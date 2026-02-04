"use client";

import { usePermission } from "@/hooks/usePermission";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Briefcase, User, Shield, AlertTriangle, CheckCircle, Ban, FileText, Check, X, FilePenLine } from "lucide-react";
import { useRouter } from "next/navigation";


import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// Types
type Stats = {
  users: number;
  freelancers: number;
  clients: number;
  jobs: number;
  pending_jobs: number;
};

type UserData = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_verified: boolean;
  is_banned: boolean;
  created_at: string;
};

type JobData = {
  id: number;
  title: string;
  description: string;
  budget: string;
  status: string;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
};

type RoleData = {
  id: number;
  name: string;
  level: number;
  description: string;
};

type PermissionData = {
  id: number;
  slug: string;
  description: string;
  parent_id: number | null;
};

type VerificationRequest = {
  id: number;
  user_id: number;
  document_path: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
};

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [allPermissions, setAllPermissions] = useState<PermissionData[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);

  // Role Editing State
  const [selectedRole, setSelectedRole] = useState<RoleData | null>(null);
  const [rolePermissions, setRolePermissions] = useState<number[]>([]);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);

  // Role Assignment State
  const [selectedUserForRole, setSelectedUserForRole] = useState<string>("");
  const [selectedRoleForAssignment, setSelectedRoleForAssignment] = useState<string>("");
  const [isRoleAssignmentDialogOpen, setIsRoleAssignmentDialogOpen] = useState(false);
  const [userToAssignRole, setUserToAssignRole] = useState<UserData | null>(null);

  // User Permission Editing State
  const [selectedUserForPerms, setSelectedUserForPerms] = useState<UserData | null>(null);
  const [userRolePerms, setUserRolePerms] = useState<number[]>([]); // Derived from role (read-only in UI context, usually)
  const [userDirectPerms, setUserDirectPerms] = useState<number[]>([]); // Directly assigned
  const [isUserPermDialogOpen, setIsUserPermDialogOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { can, loading: permLoading } = usePermission();

  const fetchStats = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats", error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      router.push('/login');
      return;
    }

    if (!permLoading && !can('user.view')) {
      console.log("Unauthorized access to admin panel. Redirecting...");
      router.push('/dashboard');
      return;
    }

    if (!permLoading && can('user.view')) {
      Promise.all([fetchStats(), fetchUsers(), fetchJobs(), fetchRoles(), fetchPermissions(), fetchVerificationRequests()]).finally(() => setLoading(false));
    }
  }, [router, permLoading, can]);

  if (loading || permLoading) {
    return <div className="p-8 flex items-center justify-center h-full text-muted-foreground">Checking Authorization...</div>;
  }


  const fetchUsers = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
  };

  const fetchJobs = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/jobs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (error) {
      console.error("Failed to fetch jobs", error);
    }
  };

  const fetchVerificationRequests = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/verification/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setVerificationRequests(await res.json());
    } catch (e) {
      console.error("Failed to fetch verifications", e);
    }
  };

  const handleVerificationAction = async (id: number, action: 'approve' | 'reject') => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/verification/${id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        fetchVerificationRequests();
        fetchUsers(); // User status changed
      }
    } catch (e) {
      console.error("Failed to action verification", e);
    }
  };

  const fetchRoles = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/roles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setRoles(await res.json());
    } catch (e) {
      console.error("Failed to fetch roles", e);
    }
  };

  const fetchPermissions = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/permissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setAllPermissions(await res.json());
    } catch (e) {
      console.error("Failed to fetch permissions", e);
    }
  };

  // ROLE Management
  const handleEditPermissions = async (role: RoleData) => {
    setSelectedRole(role);
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/roles/${role.id}/permissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const perms: PermissionData[] = await res.json();
        setRolePermissions(perms.map(p => p.id));
        setIsPermissionDialogOpen(true);
      }
    } catch (e) {
      console.error("Failed to fetch role permissions", e);
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/roles/${selectedRole.id}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ permissionIds: rolePermissions })
      });
      setIsPermissionDialogOpen(false);
      // Optional: Show toast
    } catch (e) {
      console.error("Failed to save permissions", e);
    }
  };

  const togglePermission = (id: number) => {
    setRolePermissions(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  // USER Permission Management
  const handleManageUserPermissions = async (user: UserData) => {
    setSelectedUserForPerms(user);
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/users/${user.id}/permissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // data.rolePermissions, data.directPermissions
        setUserRolePerms(data.rolePermissions.map((p: any) => p.id));
        setUserDirectPerms(data.directPermissions.map((p: any) => p.id));
        setIsUserPermDialogOpen(true);
      }
    } catch (e) {
      console.error("Failed to fetch user permissions", e);
    }
  };

  const handleSaveUserPermissions = async () => {
    if (!selectedUserForPerms) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/users/${selectedUserForPerms.id}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ permissionIds: userDirectPerms })
      });

      if (res.ok) {
        setIsUserPermDialogOpen(false);
        alert("User permissions updated!");
      }
    } catch (e) {
      console.error("Failed to save user perms", e);
    }
  };

  const toggleUserDirectPermission = (id: number) => {
    // Don't verify against role perms here, just toggle direct
    setUserDirectPerms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleAssignRole = async () => {
    // Use either the dedicated dialog state OR the separate tab state (which uses selectedUserForRole)
    const userId = userToAssignRole ? userToAssignRole.id : selectedUserForRole;
    if (!userId || !selectedRoleForAssignment) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/users/${userId}/role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ roleId: selectedRoleForAssignment })
      });
      if (res.ok) {
        fetchUsers();
        setIsRoleAssignmentDialogOpen(false);
        alert("Role assigned successfully!");
      } else {
        alert("Failed to assign role.");
      }
    } catch (e) {
      console.error("Failed to assign role", e);
    }
  };

  const handleOpenRoleDialog = (user: UserData) => {
    setUserToAssignRole(user);
    setSelectedRoleForAssignment(""); // Reset selection
    setIsRoleAssignmentDialogOpen(true);
  };

  const handleUserAction = async (id: number, action: 'verify' | 'ban' | 'unban' | 'unverify') => {
    const token = localStorage.getItem('token');
    if (!token) return;

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
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error("Failed to update user", error);
    }
  };

  const handleJobAction = async (id: number, status: 'active' | 'rejected') => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/jobs/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        fetchJobs();
        fetchStats(); // Update stats as pending count changes
      }
    } catch (error) {
      console.error("Failed to update job", error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    Promise.all([fetchStats(), fetchUsers(), fetchJobs(), fetchRoles(), fetchPermissions()]).finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  // Group permissions for UI
  const parentPermissions = allPermissions.filter(p => !p.parent_id);
  const getChildren = (parentId: number) => allPermissions.filter(p => p.parent_id === parentId);

  return (
    <>
      <PageHeader
        title="Admin Dashboard"
        description="Manage users, jobs, and system settings."
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.users || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.clients} Clients, {stats?.freelancers} Freelancers
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.jobs || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Jobs</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending_jobs || 0}</div>
            <p className="text-xs text-muted-foreground">Requires moderation</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Role</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Admin</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="jobs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="jobs">Job Moderation</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="verifications">Verifications <Badge variant="secondary" className="ml-2">{verificationRequests.length}</Badge></TabsTrigger>
          {can('rbac.roles.manage') && <TabsTrigger value="roles">Role Management</TabsTrigger>}
        </TabsList>


        <TabsContent value="verifications" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Pending Identity Verifications</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Document</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {verificationRequests.map(req => (
                    <TableRow key={req.id}>
                      <TableCell>
                        <div className="font-medium">{req.first_name} {req.last_name}</div>
                        <div className="text-sm text-muted-foreground">{req.email}</div>
                      </TableCell>
                      <TableCell>{new Date(req.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <a
                          href={`http://localhost:5000/uploads/${req.document_path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline flex items-center"
                        >
                          <FileText className="h-4 w-4 mr-1" /> View Document
                        </a>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleVerificationAction(req.id, 'approve')}>
                            Verify User
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleVerificationAction(req.id, 'reject')}>
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {verificationRequests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                        No pending verifications.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
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
                          {can('rbac.roles.manage') && (
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full" onClick={() => handleOpenRoleDialog(user)}>
                              <FilePenLine className="h-3 w-3" />
                            </Button>
                          )}
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
                        <div className="flex justify-end gap-2">
                          {!user.is_verified && can('user.verify') && (
                            <Button size="sm" variant="outline" onClick={() => handleUserAction(user.id, 'verify')}>
                              <CheckCircle className="h-4 w-4 mr-1" /> Verify
                            </Button>
                          )}
                          {user.is_verified && can('user.verify') && (
                            <Button size="sm" variant="ghost" onClick={() => handleUserAction(user.id, 'unverify')}>
                              Unverify
                            </Button>
                          )}

                          {can('rbac.permissions.manage') && (
                            <Button size="sm" variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => handleManageUserPermissions(user)}>
                              <Shield className="h-3 w-3 mr-1" /> Perms
                            </Button>
                          )}

                          {!user.is_banned ? (
                            can('user.ban') && (
                              <Button size="sm" variant="destructive" onClick={() => handleUserAction(user.id, 'ban')}>
                                <Ban className="h-4 w-4 mr-1" /> Ban
                              </Button>
                            )
                          ) : (
                            can('user.ban') && (
                              <Button size="sm" variant="outline" onClick={() => handleUserAction(user.id, 'unban')}>
                                Unban
                              </Button>
                            )
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Job Moderation</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>
                        <div className="font-medium">{job.title}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-xs">{job.description}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{job.first_name} {job.last_name}</div>
                        <div className="text-xs text-muted-foreground">{job.email}</div>
                      </TableCell>
                      <TableCell>${job.budget}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            job.status === 'active' ? 'default' :
                              job.status === 'completed' ? 'secondary' :
                                job.status === 'rejected' ? 'destructive' : 'outline'
                          }
                          className={job.status === 'active' ? 'bg-green-600' : ''}
                        >
                          {job.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {job.status === 'pending' && (
                          <div className="flex justify-end gap-2">
                            {can('job.approve') && (
                              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleJobAction(job.id, 'active')}>
                                <Check className="h-4 w-4 mr-1" /> Approve
                              </Button>
                            )}
                            {can('job.reject') && (
                              <Button size="sm" variant="destructive" onClick={() => handleJobAction(job.id, 'rejected')}>
                                <X className="h-4 w-4 mr-1" /> Reject
                              </Button>
                            )}
                          </div>
                        )}
                        {job.status !== 'pending' && (
                          <span className="text-sm text-muted-foreground capitalize">
                            {job.status}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {jobs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                        No jobs found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Existing Roles</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role Name</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Permissions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.map(role => (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">{role.name}</TableCell>
                        <TableCell>{role.level}</TableCell>
                        <TableCell>{role.description}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => handleEditPermissions(role)}>
                            Edit Permissions
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Assign Role to User</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="user-select">Select User</Label>
                    <select
                      id="user-select"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      onChange={(e) => setSelectedUserForRole(e.target.value)}
                    >
                      <option value="">Select a user...</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.email})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role-select">Select Role</Label>
                    <select
                      id="role-select"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      onChange={(e) => setSelectedRoleForAssignment(e.target.value)}
                    >
                      <option value="">Select a role...</option>
                      {roles.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>

                  <Button className="w-full" onClick={handleAssignRole}>
                    Assign Role
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isPermissionDialogOpen} onOpenChange={setIsPermissionDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Permissions: {selectedRole?.name}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {parentPermissions.map(parent => (
              <div key={parent.id} className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`perm-${parent.id}`}
                    checked={rolePermissions.includes(parent.id)}
                    onCheckedChange={() => togglePermission(parent.id)}
                  />
                  <Label htmlFor={`perm-${parent.id}`} className="font-bold text-lg">{parent.description}</Label>
                </div>

                <div className="grid grid-cols-2 gap-2 pl-6">
                  {getChildren(parent.id).map(child => (
                    <div key={child.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`perm-${child.id}`}
                        checked={rolePermissions.includes(child.id)}
                        onCheckedChange={() => togglePermission(child.id)}
                        disabled={rolePermissions.includes(parent.id)} // Optional: disable if parent is checked (meaning all included)
                      />
                      <Label htmlFor={`perm-${child.id}`}>{child.description}</Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPermissionDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSavePermissions}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isUserPermDialogOpen} onOpenChange={setIsUserPermDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Permissions: {selectedUserForPerms?.email}</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Green = Inherited from Role ({selectedUserForPerms?.role}) <br />
              Blue = Directly Assigned
            </p>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {parentPermissions.map(parent => (
              <div key={parent.id} className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className={`
                                h-4 w-4 rounded border flex items-center justify-center
                                ${userRolePerms.includes(parent.id) ? 'bg-green-100 border-green-500' : 'border-gray-300'}
                             `}>
                    {userRolePerms.includes(parent.id) && <Check className="h-3 w-3 text-green-700" />}
                  </div>

                  <Label className="font-bold text-lg">{parent.description}</Label>
                </div>

                <div className="grid grid-cols-2 gap-2 pl-6">
                  {getChildren(parent.id).map(child => {
                    const isInherited = userRolePerms.includes(child.id) || userRolePerms.includes(parent.id);
                    const isDirect = userDirectPerms.includes(child.id);

                    return (
                      <div key={child.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`u-perm-${child.id}`}
                          checked={isInherited || isDirect}
                          onCheckedChange={() => !isInherited && toggleUserDirectPermission(child.id)}
                          disabled={isInherited} // Can't change inherited permissions directly
                          className={isDirect ? "data-[state=checked]:bg-blue-600" : ""}
                        />
                        <Label htmlFor={`u-perm-${child.id}`} className={isInherited ? "text-green-700" : ""}>
                          {child.description} {isInherited && "(Inherited)"}
                        </Label>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUserPermDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveUserPermissions}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isRoleAssignmentDialogOpen} onOpenChange={setIsRoleAssignmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Role for {userToAssignRole?.first_name} {userToAssignRole?.last_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dialog-role-select">Select New Role</Label>
              <select
                id="dialog-role-select"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                onChange={(e) => setSelectedRoleForAssignment(e.target.value)}
                value={selectedRoleForAssignment}
              >
                <option value="">Select a role...</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRoleAssignmentDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAssignRole}>Update Role</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
