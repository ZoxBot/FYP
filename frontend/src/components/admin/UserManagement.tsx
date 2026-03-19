"use client";

import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Ban, Shield, FilePenLine, UserCog, Users } from "lucide-react"; // UserCog for role, Users for groups
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PermissionSelector } from "./PermissionSelector";
import { UserData, GroupData, PermissionData } from "./types";
import { usePermission } from "@/hooks/usePermission";
import { getErrorMessage } from "@/lib/utils";

interface UserManagementProps {
    users: UserData[];
    allPermissions: PermissionData[];
    onRefresh: () => void;
}

export function UserManagement({ users, allPermissions, onRefresh }: UserManagementProps) {
    const { can } = usePermission();
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

    // Change Role State
    const [isChangeRoleOpen, setIsChangeRoleOpen] = useState(false);
    const [newRole, setNewRole] = useState("");

    // Group Management State
    const [isGroupManageOpen, setIsGroupManageOpen] = useState(false);
    const [availableGroups, setAvailableGroups] = useState<GroupData[]>([]);
    const [userGroups, setUserGroups] = useState<number[]>([]); // Group IDs

    const handleUserAction = async (id: number, action: 'verify' | 'ban' | 'unban' | 'unverify') => {
        const admin_token = localStorage.getItem('admin_token');
        if (!admin_token) return;

        let body = {};
        if (action === 'verify') body = { is_verified: true };
        if (action === 'unverify') body = { is_verified: false };
        if (action === 'ban') body = { is_banned: true };
        if (action === 'unban') body = { is_banned: false };

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/users/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${admin_token}`
                },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                onRefresh();
            }
        } catch (error) {
            console.error("Failed to update user", error);
        }
    };

    // --- Role Changing ---
    const openChangeRole = (user: UserData) => {
        setSelectedUser(user);
        setNewRole(user.user_role || "N/A"); // Pre-select current
        setIsChangeRoleOpen(true);
    };

    const handleChangeRole = async () => {
        if (!selectedUser) return;
        const admin_token = localStorage.getItem('admin_token');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/users/${selectedUser.id}/role`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${admin_token}`
                },
                body: JSON.stringify({ role: newRole })
            });

            if (res.ok) {
                setIsChangeRoleOpen(false);
                onRefresh();
                alert("User role updated successfully.");
            } else {
                alert(`Failed to update role: ${getErrorMessage(res.status)}`);
            }
        } catch (e) {
            console.error(e);
        }
    };

    // --- Group Management ---
    const openGroupManage = async (user: UserData) => {
        setSelectedUser(user);
        const admin_token = localStorage.getItem('admin_token');
        if (!admin_token) return;

        try {
            // Fetch All Groups
            const gRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/groups`, {
                headers: { Authorization: `Bearer ${admin_token}` }
            });
            const allGroups = await gRes.json();
            setAvailableGroups(allGroups);

            // Fetch User Groups
            const ugRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/users/${user.id}/groups`, {
                headers: { Authorization: `Bearer ${admin_token}` }
            });
            const uGroups = await ugRes.json();
            setUserGroups(uGroups.map((g: GroupData) => g.id));

            setIsGroupManageOpen(true);
        } catch (e) {
            console.error(e);
        }
    };

    const toggleGroup = async (groupId: number, checked: boolean) => {
        if (!selectedUser) return;
        const admin_token = localStorage.getItem('admin_token');
        if (!admin_token) return;

        try {
            if (checked) {
                // Assign
                await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/users/${selectedUser.id}/groups`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${admin_token}` },
                    body: JSON.stringify({ groupId })
                });
                setUserGroups(prev => [...prev, groupId]);
            } else {
                // Remove
                await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/users/${selectedUser.id}/groups/${groupId}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${admin_token}` }
                });
                setUserGroups(prev => prev.filter(id => id !== groupId));
            }
        } catch (e) {
            console.error(e);
            alert("Failed to update group assignment.");
        }
    };

    // --- Direct Permission Management ---
    const [isDirectPermOpen, setIsDirectPermOpen] = useState(false);
    const [userDirectPerms, setUserDirectPerms] = useState<number[]>([]);

    const openDirectPerms = async (user: UserData) => {
        setSelectedUser(user);
        const admin_token = localStorage.getItem('admin_token');
        if (!admin_token) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/users/${user.id}/permissions`, {
                headers: { Authorization: `Bearer ${admin_token}` }
            });
            const data = await res.json();
            // data.directPermissions is array of objects
            setUserDirectPerms(data.directPermissions.map((p: any) => p.id));
            setIsDirectPermOpen(true);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSaveDirectPerms = async () => {
        if (!selectedUser) return;
        const admin_token = localStorage.getItem('admin_token');
        if (!admin_token) return;

        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/users/${selectedUser.id}/permissions`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${admin_token}`
                },
                body: JSON.stringify({ permissionIds: userDirectPerms })
            });
            setIsDirectPermOpen(false);
            alert("User direct permissions updated.");
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user) => (
                        <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.first_name} {user.last_name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="capitalize">{user.role}</Badge>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex gap-2">
                                    {user.is_verified && <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">Verified</Badge>}
                                    {user.is_banned && <Badge variant="destructive">Banned</Badge>}
                                    {!user.is_verified && !user.is_banned && <Badge variant="outline">Pending</Badge>}
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                {/* Verification */}
                                {!user.is_verified && can('user.verify') && (
                                    <Button size="sm" variant="outline" className="text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10" onClick={() => handleUserAction(user.id, 'verify')}>
                                        <CheckCircle className="h-4 w-4 mr-1" /> Verify
                                    </Button>
                                )}

                                {/* Banning */}
                                {!user.is_banned ? (
                                    can('user.ban') && (
                                        <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-400 hover:bg-red-500/10" onClick={() => handleUserAction(user.id, 'ban')}>
                                            <Ban className="h-4 w-4" />
                                        </Button>
                                    )
                                ) : (
                                    can('user.ban') && (
                                        <Button size="sm" variant="outline" className="text-red-500 border-red-500/20 hover:bg-red-500/10" onClick={() => handleUserAction(user.id, 'unban')}>
                                            Unban
                                        </Button>
                                    )
                                )}

                                {/* Change Role - NEW */}
                                {can('user.change_role') && (
                                    <Button size="sm" variant="ghost" className="text-slate-400 hover:text-slate-200" onClick={() => openChangeRole(user)} title="Change Role">
                                        <UserCog className="h-4 w-4" />
                                    </Button>
                                )}

                                {/* Assign Groups - NEW */}
                                {can('group.assign') && (
                                    <Button size="sm" variant="ghost" className="text-slate-400 hover:text-slate-200" onClick={() => openGroupManage(user)} title="Manage Groups">
                                        <Users className="h-4 w-4" />
                                    </Button>
                                )}

                                {/* Manage Direct Permissions */}
                                {can('rbac.permissions.manage') && (
                                    <Button size="sm" variant="ghost" className="text-slate-400 hover:text-slate-200" onClick={() => openDirectPerms(user)} title="Direct Permissions">
                                        <Shield className="h-4 w-4" />
                                    </Button>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {/* Change Role Dialog */}
            <Dialog open={isChangeRoleOpen} onOpenChange={setIsChangeRoleOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Change Role for {selectedUser?.first_name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Label>Select New Role</Label>
                        <select
                            className="w-full p-2 border rounded"
                            value={newRole || "N/A"}
                            onChange={(e) => setNewRole(e.target.value)}
                        >
                            <option value="freelancer">Freelancer</option>
                            <option value="client">Client</option>
                            <option value="admin">Admin (Basic)</option>
                            <option value="N/A">N/A (No Role)</option>
                        </select>
                        <p className="text-sm text-muted-foreground text-red-500">
                            {selectedUser?.user_role === 'admin' && newRole !== 'admin'
                                ? "Warning: Removing Admin access will CLEAR all their RBAC roles, admin groups, and special permissions."
                                : "Warning: Changing a user's role will fundamentally change their experience on the platform."
                            }
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsChangeRoleOpen(false)}>Cancel</Button>
                        <Button onClick={handleChangeRole}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Manage Groups Dialog */}
            <Dialog open={isGroupManageOpen} onOpenChange={setIsGroupManageOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Manage Groups for {selectedUser?.first_name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Label>Assigned Groups</Label>
                        <div className="space-y-2">
                            {availableGroups.length === 0 && <p className="text-sm text-muted-foreground">No groups available.</p>}
                            {availableGroups.map(group => (
                                <div key={group.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`grp-${group.id}`}
                                        checked={userGroups.includes(group.id)}
                                        onCheckedChange={(checked) => toggleGroup(group.id, checked as boolean)}
                                    />
                                    <Label htmlFor={`grp-${group.id}`}>{group.name}</Label>
                                </div>
                            ))}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Direct Permissions Dialog */}
            <Dialog open={isDirectPermOpen} onOpenChange={setIsDirectPermOpen}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Direct Permissions: {selectedUser?.first_name}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <PermissionSelector
                            allPermissions={allPermissions}
                            selectedIds={userDirectPerms}
                            onChange={setUserDirectPerms}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDirectPermOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveDirectPerms}>Save Permissions</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
