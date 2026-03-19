"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LifeBuoy, Clock, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Ticket {
    id: number;
    subject: string;
    status: string;
    priority: string;
    created_at: string;
    first_name: string;
    last_name: string;
}

export default function AdminTicketsPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        const token = localStorage.getItem('admin_token');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/tickets`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setTickets(await res.json());
        } catch (error) {
            console.error("Fetch tickets error:", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'open': return <AlertCircle className="h-4 w-4 text-red-500" />;
            case 'in_progress': return <Clock className="h-4 w-4 text-yellow-500" />;
            case 'closed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            default: return null;
        }
    };

    if (loading) return <div className="text-slate-400">Loading support queue...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-50">Support Tickets</h1>
                    <p className="text-slate-400">Manage and respond to platform support requests.</p>
                </div>
                <div className="flex gap-2">
                    <Badge variant="outline" className="text-slate-400 border-slate-800">{tickets.length} Total</Badge>
                </div>
            </div>

            <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-800">
                                    <th className="p-4 text-xs font-medium text-slate-500 uppercase">Ticket</th>
                                    <th className="p-4 text-xs font-medium text-slate-500 uppercase">User</th>
                                    <th className="p-4 text-xs font-medium text-slate-500 uppercase">Status</th>
                                    <th className="p-4 text-xs font-medium text-slate-500 uppercase">Priority</th>
                                    <th className="p-4 text-xs font-medium text-slate-500 uppercase">Created</th>
                                    <th className="p-4 text-xs font-medium text-slate-500 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tickets.map((ticket) => (
                                    <tr key={ticket.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                        <td className="p-4">
                                            <div className="font-medium text-slate-200">{ticket.subject}</div>
                                            <div className="text-xs text-slate-500">ID: #{ticket.id}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm text-slate-300">{ticket.first_name} {ticket.last_name}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(ticket.status)}
                                                <span className="text-xs capitalize text-slate-400">{ticket.status.replace('_', ' ')}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <Badge variant="outline" className={cn(
                                                "text-[10px] uppercase",
                                                ticket.priority === 'urgent' ? "border-red-500 text-red-500" :
                                                    ticket.priority === 'high' ? "border-orange-500 text-orange-500" :
                                                        "border-slate-700 text-slate-500"
                                            )}>
                                                {ticket.priority}
                                            </Badge>
                                        </td>
                                        <td className="p-4 text-xs text-slate-500">
                                            {new Date(ticket.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10" asChild>
                                                <Link href={`/admin/tickets/${ticket.id}`}>
                                                    View <ExternalLink className="ml-1 h-3 w-3" />
                                                </Link>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {tickets.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-slate-500 italic">No tickets found in the queue.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
