"use client";

import { useState } from "react";
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
import { Loader2, Plus } from "lucide-react";
import dynamic from 'next/dynamic';
 
const ReactQuill = dynamic(() => import('react-quill'), { 
  ssr: false,
  loading: () => <div className="h-[150px] w-full bg-muted animate-pulse rounded-md" />
});
import { usePermission } from "@/hooks/usePermission";
import { getErrorMessage } from "@/lib/utils";

interface PostJobDialogProps {
    onJobPosted: () => void;
}

export function PostJobDialog({ onJobPosted }: PostJobDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { can } = usePermission();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [budget, setBudget] = useState("");
    const [deadline, setDeadline] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const token = localStorage.getItem('token');

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/jobs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title,
                    description,
                    budget: parseFloat(budget),
                    deadline: deadline || null // Optional
                })
            });

            if (!res.ok) throw new Error(getErrorMessage(res.status));

            setOpen(false);
            setTitle("");
            setDescription("");
            setBudget("");
            setDeadline("");
            onJobPosted();
        } catch (error: any) {
            console.error(error);
            alert(`Failed to post job: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Post New Job
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Post a New Project</DialogTitle>
                        <DialogDescription>
                            Describe your project requirements to find the perfect freelancer.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Project Title</Label>
                            <Input
                                id="title"
                                placeholder="e.g. Build a React Website"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <div className="min-h-[200px] bg-white text-black rounded-md overflow-hidden">
                                <ReactQuill
                                    theme="snow"
                                    value={description}
                                    onChange={setDescription}
                                    placeholder="Detailed requirements, skills needed, etc..."
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="budget">Budget ($)</Label>
                                <Input
                                    id="budget"
                                    type="number"
                                    placeholder="500"
                                    value={budget}
                                    onChange={(e) => setBudget(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="deadline">Deadline (Optional)</Label>
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
                        <Button type="submit" disabled={loading || !can('job.post')}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Post Project
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
