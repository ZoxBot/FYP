"use client";

import { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { Loader2, AlertTriangle, CheckCircle, RefreshCcw, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function DisputeManagement() {
    const [disputes, setDisputes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [resolving, setResolving] = useState<number | null>(null);
    const [resolution, setResolution] = useState("");
    const [adminNotes, setAdminNotes] = useState("");
    const { toast } = useToast();

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    useEffect(() => {
        fetchDisputes();
    }, []);

    const fetchDisputes = async () => {
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`${API_URL}/api/admin/disputes`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setDisputes(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async (disputeId: number) => {
        if (!resolution) return;

        setResolving(disputeId);
        const token = localStorage.getItem("token");

        try {
            const res = await fetch(`${API_URL}/api/admin/disputes/${disputeId}/resolve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    resolution,
                    admin_notes: adminNotes
                })
            });

            if (res.ok) {
                toast({ title: "Resolved", description: `Dispute has been resolved: ${resolution}` });
                fetchDisputes();
                setResolution("");
                setAdminNotes("");
            } else {
                const err = await res.json();
                toast({ title: "Error", description: err.message, variant: "destructive" });
            }
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to resolve dispute", variant: "destructive" });
        } finally {
            setResolving(null);
        }
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-blue-500" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
                <div>
                    <h2 className="text-2xl font-bold text-slate-100">Dispute Resolution Center</h2>
                    <p className="text-slate-400">Review and intervene on flagged contracts.</p>
                </div>
                <div className="bg-orange-500/10 border border-orange-500/20 px-4 py-2 rounded-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    <span className="text-orange-500 font-bold">{disputes.filter(d => d.status === 'open').length} Active Disputes</span>
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-slate-800/50">
                        <TableRow className="hover:bg-transparent border-slate-800">
                            <TableHead className="text-slate-300">Job Title</TableHead>
                            <TableHead className="text-slate-300">Initiator</TableHead>
                            <TableHead className="text-slate-300">Reason</TableHead>
                            <TableHead className="text-slate-300">Contract Amount</TableHead>
                            <TableHead className="text-slate-300">Status</TableHead>
                            <TableHead className="text-right text-slate-300">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {disputes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                                    No disputes found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            disputes.map((dispute) => (
                                <TableRow key={dispute.id} className="border-slate-800 hover:bg-slate-800/30 transition-colors">
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span className="text-slate-200">{dispute.job_title}</span>
                                            <Link href={`/tasks/${dispute.job_id}`} target="_blank" className="text-[10px] text-blue-400 flex items-center gap-1 hover:underline">
                                                ID: #{dispute.job_id} <ExternalLink className="h-2 w-2" />
                                            </Link>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-slate-400 text-xs font-semibold uppercase">{dispute.initiator_first_name} {dispute.initiator_last_name}</span>
                                            <span className="text-[10px] text-slate-500">{dispute.initiator_id === dispute.client_id ? 'CLIENT' : 'FREELANCER'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <p className="text-xs text-slate-400 max-w-xs truncate" title={dispute.reason}>
                                            {dispute.reason}
                                        </p>
                                    </TableCell>
                                    <TableCell className="text-slate-300 font-bold">NPR {dispute.final_price}</TableCell>
                                    <TableCell>
                                        <Badge variant={dispute.status === 'resolved' ? 'secondary' : 'destructive'} className={dispute.status === 'resolved' ? 'bg-green-500/10 text-green-500 border-green-500/20' : ''}>
                                            {dispute.status}
                                        </Badge>
                                        {dispute.resolution && (
                                            <div className="text-[10px] text-slate-500 mt-1 uppercase italic">
                                                {dispute.resolution.replace('_', ' ')}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {dispute.status === 'open' ? (
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">Resolve</Button>
                                                </DialogTrigger>
                                                <DialogContent className="bg-slate-900 border-slate-800 text-slate-100">
                                                    <DialogHeader>
                                                        <DialogTitle>Resolve Dispute</DialogTitle>
                                                        <DialogDescription className="text-slate-400">
                                                            Review the details carefully. Once resolved, funds will be released or refunded as specified.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="grid gap-4 py-4">
                                                        <div className="bg-slate-800 p-3 rounded border border-slate-700">
                                                            <p className="text-xs font-bold text-slate-500 uppercase mb-2">Initiator's Reason:</p>
                                                            <p className="text-sm text-slate-300 italic">"{dispute.reason}"</p>
                                                        </div>
                                                        <div className="grid gap-2">
                                                            <Label>Resolution Action</Label>
                                                            <Select onValueChange={setResolution}>
                                                                <SelectTrigger className="bg-slate-800 border-slate-700">
                                                                    <SelectValue placeholder="Select outcome..." />
                                                                </SelectTrigger>
                                                                <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                                                                    <SelectItem value="refunded">Refund Client (Cancel Job)</SelectItem>
                                                                    <SelectItem value="released_to_freelancer">Release to Freelancer (Complete Job)</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="grid gap-2">
                                                            <Label>Internal Admin Notes</Label>
                                                            <Textarea 
                                                                placeholder="Reasoning for this resolution..." 
                                                                className="bg-slate-800 border-slate-700"
                                                                value={adminNotes}
                                                                onChange={(e) => setAdminNotes(e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                    <DialogFooter>
                                                        <Button 
                                                            onClick={() => handleResolve(dispute.id)} 
                                                            className="w-full bg-blue-600 hover:bg-blue-700"
                                                            disabled={!resolution || resolving === dispute.id}
                                                        >
                                                            {resolving === dispute.id ? <Loader2 className="animate-spin h-4 w-4 mr-2"/> : <CheckCircle className="h-4 w-4 mr-2"/>}
                                                            Confirm Resolution
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        ) : (
                                            <Button size="sm" variant="ghost" className="text-slate-500" disabled>Resolved</Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
