"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, ExternalLink, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface PortfolioItem {
  id: number;
  title: string;
  description: string;
  image_url: string;
  project_url: string;
  created_at: string;
}

interface PortfolioSectionProps {
  userId: number;
  isOwner: boolean;
}

export function PortfolioSection({ userId, isOwner }: PortfolioSectionProps) {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectUrl, setProjectUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const { toast } = useToast();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchPortfolio();
  }, [userId]);

  const fetchPortfolio = async () => {
    setLoading(true);
    try {
      const endpoint = isOwner ? `${API_URL}/api/freelancer/portfolio` : `${API_URL}/api/freelancer/${userId}/portfolio`;
      const token = localStorage.getItem('token');
      const headers = isOwner && token ? { Authorization: `Bearer ${token}` } : {};
      
      const res = await fetch(endpoint, { headers });
      if (res.ok) {
        setItems(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch portfolio", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return;

    setIsUploading(true);
    const token = localStorage.getItem('token');
    
    const formData = new FormData();
    formData.append("image", file);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("project_url", projectUrl);

    try {
      const res = await fetch(`${API_URL}/api/freelancer/portfolio`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        toast({ title: "Success", description: "Project added to your portfolio." });
        setIsDialogOpen(false);
        setTitle("");
        setDescription("");
        setProjectUrl("");
        setFile(null);
        setImagePreview(null);
        fetchPortfolio();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to upload project", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    if (selected) {
      if (selected.size > 5 * 1024 * 1024) {
        toast({ title: "File too large", description: "Maximum file size is 5MB.", variant: "destructive" });
        return;
      }
      setFile(selected);
      setImagePreview(URL.createObjectURL(selected));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/freelancer/portfolio/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        setItems(prev => prev.filter(item => item.id !== id));
        toast({ title: "Deleted", description: "Project removed from portfolio." });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete project.", variant: "destructive" });
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle>Portfolio</CardTitle>
          <CardDescription>Previous projects and sample work</CardDescription>
        </div>
        {isOwner && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-2" /> Add Project</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Add to Portfolio</DialogTitle>
                <DialogDescription>Showcase your best work to potential clients.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddProject} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
                <div className="space-y-2">
                  <Label>Project Image <span className="text-red-500">*</span></Label>
                  <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors"
                       onClick={() => document.getElementById('portfolio-file')?.click()}
                  >
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="max-h-48 object-contain rounded-md" />
                    ) : (
                      <>
                        <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-sm font-medium text-slate-700">Click to upload an image</p>
                        <p className="text-xs text-muted-foreground mt-1">PNG, JPG or WEBP (max 5MB)</p>
                      </>
                    )}
                  </div>
                  <Input 
                    id="portfolio-file"
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange}
                    className="hidden"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Project Title <span className="text-red-500">*</span></Label>
                  <Input 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    placeholder="e.g. E-commerce Website Design" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    placeholder="Briefly describe what you did..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Project URL (Optional)</Label>
                  <Input 
                    type="url" 
                    value={projectUrl} 
                    onChange={e => setProjectUrl(e.target.value)} 
                    placeholder="https://example.com"
                  />
                </div>
                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => {
                    setIsDialogOpen(false);
                    setFile(null);
                    setImagePreview(null);
                  }}>Cancel</Button>
                  <Button type="submit" disabled={isUploading || !file || !title}>
                    {isUploading ? "Uploading..." : "Save Project"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-12 text-muted-foreground flex items-center justify-center">
             <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mr-2"></div>
             Loading portfolio...
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/10">
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground opacity-30 mb-3" />
            <p className="text-muted-foreground font-medium">No portfolio items added yet.</p>
            {isOwner && <p className="text-sm text-muted-foreground mt-2">Click "Add Project" to build your portfolio and attract more clients.</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map(item => (
              <Card key={item.id} className="overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow">
                <div className="relative h-48 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden group">
                  <img 
                    src={item.image_url.startsWith('http') ? item.image_url : `${API_URL}/uploads/${item.image_url}`} 
                    alt={item.title} 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {isOwner && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        size="icon" 
                        variant="destructive" 
                        className="h-8 w-8 rounded-full shadow-lg"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-grow">
                  <h3 className="text-lg font-bold line-clamp-1 mb-2 leading-tight">{item.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-grow">
                    {item.description}
                  </p>
                  {item.project_url && (
                    <a 
                      href={item.project_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary text-sm font-semibold flex items-center hover:underline inline-flex mt-auto group"
                    >
                      View Live Project <ExternalLink className="h-3.5 w-3.5 ml-1 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </a>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
