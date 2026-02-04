"use client";

import { PageHeader } from "@/components/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Edit, Mail, Plus, Star, Upload, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Verification Card Component
function VerificationCard() {
  const [status, setStatus] = useState<'unverified' | 'pending' | 'verified'>('unverified');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/verification/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json(); // { isVerified, pendingRequest }
        if (data.isVerified) {
          setStatus('verified');
        } else if (data.pendingRequest) {
          setStatus('pending');
        } else {
          setStatus('unverified');
        }
      }
    } catch (e) {
      console.error("Failed to fetch verification status", e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('document', file);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/verification/verify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        toast({ title: "Document Submitted", description: "Your verification request is under review." });
        setStatus('pending');
      } else {
        const err = await res.json();
        toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <Card><CardContent className="p-6">Loading verification status...</CardContent></Card>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Identity Verification</CardTitle>
        <CardDescription>
          Verify your identity to post jobs and get a trusted badge.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status === 'verified' && (
          <div className="flex items-center gap-2 p-4 rounded-md bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
            <CheckCircle2 className="h-5 w-5" />
            <p className="font-medium">Your identity is verified.</p>
          </div>
        )}

        {status === 'pending' && (
          <div className="flex items-center gap-2 p-4 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            <Star className="h-5 w-5" />
            <p className="font-medium">Verification Pending Review</p>
          </div>
        )}

        {status === 'unverified' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-4 rounded-md bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-500 border border-yellow-200 dark:border-yellow-800">
              <XCircle className="h-5 w-5" />
              <p className="font-medium">You are not verified yet.</p>
            </div>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="document">Upload ID (Citizenship/Passport)</Label>
              <div className="flex gap-2">
                <Input
                  id="document"
                  type="file"
                  accept="image/*,.pdf"
                  className="flex-grow"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <Button onClick={handleUpload} disabled={!file || uploading}>
                  {uploading ? "Uploading..." : <><Upload className="h-4 w-4 mr-2" />Upload</>}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Supported formats: JPG, PNG, PDF. Max 5MB.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ first_name: "", last_name: "", bio: "", skills: [] as string[] });
  const [newSkill, setNewSkill] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

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
        setUser({
          ...data,
          name: `${data.first_name} ${data.last_name}`,
          avatar: data.avatar_url ? `${API_URL}/uploads/${data.avatar_url}` : "",
          skills: data.skills || [],
          bio: data.bio || "No bio added yet.",
          rating: 0,
          reviews: 0
        });
        setEditForm({
          first_name: data.first_name,
          last_name: data.last_name,
          bio: data.bio || "",
          skills: data.skills || []
        });
      } else if (res.status === 401 || res.status === 400) {
        localStorage.removeItem('token');
        router.push('/login');
      } else {
        setError(`Failed to load profile: ${res.status}`);
      }
    } catch (e) {
      console.error(e);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [router]);

  const addSkill = () => {
    if (newSkill.trim() && !editForm.skills.includes(newSkill.trim())) {
      setEditForm((prev) => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()],
      }));
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setEditForm((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== skillToRemove),
    }));
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;

    setIsSaving(true);
    try {
      // 1. Update Profile Text Data
      const res = await fetch(`${API_URL}/api/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      if (!res.ok) throw new Error("Failed to update profile text");

      // 2. Update Avatar if selected
      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        const avatarRes = await fetch(`${API_URL}/api/users/avatar`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
        if (!avatarRes.ok) throw new Error("Failed to upload avatar");
      }

      toast({
        title: "Profile Updated",
        description: "Your changes have been saved successfully.",
      });
      setIsEditing(false);
      setAvatarFile(null);
      fetchUser();
    } catch (e: any) {
      toast({
        title: "Update Failed",
        description: e.message || "Something went wrong.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-xl">Loading profile...</div>;
  if (error) return <div className="p-8 text-red-500 text-center text-xl">{error}</div>;
  if (!user) return <div className="p-8 text-center text-xl">User not found.</div>;

  return (
    <>
      <PageHeader
        title="My Profile"
        description="This is how other users will see you on the site."
        actions={
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <Button variant="outline"><Edit className="h-4 w-4 mr-2" /> Edit Profile</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
                <DialogDescription>Update your personal information, bio, and skills.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpdateProfile} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      value={editForm.first_name}
                      onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={editForm.last_name}
                      onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself..."
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    rows={4}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Skills</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. React, Modeling"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addSkill();
                        }
                      }}
                    />
                    <Button type="button" size="icon" onClick={addSkill} variant="secondary">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {editForm.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="flex items-center gap-1 py-1 px-2">
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="hover:bg-muted rounded-full p-0.5"
                        >
                          <XCircle className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {editForm.skills.length === 0 && <p className="text-xs text-muted-foreground">Add some skills to stand out.</p>}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="avatar">Profile Picture</Label>
                  <Input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                  />
                  {avatarFile && <p className="text-xs text-blue-600">Selected: {avatarFile.name}</p>}
                </div>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={user.avatar} />
                <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <h2 className="font-headline text-2xl font-bold">{user.name}</h2>
              <p className="text-muted-foreground capitalize">{user.role}</p>
              {user.is_verified && <Badge className="mt-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-100">Identity Verified</Badge>}
              <Separator className="my-4" />
              <div className="flex items-center justify-center text-sm text-muted-foreground">
                <Mail className="mr-2 h-4 w-4" /> {user.email}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {user.skills && user.skills.length > 0 ? (
                user.skills.map((skill: string) => (
                  <Badge key={skill} variant="secondary">{skill}</Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No skills added yet.</p>
              )}
            </CardContent>
          </Card>

          <VerificationCard />
        </div>
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bio</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {user.bio}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reviews & Ratings</CardTitle>
              <CardDescription>
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                  <span className="font-bold text-lg">{user.rating?.toFixed(1) || "0.0"}</span>
                  <span className="text-muted-foreground">({user.reviews || 0} reviews)</span>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-8 text-muted-foreground">
                <p>No reviews yet.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
