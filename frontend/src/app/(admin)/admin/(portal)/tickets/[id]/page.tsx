"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, CheckCircle2, AlertCircle, Send, ArrowLeft, User, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

interface Message {
    id: number;
    sender_id: number;
    message: string;
    created_at: string;
    first_name: string;
    last_name: string;
    role: string;
}

interface TicketDetail {
    id: number;
    subject: string;
    description: string;
    status: string;
    priority: string;
    created_at: string;
    first_name: string;
    last_name: string;
    email: string;
    claimed_by: number | null;
    claim_first_name?: string;
    claim_last_name?: string;
    messages: Message[];
}

export default function AdminTicketDetailPage() {
    const { id } = useParams();
    const [ticket, setTicket] = useState<TicketDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [reply, setReply] = useState("");
    const [sending, setSending] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const fetchTicket = async () => {
        const token = localStorage.getItem('admin_token');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tickets/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setTicket(await res.json());
            else throw new Error("Could not find ticket");
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to load ticket details.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTicket(); }, [id]);

    const handleClaim = async () => {
        const token = localStorage.getItem('admin_token');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/tickets/${id}/claim`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                toast({ title: "Ticket Claimed", description: "You are now managing this ticket." });
                fetchTicket();
            }
        } catch (error) {
            toast({ title: "Error", description: "Internal Server Error", variant: "destructive" });
        }
    };

    const handleReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reply.trim()) return;

        setSending(true);
        const token = localStorage.getItem('admin_token');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tickets/${id}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ message: reply })
            });

            if (res.ok) {
                setReply("");
                fetchTicket();
                toast({ title: "Message Sent", description: "Your response reaches the user instantly." });
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
        } finally {
            setSending(false);
        }
    };

    if (loading) return <div className="p-8 text-slate-400">Securing communication channel...</div>;
    if (!ticket) return <div className="p-8 text-slate-50 relative"><Button variant="link" asChild><Link href="/admin/tickets"><ArrowLeft className="mr-2" /> Back</Link></Button> Ticket not found.</div>;

    const isAdmin = (role: string) => role === 'admin' || role === 'Administrator' || role === 'Super Admin';

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-12">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="text-slate-400" asChild>
                    <Link href="/admin/tickets"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-slate-50">{ticket.subject}</h1>
                        <Badge variant="outline" className="text-slate-500 border-slate-800">#{ticket.id}</Badge>
                    </div>
                    <div className="text-sm text-slate-400">Opened by {ticket.first_name} {ticket.last_name} ({ticket.email})</div>
                </div>
                <div className="flex gap-2">
                    {!ticket.claimed_by && (
                        <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleClaim}>Claim Ticket</Button>
                    )}
                    {ticket.status !== 'closed' && (
                        <Button variant="outline" className="border-slate-800 text-slate-400 hover:bg-slate-800">Close Ticket</Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader><CardTitle className="text-sm text-slate-500 uppercase">Initial Description</CardTitle></CardHeader>
                        <CardContent className="text-slate-200 whitespace-pre-wrap">{ticket.description}</CardContent>
                    </Card>

                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                            Communication Log
                        </h3>
                        <div className="space-y-4 max-h-[500px] overflow-y-auto px-1">
                            {ticket.messages.map((msg) => (
                                <div key={msg.id} className={cn(
                                    "flex gap-3 max-w-[85%]",
                                    isAdmin(msg.role) ? "ml-auto flex-row-reverse" : "mr-auto"
                                )}>
                                    <Avatar className="h-8 w-8 mt-1 border border-slate-800">
                                        <AvatarFallback className={isAdmin(msg.role) ? "bg-blue-900/40 text-blue-400" : "bg-slate-800 text-slate-400"}>
                                            {msg.first_name[0]}{msg.last_name[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className={cn(
                                        "rounded-lg p-3 text-sm",
                                        isAdmin(msg.role)
                                            ? "bg-blue-600/10 border border-blue-500/20 text-slate-200"
                                            : "bg-slate-800/50 border border-slate-700/50 text-slate-300"
                                    )}>
                                        <div className="flex items-center gap-2 mb-1 justify-between">
                                            <span className="font-bold text-xs">
                                                {isAdmin(msg.role) ? "Support Agent" : `${msg.first_name} ${msg.last_name}`}
                                            </span>
                                            <span className="text-[10px] opacity-50">{new Date(msg.created_at).toLocaleTimeString()}</span>
                                        </div>
                                        <p>{msg.message}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Card className="bg-slate-950 border-slate-800">
                        <form onSubmit={handleReply}>
                            <CardContent className="pt-6">
                                <Textarea
                                    placeholder="Write your response to the user..."
                                    className="bg-slate-900 border-slate-800 text-slate-100 min-h-[120px]"
                                    value={reply}
                                    onChange={(e) => setReply(e.target.value)}
                                />
                            </CardContent>
                            <CardFooter className="flex justify-between items-center bg-slate-900/50 py-3">
                                <p className="text-xs text-slate-500">The user will be notified of your reply.</p>
                                <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700" disabled={sending || !reply.trim()}>
                                    {sending ? "Sending..." : <><Send className="h-4 w-4 mr-2" /> Send Reply</>}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader><CardTitle className="text-sm font-bold uppercase text-slate-500">Ticket Intelligence</CardTitle></CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Status</span>
                                <Badge className={cn(
                                    "capitalize",
                                    ticket.status === 'open' ? "bg-red-500/10 text-red-500" :
                                        ticket.status === 'in_progress' ? "bg-yellow-500/10 text-yellow-500" :
                                            "bg-green-500/10 text-green-500"
                                )}>
                                    {ticket.status.replace('_', ' ')}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Priority</span>
                                <Badge variant="outline" className="border-slate-800 text-slate-400 uppercase text-[10px]">{ticket.priority}</Badge>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Assigned To</span>
                                <div className="flex items-center gap-2">
                                    {ticket.claimed_by ? (
                                        <div className="flex items-center gap-1 text-blue-400 font-medium">
                                            <ShieldCheck className="h-3 w-3" />
                                            <span>{ticket.claim_first_name}</span>
                                        </div>
                                    ) : (
                                        <span className="text-slate-600 italic">Unassigned</span>
                                    )}
                                </div>
                            </div>
                            <Separator className="bg-slate-800" />
                            <div className="space-y-1">
                                <p className="text-xs text-slate-500 mb-2 uppercase font-bold">User Insight</p>
                                <div className="flex items-center gap-2 text-sm text-slate-300">
                                    <User className="h-3 w-3" /> {ticket.first_name} {ticket.last_name}
                                </div>
                                <div className="text-xs text-slate-600 ml-5">{ticket.email}</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function cn(...classes: any[]) { return classes.filter(Boolean).join(' '); }
function Separator({ className }: { className?: string }) { return <div className={cn("h-px w-full", className)} />; }
