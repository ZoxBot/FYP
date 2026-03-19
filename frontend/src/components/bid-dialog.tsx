"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface BidDialogProps {
    jobId: number;
    jobTitle: string;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function BidDialog({ jobId, jobTitle, isOpen, onOpenChange, onSuccess }: BidDialogProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [amount, setAmount] = useState("");
    const [proposal, setProposal] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        if (!token) return;

        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/jobs/${jobId}/bids`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    amount: parseFloat(amount),
                    proposal,
                }),
            });

            if (res.ok) {
                toast({
                    title: "Bid Submitted!",
                    description: "Your proposal has been sent to the client.",
                });
                onOpenChange(false);
                setAmount("");
                setProposal("");
                if (onSuccess) onSuccess();
            } else {
                const data = await res.json();
                toast({
                    title: "Error",
                    description: data.message || "Failed to submit bid.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Network error. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Place a Bid on "{jobTitle}"</DialogTitle>
                    <DialogDescription>
                        Submit your best proposal and price for this task.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="amount">Your Bid Amount (NPR)</Label>
                        <Input
                            id="amount"
                            type="number"
                            placeholder="e.g. 5000"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                            min="1"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="proposal">Professional Proposal</Label>
                        <Textarea
                            id="proposal"
                            placeholder="Explain why you are the best fit for this task..."
                            value={proposal}
                            onChange={(e) => setProposal(e.target.value)}
                            required
                            rows={5}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Proposal
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
