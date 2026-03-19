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

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        const token = localStorage.getItem('admin_token');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/jobs`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setJobs(await res.json());
        } catch (error) {
            console.error("Fetch jobs error:", error);
        } finally {
            setLoading(false);
        }
    };

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

    const filteredJobs = jobs.filter(j =>
        j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="text-slate-400">Loading moderation queue...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center text-slate-50">
                <div>
                    <h1 className="text-2xl font-bold">Job Moderation</h1>
                    <p className="text-slate-400">Review and moderate all marketplace postings.</p>
                </div>
            </div>

            <div className="relative mb-4">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                    placeholder="Search by job title or client..."
                    className="bg-slate-900 border-slate-800 pl-10 text-slate-200"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-0">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-800">
                                <th className="p-4 text-xs font-medium text-slate-500 uppercase">Post Content</th>
                                <th className="p-4 text-xs font-medium text-slate-500 uppercase">Status</th>
                                <th className="p-4 text-xs font-medium text-slate-500 uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {filteredJobs.map((job) => (
                                <tr key={job.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded bg-slate-800 flex items-center justify-center">
                                                <Briefcase className="h-5 w-5 text-slate-400" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-200">{job.title}</div>
                                                <div className="text-xs text-slate-500">Posted by {job.client_name} • {new Date(job.created_at).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <Badge className={cn(
                                            "capitalize",
                                            job.status === 'open' ? "bg-green-500/10 text-green-400 border-green-500/20" :
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
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
