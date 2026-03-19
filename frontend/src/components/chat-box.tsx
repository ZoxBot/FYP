"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MessageSquare, Paperclip, Image as ImageIcon, File as FileIcon, X } from "lucide-react";

interface Message {
    id: number;
    task_id: number;
    sender_id: number;
    message: string;
    created_at: string;
    first_name: string;
    last_name: string;
    avatar_url: string;
    attachment_url?: string;
    attachment_type?: string;
}

interface ChatBoxProps {
    taskId: number;
    currentUser: any;
    apiUrl: string;
}

import { io, Socket } from "socket.io-client";
 
export function ChatBox({ taskId, currentUser, apiUrl }: ChatBoxProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
 
    useEffect(() => {
        if (scrollAreaRef.current) {
            const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (viewport) {
                viewport.scrollTop = viewport.scrollHeight;
            }
        }
    }, [messages]);

    useEffect(() => {
        fetchMessages();
 
        // Setup Socket.io
        const newSocket = io(apiUrl, {
            withCredentials: true,
        });
 
        newSocket.on("connect", () => {
            console.log("Connected to chat socket");
            newSocket.emit("join_chat", taskId);
        });
 
        newSocket.on("new_chat_message", (message: Message) => {
            if (message.task_id === taskId) {
                setMessages((prev) => [...prev, message]);
            }
        });
 
        setSocket(newSocket);
 
        return () => {
            newSocket.disconnect();
        };
    }, [taskId]);

    const fetchMessages = async () => {
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`${apiUrl}/api/messages/${taskId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            }
        } catch (error) {
            console.error("Fetch messages error:", error);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !file) || loading || uploading) return;

        setLoading(true);
        const token = localStorage.getItem("token");
        
        try {
            let attachment_url = "";
            let attachment_type = "";

            if (file) {
                setUploading(true);
                const formData = new FormData();
                formData.append('file', file);
                
                const uploadRes = await fetch(`${apiUrl}/api/messages/${taskId}/upload`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData
                });

                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    attachment_url = uploadData.url;
                    attachment_type = uploadData.type;
                } else {
                    console.error("Upload failed");
                    setUploading(false);
                    setLoading(false);
                    return;
                }
            }

            const res = await fetch(`${apiUrl}/api/messages/${taskId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    message: newMessage,
                    attachment_url,
                    attachment_type
                })
            });

            if (res.ok) {
                setNewMessage("");
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
            }
        } catch (error) {
            console.error("Send message error:", error);
        } finally {
            setLoading(false);
            setUploading(false);
        }
    };

    return (
        <Card className="flex flex-col h-[500px]">
            <CardHeader className="py-3 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Task Chat
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow p-0 flex flex-col overflow-hidden">
                <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
                    <div className="space-y-4">
                        {messages.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground italic text-sm">
                                No messages yet. Start the conversation!
                            </div>
                        ) : (
                            messages.map((msg) => {
                                const isMe = msg.sender_id === currentUser?.id;
                                return (
                                    <div key={msg.id} className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={msg.avatar_url?.startsWith('http') ? msg.avatar_url : `${apiUrl}/uploads/${msg.avatar_url}`} />
                                            <AvatarFallback>{msg.first_name[0]}{msg.last_name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className={`flex flex-col max-w-[80%] ${isMe ? "items-end" : ""}`}>
                                            <div className={`px-4 py-2 rounded-2xl text-sm ${isMe ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted rounded-tl-none"
                                                }`}>
                                                {msg.attachment_url && (
                                                    <div className="mb-2">
                                                        {msg.attachment_type?.startsWith('image/') ? (
                                                            <div className="relative group">
                                                                <img 
                                                                    src={msg.attachment_url} 
                                                                    alt="Attachment" 
                                                                    className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity max-h-64 object-cover"
                                                                    onClick={() => window.open(msg.attachment_url, '_blank')}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <a 
                                                                href={msg.attachment_url} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className={`flex items-center gap-2 p-2 rounded-lg border ${isMe ? 'bg-primary-foreground/10 border-primary-foreground/20' : 'bg-background border-border'}`}
                                                            >
                                                                <FileIcon className="h-4 w-4 shrink-0" />
                                                                <span className="text-xs truncate max-w-[150px]">
                                                                    {msg.attachment_url.split('/').pop()?.split('_').pop() || 'File'}
                                                                </span>
                                                            </a>
                                                        )}
                                                    </div>
                                                )}
                                                {msg.message && <div>{msg.message}</div>}
                                            </div>
                                            <span className="text-[10px] text-muted-foreground mt-1 px-1">
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </ScrollArea>
                <form onSubmit={handleSendMessage} className="p-4 border-t space-y-3 bg-muted/20">
                    {file && (
                        <div className="flex items-center gap-2 bg-background p-2 rounded-lg border text-xs">
                            {file.type.startsWith('image/') ? <ImageIcon className="h-4 w-4 text-blue-500" /> : <FileIcon className="h-4 w-4 text-orange-500" />}
                            <span className="flex-grow truncate font-medium">{file.name}</span>
                            <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon" 
                                className="h-5 w-5" 
                                onClick={() => {
                                    setFile(null);
                                    if (fileInputRef.current) fileInputRef.current.value = "";
                                }}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    )}
                    <div className="flex gap-2">
                        <input
                            type="file"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                        <Button 
                            type="button" 
                            variant="outline" 
                            size="icon" 
                            className="shrink-0"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={loading || uploading}
                        >
                            <Paperclip className="h-4 w-4" />
                        </Button>
                        <Input
                            placeholder="Type your message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            className="flex-grow bg-background"
                            disabled={loading || uploading}
                        />
                        <Button type="submit" size="icon" disabled={loading || uploading || (!newMessage.trim() && !file)}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
