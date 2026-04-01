"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, Eye, CheckCircle, XCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

interface Job {
    id: number;
    title: string;
    client_name: string;
    status: string;
    created_at: string;
    budget?: number;
}

export default function AdminJobsPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const { toast } = useToast();

    // Pagination state
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalJobs, setTotalJobs] = useState(0);

    const fetchJobs = async () => {
        setLoading(true);
        const token = localStorage.getItem('admin_token');
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                search: searchTerm,
                limit: "20"
            });

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/jobs?${queryParams}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setJobs(data.jobs);
                setTotalPages(data.pages);
                setTotalJobs(data.total);
            }
        } catch (error) {
            console.error("Fetch jobs error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            setPage(1);
            fetchJobs();
        }, searchTerm ? 500 : 0);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    useEffect(() => {
        fetchJobs();
    }, [page]);

    const handleStatusUpdate = async (id: number, status: 'active' | 'rejected') => {
        const token = localStorage.getItem('admin_token');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/jobs/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });

            if (res.ok) {
                toast({ title: "Update Successful", description: `Job ${status === 'active' ? 'approved' : 'rejected'}` });
                fetchJobs();
            } else {
                toast({ title: "Update Failed", description: "Failed to update job status", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Action failed", variant: "destructive" });
        }
    };

    if (loading && jobs.length === 0) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            <div className="text-slate-400">Loading moderation queue...</div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center text-slate-50">
                <div>
                    <h1 className="text-2xl font-bold">Job Moderation</h1>
                    <p className="text-slate-400">Review and moderate {totalJobs} marketplace postings.</p>
                </div>
            </div>

            <div className="relative mb-4">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                    placeholder="Search by job title or client email..."
                    className="bg-slate-900 border-slate-800 pl-10 text-slate-200 focus-visible:ring-emerald-500/20"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-800">
                                    <th className="p-4 text-xs font-medium text-slate-500 uppercase">Post Content</th>
                                    <th className="p-4 text-xs font-medium text-slate-500 uppercase">Status</th>
                                    <th className="p-4 text-xs font-medium text-slate-500 uppercase text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {jobs.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="p-8 text-center text-slate-500">
                                            No jobs found matching your criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    jobs.map((job: any) => (
                                        <tr key={job.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded bg-slate-800 flex items-center justify-center">
                                                        <Briefcase className="h-5 w-5 text-slate-400" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-slate-200">{job.title}</div>
                                                        <div className="text-xs text-slate-500">
                                                            Posted by {job.first_name} {job.last_name} ({job.email}) • {new Date(job.created_at).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <Badge className={cn(
                                                    "capitalize",
                                                    job.status === 'open' || job.status === 'active' ? "bg-green-500/10 text-green-400 border-green-500/20" :
                                                        job.status === 'pending' ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                                                            "bg-slate-800 text-slate-400"
                                                )}>
                                                    {job.status}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10" asChild>
                                                        <Link href={`/tasks/${job.id}`}>
                                                            <Eye className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-400 hover:text-green-400 hover:bg-green-400/10"
                                                        onClick={() => handleStatusUpdate(job.id, 'active')}
                                                        disabled={job.status === 'active'}
                                                    >
                                                        <CheckCircle className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-400/10"
                                                        onClick={() => handleStatusUpdate(job.id, 'rejected')}
                                                        disabled={job.status === 'rejected'}
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between p-4 border-t border-slate-800">
                            <p className="text-sm text-slate-400">
                                Showing page {page} of {totalPages} ({totalJobs} total)
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page === 1 || loading}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    className="border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800"
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page === totalPages || loading}
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    className="border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800"
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
