"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { VerificationRequest } from "./types";
import { getErrorMessage } from "@/lib/utils";

interface VerificationRequestsProps {
    requests: VerificationRequest[];
    onRefresh: () => void;
}

export function VerificationRequests({ requests, onRefresh }: VerificationRequestsProps) {

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
            if (res.ok) onRefresh();
            else alert(`Failed to process verification: ${getErrorMessage(res.status)}`);
        } catch (e) {
            console.error(e);
            alert("Network error.");
        }
    };

    return (
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
                {requests.map(req => (
                    <TableRow key={req.id}>
                        <TableCell>
                            <div className="font-medium">{req.first_name} {req.last_name}</div>
                            <div className="text-sm text-muted-foreground">{req.email}</div>
                        </TableCell>
                        <TableCell>{new Date(req.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                            <a
                                href={req.document_path.startsWith('http') ? req.document_path : `http://localhost:5000/uploads/${req.document_path}`}
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
                {requests.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                            No pending verifications.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}
