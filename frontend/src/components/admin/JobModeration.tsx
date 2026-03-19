"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { JobData } from "./types";
import { usePermission } from "@/hooks/usePermission";
import { getErrorMessage } from "@/lib/utils";

interface JobModerationProps {
    jobs: JobData[];
    onRefresh: () => void;
}

export function JobModeration({ jobs, onRefresh }: JobModerationProps) {
    const { can } = usePermission();

    const handleJobAction = async (id: number, status: 'active' | 'rejected') => {
        const token = localStorage.getItem('token');
        if (!token) return;

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
                onRefresh();
            } else {
                alert(`Failed to update job: ${getErrorMessage(res.status)}`);
            }
        } catch (error) {
            console.error("Failed to update job", error);
            alert("Network error.");
        }
    };

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {jobs.map((job) => (
                    <TableRow key={job.id}>
                        <TableCell>
                            <div className="font-medium">{job.title}</div>
                            <div className="text-sm text-muted-foreground truncate max-w-xs">{job.description}</div>
                        </TableCell>
                        <TableCell>
                            <div className="text-sm">{job.first_name} {job.last_name}</div>
                            <div className="text-xs text-muted-foreground">{job.email}</div>
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
                        <TableCell className="text-right">
                            {(job.status === 'pending' || job.status === 'active') && (
                                <div className="flex justify-end gap-2">
                                    {job.status === 'pending' && can('job.approve') && (
                                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleJobAction(job.id, 'active')}>
                                            <Check className="h-4 w-4 mr-1" /> Approve
                                        </Button>
                                    )}
                                    {can('job.reject') && (
                                        <Button size="sm" variant="destructive" onClick={() => handleJobAction(job.id, 'rejected')}>
                                            <X className="h-4 w-4 mr-1" /> Reject
                                        </Button>
                                    )}
                                </div>
                            )}
                            {(job.status !== 'pending' && job.status !== 'active') && (
                                <span className="text-sm text-muted-foreground capitalize">
                                    {job.status}
                                </span>
                            )}
                        </TableCell>
                    </TableRow>
                ))}
                {jobs.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                            No jobs found.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}
