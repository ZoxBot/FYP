"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Edit } from "lucide-react";
import dynamic from 'next/dynamic';
 
const ReactQuill = dynamic(() => import('react-quill'), { 
    ssr: false,
    loading: () => <div className="h-[120px] w-full bg-muted animate-pulse rounded-md" />
});
import { getErrorMessage } from "@/lib/utils";

interface EditJobDialogProps {
    job: any;
    onJobUpdated: () => void;
}

export function EditJobDialog({ job, onJobUpdated }: EditJobDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState(job.title || "");
    const [description, setDescription] = useState(job.description || "");
    const [budget, setBudget] = useState(job.budget?.toString() || "");
    const [deadline, setDeadline] = useState(job.deadline ? new Date(job.deadline).toISOString().split('T')[0] : "");

    useEffect(() => {
        if (open) {
            setTitle(job.title);
            setDescription(job.description);
            setBudget(job.budget?.toString());
            setDeadline(job.deadline ? new Date(job.deadline).toISOString().split('T')[0] : "");
        }
    }, [open, job]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const token = localStorage.getItem('token');

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/jobs/${job.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title,
                    description,
                    budget: parseFloat(budget),
                    deadline: deadline || null
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || getErrorMessage(res.status));
            }

            setOpen(false);
            onJobUpdated();
        } catch (error: any) {
            console.error(error);
            alert(`Failed to update job: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Edit className="h-4 w-4" /> Edit Job
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Edit Project</DialogTitle>
                        <DialogDescription>
                            Update your project requirements. You can only do this before a bid is accepted.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Project Title</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <div className="min-h-[150px] bg-white text-black rounded-md overflow-hidden">
                                <ReactQuill
                                    theme="snow"
                                    value={description}
                                    onChange={setDescription}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="budget">Budget ($)</Label>
                                <Input
                                    id="budget"
                                    type="number"
                                    value={budget}
                                    onChange={(e) => setBudget(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="deadline">Deadline</Label>
                                <Input
                                    id="deadline"
                                    type="date"
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
