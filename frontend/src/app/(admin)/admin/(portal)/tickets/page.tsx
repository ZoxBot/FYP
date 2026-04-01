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

    // Pagination state
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalTickets, setTotalTickets] = useState(0);

    const fetchTickets = async () => {
        setLoading(true);
        const token = localStorage.getItem('admin_token');
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: "20"
            });

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/tickets?${queryParams}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTickets(data.tickets);
                setTotalPages(data.pages);
                setTotalTickets(data.total);
            }
        } catch (error) {
            console.error("Fetch tickets error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, [page]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'open': return <AlertCircle className="h-4 w-4 text-red-500" />;
            case 'in_progress': return <Clock className="h-4 w-4 text-yellow-500" />;
            case 'closed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            default: return null;
        }
    };

    if (loading && tickets.length === 0) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <div className="text-slate-400 font-medium animate-pulse">Synchronizing support stream...</div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-50">Support Tickets</h1>
                    <p className="text-slate-400">Manage and respond to {totalTickets} platform support requests.</p>
                </div>
                <div className="flex gap-2">
                    <Badge variant="outline" className="text-slate-400 border-slate-800">{totalTickets} Total</Badge>
                </div>
            </div>

            <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-800 text-slate-500 text-xs">
                                    <th className="p-4 font-medium uppercase">Ticket</th>
                                    <th className="p-4 font-medium uppercase">User</th>
                                    <th className="p-4 font-medium uppercase">Status</th>
                                    <th className="p-4 font-medium uppercase">Priority</th>
                                    <th className="p-4 font-medium uppercase">Created</th>
                                    <th className="p-4 font-medium uppercase text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {tickets.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-slate-500 italic">No tickets found in the queue.</td>
                                    </tr>
                                ) : (
                                    tickets.map((ticket) => (
                                        <tr key={ticket.id} className="hover:bg-slate-800/30 transition-colors">
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
                                            <td className="p-4 text-xs text-slate-500 font-mono">
                                                {new Date(ticket.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 text-right">
                                                <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 h-8 gap-1" asChild>
                                                    <Link href={`/admin/tickets/${ticket.id}`}>
                                                        View <ExternalLink className="h-3.5 w-3.5" />
                                                    </Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between p-4 border-t border-slate-800">
                            <p className="text-sm text-slate-400">
                                Showing page {page} of {totalPages} ({totalTickets} total)
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page === 1 || loading}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    className="border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800"
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page === totalPages || loading}
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    className="border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800"
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
