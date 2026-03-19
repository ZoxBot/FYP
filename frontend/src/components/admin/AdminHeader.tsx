"use client";

import {
    Bell,
    Search,
    User,
    LogOut,
    ChevronRight,
    ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

export function AdminHeader() {
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        router.push('/admin/login');
    };

    return (
        <header className="flex h-14 items-center gap-4 border-b border-slate-800 bg-slate-900/50 px-4 lg:h-[60px] lg:px-6">
            <div className="flex flex-1 items-center gap-2 text-sm text-slate-400">
                <span className="font-medium text-slate-200">System</span>
                <ChevronRight className="h-4 w-4" />
                <span>Root</span>
                <ChevronRight className="h-4 w-4" />
                <span>Dashboard</span>
            </div>

            <div className="flex items-center gap-4">
                <form className="hidden lg:block">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                        <Input
                            type="search"
                            placeholder="Search audit logs..."
                            className="w-80 bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500 focus-visible:ring-blue-500"
                        />
                    </div>
                </form>

                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-100">
                    <Bell className="h-5 w-5" />
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full border border-slate-700 bg-slate-800">
                            <User className="h-5 w-5 text-blue-400" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-slate-800 text-slate-200">
                        <DropdownMenuLabel>Root Administrator</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-slate-800" />
                        <DropdownMenuItem className="focus:bg-slate-800 focus:text-blue-400 cursor-pointer">
                            System Settings
                        </DropdownMenuItem>
                        <DropdownMenuItem className="focus:bg-slate-800 focus:text-blue-400 cursor-pointer">
                            Security Logs
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-800" />
                        <DropdownMenuItem
                            onClick={handleLogout}
                            className="text-red-400 focus:bg-red-400/10 focus:text-red-400 cursor-pointer"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Terminate Session
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
