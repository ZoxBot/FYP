import * as React from "react";

export default function RootAdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-slate-950">
            {children}
        </div>
    );
}
