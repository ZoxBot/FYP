"use client";

import { useEffect, useState } from "react";
import { Bell, Check, Info, MessageSquare, Star, Trash2 } from "lucide-react";
import { io, Socket } from "socket.io-client";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Notification {
    id: number;
    type: string;
    data: any;
    is_read: boolean;
    created_at: string;
}

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [socket, setSocket] = useState<Socket | null>(null);
    const { toast } = useToast();

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    useEffect(() => {
        // 1. Fetch initial notifications
        fetchNotifications();
 
        // 2. Setup Socket.io
        const newSocket = io(API_URL, {
            withCredentials: true,
        });
 
        newSocket.on("connect", () => {
            console.log("Connected to notification socket");
        });
 
        newSocket.on("notification", (notification: Notification) => {
            setNotifications((prev) => [notification, ...prev]);
            setUnreadCount((prev) => prev + 1);
 
            // Show a toast for the new notification
            toast({
                title: getNotificationTitle(notification),
                description: getNotificationDescription(notification),
            });
        });
 
        setSocket(newSocket);
 
        return () => {
            newSocket.disconnect();
        };
    }, []);
 
    const fetchNotifications = async () => {
        try {
            const res = await fetch(`${API_URL}/api/notifications`, {
                credentials: "include",
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
                setUnreadCount(data.filter((n: Notification) => !n.is_read).length);
            }
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        }
    };

    const markAsRead = async (id: number) => {
        try {
            const res = await fetch(`${API_URL}/api/notifications/${id}/read`, {
                method: "PATCH",
                credentials: "include",
            });
            if (res.ok) {
                setNotifications((prev) =>
                    prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const markAllAsRead = async () => {
        try {
            const res = await fetch(`${API_URL}/api/notifications/read-all`, {
                method: "PATCH",
                credentials: "include",
            });
            if (res.ok) {
                setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
                setUnreadCount(0);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case "new_bid":
                return <Star className="h-4 w-4 text-blue-500" />;
            case "bid_accepted":
                return <Check className="h-4 w-4 text-green-500" />;
            case "new_message":
                return <MessageSquare className="h-4 w-4 text-purple-500" />;
            default:
                return <Info className="h-4 w-4 text-slate-500" />;
        }
    };

    const getNotificationTitle = (n: Notification) => {
        switch (n.type) {
            case "new_bid": return "New Bid Received";
            case "bid_accepted": return "Bid Accepted!";
            case "bid_rejected": return "Bid Update";
            case "new_message": return "New Message";
            case "job_completed": return "Job Confirmed";
            case "job_awaiting_confirmation": return "Task Ready for Review";
            default: return "Update";
        }
    };

    const getNotificationDescription = (n: Notification) => {
        const data = n.data;
        switch (n.type) {
            case "new_bid": return `${data.freelancer_name} bid NPR ${data.amount} on "${data.job_title}"`;
            case "bid_accepted": return `Your bid for "${data.job_title}" was accepted!`;
            case "bid_rejected": return `The owner of "${data.job_title}" has accepted another bid.`;
            case "new_message": return `${data.sender_name} sent a message regarding "${data.job_title}"`;
            case "job_completed": return `Job "${data.job_title}" has been completed and payment released.`;
            case "job_awaiting_confirmation": return `${data.freelancer_name} marked "${data.job_title}" as complete.`;
            default: return "You have a new update.";
        }
    };

    const getNotificationLink = (n: Notification) => {
        if (n.data && n.data.job_id) {
            return `/tasks/${n.data.job_id}`;
        }
        return "#";
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative group">
                    <Bell className="h-5 w-5 transition-colors group-hover:text-primary" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] animate-pulse"
                        >
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 bg-muted/50">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-[10px] h-7 px-2 hover:bg-primary/10 hover:text-primary"
                            onClick={markAllAsRead}
                        >
                            Mark all as read
                        </Button>
                    )}
                </div>
                <Separator />
                <ScrollArea className="h-80">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                            <Bell className="h-8 w-8 text-muted-foreground/30 mb-2" />
                            <p className="text-sm text-muted-foreground">No notifications yet.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={cn(
                                        "flex flex-col p-4 border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer relative",
                                        !n.is_read && "bg-primary/5"
                                    )}
                                    onClick={() => markAsRead(n.id)}
                                >
                                    <Link href={getNotificationLink(n)} className="flex items-start gap-3">
                                        <div className="mt-1 p-1 bg-background rounded-full border shadow-sm">
                                            {getNotificationIcon(n.type)}
                                        </div>
                                        <div className="flex-grow space-y-1">
                                            <div className="flex justify-between items-center">
                                                <p className={cn("text-xs font-bold", !n.is_read ? "text-primary" : "text-muted-foreground")}>
                                                    {getNotificationTitle(n)}
                                                </p>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {new Date(n.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-600 line-clamp-2">
                                                {getNotificationDescription(n)}
                                            </p>
                                        </div>
                                    </Link>
                                    {!n.is_read && (
                                        <div className="absolute right-2 bottom-2 h-2 w-2 rounded-full bg-primary" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                <Separator />
                <div className="p-2 bg-muted/20">
                    <Button variant="ghost" className="w-full text-xs h-8" asChild>
                        <Link href="/settings?tab=notifications">Manage notification settings</Link>
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
