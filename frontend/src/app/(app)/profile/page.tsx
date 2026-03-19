"use client";

import { PageHeader } from "@/components/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Edit, Mail, Plus, Star, Upload, XCircle, Github, Linkedin, Globe, ExternalLink, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect, Suspense } from "react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { usePermission } from "@/hooks/usePermission";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage, cn } from "@/lib/utils";
import { PortfolioSection } from "@/components/profile/PortfolioSection";

// Verification Card Component
function VerificationCard() {
  const [status, setStatus] = useState<'unverified' | 'pending' | 'verified'>('unverified');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { can } = usePermission();
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
                <Button onClick={handleUpload} disabled={!file || uploading || !can('verification.submit')}>
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

function ProfileContent() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { can } = usePermission();
  const [error, setError] = useState<string | null>(null);
  const [reviewsData, setReviewsData] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ 
    first_name: "", 
    last_name: "", 
    bio: "", 
    skills: [] as string[],
    github_url: "",
    linkedin_url: "",
    dribbble_url: "",
    website_url: ""
  });
  const [newSkill, setNewSkill] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [markedForRemoval, setMarkedForRemoval] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('edit') === 'true') {
      setIsEditing(true);
    }
  }, [searchParams]);

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
        const skillList = Array.isArray(data.skills) ? data.skills : (typeof data.skills === 'string' ? data.skills.split(',').map((s: string) => s.trim()) : []);
        
        setUser({
          ...data,
          name: `${data.first_name} ${data.last_name}`,
          avatar: data.avatar_url
            ? (data.avatar_url.startsWith('http') ? data.avatar_url : `${API_URL}${data.avatar_url.startsWith('/') ? '' : '/'}${data.avatar_url}`)
            : "",
          skills: skillList,
          bio: data.bio || "No bio added yet.",
          rating: parseFloat(data.avg_rating) || 0,
          reviews: parseInt(data.review_count) || 0
        });
        fetchReviews(data.id);

        // Sync with localStorage for navbar/other components
        localStorage.setItem('user', JSON.stringify(data));
        window.dispatchEvent(new Event('userUpdated'));

        setEditForm({
          first_name: data.first_name,
          last_name: data.last_name,
          bio: data.bio || "",
          skills: skillList,
          github_url: data.github_url || "",
          linkedin_url: data.linkedin_url || "",
          dribbble_url: data.dribbble_url || "",
          website_url: data.website_url || ""
        });
      } else if (res.status === 401 || res.status === 400) {
        router.push('/login');
      } else {
        setError(`Failed to load profile: ${getErrorMessage(res.status)}`);
      }
    } catch (e) {
      console.error(e);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (userId: number) => {
    try {
      const res = await fetch(`${API_URL}/api/reviews/user/${userId}`);
      if (res.ok) {
        setReviewsData(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch reviews", e);
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

    // Client-side validation for avatar size
    if (avatarFile && avatarFile.size > 2 * 1024 * 1024) {
      setAvatarError("Maximum 2MB allowed.");
      return;
    }

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

      // 2. Remove Avatar if marked (and no new file to replace it)
      if (markedForRemoval && !avatarFile) {
        const removeRes = await fetch(`${API_URL}/api/users/avatar`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!removeRes.ok) {
          const errData = await removeRes.json();
          throw new Error(errData.message || "Failed to remove avatar");
        }
      }

      // 3. Update Avatar if selected (overrides removal)
      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        const avatarRes = await fetch(`${API_URL}/api/users/avatar`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
        if (!avatarRes.ok) {
          const errData = await avatarRes.json();
          throw new Error(errData.message || "Failed to upload avatar");
        }
      }

      toast({
        title: "Profile Updated",
        description: "Your changes have been saved successfully.",
      });
      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      setMarkedForRemoval(false);
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

  if (loading) return (
    <div className="space-y-8 animate-pulse">
      <div className="flex flex-col md:flex-row items-center gap-8 bg-card/50 p-12 rounded-[3.5rem] border border-border/50">
        <Skeleton className="h-40 w-40 rounded-full" />
        <div className="flex-1 space-y-4 text-center md:text-left">
          <Skeleton className="h-10 w-64 mx-auto md:mx-0" />
          <div className="flex flex-wrap justify-center md:justify-start gap-3">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-32 rounded-full" />
          </div>
          <Skeleton className="h-4 w-48 mx-auto md:mx-0" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="rounded-[2.5rem] p-6 space-y-4">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-12 w-full rounded-2xl" />
          </Card>
          <Card className="rounded-[2.5rem] p-6 space-y-6">
            <Skeleton className="h-8 w-32" />
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/30 p-6 rounded-3xl space-y-2">
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-3 w-16" />
              </div>
              <div className="bg-muted/30 p-6 rounded-3xl space-y-2">
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <Card className="rounded-[3rem] p-10 space-y-6">
            <Skeleton className="h-8 w-24" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="flex flex-wrap gap-2 pt-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-8 w-20 rounded-full" />)}
            </div>
          </Card>
          <div className="space-y-6">
            <Skeleton className="h-8 w-32" />
            <div className="grid grid-cols-2 gap-6">
              {[1, 2].map(i => <Skeleton key={i} className="h-48 w-full rounded-[2rem]" />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  if (error) return <div className="p-8 text-red-500 text-center text-xl">{error}</div>;
  if (!user) return <div className="p-20 text-center text-muted-foreground font-medium animate-pulse">Initializing session...</div>;

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

                <div className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Social Presence</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="github" className="flex items-center gap-2"><Github className="h-4 w-4" /> GitHub</Label>
                      <Input
                        id="github"
                        placeholder="https://github.com/username"
                        value={editForm.github_url}
                        onChange={(e) => setEditForm({ ...editForm, github_url: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="linkedin" className="flex items-center gap-2"><Linkedin className="h-4 w-4" /> LinkedIn</Label>
                      <Input
                        id="linkedin"
                        placeholder="https://linkedin.com/in/username"
                        value={editForm.linkedin_url}
                        onChange={(e) => setEditForm({ ...editForm, linkedin_url: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="dribbble" className="flex items-center gap-2"><ExternalLink className="h-4 w-4" /> Dribbble</Label>
                      <Input
                        id="dribbble"
                        placeholder="https://dribbble.com/username"
                        value={editForm.dribbble_url}
                        onChange={(e) => setEditForm({ ...editForm, dribbble_url: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="website" className="flex items-center gap-2"><Globe className="h-4 w-4" /> Website</Label>
                      <Input
                        id="website"
                        placeholder="https://yourportfolio.com"
                        value={editForm.website_url}
                        onChange={(e) => setEditForm({ ...editForm, website_url: e.target.value })}
                      />
                    </div>
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
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      if (file) {
                        if (file.size > 2 * 1024 * 1024) {
                          setAvatarError("Maximum 2MB allowed.");
                          setAvatarFile(null);
                          setAvatarPreview(null);
                        } else {
                          setAvatarError(null);
                          setAvatarFile(file);
                          setAvatarPreview(URL.createObjectURL(file));
                          setMarkedForRemoval(false); // New file selection cancels removal
                        }
                      }
                    }}
                  />
                  {avatarError && <p className="text-xs text-red-500 font-semibold">{avatarError}</p>}

                  {/* Avatar Preview & Remove Button */}
                  <div className="mt-4 flex items-center gap-4 p-3 border rounded-lg bg-muted/20">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={markedForRemoval ? "" : (avatarPreview || user.avatar)} />
                      <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-1">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="h-7 text-[10px]"
                        disabled={(!user.avatar && !avatarFile) || markedForRemoval}
                        onClick={() => {
                          if (avatarFile) {
                            setAvatarFile(null);
                            setAvatarPreview(null);
                            return;
                          }
                          setMarkedForRemoval(true);
                        }}
                      >
                        {markedForRemoval ? "Removed (pending save)" : "Remove Photo"}
                      </Button>
                      {markedForRemoval && (
                        <Button
                          type="button"
                          variant="link"
                          className="h-4 p-0 text-[10px]"
                          onClick={() => {
                            setMarkedForRemoval(false);
                            if (user.avatar) setAvatarPreview(user.avatar);
                          }}
                        >
                          Undo
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog >
        }
      />
      <div className="grid gap-12 lg:grid-cols-[1fr_350px]">
        {/* Left Column: Main Info */}
        <div className="space-y-12">
          {/* Main User Card */}
          <Card className="rounded-[3.5rem] border-none shadow-2xl bg-card/60 overflow-hidden">
            <CardContent className="p-10 md:p-16">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-12">
                <Avatar className="h-40 w-40 border-8 border-background shadow-2xl shrink-0">
                  <AvatarImage src={user.avatar} className="object-cover" />
                  <AvatarFallback className="text-5xl bg-primary/10 text-primary font-black">
                    {user.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 text-center md:text-left space-y-4">
                  <div>
                    <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                       <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{user.name}</h2>
                       {user.is_verified && (
                         <div title="Identity Verified">
                           <CheckCircle2 className="h-8 w-8 text-blue-500 fill-blue-500/10" />
                         </div>
                       )}
                    </div>
                    <Badge variant="outline" className="px-3 py-1 rounded-full bg-primary/5 text-primary text-xs font-medium uppercase tracking-wider">
                      Professional {user.role}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm font-bold text-muted-foreground/80 pt-4">
                     <div className="flex items-center gap-2">
                       <Mail className="h-4 w-4" />
                       <span>{user.email}</span>
                     </div>
                     <div className="flex items-center gap-2">
                       <Calendar className="h-4 w-4" />
                       <span>Member since {new Date(user.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
                     </div>
                  </div>

                  {/* Social Presence Display */}
                  {(user.github_url || user.linkedin_url || user.dribbble_url || user.website_url) && (
                    <div className="flex items-center justify-center md:justify-start gap-4 pt-4">
                      {user.github_url && (
                        <a href={user.github_url} target="_blank" rel="noopener noreferrer" className="p-3 rounded-2xl bg-muted/30 hover:bg-primary/10 hover:text-primary transition-all border border-transparent hover:border-primary/20">
                          <Github className="h-5 w-5" />
                        </a>
                      )}
                      {user.linkedin_url && (
                        <a href={user.linkedin_url} target="_blank" rel="noopener noreferrer" className="p-3 rounded-2xl bg-muted/30 hover:bg-primary/10 hover:text-primary transition-all border border-transparent hover:border-primary/20">
                          <Linkedin className="h-5 w-5" />
                        </a>
                      )}
                      {user.dribbble_url && (
                        <a href={user.dribbble_url} target="_blank" rel="noopener noreferrer" className="p-3 rounded-2xl bg-muted/30 hover:bg-primary/10 hover:text-primary transition-all border border-transparent hover:border-primary/20">
                          <ExternalLink className="h-5 w-5" />
                        </a>
                      )}
                      {user.website_url && (
                        <a href={user.website_url} target="_blank" rel="noopener noreferrer" className="p-3 rounded-2xl bg-muted/30 hover:bg-primary/10 hover:text-primary transition-all border border-transparent hover:border-primary/20">
                          <Globe className="h-5 w-5" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <Separator className="my-12 opacity-50" />

              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-foreground">About</h3>
                <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed whitespace-pre-wrap">
                  {user.bio}
                </p>
              </div>

              <Separator className="my-12 opacity-50" />

              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-foreground">Skills & Expertise</h3>
                <div className="flex flex-wrap gap-2.5">
                  {user.skills && user.skills.length > 0 ? (
                    user.skills.map((skill: string) => (
                      <Badge key={skill} variant="secondary" className="px-6 py-2.5 rounded-2xl border-none bg-muted/50 hover:bg-primary/5 text-foreground font-black text-xs tracking-tight transition-all">
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No skills added yet.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Portfolio Section Integrated */}
          {user.role === 'freelancer' && (
            <PortfolioSection userId={user.id} isOwner={true} />
          )}

          {/* Reviews & Ratings Section */}
          <Card className="rounded-[3rem] border-none shadow-xl bg-card/60 overflow-hidden">
            <CardHeader className="p-10 border-b border-white/5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-bold">Reviews & Feedback</CardTitle>
                  <CardDescription className="font-bold text-muted-foreground">Recent project evaluations from your clients.</CardDescription>
                </div>
                <div className="flex items-center gap-3 bg-primary/5 px-6 py-3 rounded-full border border-primary/10">
                  <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
                  <span className="font-black text-2xl tracking-tighter">{user.rating?.toFixed(1) || "0.0"}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">({user.reviews || 0} reviews)</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-10">
              {reviewsData.length > 0 ? (
                <div className="space-y-6">
                  {reviewsData.map((rev) => (
                    <div key={rev.id} className="p-8 rounded-[2rem] bg-muted/20 hover:bg-muted/30 transition-all border border-transparent hover:border-white/10 group">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-1.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={cn("h-5 w-5", rev.rating >= s ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30")}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{new Date(rev.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-lg text-gray-700 dark:text-gray-300 italic mb-8 font-medium">"{rev.comment}"</p>
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10 border-2 border-background shadow-lg">
                          <AvatarImage src={rev.reviewer_avatar_url?.startsWith('http') ? rev.reviewer_avatar_url : (rev.reviewer_avatar_url ? `${API_URL}/uploads/${rev.reviewer_avatar_url}` : "")} />
                          <AvatarFallback className="font-black text-xs bg-muted text-muted-foreground">{rev.reviewer_first_name?.[0]}{rev.reviewer_last_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-black tracking-tight">{rev.reviewer_first_name} {rev.reviewer_last_name}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Client for {rev.job_title}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 px-10 border-4 border-dashed rounded-[3rem] border-white/5 bg-white/[0.02]">
                   <div className="bg-muted w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <Star className="h-8 w-8 text-muted-foreground/30" />
                   </div>
                   <p className="text-xl font-bold text-muted-foreground">No ratings yet.</p>
                   <p className="text-sm font-medium text-muted-foreground/60 max-w-xs mx-auto mt-2">Complete your active projects to build your professional reputation.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Platform Status */}
        <div className="space-y-8">
           <VerificationCard />
           
           <Card className="rounded-[2.5rem] border-none shadow-xl bg-primary/5 border border-primary/10">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Platform Stats</CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-8">
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-background/40 p-6 rounded-3xl border border-white/5 space-y-1">
                      <p className="text-3xl font-black tracking-tighter">{user.reviews || 0}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Projects</p>
                   </div>
                   <div className="bg-background/40 p-6 rounded-3xl border border-white/5 space-y-1">
                      <p className="text-3xl font-black tracking-tighter">{user.rating?.toFixed(1) || "0"}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Score</p>
                   </div>
                </div>
                <div className="bg-primary/10 p-6 rounded-3xl space-y-3">
                   <div className="flex items-center gap-2">
                       <CheckCircle2 className="h-4 w-4 text-primary" />
                       <span className="text-xs font-black uppercase tracking-widest text-primary">Status</span>
                   </div>
                   <p className="text-sm font-bold leading-relaxed">{user.role === 'freelancer' ? 'Expert Contractor' : 'Active Project Client'}</p>
                </div>
              </CardContent>
           </Card>
        </div>
      </div>
    </>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="p-20 text-center text-muted-foreground animate-pulse">Loading profile...</div>}>
      <ProfileContent />
    </Suspense>
  );
}
