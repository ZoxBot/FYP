"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Settings, Save, RefreshCcw, Lock, User, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Setting {
    key: string;
    value: any;
    description: string;
}

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<Setting[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    // Profile State
    const [profile, setProfile] = useState({ first_name: "", last_name: "", email: "" });
    const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
    const [profileStatus, setProfileStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

    const fetchAll = async () => {
        const token = localStorage.getItem('admin_token');
        try {
            const [settingsRes, profileRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/settings`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            if (settingsRes.ok) setSettings(await settingsRes.json());
            if (profileRes.ok) setProfile(await profileRes.json());
        } catch (error) {
            console.error("Fetch data error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, []);

    const handleUpdateSetting = async (key: string, newValue: any) => {
        setSaving(key);
        const token = localStorage.getItem('admin_token');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/settings/${key}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ value: newValue })
            });
            if (res.ok) {
                setSettings(current => current.map(s => s.key === key ? { ...s, value: newValue } : s));
            }
        } catch (error) {
            console.error("Update setting error:", error);
        } finally {
            setSaving(null);
        }
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileStatus(null);
        const token = localStorage.getItem('admin_token');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/me/profile`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ first_name: profile.first_name, last_name: profile.last_name })
            });
            if (res.ok) setProfileStatus({ type: 'success', msg: 'Profile updated' });
            else setProfileStatus({ type: 'error', msg: 'Update failed' });
        } catch (err) {
            setProfileStatus({ type: 'error', msg: 'Server error' });
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileStatus(null);
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setProfileStatus({ type: 'error', msg: 'Passwords do not match' });
            return;
        }

        const token = localStorage.getItem('admin_token');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/me/password`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            });
            if (res.ok) {
                setProfileStatus({ type: 'success', msg: 'Password changed successfully' });
                setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
            } else {
                const data = await res.json();
                setProfileStatus({ type: 'error', msg: data.message || 'Error updating password' });
            }
        } catch (err) {
            setProfileStatus({ type: 'error', msg: 'Server error' });
        }
    };

    if (loading) return <div className="text-slate-400 p-8 flex items-center gap-3">
        <RefreshCcw className="h-5 w-5 animate-spin text-blue-500" />
        Synchronizing system configuration...
    </div>;

    return (
        <div className="space-y-10 pb-20 p-6 lg:p-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-50">
                        <Settings className="h-6 w-6 text-blue-500" />
                        Settings & Account
                    </h1>
                    <p className="text-slate-400">System configuration and administrative profile security.</p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchAll} className="border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800">
                    <RefreshCcw className="h-4 w-4 mr-2" /> Refresh
                </Button>
            </div>

            {profileStatus && (
                <div className={cn(
                    "p-4 rounded-lg flex items-center gap-3 border animate-in fade-in slide-in-from-top-2",
                    profileStatus.type === 'success' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                )}>
                    {profileStatus.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                    <span className="text-sm font-medium">{profileStatus.msg}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Section 1: System Config */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-slate-200 font-semibold mb-2">
                        <Settings className="h-4 w-4 text-blue-500" />
                        System Content & Toggles
                    </div>
                    {settings.map((setting) => (
                        <Card key={setting.key} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors">
                            <CardHeader className="pb-3 text-slate-50">
                                <CardTitle className="text-base font-medium capitalize">{setting.key.replace(/_/g, ' ')}</CardTitle>
                                <CardDescription className="text-slate-500 text-xs">{setting.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    {typeof setting.value === 'boolean' ? (
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                id={setting.key}
                                                checked={setting.value}
                                                onCheckedChange={(val) => handleUpdateSetting(setting.key, val)}
                                                disabled={saving === setting.key}
                                            />
                                            <Label htmlFor={setting.key} className="text-slate-400 text-xs cursor-pointer">
                                                {setting.value ? 'Active' : 'Disabled'}
                                            </Label>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2 w-full">
                                            <Input
                                                className="bg-slate-800 border-slate-700 text-slate-200 h-8 text-xs focus:ring-blue-500"
                                                defaultValue={setting.value}
                                                id={setting.key}
                                            />
                                            <Button
                                                size="sm"
                                                className="bg-blue-600 hover:bg-blue-700 h-8 px-3 text-xs"
                                                disabled={saving === setting.key}
                                                onClick={() => {
                                                    const el = document.getElementById(setting.key) as HTMLInputElement;
                                                    handleUpdateSetting(setting.key, el.value);
                                                }}
                                            >
                                                {saving === setting.key ? "..." : <Save className="h-3 w-3" />}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {settings.length === 0 && <div className="text-slate-600 italic text-sm">No dynamic settings discovered.</div>}
                </div>

                {/* Section 2: Account Security */}
                <div className="space-y-8">
                    {/* Profile Info */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-200 font-semibold">
                            <User className="h-4 w-4 text-blue-500" />
                            Administrative Identity
                        </div>
                        <Card className="bg-slate-900 border-slate-800">
                            <CardContent className="pt-6">
                                <form onSubmit={handleProfileUpdate} className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-slate-500">First Name</Label>
                                        <Input
                                            value={profile.first_name}
                                            onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                                            className="bg-slate-800 border-slate-700 text-slate-200 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-slate-500">Last Name</Label>
                                        <Input
                                            value={profile.last_name}
                                            onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                                            className="bg-slate-800 border-slate-700 text-slate-200 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <Label className="text-xs text-slate-500">Email Address (Read-only)</Label>
                                        <Input value={profile.email} disabled className="bg-slate-800/50 border-slate-700 text-slate-500 cursor-not-allowed" />
                                    </div>
                                    <Button type="submit" className="col-span-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-1 h-8">Update Details</Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Change Password */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-200 font-semibold">
                            <Lock className="h-4 w-4 text-red-400" />
                            Account Security
                        </div>
                        <Card className="bg-slate-900 border-slate-800 overflow-hidden shadow-lg shadow-red-950/10">
                            <div className="bg-red-500/5 px-6 py-2 border-b border-red-500/10 text-[10px] text-red-400 font-medium tracking-wider uppercase">
                                RE-AUTHENTICATION REQUIRED FOR UPDATES
                            </div>
                            <CardContent className="pt-6">
                                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-slate-500">Current Password</Label>
                                        <Input
                                            type="password"
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                            className="bg-slate-800 border-slate-700 text-slate-200 focus:ring-red-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-slate-500">New Password</Label>
                                        <Input
                                            type="password"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            className="bg-slate-800 border-slate-700 text-slate-200 focus:ring-red-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-slate-500">Confirm New Password</Label>
                                        <Input
                                            type="password"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            className="bg-slate-800 border-slate-700 text-slate-200 focus:ring-red-500"
                                        />
                                    </div>
                                    <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white text-xs py-1 h-9 font-semibold">Update Password</Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
