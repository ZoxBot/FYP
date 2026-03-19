"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Briefcase,
  CreditCard,
  DollarSign,
  Users,
  Clock,
  CheckCircle,
  Bookmark,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { useRouter } from "next/navigation";

interface Task {
  id: number;
  title: string;
  status: string;
  final_price: number;
  created_at: string;
}

interface Bid {
  id: number;
  job_id: number;
  job_title: string;
  amount: number;
  status: string;
  created_at: string;
}

interface Wallet {
  balance: number;
  stats: {
    total_escrow: number;
    total_earned: number;
  };
}

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const [tasksRes, bidsRes, savedRes, walletRes, statusRes] = await Promise.all([
        fetch(`${API_URL}/api/freelancer/tasks`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/freelancer/bids`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/freelancer/saved-jobs`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/payments/wallet`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/verification/status`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (tasksRes.ok) setTasks(await tasksRes.json());
      if (bidsRes.ok) setBids(await bidsRes.json());
      if (savedRes.ok) setSavedJobs(await savedRes.json());
      if (walletRes.ok) setWallet(await walletRes.json());
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setIsVerified(statusData.isVerified);
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const activeTasks = tasks.filter(t => t.status === 'in_progress' || t.status === 'awaiting_confirmation').length;
  const pendingBids = bids.filter(b => b.status === 'pending').length;
  
  // Use backend stats if available, fallback to manual sum
  const totalEarned = wallet?.stats?.total_earned || tasks.filter(t => t.status === 'completed').reduce((sum, t) => sum + Number(t.final_price || 0), 0) * 0.95;
  const currentBalance = wallet?.balance || 0;

  return (
    <>
      <PageHeader 
        title="Freelancer Dashboard" 
        description={
            <div className="flex items-center gap-1">
              Overview of your bids and active projects.
              {isVerified && <span title="Verified Freelancer"><CheckCircle className="h-4 w-4 text-blue-500 fill-blue-500/10" /></span>}
            </div>
        } 
      />

      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
            <CreditCard className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">NPR {Number(currentBalance).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Available for withdrawal</p>
            <Button asChild variant="link" size="sm" className="p-0 h-auto mt-2 text-primary font-bold">
              <Link href="/dashboard/withdraw">Withdraw Funds →</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Net Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">NPR {Number(totalEarned).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">After 5% platform fee</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTasks}</div>
            <p className="text-xs text-muted-foreground">{tasks.length} total assignments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks}</div>
            <p className="text-xs text-muted-foreground">Successful deliveries</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Bids</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingBids}</div>
            <p className="text-xs text-muted-foreground">Waiting for response</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3 mt-4">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Assigned Tasks</CardTitle>
              <CardDescription>Work you are currently doing or have completed.</CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/tasks">
                Explore More
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                <Briefcase className="h-8 w-8 opacity-40" />
                <p className="text-sm">No tasks assigned yet.</p>
                <Button asChild variant="outline" size="sm" className="mt-2">
                  <Link href="/tasks">Browse Tasks</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-full text-primary">
                        <Briefcase className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-bold">{task.title}</p>
                        <p className="text-xs text-muted-foreground">Started {new Date(task.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Badge
                      variant={task.status === 'in_progress' ? 'default' : 'secondary'}
                      className={task.status === 'in_progress' ? 'bg-green-600' : ''}
                    >
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4 xl:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>My Bids</CardTitle>
              <CardDescription>Recent bid status and amounts.</CardDescription>
            </CardHeader>
            <CardContent>
              {bids.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                  <Activity className="h-8 w-8 opacity-40" />
                  <p className="text-sm text-center">No bids placed yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bids.slice(0, 5).map((bid) => (
                    <div key={bid.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{bid.job_title}</p>
                        <p className="text-xs text-muted-foreground">NPR {bid.amount}</p>
                      </div>
                      <Badge
                        variant={bid.status === 'accepted' ? 'secondary' : (bid.status === 'rejected' ? 'destructive' : 'outline')}
                        className="text-[10px] h-5"
                      >
                        {bid.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center">
              <div className="grid gap-1">
                <CardTitle>Saved Jobs</CardTitle>
                <CardDescription>Tasks you bookmarked for later.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {savedJobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2 border-2 border-dashed rounded-xl">
                  <Bookmark className="h-6 w-6 opacity-40" />
                  <p className="text-xs">No bookmarks yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedJobs.slice(0, 3).map((job) => (
                    <Link
                      key={job.id}
                      href={`/tasks/${job.id}`}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate group-hover:text-primary transition-colors">{job.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          NPR {job.budget} • {job.first_name} {job.last_name}
                        </p>
                      </div>
                      <ArrowUpRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                    </Link>
                  ))}
                  {savedJobs.length > 3 && (
                    <Button asChild variant="ghost" size="sm" className="w-full text-xs text-primary font-bold">
                       <Link href="/tasks">View all bookmarks in marketplace →</Link>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
