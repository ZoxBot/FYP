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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DisputeDialogProps {
    jobId: number;
    onSuccess: () => void;
}

export function DisputeDialog({ jobId, onSuccess }: DisputeDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [reason, setReason] = useState("");
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason.trim()) return;

        setLoading(true);
        const token = localStorage.getItem('token');

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/jobs/${jobId}/dispute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ reason })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to open dispute');
            }

            toast({ title: "Dispute Opened", description: "The job has been flagged and an administrator will review it shortly." });
            setOpen(false);
            setReason("");
            onSuccess();
        } catch (error: any) {
            console.error(error);
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-orange-600 border-orange-200 hover:bg-orange-50 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> Report Issue / Dispute
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-orange-600">
                            <AlertTriangle className="h-5 w-5" /> Open a Dispute
                        </DialogTitle>
                        <DialogDescription>
                            Please describe the issue in detail. The contract will be frozen until an administrator reviews and resolves the dispute.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="reason">Reason for Dispute</Label>
                            <Textarea
                                id="reason"
                                placeholder="Explain why you are opening this dispute (e.g., work not delivered, poor quality, payment disagreement)..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                required
                                className="min-h-[120px]"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="destructive" disabled={loading || !reason.trim()}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Dispute
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
