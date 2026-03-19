"use client";

import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { usePermission } from "@/hooks/usePermission";
import { getErrorMessage } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Search, Filter, MessageCircle, AlertTriangle, CheckCircle, Clock, Image as ImageIcon, File as FileIcon, X, Send, Trash, LifeBuoy } from "lucide-react";

interface Ticket {
    id: number;
    user_id: number;
    subject: string;
    category: string;
    description: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'critical';
    created_at: string;
    updated_at: string;
    first_name: string;
    last_name: string;
    email: string;
    claimed_by?: number;
    claim_first_name?: string;
    claim_last_name?: string;
    has_unread_user: boolean;
    has_unread_admin: boolean;
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

export function TicketManagement() {
    const { toast } = useToast();
    const { can } = usePermission();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [reply, setReply] = useState("");
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    const getCurrentUserId = () => {
        const token = localStorage.getItem('token');
        if (!token) return null;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.id;
        } catch (e) {
            return null;
        }
    };
    const currentUserId = getCurrentUserId();

    const fetchTickets = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/tickets/admin/all`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTickets(data);
            } else {
                setTickets([]); // Clear on error to avoid stale data
                if (res.status === 403) {
                    toast({ title: "Access Denied", description: "You don't have permission to view this section.", variant: "destructive" });
                }
            }
        } catch (e) {
            console.error(e);
            setTickets([]);
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
                // Mark as read on frontend list immediately
                setTickets(prev => prev.map(t => t.id === id ? { ...t, has_unread_admin: false } : t));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleUpdateTicket = async (id: number, updates: Partial<Ticket>) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch(`${API_URL}/api/tickets/admin/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(updates)
            });

            if (res.ok) {
                const updated = await res.json();
                setTickets((prev: Ticket[]) => prev.map(t => t.id === id ? { ...t, ...updated } : t));
                if (selectedTicket?.id === id) {
                    setSelectedTicket((prev: any) => prev ? { ...prev, ...updated } : null);
                }
                toast({ title: "Updated", description: "Ticket status/priority updated." });
            }
        } catch (e) {
            console.error(e);
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
                // Auto set status to in_progress if it was open
                if (selectedTicket.status === 'open') {
                    handleUpdateTicket(selectedTicket.id, { status: 'in_progress' });
                }
                viewTicket(selectedTicket.id); // Refresh messages
            }
        } catch (e) {
            console.error(e);
        } finally {
            setUploading(false);
        }
    };

    const handleClaim = async (id: number) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch(`${API_URL}/api/tickets/admin/${id}/claim`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                toast({ title: "Claimed", description: "You have claimed this ticket." });
                fetchTickets();
                viewTicket(id);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (id: number) => {
        const token = localStorage.getItem('token');
        if (!token) return;
        if (!confirm("Are you sure you want to permanently delete this ticket?")) return;

        try {
            const res = await fetch(`${API_URL}/api/tickets/admin/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                toast({ title: "Deleted", description: "Ticket deleted permanently." });
                setIsViewOpen(false);
                setSelectedTicket(null);
                fetchTickets();
            } else {
                const err = await res.json();
                toast({ title: "Error", description: err.message, variant: "destructive" });
            }
        } catch (e) {
            console.error(e);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'open': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-bold">New</Badge>;
            case 'in_progress': return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 font-bold">In Progress</Badge>;
            case 'resolved': return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-bold">Resolved</Badge>;
            case 'closed': return <Badge variant="secondary" className="font-bold opacity-70">Closed</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'critical': return <Badge variant="destructive" className="animate-pulse">Critical</Badge>;
            case 'high': return <Badge variant="destructive">High</Badge>;
            case 'medium': return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Medium</Badge>;
            case 'low': return <Badge variant="outline">Low</Badge>;
            default: return <Badge variant="outline">{priority}</Badge>;
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
                        href={at.file_path.startsWith('http') ? at.file_path : `${API_URL}/${at.file_path}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-20 h-20 rounded border bg-muted overflow-hidden hover:opacity-80 transition-opacity"
                    >
                        <img src={at.file_path.startsWith('http') ? at.file_path : `${API_URL}/${at.file_path}`} alt="attachment" className="object-cover w-full h-full" />
                    </a>
                ))}
            </div>
        );
    };

    if (!can('ticket.manage')) return <div className="p-8 text-center text-red-500">Access Denied. You do not have permission to manage tickets.</div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-muted/30 p-4 rounded-lg border">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        Support Dashboard
                    </h3>
                    <p className="text-sm text-muted-foreground">Manage user reports and system issues.</p>
                </div>
                <div className="flex gap-4">
                    <div className="text-center px-4 border-r">
                        <p className="text-2xl font-bold">{tickets.filter(t => t.status === 'open').length}</p>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">New</p>
                    </div>
                    <div className="text-center px-4">
                        <p className="text-2xl font-bold">{tickets.filter(t => t.status === 'in_progress').length}</p>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">In Progress</p>
                    </div>
                </div>
            </div>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Subject & Category</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Claimed By</TableHead>
                            <TableHead>Submitted</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tickets.map((ticket) => (
                            <TableRow
                                key={ticket.id}
                                className={`cursor-pointer group hover:bg-muted/50 ${ticket.has_unread_admin ? 'bg-primary/[0.03]' : ''}`}
                                onClick={() => viewTicket(ticket.id)}
                            >
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {ticket.has_unread_admin && (
                                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-sm shadow-red-500/50" />
                                        )}
                                        <div>
                                            <div className="font-bold text-sm">{ticket.first_name} {ticket.last_name}</div>
                                            <div className="text-[10px] text-muted-foreground">{ticket.email}</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className={`text-sm max-w-xs truncate ${ticket.has_unread_admin ? 'font-black' : 'font-semibold'}`}>{ticket.subject}</div>
                                    <div className="text-[10px] opacity-70 uppercase tracking-tighter">{ticket.category.replace('_', ' ')}</div>
                                </TableCell>
                                <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                                <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                                <TableCell>
                                    {ticket.claim_first_name ? (
                                        <div className="flex flex-col">
                                            <span className="text-xs font-semibold">{ticket.claim_first_name} {ticket.claim_last_name}</span>
                                            <span className="text-[9px] text-muted-foreground">Assigned</span>
                                        </div>
                                    ) : (
                                        <span className="text-[10px] text-muted-foreground italic">Unclaimed</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-xs font-medium">{new Date(ticket.created_at).toLocaleDateString()}</TableCell>
                                <TableCell className="text-right">
                                    <Button size="sm" variant="ghost" className="group-hover:bg-primary group-hover:text-primary-foreground h-8 px-4">Manage</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {tickets.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-16 text-muted-foreground italic border-dashed border-2 m-4 rounded-lg">
                                    <div className="flex flex-col items-center gap-2">
                                        <LifeBuoy className="h-10 w-10 opacity-20" />
                                        No tickets found in this section.
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>

            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0">
                    {selectedTicket && (
                        <>
                            <DialogHeader className="p-6 border-b bg-muted/20">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <DialogTitle className="text-xl">{selectedTicket.subject}</DialogTitle>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="font-bold">{selectedTicket.first_name} {selectedTicket.last_name}</span>
                                            <span className="text-muted-foreground">({selectedTicket.email})</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2 justify-end">
                                            {selectedTicket.status === 'closed' && can('ticket.delete') && (
                                                <Button variant="destructive" size="sm" onClick={() => handleDelete(selectedTicket.id)} className="h-7 text-[10px]">
                                                    <Trash className="h-3 w-3 mr-1" /> Delete Permanently
                                                </Button>
                                            )}
                                            {selectedTicket.claim_first_name ? (
                                                <Badge variant="outline" className="text-[10px] bg-slate-100 border-slate-200">
                                                    Claimed by: {selectedTicket.claim_first_name} {selectedTicket.claim_last_name}
                                                </Badge>
                                            ) : (
                                                can('ticket.claim') && (
                                                    <Button size="sm" onClick={() => handleClaim(selectedTicket.id)} className="h-7 text-[10px]">
                                                        Claim Ticket
                                                    </Button>
                                                )
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Label className="text-xs">Status:</Label>
                                            <select
                                                className="text-xs p-1 border rounded"
                                                value={selectedTicket.status}
                                                onChange={(e) => handleUpdateTicket(selectedTicket.id, { status: e.target.value as any })}
                                            >
                                                <option value="open">Open</option>
                                                <option value="in_progress">In Progress</option>
                                                <option value="resolved">Resolved</option>
                                                <option value="closed">Closed</option>
                                            </select>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Label className="text-xs">Priority:</Label>
                                            <select
                                                className="text-xs p-1 border rounded"
                                                value={selectedTicket.priority}
                                                onChange={(e) => handleUpdateTicket(selectedTicket.id, { priority: e.target.value as any })}
                                            >
                                                <option value="low">Low</option>
                                                <option value="medium">Medium</option>
                                                <option value="high">High</option>
                                                <option value="critical">Critical</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                <div className="bg-card p-4 rounded-lg border shadow-sm relative">
                                    <div className="absolute top-2 right-2 opacity-5">
                                        <MessageCircle className="h-10 w-10" />
                                    </div>
                                    <h4 className="text-[10px] font-black uppercase text-muted-foreground mb-2 flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3" /> Initial User Request
                                    </h4>
                                    <p className="text-sm border-l-4 border-primary pl-4 py-1 bg-muted/10 italic whitespace-pre-wrap">
                                        "{selectedTicket.description}"
                                    </p>
                                    <AttachmentGallery attachments={selectedTicket.attachments} />
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase text-muted-foreground border-b pb-1 flex justify-between items-center">
                                        <span>Communication Log</span>
                                        <span className="opacity-50">{selectedTicket.messages.length} Messages</span>
                                    </h4>
                                    <div className="space-y-3">
                                        {selectedTicket.messages.map((msg: any) => {
                                            const isOwn = msg.sender_id === currentUserId;
                                            const isAdmin = msg.role === 'admin' || msg.role === 'Administrator' || msg.role === 'Admin' || msg.role === 'Higher Admin';
                                            return (
                                                <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm ${isOwn
                                                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-700'
                                                        }`}>
                                                        <div className="flex justify-between items-center mb-1 gap-6">
                                                            <span className="text-[9px] font-black uppercase tracking-wider opacity-80">
                                                                {msg.first_name} {msg.last_name} {isAdmin && (isOwn ? "✅ (You)" : "👮 (Support)")}
                                                            </span>
                                                            <span className="text-[9px] opacity-60">
                                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                                                        <AttachmentGallery attachments={msg.attachments} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {selectedTicket.messages.length === 0 && (
                                            <div className="text-center py-10 text-muted-foreground italic text-sm bg-muted/10 rounded-xl border border-dashed">
                                                The user is waiting for a response...
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t bg-muted/30">
                                <div className="flex flex-col gap-4">
                                    <div className="flex gap-3 items-end">
                                        <div className="flex-1 space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Your Response</Label>
                                            <Textarea
                                                placeholder="Type your message to the user..."
                                                value={reply}
                                                onChange={(e) => setReply(e.target.value)}
                                                rows={2}
                                                className="resize-none border-primary/20 focus-visible:ring-primary/40 bg-background"
                                                disabled={selectedTicket.status === 'closed'}
                                            />
                                            <div className="flex items-center gap-4">
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    className="hidden"
                                                    id="admin-reply-upload"
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
                                                    onClick={() => document.getElementById('admin-reply-upload')?.click()}
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
                                                <Send className="h-5 w-5 mr-2" />
                                            )}
                                            {uploading ? "Uploading..." : "Reply"}
                                        </Button>
                                    </div>
                                    {selectedTicket.status === 'closed' && (
                                        <p className="text-center text-[11px] font-bold text-muted-foreground uppercase py-2 bg-muted rounded-lg border">
                                            This ticket is closed. Only view access is permitted.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
