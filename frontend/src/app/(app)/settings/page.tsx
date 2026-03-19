"use client";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Settings, User, Lock, Bell, Plus, XCircle, CreditCard, ShieldCheck } from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { useToast } from "@/hooks/use-toast";
import { usePermission } from "@/hooks/usePermission";
import { useRouter, useSearchParams } from "next/navigation";

function SettingsContent() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { can } = usePermission();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    first_name: "",
    last_name: "",
    bio: "",
    skills: [] as string[]
  });
  const [newSkill, setNewSkill] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Account Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Advanced Settings State
  const [notifications, setNotifications] = useState<any>(null);
  const [payments, setPayments] = useState<any>(null);
  const [privacy, setPrivacy] = useState<any>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const fetchUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setProfileForm({
          first_name: data.first_name,
          last_name: data.last_name,
          bio: data.bio || "",
          skills: data.skills || []
        });
        setNotifications(data.notification_settings || {
          email_notifications: true,
          platform_notifications: true,
          bid_alerts: true,
          message_alerts: true
        });
        setPayments(data.payment_settings || {});
        setPrivacy(data.privacy_settings || {
          profile_visibility: "public",
          show_online_status: true
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleUpdateProfile = () => {
    // Redirect to profile page with edit intent instead of saving from here
    router.push('/profile?edit=true');
  };

  const handleUpdateSettings = async (type: 'notification_settings' | 'payment_settings' | 'privacy_settings', payload: any) => {
    setIsSavingSettings(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/users/me/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ [type]: payload })
      });

      if (res.ok) {
        toast({ title: "Settings Saved", description: "Your preferences have been updated." });
        fetchUser();
      } else {
        throw new Error("Failed to update settings");
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }

    setIsChangingPassword(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/users/me/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      if (res.ok) {
        toast({ title: "Password Updated", description: "Your password has been changed successfully." });
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        const data = await res.json();
        throw new Error(data.message || "Failed to change password");
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleTabChange = (value: string) => {
    router.push(`/settings?tab=${value}`);
  };

  if (loading) return <div className="p-8 text-center">Loading settings...</div>;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Settings"
        description="Manage your account settings and preferences."
      />

      <div className="max-w-4xl mx-auto w-full py-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" /> <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <Lock className="h-4 w-4" /> <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" /> <span className="hidden sm:inline">Alerts</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> <span className="hidden sm:inline">Payments</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> <span className="hidden sm:inline">Privacy</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal details and bio.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-muted/30 p-6 rounded-2xl border flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    <div className="flex-1 space-y-2 text-center sm:text-left">
                      <h3 className="font-semibold text-lg">{user?.first_name} {user?.last_name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {user?.bio || "No bio added yet."}
                      </p>
                      
                      {user?.skills && user.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2 justify-center sm:justify-start">
                          {user.skills.map((skill: string) => (
                            <Badge key={skill} variant="secondary" className="px-2 py-0.5 text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button onClick={handleUpdateProfile}>
                      Edit Profile
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Ensure your account is using a long, random password to stay secure.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="current_password">Current Password</Label>
                    <Input
                      id="current_password"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="new_password">New Password</Label>
                    <Input
                      id="new_password"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirm_password">Confirm New Password</Label>
                    <Input
                      id="confirm_password"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={isChangingPassword}>
                      {isChangingPassword ? "Updating..." : "Update Password"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="border-destructive/50 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>Permanently delete your account and all of your content.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive">Delete Account</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose how you want to be notified about activity on Kaamko Kura.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive updates about your account via email.</p>
                    </div>
                    <Switch
                      checked={notifications?.email_notifications !== false}
                      onCheckedChange={(val) => setNotifications({ ...notifications, email_notifications: val })}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Platform Alerts</Label>
                      <p className="text-sm text-muted-foreground">Get real-time alerts in the application dashboard.</p>
                    </div>
                    <Switch
                      checked={notifications?.platform_notifications !== false}
                      onCheckedChange={(val) => setNotifications({ ...notifications, platform_notifications: val })}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Bid Alerts</Label>
                      <p className="text-sm text-muted-foreground">Notification when someone bids on your job or your bid is accepted.</p>
                    </div>
                    <Switch
                      checked={notifications?.bid_alerts !== false}
                      onCheckedChange={(val) => setNotifications({ ...notifications, bid_alerts: val })}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Message Alerts</Label>
                      <p className="text-sm text-muted-foreground">Notification when you receive a new chat message.</p>
                    </div>
                    <Switch
                      checked={notifications?.message_alerts !== false}
                      onCheckedChange={(val) => setNotifications({ ...notifications, message_alerts: val })}
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <Button onClick={() => handleUpdateSettings('notification_settings', notifications)} disabled={isSavingSettings}>
                    {isSavingSettings ? "Saving..." : "Save Preferences"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payout & Billing</CardTitle>
                <CardDescription>Configure where you receive your earnings and how you pay.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="khalti_id">Khalti ID / Number</Label>
                    <Input
                      id="khalti_id"
                      placeholder="e.g. 98XXXXXXXX"
                      value={payments?.khalti_id || ""}
                      onChange={(e) => setPayments({ ...payments, khalti_id: e.target.value })}
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or Bank Transfer</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="bank_name">Bank Name</Label>
                      <Input
                        id="bank_name"
                        placeholder="e.g. Nabil Bank"
                        value={payments?.bank_name || ""}
                        onChange={(e) => setPayments({ ...payments, bank_name: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="account_holder">Account Holder Name</Label>
                      <Input
                        id="account_holder"
                        placeholder="Full Name as in Bank"
                        value={payments?.account_holder || ""}
                        onChange={(e) => setPayments({ ...payments, account_holder: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="account_number">Account Number</Label>
                    <Input
                      id="account_number"
                      placeholder="Account ID"
                      value={payments?.account_number || ""}
                      onChange={(e) => setPayments({ ...payments, account_number: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <Button onClick={() => handleUpdateSettings('payment_settings', payments)} disabled={isSavingSettings}>
                    {isSavingSettings ? "Saving..." : "Update Payout Info"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
                <CardDescription>Control your visibility and data sharing preferences.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Profile Visibility</Label>
                      <p className="text-sm text-muted-foreground">Allow others to find your profile in searches.</p>
                    </div>
                    <select
                      className="bg-background border rounded-md p-2 px-3 text-sm focus:ring-primary focus:border-primary outline-none"
                      value={privacy?.profile_visibility || 'public'}
                      onChange={(e) => setPrivacy({ ...privacy, profile_visibility: e.target.value })}
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                      <option value="clients_only">Clients Only</option>
                    </select>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Show Online Status</Label>
                      <p className="text-sm text-muted-foreground">Display a status dot when you are active.</p>
                    </div>
                    <Switch
                      checked={privacy?.show_online_status !== false}
                      onCheckedChange={(val) => setPrivacy({ ...privacy, show_online_status: val })}
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <Button onClick={() => handleUpdateSettings('privacy_settings', privacy)} disabled={isSavingSettings}>
                    {isSavingSettings ? "Saving..." : "Save Privacy Settings"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground animate-pulse">Loading settings...</div>}>
      <SettingsContent />
    </Suspense>
  );
}

const Separator = () => <div className="h-px bg-border w-full my-2" />;
