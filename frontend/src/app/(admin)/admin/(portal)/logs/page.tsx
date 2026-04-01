"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Shield, Clock, Terminal } from "lucide-react";

interface AuditLog {
    id: number;
    admin_id: number;
    first_name: string;
    last_name: string;
    email: string;
    action: string;
    target_type: string;
    target_id: number;
    details: any;
    ip_address: string;
    created_at: string;
}

import { Button } from "@/components/ui/button";

export default function AdminLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    // Pagination state
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalLogs, setTotalLogs] = useState(0);

    const fetchLogs = async () => {
        setLoading(true);
        const token = localStorage.getItem('admin_token');
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: "50"
            });

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/logs?${queryParams}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs);
                setTotalPages(data.pages);
                setTotalLogs(data.total);
            }
        } catch (error) {
            console.error("Fetch logs error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page]);

    const getActionColor = (action: string) => {
        if (action.includes('delete') || action.includes('ban')) return "bg-red-500/10 text-red-500 border-red-500/20";
        if (action.includes('update') || action.includes('migrate')) return "bg-amber-500/10 text-amber-500 border-amber-500/20";
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    };

    if (loading && logs.length === 0) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <div className="text-slate-400">Loading audit stream...</div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-50">
                        <Activity className="h-6 w-6 text-blue-500" />
                        System Audit Logs
                    </h1>
                    <p className="text-slate-400">History of {totalLogs} administrative actions in the portal.</p>
                </div>
            </div>

            <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-800 text-slate-500 text-xs">
                                    <th className="p-4 font-medium uppercase text-slate-500">Admin</th>
                                    <th className="p-4 font-medium uppercase text-slate-500">Action</th>
                                    <th className="p-4 font-medium uppercase text-slate-500">Target</th>
                                    <th className="p-4 font-medium uppercase text-slate-500">Timestamp</th>
                                    <th className="p-4 font-medium uppercase text-slate-500">IP Address</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-slate-500 italic">No audit logs found.</td>
                                    </tr>
                                ) : logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-800/20 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <Shield className="h-4 w-4 text-slate-500" />
                                                <div>
                                                    <div className="font-medium text-slate-200">{log.first_name} {log.last_name}</div>
                                                    <div className="text-[10px] text-slate-500">{log.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <Badge variant="outline" className={getActionColor(log.action)}>
                                                {log.action.replace('_', ' ')}
                                            </Badge>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-slate-400 text-xs capitalize">{log.target_type}</span>
                                            <span className="text-slate-600 text-xs ml-1">#{log.target_id}</span>
                                        </td>
                                        <td className="p-4 text-xs text-slate-500">
                                            <div className="flex items-center gap-1 font-mono text-slate-500">
                                                <Clock className="h-3 w-3" />
                                                {new Date(log.created_at).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="p-4 text-xs font-mono text-slate-600">
                                            <div className="flex items-center gap-1 text-slate-600">
                                                <Terminal className="h-3 w-3" />
                                                {log.ip_address}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between p-4 border-t border-slate-800">
                            <p className="text-sm text-slate-400">
                                Showing page {page} of {totalPages} ({totalLogs} total)
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
