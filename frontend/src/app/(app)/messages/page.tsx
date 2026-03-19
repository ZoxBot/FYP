"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, RefreshCcw } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatBox } from "@/components/chat-box";
import { Button } from "@/components/ui/button";

interface Conversation {
    task_id: number;
    title: string;
    status: string;
    client_id: number;
    selected_freelancer_id: number;
    client_fname: string;
    client_lname: string;
    client_avatar: string;
    freelancer_fname: string;
    freelancer_lname: string;
    freelancer_avatar: string;
    last_message: string;
    last_message_attachment_url?: string;
    last_message_attachment_type?: string;
    last_message_time: string;
}

export default function MessagesPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTask, setActiveTask] = useState<Conversation | null>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    useEffect(() => {
        const fetchUser = async () => {
            const userStr = localStorage.getItem("user");
            if (userStr) {
                setCurrentUser(JSON.parse(userStr));
            }
        };
        fetchUser();
        fetchConversations();
    }, []);

    const fetchConversations = async () => {
        setLoading(true);
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`${apiUrl}/api/messages/conversations/all`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setConversations(data);
                if (data.length > 0 && !activeTask) {
                    setActiveTask(data[0]);
                }
            }
        } catch (error) {
            console.error("Fetch conversations error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)]">
            <PageHeader
                title="Messages"
                description="Your conversations with clients and freelancers."
            />
            
            <div className="flex-grow flex gap-4 overflow-hidden mt-6">
                {/* Sidebar - Conversations List */}
                <Card className="w-1/3 flex flex-col h-full overflow-hidden">
                    <div className="p-4 border-b flex items-center justify-between bg-muted/20">
                        <h2 className="font-semibold flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-primary" />
                            Conversations
                        </h2>
                        <Button variant="ghost" size="icon" onClick={fetchConversations} disabled={loading}>
                            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                    
                    <ScrollArea className="flex-grow">
                        {loading && conversations.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">Loading conversations...</div>
                        ) : conversations.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground italic">No conversations found.</div>
                        ) : (
                            <div className="flex flex-col divide-y">
                                {conversations.map(conv => {
                                    const isClient = currentUser?.role === 'client';
                                    const otherName = isClient ? `${conv.freelancer_fname} ${conv.freelancer_lname}` : `${conv.client_fname} ${conv.client_lname}`;
                                    const otherAvatar = isClient ? conv.freelancer_avatar : conv.client_avatar;
                                    
                                    return (
                                        <button 
                                            key={conv.task_id}
                                            onClick={() => setActiveTask(conv)}
                                            className={`flex items-start gap-4 p-4 text-left transition-colors hover:bg-muted/50 ${activeTask?.task_id === conv.task_id ? 'bg-muted' : ''}`}
                                        >
                                            <Avatar className="h-10 w-10 shrink-0">
                                                <AvatarImage src={otherAvatar?.startsWith('http') ? otherAvatar : `${apiUrl}/uploads/${otherAvatar}`} />
                                                <AvatarFallback>{otherName.substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-grow min-w-0">
                                                <div className="flex justify-between items-baseline mb-1">
                                                    <h3 className="font-semibold truncate pr-2">{otherName}</h3>
                                                    {conv.last_message_time && (
                                                        <span className="text-xs text-muted-foreground shrink-0">
                                                            {new Date(conv.last_message_time).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs font-medium text-primary mb-1 truncate">{conv.title}</p>
                                                <p className="text-sm text-muted-foreground truncate">
                                                    {conv.last_message ? conv.last_message : (conv.last_message_attachment_url ? (conv.last_message_attachment_type?.startsWith('image/') ? "📷 Image" : "📎 Attachment") : "No messages yet")}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </ScrollArea>
                </Card>

                {/* Main Content - Chat Area */}
                <div className="w-2/3 h-full overflow-hidden flex flex-col">
                    {activeTask ? (
                        <div className="flex-grow h-full [&>div]:h-full">
                            <ChatBox 
                                taskId={activeTask.task_id} 
                                currentUser={currentUser} 
                                apiUrl={apiUrl} 
                            />
                        </div>
                    ) : (
                        <Card className="flex flex-col h-full items-center justify-center text-center p-8 bg-muted/20">
                            <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-4" />
                            <h2 className="text-xl font-semibold mb-2">No Conversation Selected</h2>
                            <p className="text-muted-foreground">Choose a conversation from the sidebar to start chatting.</p>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
