"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/utils";
import { usePermission } from "@/hooks/usePermission";
import { Plus, MessageSquare, Clock, CheckCircle2, AlertCircle, Image as ImageIcon, File as FileIcon, X, Send, LifeBuoy, Trash2 } from "lucide-react";

interface Ticket {
    id: number;
    subject: string;
    category: string;
    description: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'critical';
    created_at: string;
    updated_at: string;
}

interface TicketMessage {
    id: number;
    sender_id: number;
    message: string;
    created_at: string;
    first_name: string;
    last_name: string;
    role: string;
}

export default function SupportPage() {
    const { toast } = useToast();
    const { can } = usePermission();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [ticketToDelete, setTicketToDelete] = useState<number | null>(null);
    const [selectedTicket, setSelectedTicket] = useState<any>(null);

    // Form State
    const [newTicket, setNewTicket] = useState({ subject: "", category: "technical_issue", description: "" });
    const [reply, setReply] = useState("");
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    const fetchTickets = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/api/tickets/my`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTickets(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);


    const viewTicket = async (id: number) => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/api/tickets/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSelectedTicket(data);
                setIsViewOpen(true);
                // Clear red dot on frontend list immediately
                setTickets(prev => prev.map(t => t.id === id ? { ...t, has_unread_user: false } : t));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!token) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('subject', newTicket.subject);
        formData.append('category', newTicket.category);
        formData.append('description', newTicket.description);
        selectedFiles.forEach(file => formData.append('images', file));

        try {
            const res = await fetch(`${API_URL}/api/tickets`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                toast({ title: "Ticket Created", description: "Our team will review it shortly." });
                setIsCreateOpen(false);
                setNewTicket({ subject: "", category: "technical_issue", description: "" });
                setSelectedFiles([]);
                fetchTickets();
            } else {
                toast({ title: "Error", description: getErrorMessage(res.status), variant: "destructive" });
            }
        } catch (err) {
            toast({ title: "Error", description: "Failed to connect to server.", variant: "destructive" });
        } finally {
            setUploading(false);
        }
    };

    const handleSendReply = async () => {
        if (!selectedTicket || (!reply.trim() && selectedFiles.length === 0)) return;
        const token = localStorage.getItem('token');
        if (!token) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('message', reply);
        selectedFiles.forEach(file => formData.append('images', file));

        try {
            const res = await fetch(`${API_URL}/api/tickets/${selectedTicket.id}/messages`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                setReply("");
                setSelectedFiles([]);
                viewTicket(selectedTicket.id);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteTicket = async () => {
        if (!ticketToDelete) return;
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch(`${API_URL}/api/tickets/${ticketToDelete}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                toast({ title: "Ticket Removed", description: "The ticket has been successfully removed from your view." });
                setIsDeleteOpen(false);
                setTicketToDelete(null);
                fetchTickets();
            } else {
                toast({ title: "Error", description: "Failed to delete ticket.", variant: "destructive" });
            }
        } catch (e) {
            console.error(e);
            toast({ title: "Error", description: "Connection failed.", variant: "destructive" });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'open': return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Open</Badge>;
            case 'in_progress': return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Active</Badge>;
            case 'resolved': return <Badge className="bg-green-500/10 text-green-700 border-green-500/20">Resolved</Badge>;
            case 'closed': return <Badge variant="secondary">Closed</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    const AttachmentPreview = ({ files }: { files: File[] }) => (
        <div className="flex flex-wrap gap-2 mt-2">
            {files.map((file, i) => (
                <div key={i} className="relative group">
                    <div className="w-16 h-16 rounded border bg-muted flex items-center justify-center overflow-hidden">
                        {file.type.startsWith('image/') ? (
                            <img src={URL.createObjectURL(file)} alt="preview" className="object-cover w-full h-full" />
                        ) : (
                            <FileIcon className="h-6 w-6 text-muted-foreground" />
                        )}
                    </div>
                    <button
                        onClick={() => setSelectedFiles(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </div>
            ))}
        </div>
    );

    const AttachmentGallery = ({ attachments }: { attachments: any[] }) => {
        if (!attachments || attachments.length === 0) return null;
        return (
            <div className="flex flex-wrap gap-2 mt-2">
                {attachments.map((at, i) => (
                    <a
                        key={i}
                        href={`${API_URL}/${at.file_path}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-20 h-20 rounded border bg-muted overflow-hidden hover:opacity-80 transition-opacity"
                    >
                        <img src={`${API_URL}/${at.file_path}`} alt="attachment" className="object-cover w-full h-full" />
                    </a>
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Support Tickets"
                description="Need help? Create a ticket and our team will get back to you."
                actions={
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button><Plus className="h-4 w-4 mr-2" /> New Ticket</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Create Support Ticket</DialogTitle>
                                <DialogDescription>Describe the issue you're facing. You can upload up to 5 photos.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreateTicket} className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="subject">Subject</Label>
                                    <Input
                                        id="subject"
                                        value={newTicket.subject}
                                        onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                                        required
                                        placeholder="Brief summary of the issue"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="category">Category</Label>
                                    <select
                                        id="category"
                                        className="w-full p-2 border rounded-md text-sm bg-background"
                                        value={newTicket.category}
                                        onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                                    >
                                        <option value="technical_issue">Technical Issue</option>
                                        <option value="billing_payment">Billing & Payment</option>
                                        <option value="account_access">Account Access</option>
                                        <option value="job_dispute">Job Dispute</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={newTicket.description}
                                        onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                                        required
                                        placeholder="Detailed description..."
                                        rows={4}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Attachments (Photos)</Label>
                                    <div className="flex items-center gap-4">
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                            id="file-upload"
                                            onChange={(e) => {
                                                if (e.target.files) {
                                                    setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                                                }
                                            }}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full flex gap-2"
                                            onClick={() => document.getElementById('file-upload')?.click()}
                                        >
                                            <ImageIcon className="h-4 w-4" /> Upload Images
                                        </Button>
                                    </div>
                                    <AttachmentPreview files={selectedFiles} />
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={uploading}>
                                        {uploading ? "Submitting..." : "Submit Ticket"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                }
            />

            <Card>
                <CardHeader>
                    <CardTitle>My Tickets</CardTitle>
                    <CardDescription>Track the status of your reported issues.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="py-8 text-center text-muted-foreground italic">Loading tickets...</div>
                    ) : tickets.length === 0 ? (
                        <div className="py-12 text-center border-2 border-dashed rounded-lg space-y-3">
                            <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground opacity-50" />
                            <p className="text-muted-foreground">You haven't created any support tickets yet.</p>
                            <Button variant="outline" onClick={() => setIsCreateOpen(true)}>Create your first ticket</Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Last Update</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tickets.map((ticket) => (
                                    <TableRow key={ticket.id} className="group cursor-pointer" onClick={() => viewTicket(ticket.id)}>
                                        <TableCell className="font-medium relative">
                                            {ticket.has_unread_user && (
                                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-sm shadow-red-500/50" />
                                            )}
                                            <span className={ticket.has_unread_user ? "pl-3 font-bold text-foreground" : ""}>
                                                {ticket.subject}
                                            </span>
                                        </TableCell>
                                        <TableCell className="capitalize">{ticket.category.replace('_', ' ')}</TableCell>
                                        <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {new Date(ticket.updated_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => viewTicket(ticket.id)} className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">Details</Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setTicketToDelete(ticket.id);
                                                    setIsDeleteOpen(true);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Ticket Details Dialog */}
            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0">
                    {selectedTicket && (
                        <>
                            <DialogHeader className="p-6 border-b">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <DialogTitle className="text-xl mb-1">{selectedTicket.subject}</DialogTitle>
                                        <p className="text-sm text-muted-foreground">Ticket #{selectedTicket.id} &bull; {selectedTicket.category.replace('_', ' ')}</p>
                                    </div>
                                    <div className="text-right">
                                        {getStatusBadge(selectedTicket.status)}
                                        <p className="text-xs text-muted-foreground mt-1">Priority: <span className="capitalize font-medium">{selectedTicket.priority}</span></p>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {/* Original Description */}
                                <div className="bg-muted/30 p-5 rounded-xl border relative">
                                    <div className="absolute top-0 right-0 p-2 opacity-10">
                                        <LifeBuoy className="h-12 w-12" />
                                    </div>
                                    <h4 className="text-[11px] font-black uppercase text-muted-foreground mb-3 tracking-widest border-b pb-1">Initial Request</h4>
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{selectedTicket.description}</p>
                                    <AttachmentGallery attachments={selectedTicket.attachments} />
                                    <p className="text-[10px] text-muted-foreground mt-4 flex items-center gap-1">
                                        <Clock className="h-3 w-3" /> Submitted {new Date(selectedTicket.created_at).toLocaleString()}
                                    </p>
                                </div>

                                {/* Messages */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase text-muted-foreground text-center flex items-center gap-4">
                                        <span className="flex-1 h-px bg-muted" />
                                        Communication Thread
                                        <span className="flex-1 h-px bg-muted" />
                                    </h4>

                                    <div className="space-y-4 pt-2">
                                        {selectedTicket.messages.map((msg: any) => {
                                            const isAdmin = msg.role === 'admin' || msg.role === 'Administrator' || msg.role === 'Admin' || msg.role === 'Higher Admin';
                                            return (
                                                <div key={msg.id} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                                                    <div className={`max-w-[85%] group`}>
                                                        <div className={`p-4 rounded-2xl shadow-sm ${isAdmin
                                                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-700'
                                                            : 'bg-primary text-primary-foreground rounded-tr-none'
                                                            }`}>
                                                            <div className="flex justify-between items-center mb-1.5 gap-6">
                                                                <span className="text-[9px] font-black uppercase tracking-widest opacity-80">
                                                                    {msg.first_name} {msg.last_name} {isAdmin && "👮"}
                                                                </span>
                                                                <span className="text-[9px] opacity-60">
                                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                                                            <AttachmentGallery attachments={msg.attachments} />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {selectedTicket.messages.length === 0 && (
                                            <div className="text-center py-12 text-muted-foreground italic text-sm bg-muted/20 rounded-xl border-2 border-dashed">
                                                Our support specialists will be with you shortly.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t bg-background">
                                <div className="flex flex-col gap-4">
                                    <div className="flex gap-3 items-end">
                                        <div className="flex-1 space-y-3">
                                            <Textarea
                                                placeholder="Type your message here..."
                                                value={reply}
                                                onChange={(e) => setReply(e.target.value)}
                                                rows={2}
                                                className="resize-none shadow-none focus-visible:ring-primary/20 bg-muted/20"
                                                disabled={selectedTicket.status === 'closed'}
                                            />
                                            <div className="flex items-center gap-4">
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    className="hidden"
                                                    id="reply-file-upload"
                                                    onChange={(e) => {
                                                        if (e.target.files) {
                                                            setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                                                        }
                                                    }}
                                                    disabled={selectedTicket.status === 'closed'}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 gap-2 text-muted-foreground hover:text-primary"
                                                    onClick={() => document.getElementById('reply-file-upload')?.click()}
                                                    disabled={selectedTicket.status === 'closed'}
                                                >
                                                    <ImageIcon className="h-4 w-4" /> Add Photos
                                                </Button>
                                                {selectedFiles.length > 0 && (
                                                    <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                                        {selectedFiles.length} photos selected
                                                    </span>
                                                )}
                                            </div>
                                            <AttachmentPreview files={selectedFiles} />
                                        </div>
                                        <Button
                                            onClick={handleSendReply}
                                            disabled={(!reply.trim() && selectedFiles.length === 0) || selectedTicket.status === 'closed' || uploading}
                                            className="h-20 px-10 shadow-lg shadow-primary/20"
                                        >
                                            {uploading ? (
                                                <Clock className="h-5 w-5 animate-spin" />
                                            ) : (
                                                <Send className="h-5 w-5" />
                                            )}
                                        </Button>
                                    </div>
                                    {selectedTicket.status === 'closed' && (
                                        <p className="text-center text-[11px] text-muted-foreground bg-muted/30 py-2 rounded-lg font-bold uppercase tracking-tighter">
                                            This ticket is closed and no longer accepting replies.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-5 w-5" /> Delete Ticket
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to remove this ticket from your view? This action cannot be undone by you, though administrators will retain a copy for support records.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0 mt-4">
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteTicket}>Remove Ticket</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
