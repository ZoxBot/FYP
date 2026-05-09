"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Calendar, Star, Briefcase, Github, Linkedin, Globe, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PortfolioSection } from "@/components/profile/PortfolioSection";

interface UserProfile {
  id: number;
  first_name: string;
  last_name: string;
  role: string;
  is_verified: boolean;
  bio: string;
  avatar_url: string;
  skills: string | string[];
  created_at: string;
  avg_rating: string | number;
  review_count: string | number;
  github_url?: string;
  linkedin_url?: string;
  dribbble_url?: string;
  website_url?: string;
}

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [reviewsData, setReviewsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProfile();
    fetchReviews();
  }, [id]);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/reviews/user/${id}`);
      if (res.ok) {
        setReviewsData(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch reviews", e);
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/users/${id}`);
      if (!res.ok) throw new Error("User not found");
      const data = await res.json();
      setUser(data);
    } catch (e: any) {
      setError(e.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-12 w-full lg:px-8 animate-pulse">
        <div className="h-20 w-1/3 bg-muted rounded-xl mb-4" />
        <div className="grid gap-8 md:grid-cols-[1fr_300px] lg:grid-cols-[1fr_350px]">
          <div className="space-y-8">
            <Card className="rounded-[2rem] p-12 space-y-8">
              <div className="flex items-center gap-8">
                <Skeleton className="h-32 w-32 rounded-full" />
                <div className="space-y-4 flex-1">
                  <Skeleton className="h-10 w-3/4" />
                  <Skeleton className="h-6 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-[2px] w-full" />
              <div className="space-y-4">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-20 w-full" />
              </div>
            </Card>
          </div>
          <div className="space-y-8">
            <Skeleton className="h-64 w-full rounded-[2rem]" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-3xl font-bold">Profile Not Found</h2>
        <p className="text-muted-foreground">{error || "This user does not exist or has been removed."}</p>
      </div>
    );
  }

  const skillList = Array.isArray(user.skills) ? user.skills : (typeof user.skills === 'string' ? user.skills.split(',').map(s => s.trim()) : []);
  const rating = parseFloat(user.avg_rating as string) || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 w-full lg:px-8">
      <PageHeader 
        title={`${user.first_name} ${user.last_name}`}
        description={`${user.role.charAt(0).toUpperCase() + user.role.slice(1)} Profile`}
      />

      <div className="grid gap-8 md:grid-cols-[1fr_300px] lg:grid-cols-[1fr_350px]">
        {/* Main Info */}
        <div className="space-y-8 min-w-0">
          <Card className="rounded-[2rem] border-none shadow-xl bg-card/50 overflow-hidden">
            <CardContent className="p-8 sm:p-12">
              <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-center">
                <Avatar className="h-32 w-32 border-4 border-background shadow-2xl shrink-0">
                  <AvatarImage src={user.avatar_url ? (user.avatar_url.startsWith('http') ? user.avatar_url : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${user.avatar_url}`) : ''} alt={user.first_name} className="object-cover" />
                  <AvatarFallback className="text-4xl bg-primary/10 text-primary font-black">
                    {user.first_name[0]}{user.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                
                <div className="space-y-4 flex-1 min-w-0">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight truncate">{user.first_name} {user.last_name}</h1>
                      {user.is_verified && (
                        <Badge className="bg-blue-500/10 text-blue-500 border-none px-3 py-1 text-xs uppercase tracking-wider font-semibold gap-1.5 shrink-0">
                          <CheckCircle className="h-3.5 w-3.5" /> Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-base sm:text-lg text-muted-foreground font-medium mt-1">
                      {user.role === 'freelancer' ? 'Professional Freelancer' : 'Platform Client'}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-muted-foreground/80">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Joined {new Date(user.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
                    </div>
                    {user.role === 'freelancer' && (
                      <div className="flex items-center gap-2 text-yellow-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="font-bold text-foreground">{rating.toFixed(1)} <span className="text-muted-foreground font-normal">({user.review_count} reviews)</span></span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {(user.github_url || user.linkedin_url || user.dribbble_url || user.website_url) && (
                <div className="flex flex-wrap items-center gap-4 mt-6">
                  {user.github_url && (
                    <a href={user.github_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-muted/50 hover:bg-primary/10 hover:text-primary transition-all">
                      <Github className="h-5 w-5" />
                    </a>
                  )}
                  {user.linkedin_url && (
                    <a href={user.linkedin_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-muted/50 hover:bg-primary/10 hover:text-primary transition-all">
                      <Linkedin className="h-5 w-5" />
                    </a>
                  )}
                  {user.dribbble_url && (
                    <a href={user.dribbble_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-muted/50 hover:bg-primary/10 hover:text-primary transition-all">
                      <ExternalLink className="h-5 w-5" />
                    </a>
                  )}
                  {user.website_url && (
                    <a href={user.website_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-muted/50 hover:bg-primary/10 hover:text-primary transition-all">
                      <Globe className="h-5 w-5" />
                    </a>
                  )}
                </div>
              )}

              <Separator className="my-8 opacity-50" />

              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground">About</h3>
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                  {user.bio || "This user hasn't added a bio yet."}
                </p>
              </div>

              {skillList.length > 0 && (
                <>
                  <Separator className="my-8 opacity-50" />
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-foreground">Skills & Expertise</h3>
                    <div className="flex flex-wrap gap-2">
                      {skillList.map(skill => (
                        <Badge key={skill} variant="secondary" className="px-4 py-2 text-xs font-bold rounded-lg border-none bg-muted/50 hover:bg-muted text-foreground transition-colors shadow-sm">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {user.role === 'freelancer' && (
                <div className="mt-12">
                   <PortfolioSection userId={user.id} isOwner={false} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reviews & Ratings Section */}
          <Card className="rounded-[3rem] border-none shadow-xl bg-card/60 overflow-hidden">
            <CardHeader className="p-8 sm:p-12 border-b border-primary/5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold text-foreground">Reviews & Feedback</h3>
                  <p className="text-sm font-bold text-muted-foreground">What previous clients have to say.</p>
                </div>
                <div className="flex items-center gap-3 bg-primary/5 px-6 py-3 rounded-full border border-primary/10">
                  <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
                  <span className="font-black text-2xl tracking-tighter">{rating.toFixed(1)}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">({user.review_count || 0} reviews)</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 sm:p-12">
              {reviewsData.length > 0 ? (
                <div className="space-y-6">
                  {reviewsData.map((rev) => (
                    <div key={rev.id} className="p-8 rounded-[2rem] bg-muted/20 hover:bg-muted/30 transition-all border border-transparent hover:border-primary/10 group">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-1.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={cn("h-5 w-5", rev.rating >= s ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30")}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{new Date(rev.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-lg text-gray-700 dark:text-gray-300 italic mb-8 font-medium">"{rev.comment}"</p>
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10 border-2 border-background shadow-lg">
                          <AvatarImage src={rev.reviewer_avatar_url?.startsWith('http') ? rev.reviewer_avatar_url : (rev.reviewer_avatar_url ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/uploads/${rev.reviewer_avatar_url}` : "")} />
                          <AvatarFallback className="font-black text-xs bg-muted text-muted-foreground">{rev.reviewer_first_name?.[0]}{rev.reviewer_last_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-black tracking-tight">{rev.reviewer_first_name} {rev.reviewer_last_name}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Client for {rev.job_title}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 px-10 border-4 border-dashed rounded-[3rem] border-primary/5 bg-primary/[0.02]">
                   <div className="bg-muted w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <Star className="h-8 w-8 text-muted-foreground/30" />
                   </div>
                   <p className="text-xl font-bold text-muted-foreground">No ratings yet.</p>
                   <p className="text-sm font-medium text-muted-foreground/60 max-w-xs mx-auto mt-2">This user hasn't received any reviews.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar / Stats */}
        <div className="space-y-8">
          <Card className="rounded-[2rem] border-none shadow-lg bg-card/30">
            <CardContent className="p-8 space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Platform Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                {user.role === 'freelancer' ? (
                  <>
                    <div className="space-y-1">
                      <p className="text-3xl font-black text-foreground">{user.review_count}</p>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Total Reviews</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-3xl font-black text-foreground">{rating.toFixed(1)}</p>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Avg Rating</p>
                    </div>
                  </>
                ) : (
                  <div className="col-span-2 space-y-1 bg-primary/5 p-5 rounded-2xl border border-primary/10">
                    <Briefcase className="h-6 w-6 text-primary mb-4" />
                    <p className="text-xl font-black text-foreground">Client Account</p>
                    <p className="text-xs font-bold text-muted-foreground mt-1 tracking-wide">Looking for top talent</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
