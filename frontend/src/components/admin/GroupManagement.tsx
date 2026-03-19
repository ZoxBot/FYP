"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // Assuming Textarea component exists, if not use Input
import { Edit, Trash, Shield, Plus, Users, UserPlus } from "lucide-react";
import { GroupData, PermissionData, UserData } from "./types";
import { usePermission } from "@/hooks/usePermission";
import { PermissionSelector } from "./PermissionSelector";
import { getErrorMessage } from "@/lib/utils";

interface GroupManagementProps {
    groups: GroupData[];
    allPermissions: PermissionData[];
    allUsers: UserData[]; // Added for searching
    onRefresh: () => void;
}

export function GroupManagement({ groups, allPermissions, allUsers, onRefresh }: GroupManagementProps) {
    const { can } = usePermission();

    // Group CRUD State
    const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<GroupData | null>(null);
    const [formData, setFormData] = useState({ name: "", description: "" });

    // Permission Edit State
    const [isPermDialogOpen, setIsPermDialogOpen] = useState(false);
    const [selectedGroupForPerms, setSelectedGroupForPerms] = useState<GroupData | null>(null);
    const [groupPermissions, setGroupPermissions] = useState<number[]>([]);

    // Member Management State
    const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
    const [selectedGroupForMembers, setSelectedGroupForMembers] = useState<GroupData | null>(null);
    const [groupMembers, setGroupMembers] = useState<UserData[]>([]);
    const [searchUser, setSearchUser] = useState("");

    // --- CRUD ---
    const handleCreate = () => {
        setEditingGroup(null);
        setFormData({ name: "", description: "" });
        setIsGroupDialogOpen(true);
    };

    const handleEdit = (group: GroupData) => {
        setEditingGroup(group);
        setFormData({ name: group.name, description: group.description });
        setIsGroupDialogOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this group?")) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/groups/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) onRefresh();
            else alert(`Failed to delete group: ${getErrorMessage(res.status)}`);
        } catch (e) {
            console.error(e);
            alert("Network error.");
        }
    };

    const handleSaveGroup = async () => {
        const token = localStorage.getItem('token');
        const url = editingGroup
            ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/groups/${editingGroup.id}`
            : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/groups`;
        const method = editingGroup ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setIsGroupDialogOpen(false);
                onRefresh();
            } else {
                alert(`Failed to save group: ${getErrorMessage(res.status)}`);
            }
        } catch (e) {
            console.error(e);
            alert("Network error.");
        }
    };

    // --- Permissions ---
    const handleEditPermissions = async (group: GroupData) => {
        setSelectedGroupForPerms(group);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/groups/${group.id}/permissions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const perms: number[] = await res.json();
            setGroupPermissions(perms);
            setIsPermDialogOpen(true);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSavePermissions = async () => {
        if (!selectedGroupForPerms) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/groups/${selectedGroupForPerms.id}/permissions`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ permissionIds: groupPermissions })
            });
            if (res.ok) {
                setIsPermDialogOpen(false);
                alert("Permissions updated!");
            }
        } catch (e) {
            console.error(e);
        }
    };

    // --- Members ---
    const handleManageMembers = async (group: GroupData) => {
        setSelectedGroupForMembers(group);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/groups/${group.id}/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setGroupMembers(await res.json());
            } else {
                setGroupMembers([]);
            }
            setIsMemberDialogOpen(true);
        } catch (e) {
            console.error(e);
            setGroupMembers([]);
        }
    };

    const handleAddMember = async (userId: number) => {
        if (!selectedGroupForMembers) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/users/${userId}/groups`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ groupId: selectedGroupForMembers.id })
            });
            if (res.ok) {
                handleManageMembers(selectedGroupForMembers);
            } else {
                alert(`Error: ${getErrorMessage(res.status)}`);
            }
        } catch (e) { console.error(e); }
    };

    const handleRemoveMember = async (userId: number) => {
        if (!selectedGroupForMembers || !confirm("Are you sure?")) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/groups/${selectedGroupForMembers.id}/users/${userId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                handleManageMembers(selectedGroupForMembers);
            }
        } catch (e) { console.error(e); }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Groups</h2>
                {can('group.create') && (
                    <Button onClick={handleCreate}>
                        <Plus className="h-4 w-4 mr-2" /> Create Group
                    </Button>
                )}
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {groups.map(group => (
                        <TableRow key={group.id}>
                            <TableCell className="font-medium">{group.name}</TableCell>
                            <TableCell>{group.description}</TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    {can('group.edit') && (
                                        <>
                                            <Button size="sm" variant="ghost" onClick={() => handleEdit(group)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => handleManageMembers(group)} title="Manage Members">
                                                <Users className="h-4 w-4 mr-1" /> Members
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => handleEditPermissions(group)} title="Manage Permissions">
                                                <Shield className="h-4 w-4 mr-1" /> Perms
                                            </Button>
                                        </>
                                    )}
                                    {can('group.delete') && (
                                        <Button size="sm" variant="destructive" onClick={() => handleDelete(group.id)}>
                                            <Trash className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                    {groups.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                                No groups found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {/* Create/Edit Group Dialog */}
            <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingGroup ? 'Edit Group' : 'Create Group'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Moderators"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Group description..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsGroupDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveGroup}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Permissions Dialog */}
            <Dialog open={isPermDialogOpen} onOpenChange={setIsPermDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Permissions: {selectedGroupForPerms?.name}</DialogTitle>
                    </DialogHeader>

                    <div className="py-4">
                        <PermissionSelector
                            allPermissions={allPermissions}
                            selectedIds={groupPermissions}
                            onChange={setGroupPermissions}
                        />
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPermDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSavePermissions}>Save Application</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Members Dialog */}
            <Dialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Manage Members: {selectedGroupForMembers?.name}</DialogTitle>
                    </DialogHeader>

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

                        <div className="space-y-2">
                            <Label>Current Members</Label>
                            <div className="border rounded divide-y overflow-y-auto max-h-60">
                                {groupMembers.map(member => (
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
                                {groupMembers.length === 0 && <p className="p-4 text-center text-muted-foreground text-sm">No members in this group.</p>}
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
