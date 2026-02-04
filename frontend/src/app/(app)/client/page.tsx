"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Briefcase, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import { PostJobDialog } from "@/components/post-job-dialog";

type JobData = {
    id: number;
    title: string;
    description: string;
    budget: string;
    status: string;
    created_at: string;
};

export default function ClientDashboard() {
    const [jobs, setJobs] = useState<JobData[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchJobs = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/client/jobs`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setJobs(data);
            }
        } catch (error) {
            console.error("Failed to fetch jobs", error);
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
    }, [router]);

    if (loading) {
        return <div className="p-8">Loading...</div>;
    }

    const activeJobs = jobs.filter(j => j.status === 'active').length;
    // Calculate total budget of all posted jobs (just as a sample stat)
    const totalBudget = jobs.reduce((acc, job) => acc + parseFloat(job.budget), 0);

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <PageHeader
                    title="Client Dashboard"
                    description="Manage your projects and hire freelancers."
                />
                <PostJobDialog onJobPosted={fetchJobs} />
            </div>

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
                                <TableHead>Created</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {jobs.map((job) => (
                                <TableRow key={job.id}>
                                    <TableCell>
                                        <div className="font-medium">{job.title}</div>
                                        <div className="text-sm text-muted-foreground truncate max-w-xs">{job.description}</div>
                                    </TableCell>
                                    <TableCell>${job.budget}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                job.status === 'active' ? 'default' :
                                                    job.status === 'completed' ? 'secondary' :
                                                        job.status === 'rejected' ? 'destructive' : 'outline'
                                            }
                                            className={job.status === 'active' ? 'bg-green-600' : ''}
                                        >
                                            {job.status}
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
