"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Legend } from 'recharts';

interface AnalyticsData {
    user_growth: any[];
    job_growth: any[];
    revenue_growth: any[];
    role_distribution: any[];
    job_status: any[];
    category_distribution: any[];
}

export function AnalyticsCharts({ data }: { data: AnalyticsData }) {
    // Format dates for charts
    const formatData = (items: any[]) => items.map(item => ({
        ...item,
        date: new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        count: parseInt(item.count || item.amount || 0)
    }));

    const userData = formatData(data.user_growth);
    const jobData = formatData(data.job_growth);
    const revenueData = formatData(data.revenue_growth);

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-widest">User Growth (Last 30 Days)</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    {userData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={userData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                                    itemStyle={{ color: '#3b82f6', fontSize: '12px', fontWeight: 'bold' }}
                                />
                                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-600 text-xs font-bold uppercase border border-dashed border-slate-800 rounded-lg">No growth data found</div>
                    )}
                </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-widest">Revenue Stream (Last 30 Days)</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    {revenueData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                                    itemStyle={{ color: '#10b981', fontSize: '12px', fontWeight: 'bold' }}
                                />
                                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-600 text-xs font-bold uppercase border border-dashed border-slate-800 rounded-lg">No revenue recorded yet</div>
                    )}
                </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-widest">Market Categories</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    {data.category_distribution?.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.category_distribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={8}
                                    dataKey="count"
                                    nameKey="category"
                                >
                                    {data.category_distribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff' }} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', paddingTop: '20px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-600 text-xs font-bold uppercase border border-dashed border-slate-800 rounded-lg">No jobs posted yet</div>
                    )}
                </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-widest">User Roles</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    {data.role_distribution?.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.role_distribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={8}
                                    dataKey="count"
                                    nameKey="role"
                                >
                                    {data.role_distribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', paddingTop: '20px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-600 text-xs font-bold uppercase border border-dashed border-slate-800 rounded-lg">No user data available</div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
