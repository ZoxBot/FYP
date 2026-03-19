"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Shield, MoreVertical, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSearchParams } from "next/navigation";
import { UserManagement } from "@/components/admin/UserManagement";
import { UserData, PermissionData } from "@/components/admin/types";

export default function AdminUsersPage() {
    const searchParams = useSearchParams();
    const typeFilter = searchParams.get("type");

    const [users, setUsers] = useState<UserData[]>([]);
    const [allPermissions, setAllPermissions] = useState<PermissionData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchData = async () => {
        const token = localStorage.getItem('admin_token');
        try {
            const [usersRes, permsRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/users`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/permissions`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            if (usersRes.ok) setUsers(await usersRes.json());
            if (permsRes.ok) setAllPermissions(await permsRes.json());
        } catch (error) {
            console.error("Fetch admin users error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());

        if (!typeFilter) return matchesSearch;
        if (typeFilter === "admin") return matchesSearch && (u.user_role === "admin" || (u.role && u.role.toLowerCase().includes("admin")));
        if (typeFilter === "client") return matchesSearch && u.user_role === "client";
        if (typeFilter === "freelancer") return matchesSearch && u.user_role === "freelancer";

        return matchesSearch;
    });

    if (loading) return <div className="text-slate-400">Accessing secure user registry...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center text-slate-50">
                <div>
                    <h1 className="text-2xl font-bold capitalize">
                        {typeFilter ? `${typeFilter}s` : "User Management"}
                    </h1>
                    <p className="text-slate-400">
                        Audit and manage all platform accounts with granular RBAC controls.
                    </p>
                </div>
            </div>

            <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                        placeholder="Search by name or email..."
                        className="bg-slate-900 border-slate-800 pl-10 text-slate-200"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-4">
                    <UserManagement
                        users={filteredUsers}
                        allPermissions={allPermissions}
                        onRefresh={fetchData}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
