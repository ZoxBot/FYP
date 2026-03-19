"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RoleData, PermissionData, UserData, GroupData } from "./types";
import { usePermission } from "@/hooks/usePermission";
import { PermissionSelector } from "./PermissionSelector";
import { getErrorMessage } from "@/lib/utils";
import { UserCog, Shield, Users, Plus, Trash, UserPlus } from "lucide-react";
import { GroupManagement } from "./GroupManagement";

interface RoleManagementProps {
    roles: RoleData[];
    allPermissions: PermissionData[];
    allUsers: UserData[]; // For adding members
    onRefresh: () => void;
    groups: GroupData[]; // Integrated groups
}

export function RoleManagement({ roles, allPermissions, allUsers, onRefresh, groups }: RoleManagementProps) {
    const { can } = usePermission();

    // Permissions Dialog
    const [isPermDialogOpen, setIsPermDialogOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<RoleData | null>(null);
    const [rolePermissions, setRolePermissions] = useState<number[]>([]);

    // Members (Users) Dialog
    const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
    const [roleMembers, setRoleMembers] = useState<UserData[]>([]);
    const [searchUser, setSearchUser] = useState("");

    const handleEditPermissions = async (role: RoleData) => {
        setSelectedRole(role);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/roles/${role.id}/permissions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setRolePermissions(data.map((p: any) => p.id));
            setIsPermDialogOpen(true);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSavePermissions = async () => {
        if (!selectedRole) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/roles/${selectedRole.id}/permissions`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ permissionIds: rolePermissions })
            });
            if (res.ok) {
                setIsPermDialogOpen(false);
                alert("Role permissions updated!");
                onRefresh();
            }
        } catch (e) { console.error(e); }
    };

    const handleManageMembers = async (role: RoleData) => {
        setSelectedRole(role);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/roles/${role.id}/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                console.log("Role members fetched:", data);
                setRoleMembers(data);
            } else {
                console.error("Failed to fetch role members:", res.status, await res.text());
                setRoleMembers([]);
            }
            setIsMemberDialogOpen(true);
        } catch (e) {
            console.error(e);
            setRoleMembers([]);
        }
    };

    const handleAddMember = async (userId: number) => {
        if (!selectedRole) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/roles/${selectedRole.id}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ userId })
            });
            if (res.ok) {
                handleManageMembers(selectedRole);
                onRefresh();
            } else {
                alert(`Error: ${getErrorMessage(res.status)}`);
            }
        } catch (e) { console.error(e); }
    };

    const handleRemoveMember = async (userId: number) => {
        if (!selectedRole || !confirm("Are you sure? This will remove their admin access for this role.")) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/roles/${selectedRole.id}/users/${userId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                handleManageMembers(selectedRole);
                onRefresh();
            } else {
                const err = await res.json();
                alert(err.message || "Failed to remove member.");
            }
        } catch (e) { console.error(e); }
    };

    return (
        <div className="space-y-12">
            {/* Roles Section */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" /> System Roles
                    </h2>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Role Name</TableHead>
                            <TableHead>Level</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Manage</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {roles.map(role => (
                            <TableRow key={role.id}>
                                <TableCell className="font-medium">{role.name}</TableCell>
                                <TableCell>{role.level}</TableCell>
                                <TableCell>{role.description}</TableCell>
                                <TableCell className="text-right flex justify-end gap-2">
                                    <Button variant="outline" size="sm" onClick={() => handleManageMembers(role)}>
                                        <Users className="h-4 w-4 mr-1" /> Members
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => handleEditPermissions(role)}>
                                        <Shield className="h-4 w-4 mr-1" /> Perms
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Integrated Groups Section */}
            <div className="pt-8 border-t">
                <GroupManagement groups={groups} allPermissions={allPermissions} allUsers={allUsers} onRefresh={onRefresh} />
            </div>

            {/* Permissions Dialog */}
            <Dialog open={isPermDialogOpen} onOpenChange={setIsPermDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Permissions: {selectedRole?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <PermissionSelector allPermissions={allPermissions} selectedIds={rolePermissions} onChange={setRolePermissions} />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPermDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSavePermissions}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Members Dialog */}
            <Dialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Manage Members: {selectedRole?.name}</DialogTitle>
                    </DialogHeader>

                    {/* Add Member Search */}
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label>Add New Member</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Search by name or email..."
                                    value={searchUser}
                                    onChange={(e) => setSearchUser(e.target.value)}
                                />
                            </div>
                            {searchUser.length > 2 && (
                                <div className="border rounded shadow-sm max-h-40 overflow-y-auto bg-white absolute z-50 w-[94%]">
                                    {(allUsers || [])
                                        .filter(u =>
                                            ((u.first_name || "") + " " + (u.last_name || "")).toLowerCase().includes(searchUser.toLowerCase()) ||
                                            (u.email || "").toLowerCase().includes(searchUser.toLowerCase())
                                        )
                                        .slice(0, 5)
                                        .map(user => (
                                            <div key={user.id} className="p-2 hover:bg-muted flex justify-between items-center text-sm border-b last:border-0 cursor-pointer" onClick={() => handleAddMember(user.id)}>
                                                <span>{user.first_name || user.email.split('@')[0]} ({user.email})</span>
                                                <Button size="sm" variant="ghost">
                                                    <UserPlus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))
                                    }
                                </div>
                            )}
                        </div>

                        {/* Current Member List */}
                        <div className="space-y-2">
                            <Label>Current Members</Label>
                            <div className="border rounded divide-y overflow-y-auto max-h-60">
                                {roleMembers.map(member => (
                                    <div key={member.id} className="p-3 flex justify-between items-center text-sm">
                                        <div>
                                            <p className="font-medium">{member.first_name} {member.last_name}</p>
                                            <p className="text-xs text-muted-foreground">{member.email}</p>
                                        </div>
                                        <Button size="sm" variant="ghost" onClick={() => handleRemoveMember(member.id)}>
                                            <Trash className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                                {roleMembers.length === 0 && <p className="p-4 text-center text-muted-foreground text-sm">No members in this role.</p>}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button onClick={() => setIsMemberDialogOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
