"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PlusCircle, Briefcase, Search, Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePermission } from "@/hooks/usePermission";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

type Job = {
  id: number;
  title: string;
  description: string;
  budget: string;
  deadline: string;
  status: string;
  client_first_name: string;
  client_last_name: string;
  created_at: string;
  category: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function TasksPage() {
  const { can } = usePermission();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedJobIds, setSavedJobIds] = useState<number[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  // Filter States
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [sort, setSort] = useState("newest");
  const [statusFilter, setStatusFilter] = useState("all");

  // Local state for debounced search typing
  const [searchInput, setSearchInput] = useState("");
 
  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Load User Role and Saved Jobs
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserRole(user.role);

      if (user.role === 'freelancer') {
        fetchSavedJobs();
      }
    }
  }, []);

  const fetchSavedJobs = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/freelancer/saved-jobs/ids`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSavedJobIds(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch saved jobs", e);
    }
  };

  const toggleSaveJob = async (jobId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem('token');
    const isSaved = savedJobIds.includes(jobId);

    try {
      const method = isSaved ? 'DELETE' : 'POST';
      const endpoint = isSaved 
        ? `${API_URL}/api/freelancer/saved-jobs/${jobId}`
        : `${API_URL}/api/freelancer/saved-jobs`;
      
      const res = await fetch(endpoint, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: isSaved ? undefined : JSON.stringify({ jobId })
      });

      if (res.ok) {
        setSavedJobIds(prev => isSaved ? prev.filter(id => id !== jobId) : [...prev, jobId]);
        toast({
          title: isSaved ? "Removed from Bookmarks" : "Saved to Bookmarks",
          description: isSaved ? "The job has been removed from your saved list." : "You can view this job later in your dashboard.",
        });
      }
    } catch (e) {
      console.error("Toggle save error:", e);
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
    }
  };
 
  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, category, minBudget, maxBudget, sort, statusFilter]);
 
  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
 
      // Build Query String
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (category && category !== "all") params.append("category", category);
      if (minBudget) params.append("min_budget", minBudget);
      if (maxBudget) params.append("max_budget", maxBudget);
      if (sort) params.append("sort", sort);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      params.append("limit", "10");
      params.append("page", page.toString());
 
      try {
        const res = await fetch(`${API_URL}/api/jobs?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setJobs(data.jobs);
          setTotalPages(data.pagination.totalPages);
        } else {
          console.error("Failed to fetch jobs:", res.status);
        }
      } catch (e) {
        console.error("Failed to fetch jobs", e);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [search, category, minBudget, maxBudget, sort, page, statusFilter]);

  // Handle Search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const filteredJobs = jobs;

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)] md:h-[calc(100vh-7rem)] overflow-hidden">
      <PageHeader
        title="Tasks Marketplace"
        description="Find your next project. Browse and bid on tasks."
        className="mb-0 shrink-0"
        actions={
          <div className="flex w-full md:w-auto items-center gap-3">
            <form onSubmit={handleSearch} className="relative group flex-1 md:w-[320px] lg:w-[400px]">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              </div>
              <Input 
                placeholder="Search keywords or skills..." 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="h-10 pl-11 pr-4 rounded-xl bg-card/50 backdrop-blur-md border border-border/40 shadow-sm focus-visible:ring-primary/20 font-medium placeholder:text-muted-foreground/40 transition-all text-sm w-full"
              />
              <button type="submit" className="hidden">Search</button>
            </form>
            {can('job.post') && (
              <Button size="sm" className="h-10 px-4 gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md shadow-primary/20 shrink-0" asChild>
                <Link href="/tasks/new">
                  <PlusCircle className="h-4 w-4" />
                  <span className="hidden sm:inline-block">Post Task</span>
                </Link>
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-6 md:gap-8 lg:grid-cols-[1fr_280px] xl:grid-cols-[1fr_320px] mt-6 flex-1 min-h-0">
        
        {/* Main Content - Job Feed */}
        <div className="flex-1 min-w-0 flex flex-col h-full min-h-0 order-2 lg:order-1">
          <div className="flex-1 overflow-y-auto pr-4 pb-8 scrollbar-hide hover:scrollbar-default relative">
            {loading ? (
              <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-card/40 backdrop-blur-xl rounded-2xl border border-border/50 p-6 space-y-6 h-[250px]">
                    <div className="flex justify-between">
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-6 w-24 rounded-full" />
                      </div>
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <Skeleton className="h-8 w-3/4" />
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                    <div className="pt-6 border-t border-border/30 flex justify-between">
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-6 w-24" />
                      </div>
                      <div className="text-right space-y-2">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-10 w-full rounded-xl" />
                  </div>
                ))}
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="bg-card/30 backdrop-blur-sm border-2 border-dashed border-border/50 rounded-[3rem] p-24 text-center space-y-8 shadow-2xl">
                <div className="h-24 w-24 bg-muted/20 border border-border/20 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <Briefcase className="h-10 w-10 text-muted-foreground opacity-30" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-3xl font-black tracking-tighter text-foreground">No Tasks Found</h3>
                  <p className="text-muted-foreground text-base max-w-sm mx-auto font-medium leading-relaxed">
                    We couldn't find any tasks matching your current filters. Try adjusting them for more results.
                   </p>
                </div>
                <Button variant="outline" onClick={() => {
                  setSearch(""); setSearchInput(""); setCategory("all"); setMinBudget(""); setMaxBudget(""); setSort("newest"); setStatusFilter("all");
                }} className="rounded-full px-8 h-10 font-bold text-sm border-2 hover:bg-primary hover:text-primary-foreground transition-all">
                  Refresh Marketplace
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 grid-cols-1 xl:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {filteredJobs.map((job) => (
                  <Card key={job.id} className="group relative flex flex-col bg-card/40 hover:bg-card/60 backdrop-blur-sm hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 rounded-2xl border border-border/50 overflow-hidden">
                    <CardHeader className="p-6 pb-4">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-start gap-3">
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wide px-3 py-1 bg-muted/20 border-none text-muted-foreground">
                              {job.category || "Uncategorized"}
                            </Badge>
                            <Badge className={`text-[10px] font-bold uppercase tracking-wide px-3 py-1 border-none shadow-sm ${
                              (job.status === 'open' || job.status === 'active') ? 'bg-primary text-primary-foreground shadow-primary/20' : 'bg-foreground text-background'
                            }`}>
                              {job.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          {userRole === 'freelancer' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => toggleSaveJob(job.id, e)}
                              className={`h-8 w-8 p-0 rounded-full transition-all group/bookmark ${
                                savedJobIds.includes(job.id) ? 'text-primary' : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                              }`}
                            >
                              {savedJobIds.includes(job.id) ? (
                                <BookmarkCheck className="h-4 w-4 fill-current" />
                              ) : (
                                <Bookmark className="h-4 w-4 transition-transform group-hover/bookmark:scale-110" />
                              )}
                            </Button>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                          #{job.id}
                        </span>
                      </div>
                      <Link href={`/tasks/${job.id}`}>
                        <CardTitle className="text-xl font-bold tracking-tight group-hover:text-primary transition-colors cursor-pointer leading-snug text-foreground">
                          {job.title}
                        </CardTitle>
                      </Link>
                    </CardHeader>
                    <CardContent className="px-6 flex-grow">
                      <p className="text-muted-foreground/80 text-sm line-clamp-3 leading-relaxed">
                        {job.description}
                      </p>
                    </CardContent>
                    <CardFooter className="p-6 pt-0 flex flex-col gap-5">
                      <div className="flex items-center justify-between w-full pt-5 border-t border-border/30">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Budget</p>
                          <p className="text-xl font-bold text-foreground tabular-nums">NPR {parseFloat(job.budget).toLocaleString()}</p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Hirer</p>
                          <p className="text-sm font-bold text-foreground tracking-tight">{job.client_first_name} {job.client_last_name}</p>
                        </div>
                      </div>
                      <Button asChild className="w-full h-11 rounded-xl font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 shadow-sm shadow-primary/20">
                        <Link href={`/tasks/${job.id}`}>
                          {(job.status === 'open' || job.status === 'active') ? 'View Details' : 'Review Scope'}
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-6 py-16">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-2xl px-8 h-12 font-bold border-2 hover:bg-primary transition-all shadow-lg"
                >
                  Previous
                </Button>
                <div className="flex items-center gap-3 px-6 py-3 bg-card/40 backdrop-blur-md rounded-2xl border border-border/50 shadow-inner">
                   <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Page</span>
                   <span className="text-lg font-black text-foreground leading-none">{page}</span>
                   <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">of {totalPages}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-2xl px-8 h-12 font-bold border-2 hover:bg-primary transition-all shadow-lg"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Filter Sidebar - Right Layout */}
        <div className="w-full h-full overflow-y-auto pr-2 pb-8 scrollbar-hide hover:scrollbar-default order-1 lg:order-2">
          <Card className="rounded-[2.5rem] border-none shadow-xl bg-card/60 p-6 xl:p-8 space-y-8">
            {/* Category Filter */}
            <div className="space-y-4">
              <Label className="text-xs font-bold uppercase tracking-widest text-foreground/80">Categories</Label>
              <div className="flex flex-col gap-1.5">
                {["all", "Web Development", "Graphic Design", "Digital Marketing", "Writing & Translation", "Video & Animation", "Data Entry", "Other"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      category === cat 
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]" 
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {cat === 'all' ? 'All Tasks' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Budget Filter */}
            <div className="space-y-4 pt-6 border-t border-border/40">
              <Label className="text-xs font-bold uppercase tracking-widest text-foreground/80">Budget (NPR)</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground px-1 uppercase tracking-wider">Min</span>
                  <Input 
                    type="number" 
                    placeholder="500" 
                    value={minBudget}
                    onChange={(e) => setMinBudget(e.target.value)}
                    className="h-10 rounded-[1rem] bg-muted/30 border-none shadow-inner text-sm font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground px-1 uppercase tracking-wider">Max</span>
                  <Input 
                    type="number" 
                    placeholder="50000" 
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(e.target.value)}
                    className="h-10 rounded-[1rem] bg-muted/30 border-none shadow-inner text-sm font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Availability */}
            <div className="space-y-4 pt-6 border-t border-border/40">
              <Label className="text-xs font-bold uppercase tracking-widest text-foreground/80">Availability</Label>
              <div className="flex flex-col gap-1.5">
                {[{id: 'all', label: 'All Jobs'}, {id: 'open', label: 'Open'}, {id: 'in_progress', label: 'In Progress'}, {id: 'completed', label: 'Completed'}].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStatusFilter(s.id)}
                    className={`text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      statusFilter === s.id 
                      ? "bg-secondary text-secondary-foreground shadow-sm" 
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Options */}
            <div className="space-y-3 pt-6 border-t border-border/40">
              <Label className="text-xs font-bold uppercase tracking-widest text-foreground/80">Sort By</Label>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="h-12 rounded-[1rem] bg-muted/30 border-none font-semibold text-foreground">
                  <SelectValue placeholder="Sort order" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border border-border/50 shadow-2xl bg-card">
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="budget_desc">Highest Budget</SelectItem>
                  <SelectItem value="budget_asc">Lowest Budget</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(search || category !== 'all' || minBudget || maxBudget || sort !== 'newest' || statusFilter !== 'all') && (
              <div className="pt-2">
                <Button 
                    variant="outline" 
                    className="w-full h-12 rounded-[1rem] text-xs font-bold text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors border-destructive/20"
                    onClick={() => {
                      setSearch(""); setSearchInput(""); setCategory("all"); setMinBudget(""); setMaxBudget(""); setSort("newest"); setStatusFilter("all");
                    }}
                >
                    Reset All Filters
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
