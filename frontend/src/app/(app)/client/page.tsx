"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Briefcase, CreditCard, CheckCircle, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { PostJobDialog } from "@/components/post-job-dialog";
import { usePermission } from "@/hooks/usePermission";

type JobData = {
    id: number;
    title: string;
    description: string;
    budget: string;
    status: string;
    created_at: string;
    bid_count?: number | string;
};

export default function ClientDashboard() {
    const [jobs, setJobs] = useState<JobData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const { can, loading: permsLoading } = usePermission();
    const router = useRouter();

    const fetchJobs = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const [jobsRes, statusRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/client/jobs`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/verification/status`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);
            
            if (jobsRes.ok) {
                const data = await jobsRes.json();
                setJobs(data);
            }
            if (statusRes.ok) {
                const statusData = await statusRes.json();
                setIsVerified(statusData.isVerified);
            }
        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        fetchJobs();

        // Check for #post-job hash
        if (window.location.hash === '#post-job') {
            setIsPostDialogOpen(true);
            // Optionally clear the hash
            window.history.replaceState(null, '', window.location.pathname);
        }
    }, [router]);

    if (loading || permsLoading) {
        return <div className="p-8 text-center">Loading dashboard...</div>;
    }

    const activeJobs = jobs.filter(j => j.status === 'active' || j.status === 'open').length;
    // Calculate total budget of all posted jobs (just as a sample stat)
    const totalBudget = jobs.reduce((acc, job) => acc + parseFloat(job.budget), 0);

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <PageHeader
                    title="Client Dashboard"
                    description={
                        <div className="flex items-center gap-1">
                            Manage your projects and hire freelancers.
                            {isVerified && <span title="Verified Client"><CheckCircle className="h-4 w-4 text-blue-500 fill-blue-500/10" /></span>}
                        </div>
                    }
                />
                <PostJobDialog
                    open={isPostDialogOpen}
                    onOpenChange={setIsPostDialogOpen}
                    onJobPosted={fetchJobs}
                />
            </div>

            {!isVerified && !permsLoading && !can('job.post') && (
                <Card className="mb-6 border-orange-500/50 bg-orange-500/10 backdrop-blur-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <Shield className="h-8 w-8 text-orange-500" />
                        <div>
                            <p className="font-bold text-orange-700 dark:text-orange-400">Account Not Fully Verified</p>
                            <p className="text-sm text-muted-foreground">Please complete your verification in Settings to start posting jobs. If you recently submitted, please wait for admin approval.</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeJobs}</div>
                        <p className="text-xs text-muted-foreground">
                            {jobs.length} Total Projects Posted
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${totalBudget.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">
                            Across all projects
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>My Posted Projects</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Budget</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Bids</TableHead>
                                <TableHead>Created</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {jobs.map((job) => (
                                <TableRow
                                    key={job.id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => router.push(`/tasks/${job.id}`)}
                                >
                                    <TableCell>
                                        <div className="font-medium">{job.title}</div>
                                        <div className="text-sm text-muted-foreground truncate max-w-xs">{job.description}</div>
                                    </TableCell>
                                    <TableCell>${job.budget}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                job.status === 'active' || job.status === 'open' ? 'default' :
                                                    job.status === 'completed' ? 'secondary' :
                                                        job.status === 'rejected' ? 'destructive' : 'outline'
                                            }
                                            className={
                                                job.status === 'active' || job.status === 'open' ? 'bg-blue-600' :
                                                    job.status === 'in_progress' ? 'bg-green-600 text-white border-none' :
                                                        job.status === 'pending_payment' ? 'bg-orange-500 text-white border-none' :
                                                            job.status === 'awaiting_confirmation' ? 'bg-yellow-500 text-white border-none' : ''
                                            }
                                        >
                                            {job.status.replace('_', ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-slate-50">
                                            {job.bid_count || 0} Bids
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {new Date(job.created_at).toLocaleDateString()}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {jobs.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                        You haven't posted any projects yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    );
}
