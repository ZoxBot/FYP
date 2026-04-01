"use client";

import * as React from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthenticatedAdminLayout({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const adminToken = localStorage.getItem('admin_token');
        if (!adminToken) {
            router.push('/admin/login');
        } else {
            setLoading(false);
        }
    }, [router]);

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-slate-400">
                Authenticating Control Panel...
            </div>
        );
    }

    return (
        <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr] bg-slate-950 text-slate-50">
            <div className="hidden border-r border-slate-800 bg-slate-900/50 lg:block">
                <AdminSidebar />
            </div>
            <div className="flex flex-col">
                <AdminHeader />
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-8 lg:p-8">
                    <React.Suspense fallback={
                        <div className="flex items-center justify-center h-full text-slate-500 animate-pulse">
                            Initializing module...
                        </div>
                    }>
                        {children}
                    </React.Suspense>
                </main>
            </div>
        </div>
    );
}
