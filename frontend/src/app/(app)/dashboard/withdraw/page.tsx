"use client";
 
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Wallet, Building, Smartphone, Loader2, History, Banknote } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
 
export default function WithdrawPage() {
    const [balance, setBalance] = useState(0);
    const [history, setHistory] = useState<any[]>([]);
    const [amount, setAmount] = useState("");
    const [method, setMethod] = useState("bank");
    const [methodDetails, setMethodDetails] = useState({
        bank_name: "",
        account_number: "",
        khalti_id: ""
    });
    const [loading, setLoading] = useState(true);
    const [requesting, setRequesting] = useState(false);
    const { toast } = useToast();
 
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
 
    const fetchData = async () => {
        const token = localStorage.getItem("token");
        try {
            const [walletRes, historyRes] = await Promise.all([
                fetch(`${API_URL}/api/payments/wallet`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_URL}/api/withdrawals/me`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
 
            if (walletRes.ok) {
                const wallet = await walletRes.json();
                setBalance(wallet.balance);
            }
            if (historyRes.ok) setHistory(await historyRes.json());
        } catch (error) {
            console.error("Fetch withdrawal data error:", error);
        } finally {
            setLoading(false);
        }
    };
 
    useEffect(() => {
        fetchData();
    }, []);
 
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (Number(amount) > balance) {
            toast({ title: "Insufficient Balance", variant: "destructive" });
            return;
        }
 
        setRequesting(true);
        const token = localStorage.getItem("token");
        try {
            const details = method === 'bank' 
                ? { bank_name: methodDetails.bank_name, account_number: methodDetails.account_number }
                : { khalti_id: methodDetails.khalti_id };
 
            const res = await fetch(`${API_URL}/api/withdrawals`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    amount: Number(amount),
                    method,
                    method_details: details
                }),
            });
 
            if (res.ok) {
                toast({ title: "Withdrawal Requested", description: "Standard process time is 1-3 business days." });
                setAmount("");
                fetchData();
            } else {
                const data = await res.json();
                toast({ title: "Request Failed", description: data.message, variant: "destructive" });
            }
        } catch (error) {
            console.error("Withdrawal error:", error);
        } finally {
            setRequesting(false);
        }
    };
 
    if (loading) return <div className="p-8 text-center">Loading wallet info...</div>;
 
    return (
        <div className="space-y-6">
            <PageHeader
                title="Withdraw Funds"
                description="Transfer your earnings to your bank or mobile wallet."
                actions={
                    <Button asChild variant="outline" size="sm">
                        <Link href="/dashboard"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard</Link>
                    </Button>
                }
            />
 
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-1 bg-primary/5 border-primary/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Wallet className="h-5 w-5 text-primary" />
                            Current Balance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">NPR {Number(balance).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">Ready for payout</p>
                    </CardContent>
                </Card>
 
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Transfer Request</CardTitle>
                        <CardDescription>Enter amount and payout method.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="amount">Withdrawal Amount (NPR)</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    placeholder="Minimum 100"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    max={balance}
                                    required
                                />
                            </div>
 
                            <div className="grid gap-2">
                                <Label htmlFor="method">Payout Method</Label>
                                <Select value={method} onValueChange={setMethod}>
                                    <SelectTrigger id="method">
                                        <SelectValue placeholder="Select method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="bank">Bank Transfer</SelectItem>
                                        <SelectItem value="khalti">Khalti ID</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
 
                            {method === 'bank' ? (
                                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1">
                                    <div className="grid gap-2">
                                        <Label htmlFor="bank_name">Bank Name</Label>
                                        <Input
                                            id="bank_name"
                                            placeholder="e.g. NIC Asia"
                                            value={methodDetails.bank_name}
                                            onChange={(e) => setMethodDetails({ ...methodDetails, bank_name: e.target.value })}
                                            required={method === 'bank'}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="acc_num">Account Number</Label>
                                        <Input
                                            id="acc_num"
                                            placeholder="XXXX XXXX XXXX"
                                            value={methodDetails.account_number}
                                            onChange={(e) => setMethodDetails({ ...methodDetails, account_number: e.target.value })}
                                            required={method === 'bank'}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="grid gap-2 animate-in fade-in slide-in-from-top-1">
                                    <Label htmlFor="khalti_id">Khalti ID / Phone Number</Label>
                                    <Input
                                        id="khalti_id"
                                        placeholder="98XXXXXXXX"
                                        value={methodDetails.khalti_id}
                                        onChange={(e) => setMethodDetails({ ...methodDetails, khalti_id: e.target.value })}
                                        required={method === 'khalti'}
                                    />
                                </div>
                            )}
 
                            <Button type="submit" className="w-full" disabled={requesting || !amount || Number(amount) <= 0 || Number(amount) > balance}>
                                {requesting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Banknote className="h-4 w-4 mr-2" />}
                                Request Withdrawal
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
 
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Withdrawal History
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {history.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground italic border-2 border-dashed rounded-lg">
                            No withdrawal history yet.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Method</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {history.map((h) => (
                                    <TableRow key={h.id}>
                                        <TableCell className="text-sm">{new Date(h.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="font-bold">Rs. {parseFloat(h.amount).toLocaleString()}</TableCell>
                                        <TableCell className="capitalize text-xs">{h.method}</TableCell>
                                        <TableCell>
                                            <Badge variant={h.status === 'completed' ? 'default' : (h.status === 'rejected' ? 'destructive' : 'secondary')} className="text-[10px]">
                                                {h.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
