"use client";
 
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, ArrowUpRight, ArrowDownLeft, Wallet, Receipt, Loader2, Banknote } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/page-header";
import Link from "next/link";
 
interface Payment {
    id: number;
    job_title: string;
    amount: string;
    status: string;
    created_at: string;
    client_id: number;
    freelancer_id: number;
    client_name: string;
    freelancer_name: string;
    commission_amount?: string;
    net_amount?: string;
}
 
interface Withdrawal {
    id: number;
    amount: string;
    status: string;
    method: string;
    created_at: string;
}
 
export default function BillingPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const { toast } = useToast();
 
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
 
    useEffect(() => {
        const fetchBillingData = async () => {
            const token = localStorage.getItem("token");
            const userStr = localStorage.getItem("user");
            if (userStr) setUser(JSON.parse(userStr));
 
            try {
                const [historyRes, walletRes] = await Promise.all([
                    fetch(`${API_URL}/api/payments/history`, { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(`${API_URL}/api/payments/wallet`, { headers: { Authorization: `Bearer ${token}` } })
                ]);
 
                if (historyRes.ok) {
                    const data = await historyRes.json();
                    setPayments(data.payments);
                    setWithdrawals(data.withdrawals);
                }
                if (walletRes.ok) {
                    const wallet = await walletRes.json();
                    setBalance(wallet.balance);
                }
            } catch (error) {
                console.error("Fetch billing error:", error);
            } finally {
                setLoading(false);
            }
        };
 
        fetchBillingData();
    }, []);
 
    if (loading) return <div className="p-8 text-center">Loading billing information...</div>;
 
    return (
        <div className="space-y-6">
            <PageHeader
                title="Billing & Payments"
                description="Monitor your transactions, escrow payments, and withdrawals."
                actions={
                    user?.role === 'freelancer' && (
                        <Button asChild className="gap-2">
                            <Link href="/dashboard/withdraw">
                                <Banknote className="h-4 w-4" /> Withdraw Funds
                            </Link>
                        </Button>
                    )
                }
            />
 
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">NPR {Number(balance).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Available for withdrawal</p>
                    </CardContent>
                </Card>
                {/* Add more stats if needed */}
            </div>
 
            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Receipt className="h-5 w-5" />
                            Escrow & Job Payments
                        </CardTitle>
                        <CardDescription>All payments related to jobs you have posted or worked on.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {payments.length === 0 ? (
                            <div className="py-8 text-center text-slate-500 italic">No job payments found.</div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Job Title</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payments.map((p) => {
                                        const isOutgoing = p.client_id === user?.id;
                                        return (
                                            <TableRow key={p.id}>
                                                <TableCell className="text-xs">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                                                <TableCell className="font-medium">{p.job_title}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1 text-xs">
                                                        {isOutgoing ? (
                                                            <><ArrowUpRight className="h-3 w-3 text-red-400" /> Outgoing</>
                                                        ) : (
                                                            <><ArrowDownLeft className="h-3 w-3 text-green-400" /> Incoming</>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className={isOutgoing ? "text-slate-300" : "text-green-400 font-bold"}>
                                                    Rs. {parseFloat(isOutgoing ? p.amount : (p.net_amount || p.amount)).toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="capitalize text-[10px]">
                                                        {p.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
 
                {user?.role === 'freelancer' && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Withdrawal History
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {withdrawals.length === 0 ? (
                                <div className="py-8 text-center text-slate-500 italic">No withdrawals found.</div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Method</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {withdrawals.map((w) => (
                                            <TableRow key={w.id}>
                                                <TableCell className="text-xs">{new Date(w.created_at).toLocaleDateString()}</TableCell>
                                                <TableCell className="capitalize text-xs">{w.method}</TableCell>
                                                <TableCell className="text-red-400 font-bold">
                                                    - Rs. {parseFloat(w.amount).toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={w.status === 'completed' ? 'default' : (w.status === 'rejected' ? 'destructive' : 'secondary')} className="text-[10px]">
                                                        {w.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
