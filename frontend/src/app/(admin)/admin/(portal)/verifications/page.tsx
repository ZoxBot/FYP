"use client";
 
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
 
interface VerificationRequest {
    id: number;
    user_id: number;
    first_name: string;
    last_name: string;
    email: string;
    document_path: string;
    status: string;
    created_at: string;
}
 
export default function AdminVerificationsPage() {
    const [requests, setRequests] = useState<VerificationRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const { toast } = useToast();
 
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
 
    const fetchRequests = async () => {
        const token = localStorage.getItem("admin_token");
        try {
            const res = await fetch(`${API_URL}/api/verification/pending`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setRequests(await res.json());
            }
        } catch (error) {
            console.error("Fetch pending verifications error:", error);
        } finally {
            setLoading(false);
        }
    };
 
    useEffect(() => {
        fetchRequests();
    }, []);
 
    const handleReview = async (id: number, action: "approve" | "reject") => {
        setProcessingId(id);
        const token = localStorage.getItem("admin_token");
        try {
            const res = await fetch(`${API_URL}/api/verification/${id}/review`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ action }),
            });
 
            if (res.ok) {
                toast({
                    title: `Request ${action === "approve" ? "Approved" : "Rejected"}`,
                    description: `User has been notified and status updated.`,
                });
                setRequests((prev) => prev.filter((r) => r.id !== id));
            } else {
                const data = await res.json();
                toast({
                    title: "Review Failed",
                    description: data.message || "An error occurred.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Review verification error:", error);
        } finally {
            setProcessingId(null);
        }
    };
 
    if (loading) return <div className="text-slate-400">Loading pending verification requests...</div>;
 
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center text-slate-50">
                <div>
                    <h1 className="text-2xl font-bold">Identity Verification</h1>
                    <p className="text-slate-400">Review and approve government IDs uploaded by users.</p>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-blue-500" />
                    <div>
                        <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Pending Tasks</div>
                        <div className="text-xl font-bold text-slate-100">{requests.length} Requests</div>
                    </div>
                </div>
            </div>
 
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-slate-100">Pending Requests</CardTitle>
                    <CardDescription className="text-slate-400">
                        Please verify that the document matches the user's name and is an official government ID.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {requests.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-800 rounded-lg">
                            No pending verification requests found.
                        </div>
                    ) : (
                        <div className="rounded-md border border-slate-800 overflow-hidden">
                            <Table>
                                <TableHeader className="bg-slate-950/50">
                                    <TableRow className="border-slate-800 hover:bg-transparent">
                                        <TableHead className="text-slate-400">User</TableHead>
                                        <TableHead className="text-slate-400">Email</TableHead>
                                        <TableHead className="text-slate-400">Document</TableHead>
                                        <TableHead className="text-slate-400">Submitted On</TableHead>
                                        <TableHead className="text-right text-slate-400">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {requests.map((req) => (
                                        <TableRow key={req.id} className="border-slate-800 hover:bg-slate-800/30 transition-colors">
                                            <TableCell className="font-medium text-slate-200">
                                                {req.first_name} {req.last_name}
                                            </TableCell>
                                            <TableCell className="text-slate-400">{req.email}</TableCell>
                                            <TableCell>
                                                <Button asChild variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10">
                                                    <a href={req.document_path} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                                                        <ExternalLink className="h-4 w-4" /> View ID
                                                    </a>
                                                </Button>
                                            </TableCell>
                                            <TableCell className="text-slate-400 text-xs">
                                                {new Date(req.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-green-500/50 text-green-500 hover:bg-green-500/10 hover:text-green-400"
                                                        disabled={processingId === req.id}
                                                        onClick={() => handleReview(req.id, "approve")}
                                                    >
                                                        {processingId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-1" /> Approve</>}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-400"
                                                        disabled={processingId === req.id}
                                                        onClick={() => handleReview(req.id, "reject")}
                                                    >
                                                        {processingId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><X className="h-4 w-4 mr-1" /> Reject</>}
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
