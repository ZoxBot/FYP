"use client";
 
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, Loader2, Banknote, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
 
interface WithdrawalRequest {
    id: number;
    user_id: number;
    first_name: string;
    last_name: string;
    email: string;
    amount: string;
    method: string;
    method_details: any;
    status: string;
    created_at: string;
}
 
export default function AdminWithdrawalsPage() {
    const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const { toast } = useToast();
 
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
 
    const fetchRequests = async () => {
        const token = localStorage.getItem("admin_token");
        try {
            const res = await fetch(`${API_URL}/api/withdrawals/pending`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setRequests(await res.json());
            }
        } catch (error) {
            console.error("Fetch pending withdrawals error:", error);
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
            const res = await fetch(`${API_URL}/api/withdrawals/${id}/review`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ action }),
            });
 
            if (res.ok) {
                toast({
                    title: `Withdrawal ${action === "approve" ? "Approved" : "Rejected"}`,
                    description: `Status updated successfully.`,
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
            console.error("Review withdrawal error:", error);
        } finally {
            setProcessingId(null);
        }
    };
 
    if (loading) return <div className="text-slate-400">Loading pending withdrawal requests...</div>;
 
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center text-slate-50">
                <div>
                    <h1 className="text-2xl font-bold">Withdrawal Requests</h1>
                    <p className="text-slate-400">Manage and process freelancer fund withdrawals.</p>
                </div>
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-center gap-3">
                    <Banknote className="h-5 w-5 text-green-500" />
                    <div>
                        <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Pending Payouts</div>
                        <div className="text-xl font-bold text-slate-100">{requests.length} Requests</div>
                    </div>
                </div>
            </div>
 
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-slate-100">Pending Requests</CardTitle>
                    <CardDescription className="text-slate-400">
                        Review the payment details and approve only after verifying external fund transfer.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {requests.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-800 rounded-lg">
                            No pending withdrawal requests.
                        </div>
                    ) : (
                        <div className="rounded-md border border-slate-800 overflow-hidden">
                            <Table>
                                <TableHeader className="bg-slate-950/50">
                                    <TableRow className="border-slate-800 hover:bg-transparent">
                                        <TableHead className="text-slate-400">User</TableHead>
                                        <TableHead className="text-slate-400">Amount</TableHead>
                                        <TableHead className="text-slate-400">Method</TableHead>
                                        <TableHead className="text-slate-400">Details</TableHead>
                                        <TableHead className="text-slate-400">Submitted On</TableHead>
                                        <TableHead className="text-right text-slate-400">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {requests.map((req) => (
                                        <TableRow key={req.id} className="border-slate-800 hover:bg-slate-800/30 transition-colors">
                                            <TableCell className="font-medium text-slate-200">
                                                {req.first_name} {req.last_name}
                                                <div className="text-[10px] text-slate-500">{req.email}</div>
                                            </TableCell>
                                            <TableCell className="text-green-400 font-bold">
                                                Rs. {parseFloat(req.amount).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="capitalize text-slate-300">
                                                <Badge variant="outline" className="border-slate-700 text-slate-400">
                                                    {req.method}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-400">
                                                {req.method === 'bank' ? (
                                                    <div>
                                                        <div>{req.method_details.bank_name}</div>
                                                        <div>Acc: {req.method_details.account_number}</div>
                                                    </div>
                                                ) : (
                                                    <div>ID: {req.method_details.khalti_id}</div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-slate-500 text-xs">
                                                {new Date(req.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        className="bg-green-600 hover:bg-green-700 text-white"
                                                        disabled={processingId === req.id}
                                                        onClick={() => handleReview(req.id, "approve")}
                                                    >
                                                        {processingId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-1" /> Mark Paid</>}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
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
