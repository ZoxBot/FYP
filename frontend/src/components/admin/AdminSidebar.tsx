"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Users,
    Briefcase,
    Shield,
    Settings,
    Activity,
    LayoutDashboard,
    ShieldAlert,
    Terminal,
    LifeBuoy,
    ChevronDown,
    ChevronRight,
    UserCircle,
    UserPlus,
    UserCheck,
    AlertTriangle,
    Banknote
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import Logo from "@/components/logo";

const adminNavItems = [
    { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    {
        label: "User Management",
        icon: Users,
        isExpandable: true,
        subItems: [
            { href: "/admin/users", icon: Users, label: "All Users" },
            { href: "/admin/users?type=admin", icon: Shield, label: "Admins" },
            { href: "/admin/users?type=client", icon: UserCircle, label: "Clients" },
            { href: "/admin/users?type=freelancer", icon: UserPlus, label: "Freelancers" },
        ]
    },
    { href: "/admin/verifications", icon: UserCheck, label: "Identity Verification" },
    { href: "/admin/jobs", icon: Briefcase, label: "Job Moderation" },
    { href: "/admin/roles", icon: Shield, label: "Roles & Permissions" },
    { href: "/admin/disputes", icon: AlertTriangle, label: "Disputes" },
    { href: "/admin/withdrawals", icon: Banknote, label: "Withdrawal Requests" },
    { href: "/admin/logs", icon: Activity, label: "Audit Logs" },
    { href: "/admin/tickets", icon: LifeBuoy, label: "Support Tickets" },
    { href: "/admin/settings", icon: Settings, label: "System Settings" },
];

export function AdminSidebar() {
    const pathname = usePathname();
    const [expandedItems, setExpandedItems] = useState<string[]>(["User Management"]);

    const toggleExpand = (label: string) => {
        setExpandedItems(current =>
            current.includes(label)
                ? current.filter(i => i !== label)
                : [...current, label]
        );
    };

    return (
        <div className="flex h-full flex-col gap-2">
            <div className="flex h-14 items-center border-b border-slate-800 px-4 lg:h-[60px] lg:px-6">
                <Link href="/admin/dashboard" className="flex items-center gap-2 font-semibold">
                    <ShieldAlert className="h-6 w-6 text-blue-500" />
                    <span className="text-slate-100">Control Panel</span>
                </Link>
            </div>
            <div className="flex-1">
                <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-1 mt-4">
                    {adminNavItems.map((item) => {
                        if (item.subItems) {
                            const isExpanded = expandedItems.includes(item.label);
                            const isSubActive = item.subItems.some(sub => pathname.startsWith(sub.href));

                            return (
                                <div key={item.label} className="flex flex-col gap-1">
                                    <button
                                        onClick={() => toggleExpand(item.label)}
                                        className={cn(
                                            "flex items-center justify-between gap-3 rounded-lg px-3 py-2 transition-all hover:text-blue-400",
                                            isSubActive ? "text-blue-400" : "text-slate-400"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon className="h-4 w-4" />
                                            {item.label}
                                        </div>
                                        {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                    </button>
                                    {isExpanded && (
                                        <div className="ml-4 flex flex-col gap-1 border-l border-slate-800 pl-4 py-1">
                                            {item.subItems.map(sub => {
                                                const isActive = pathname === sub.href;
                                                return (
                                                    <Link
                                                        key={sub.href}
                                                        href={sub.href}
                                                        className={cn(
                                                            "flex items-center gap-3 rounded-lg px-3 py-1.5 text-xs transition-all hover:text-blue-400",
                                                            isActive ? "text-blue-400 font-semibold" : "text-slate-500"
                                                        )}
                                                    >
                                                        <sub.icon className="h-3.5 w-3.5" />
                                                        {sub.label}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-blue-400",
                                    isActive
                                        ? "bg-slate-800 text-blue-400 shadow-sm"
                                        : "text-slate-400"
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>
            <div className="mt-auto p-4 border-t border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Terminal className="h-3 w-3" />
                    <span>v2.4.0-internal</span>
                </div>
            </div>
        </div>
    );
}
