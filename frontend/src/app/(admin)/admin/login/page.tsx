"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Authentication failed");
            }

            localStorage.setItem("admin_token", data.admin_token);
            localStorage.setItem("admin_user", JSON.stringify(data.user));

            router.push("/admin/dashboard");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
            <Card className="w-full max-w-md border-slate-800 bg-slate-900 shadow-2xl">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="rounded-full bg-blue-500/10 p-3">
                            <ShieldAlert className="h-10 w-10 text-blue-500" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-slate-50">
                        Control Panel Login
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        Secure access for authorized administrators only
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-300">Admin Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="root@system.internal"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500 focus:ring-blue-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" title="password" className="text-slate-300">Secret Token</Label>
                            <Input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-slate-800 border-slate-700 text-slate-200 focus:ring-blue-500"
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 rounded-md bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">
                                <Lock className="h-4 w-4" />
                                <span>{error}</span>
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold h-11"
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="animate-spin" /> : "Authorize Session"}
                        </Button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-xs text-slate-500 uppercase tracking-widest font-medium">
                            Enterprise Security Boundary v4.0
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
