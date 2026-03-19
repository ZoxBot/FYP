"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, Shield, AlertTriangle, Activity, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AnalyticsCharts } from "@/components/admin/AnalyticsCharts";
import { DataExportButtons } from "@/components/admin/DataExportButtons";

interface Stats {
    users: number;
    clients: number;
    freelancers: number;
    jobs: number;
    pending_jobs: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        const fetchData = async () => {
            try {
                const [statsRes, analyticsRes] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/stats`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/analytics/overview`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ]);

                if (statsRes.ok) setStats(await statsRes.json());
                if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
            } catch (error) {
                console.error("Dashboard fetch error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-40 space-y-4">
            <Activity className="h-10 w-10 text-blue-500 animate-pulse" />
            <div className="text-slate-400 font-medium animate-pulse">Synchronizing system telemetry...</div>
        </div>
    );

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-white mb-1">System Intelligence</h1>
                    <p className="text-slate-400 font-medium">Real-time control panel metrics and growth analytics.</p>
                </div>
                <Badge variant="outline" className="h-7 border-blue-500/20 bg-blue-500/5 text-blue-400 gap-1.5 px-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" /> Live Stream Active
                </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest">Global Users</CardTitle>
                        <Users className="h-5 w-5 text-blue-400 transition-transform group-hover:scale-110" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-white">{stats?.users || 0}</div>
                        <p className="text-xs font-medium text-slate-500 mt-1">
                            {stats?.clients} Clients • {stats?.freelancers} Freelancers
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest">Active Jobs</CardTitle>
                        <Briefcase className="h-5 w-5 text-emerald-400 transition-transform group-hover:scale-110" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-white">{stats?.jobs || 0}</div>
                        <p className="text-xs font-medium text-emerald-500/80 mt-1 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" /> Growth trend stable
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden group border-l-4 border-l-orange-500/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest">Moderation Queue</CardTitle>
                        <AlertTriangle className="h-5 w-5 text-orange-500 animate-bounce" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-white">{stats?.pending_jobs || 0}</div>
                        <Badge variant="outline" className="mt-2 border-orange-500/20 bg-orange-500/10 text-orange-500 text-[10px] font-black uppercase tracking-tighter">Action Required</Badge>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest">System Health</CardTitle>
                        <Activity className="h-5 w-5 text-cyan-400 transition-transform group-hover:rotate-12" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-white">99.9%</div>
                        <p className="text-xs font-medium text-slate-500 mt-1 capitalize">Latency: 24ms • operational</p>
                    </CardContent>
                </Card>
            </div>

            {/* NEW: Data Export Section */}
            <DataExportButtons />

            {/* NEW: Analytics Section */}
            {analytics ? (
                <div className="space-y-6">
                    <div className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-blue-500" />
                        <h2 className="text-xl font-black text-white uppercase tracking-widest">Visual Intelligence</h2>
                    </div>
                    <AnalyticsCharts data={analytics} />
                </div>
            ) : (
                <div className="h-[400px] flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-[2rem] bg-slate-900/40">
                    <Activity className="h-8 w-8 text-slate-700 mb-4 animate-spin-slow" />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Awaiting data stream processing...</p>
                </div>
            )}
        </div>
    );
}
