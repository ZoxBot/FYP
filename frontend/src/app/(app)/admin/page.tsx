"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Briefcase, User, Shield, AlertTriangle, CheckCircle, Ban } from "lucide-react";
import { useRouter } from "next/navigation";

// Types
type Stats = {
  users: number;
  freelancers: number;
  clients: number;
  gigs: number;
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

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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

  const handleAction = async (id: number, action: 'verify' | 'ban' | 'unban' | 'unverify') => {
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
        // Refresh users
        fetchUsers();
      }
    } catch (error) {
      console.error("Failed to update user", error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      // Redirect to login if not authenticated
      router.push('/login');
      return;
    }

    Promise.all([fetchStats(), fetchUsers()]).finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <>
      <PageHeader
        title="Admin Dashboard"
        description="Manage users, tasks, and system settings."
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.users || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Freelancers</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.freelancers || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.clients || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* User Management Table */}
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
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {user.is_verified && <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">Verified</Badge>}
                      {user.is_banned && <Badge variant="destructive">Banned</Badge>}
                      {!user.is_verified && !user.is_banned && <Badge variant="outline">Active</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {!user.is_verified && (
                        <Button size="sm" variant="outline" onClick={() => handleAction(user.id, 'verify')}>
                          <CheckCircle className="h-4 w-4 mr-1" /> Verify
                        </Button>
                      )}
                      {user.is_verified && (
                        <Button size="sm" variant="ghost" onClick={() => handleAction(user.id, 'unverify')}>
                          Unverify
                        </Button>
                      )}

                      {!user.is_banned ? (
                        <Button size="sm" variant="destructive" onClick={() => handleAction(user.id, 'ban')}>
                          <Ban className="h-4 w-4 mr-1" /> Ban
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleAction(user.id, 'unban')}>
                          Unban
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
