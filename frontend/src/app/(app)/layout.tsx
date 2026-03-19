"use client";

import * as React from "react";
import Link from "next/link";
import {
  Home,
  LineChart,
  Package,
  Package2,
  PanelLeft,
  Search,
  ShoppingCart,
  Users,
} from "lucide-react";
import { MainNav } from "@/components/main-nav";
import Logo from "@/components/logo";
import { UserNav } from "@/components/user-nav";
import { NotificationBell } from "@/components/NotificationBell";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[auto_1fr] lg:grid-cols-[auto_1fr]">
      <div
        className={`hidden border-r bg-muted/40 md:block sticky top-0 h-screen transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"
          }`}
      >
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Logo hideText={isCollapsed} />
          </div>
          <div className="flex-1">
            <MainNav isCollapsed={isCollapsed} />
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <nav className="grid gap-2 text-lg font-medium">
                <Logo />
                <MainNav isCollapsed={false} />
              </nav>
            </SheetContent>
          </Sheet>
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>

          <div className="w-full flex-1">
            <form>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search tasks, freelancers..."
                  className="w-full appearance-none bg-background pl-8 md:w-2/3 lg:w-1/3"
                />
              </div>
            </form>
          </div>
          <ThemeToggle />
          <NotificationBell />
          <UserNav />
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
