"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  User,
  Settings,
  Shield,
  MessageSquare,
  LifeBuoy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePermission } from "@/hooks/usePermission";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/tasks", icon: Briefcase, label: "Tasks" },
  { href: "/messages", icon: MessageSquare, label: "Messages" },
  { href: "/profile", icon: User, label: "Profile" },
  { href: "/settings", icon: Settings, label: "Settings" },
  { href: "/support/tickets", icon: LifeBuoy, label: "Tickets" },
];
export function MainNav({ isCollapsed }: { isCollapsed: boolean }) {
  const pathname = usePathname();
  const { can } = usePermission();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      const userData = JSON.parse(user);
      setUserRole(userData.role);
    }
  }, []);

  const items = [
    {
      href: userRole === "client" ? "/client" : "/dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
    },
    { href: "/tasks", icon: Briefcase, label: "Tasks" },
    { href: "/messages", icon: MessageSquare, label: "Messages" },
    { href: "/profile", icon: User, label: "Profile" },
    { href: "/settings", icon: Settings, label: "Settings" },
    { href: "/support/tickets", icon: LifeBuoy, label: "Tickets" },
  ];

  // Add "Post a Task" for clients with permission
  if (userRole === "client" || can("job.post")) {
    items.splice(2, 0, {
      href: "/client#post-job",
      icon: Shield,
      label: "Post a Task",
    });
  }

  return (
    <TooltipProvider>
      <nav className="grid gap-2 px-2">
        {items.map((item) => {
          const isActive = pathname === item.href || (item.href === "/dashboard" && pathname === "/dashboard");
          return isCollapsed ? (
            <Tooltip key={item.label} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                    isActive && "bg-accent text-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="sr-only">{item.label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          ) : (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground",
                isActive && "bg-accent text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </TooltipProvider>
  );
}
