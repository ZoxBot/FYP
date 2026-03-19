"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Plus, MoreVertical, Users, Trash2, Edit2, Lock, Settings2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { PermissionSelector } from "@/components/admin/PermissionSelector";
import { PermissionData } from "@/components/admin/types";
import { useToast } from "@/hooks/use-toast";

interface AdminGroup {
    id: number;
    name: string;
    description: string;
    created_at: string;
}

interface AdminRole {
    id: number;
    name: string;
    level: number;
    description: string;
}

export default function AdminRolesPage() {
    const [roles, setRoles] = useState<AdminRole[]>([]);
    const [groups, setGroups] = useState<AdminGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [newGroupName, setNewGroupName] = useState("");

    // Permission Management State
    const [allPermissions, setAllPermissions] = useState<PermissionData[]>([]);
    const [isPermModalOpen, setIsPermModalOpen] = useState(false);
    const [currentEditingTarget, setCurrentEditingTarget] = useState<{ type: 'role' | 'group', id: number, name: string } | null>(null);
    const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);
    const [savingPerms, setSavingPerms] = useState(false);
    const { toast } = useToast();

    const fetchData = async () => {
        const token = localStorage.getItem('admin_token');
        try {
            const [rolesRes, groupsRes, permsRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/roles`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/groups`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/permissions`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            if (rolesRes.ok) setRoles(await rolesRes.json());
            if (groupsRes.ok) setGroups(await groupsRes.json());
            if (permsRes.ok) setAllPermissions(await permsRes.json());
        } catch (error) {
            console.error("Fetch RBAC data error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenPermissionModal = async (type: 'role' | 'group', id: number, name: string) => {
        setCurrentEditingTarget({ type, id, name });
        setSelectedPermissionIds([]);
        setIsPermModalOpen(true);

        const token = localStorage.getItem('admin_token');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/${type}s/${id}/permissions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // If it's role, it might return full objects or IDs. Role endpoint returns objects. Group returns IDs.
                if (type === 'role') {
                    setSelectedPermissionIds(data.map((p: any) => p.id));
                } else {
                    setSelectedPermissionIds(data);
                }
            }
        } catch (error) {
            toast({ title: "Fetch Error", description: "Failed to fetch permissions", variant: "destructive" });
        }
    };

    const handleSavePermissions = async () => {
        if (!currentEditingTarget) return;
        setSavingPerms(true);
        const { type, id } = currentEditingTarget;
        const token = localStorage.getItem('admin_token');

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/${type}s/${id}/permissions`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ permissionIds: selectedPermissionIds })
            });

            if (res.ok) {
                toast({ title: "Success", description: "Permissions updated successfully" });
                setIsPermModalOpen(false);
            } else {
                toast({ title: "Update Failed", description: "Failed to update permissions", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Error saving permissions", variant: "destructive" });
        } finally {
            setSavingPerms(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const createGroup = async () => {
        if (!newGroupName) return;
        const token = localStorage.getItem('admin_token');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/groups`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ name: newGroupName, description: "Custom administrative group" })
            });
            if (res.ok) {
                setNewGroupName("");
                fetchData();
            }
        } catch (error) {
            console.error("Create group error:", error);
        }
    };

    const deleteGroup = async (id: number) => {
        if (!confirm("Are you sure you want to delete this group?")) return;
        const token = localStorage.getItem('admin_token');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/groups/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) fetchData();
        } catch (error) {
            console.error("Delete group error:", error);
        }
    };

    if (loading) return <div className="text-slate-400">Loading RBAC hierarchy...</div>;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Shield className="h-6 w-6 text-blue-500" />
                    Roles & Permissions
                </h1>
                <p className="text-slate-400">Manage administrative authority levels and functional groups.</p>
            </div>

            <section className="space-y-4">
                <div className="flex items-center gap-2 text-slate-200 font-semibold">
                    <Lock className="h-4 w-4 text-amber-500" />
                    System Roles
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {roles.map((role) => (
                        <Card key={role.id} className="bg-slate-900 border-slate-800">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 h-20">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-slate-200">{role.name}</CardTitle>
                                        <Badge variant="outline" className="text-[10px] text-blue-400 border-blue-400/20">
                                            Level {role.level}
                                        </Badge>
                                    </div>
                                    <CardDescription className="text-slate-500 text-xs">{role.description}</CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-slate-500 hover:text-blue-400"
                                        onClick={() => handleOpenPermissionModal('role', role.id, role.name)}
                                    >
                                        <Settings2 className="h-4 w-4" />
                                    </Button>
                                    <Shield className="h-5 w-5 text-slate-700" />
                                </div>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            </section>

            <section className="space-y-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-slate-200 font-semibold">
                        <Users className="h-4 w-4 text-blue-500" />
                        Administrative Groups
                    </div>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Group name..."
                            className="h-8 w-40 bg-slate-800 border-slate-700 text-xs text-slate-200"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                        />
                        <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 text-xs" onClick={createGroup}>
                            <Plus className="h-3 w-3 mr-1" /> Create
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {groups.map((group) => (
                        <Card key={group.id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-slate-200 text-base">{group.name}</CardTitle>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-600 hover:text-red-400" onClick={() => deleteGroup(group.id)}>
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                                <CardDescription className="text-slate-500 text-xs">{group.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between text-[10px] text-slate-600 mt-2">
                                    <span>Created {new Date(group.created_at).toLocaleDateString()}</span>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="link"
                                            className="h-auto p-0 text-blue-500 text-[10px]"
                                            onClick={() => handleOpenPermissionModal('group', group.id, group.name)}
                                        >
                                            Permissions
                                        </Button>
                                        <Button variant="link" className="h-auto p-0 text-slate-500 text-[10px]">Members</Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Permission Management Modal */}
            <Dialog open={isPermModalOpen} onOpenChange={setIsPermModalOpen}>
                <DialogContent className="bg-slate-900 border-slate-800 text-slate-200 max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Management Permissions: {currentEditingTarget?.name}</DialogTitle>
                        <DialogDescription className="text-slate-500">
                            Select functional permissions for this {currentEditingTarget?.type}.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <PermissionSelector
                            allPermissions={allPermissions}
                            selectedIds={selectedPermissionIds}
                            onChange={setSelectedPermissionIds}
                        />
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" className="border-slate-800 text-slate-400" onClick={() => setIsPermModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSavePermissions} disabled={savingPerms}>
                            {savingPerms ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
