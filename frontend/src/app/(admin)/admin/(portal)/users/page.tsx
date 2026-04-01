"use client";

import { useEffect, useState, Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import { User, Shield, MoreVertical, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSearchParams } from "next/navigation";
import { UserData, PermissionData } from "@/components/admin/types";

// Dynamic import for UserManagement to prevent SSR issues with complex controls
const UserManagement = dynamic(() => import("@/components/admin/UserManagement").then(mod => mod.UserManagement), { 
    ssr: false,
    loading: () => <div className="h-64 w-full bg-slate-900/50 animate-pulse rounded-xl" />
});

function AdminUsersContent() {
    const searchParams = useSearchParams();
    const typeFilter = searchParams.get("type") || "";

    const [users, setUsers] = useState<UserData[]>([]);
    const [allPermissions, setAllPermissions] = useState<PermissionData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    
    // Pagination state
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);

    const fetchData = async () => {
        setLoading(true);
        const token = localStorage.getItem('admin_token');
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                search: searchTerm,
                role: typeFilter,
                limit: "20"
            });

            const [usersRes, permsRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/users?${queryParams}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/permissions`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            if (usersRes.ok) {
                const data = await usersRes.json();
                setUsers(data.users);
                setTotalPages(data.pages);
                setTotalUsers(data.total);
            }
            if (permsRes.ok) setAllPermissions(await permsRes.json());
        } catch (error) {
            console.error("Fetch admin users error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            setPage(1);
            fetchData();
        }, searchTerm ? 500 : 0);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, typeFilter]);

    useEffect(() => {
        fetchData();
    }, [page]);

    if (loading && users.length === 0) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            <div className="text-slate-400">Accessing secure user registry...</div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center text-slate-50">
                <div>
                    <h1 className="text-2xl font-bold capitalize">
                        {typeFilter ? `${typeFilter}s` : "User Management"}
                    </h1>
                    <p className="text-slate-400">
                        Audit and manage {totalUsers} platform accounts with granular RBAC controls.
                    </p>
                </div>
            </div>

            <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                        placeholder="Search by name or email..."
                        className="bg-slate-900 border-slate-800 pl-10 text-slate-200 focus-visible:ring-emerald-500/20"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-4">
                    <UserManagement
                        users={users}
                        allPermissions={allPermissions}
                        onRefresh={fetchData}
                    />
                    
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-800">
                            <p className="text-sm text-slate-400">
                                Showing page {page} of {totalPages} ({totalUsers} total)
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

export default function AdminUsersPage() {
    return (
        <Suspense fallback={<div className="text-slate-400">Loading user registry...</div>}>
            <AdminUsersContent />
        </Suspense>
    );
}
