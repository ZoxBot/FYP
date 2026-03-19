"use client";

import { Button } from "@/components/ui/button";
import { Download, FileText, Table } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function DataExportButtons() {
    const { toast } = useToast();

    const exportData = async (type: 'users' | 'jobs' | 'payments') => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/analytics/export/${type}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) throw new Error("Export failed");

            const data = await res.json();
            
            // Convert to CSV
            if (data.length === 0) {
                toast({ title: "No Data", description: `There are no ${type} to export at this time.` });
                return;
            }

            const headers = Object.keys(data[0]).join(',');
            const rows = data.map((row: any) => 
                Object.values(row).map(value => 
                    typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
                ).join(',')
            );
            const csvContent = [headers, ...rows].join('\n');

            // Download file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `export_${type}_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast({ title: "Export Successful", description: `The ${type} list has been downloaded.` });
        } catch (error) {
            console.error("Export error:", error);
            toast({ title: "Export Error", description: "Failed to generate CSV file.", variant: "destructive" });
        }
    };

    return (
        <div className="flex flex-wrap gap-4 items-center bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
            <div className="flex-1 min-w-[200px]">
                <h3 className="text-sm font-bold text-slate-200">System Records Export</h3>
                <p className="text-xs text-slate-500">Generate encrypted data dumps for archival purposes.</p>
            </div>
            <div className="flex gap-2">
                <Button onClick={() => exportData('users')} variant="outline" size="sm" className="bg-slate-950 border-slate-800 hover:bg-slate-800 text-slate-300 gap-2">
                    <Download className="h-4 w-4" /> Users CSV
                </Button>
                <Button onClick={() => exportData('jobs')} variant="outline" size="sm" className="bg-slate-950 border-slate-800 hover:bg-slate-800 text-slate-300 gap-2">
                    <Table className="h-4 w-4" /> Jobs CSV
                </Button>
                <Button onClick={() => exportData('payments')} variant="outline" size="sm" className="bg-slate-950 border-slate-800 hover:bg-slate-800 text-slate-300 gap-2">
                    <FileText className="h-4 w-4" /> Revenue CSV
                </Button>
            </div>
        </div>
    );
}
