"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ReviewFormProps {
    jobId: number;
    onSuccess?: () => void;
}

export function ReviewForm({ jobId, onSuccess }: ReviewFormProps) {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            toast({ title: "Error", description: "Please select a rating.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/api/reviews`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    job_id: jobId,
                    rating,
                    comment,
                }),
            });

            if (res.ok) {
                toast({ title: "Success", description: "Thank you for your feedback!" });
                if (onSuccess) onSuccess();
            } else {
                const data = await res.json();
                throw new Error(data.message || "Failed to submit review");
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-muted/20">
            <div className="space-y-2">
                <Label>Rate your experience</Label>
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            className="focus:outline-none transition-transform hover:scale-110"
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setRating(star)}
                        >
                            <Star
                                className={cn(
                                    "h-8 w-8",
                                    (hoverRating || rating) >= star
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-muted-foreground"
                                )}
                            />
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="comment">Feedback / Comments (Optional)</Label>
                <Textarea
                    id="comment"
                    placeholder="Share your thoughts about the collaboration..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting || rating === 0}>
                {isSubmitting ? "Submitting..." : "Submit Review"}
            </Button>
        </form>
    );
}
