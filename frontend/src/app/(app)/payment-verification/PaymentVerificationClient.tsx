"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

export default function PaymentVerificationClient() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
    const [message, setMessage] = useState("We are verifying your payment with Khalti...");

    const pidx = searchParams.get("pidx");
    const purchase_order_id = searchParams.get("purchase_order_id");

    useEffect(() => {
        if (pidx) {
            verifyPayment();
        } else {
            setStatus("error");
            setMessage("No payment information found.");
        }
    }, [pidx]);

    const verifyPayment = async () => {
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/payments/verify?pidx=${pidx}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                setStatus("success");
                setMessage("Payment successful! You have hired the freelancer.");
                // Redirect back after a few seconds
                setTimeout(() => {
                    router.push("/client"); // Redirect to client dashboard
                }, 3000);
            } else {
                const data = await res.json();
                setStatus("error");
                setMessage(data.message || "Payment verification failed.");
            }
        } catch (error) {
            console.error(error);
            setStatus("error");
            setMessage("Network error during verification.");
        }
    };

    return (
        <>
            <PageHeader
                title="Payment Verification"
                description="Please wait while we confirm your transaction."
            />
            <Card className="max-w-md mx-auto mt-8">
                <CardContent className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                    {status === "verifying" && (
                        <>
                            <Loader2 className="h-12 w-12 text-primary animate-spin" />
                            <p className="text-lg font-medium">{message}</p>
                        </>
                    )}

                    {status === "success" && (
                        <>
                            <CheckCircle className="h-12 w-12 text-green-500" />
                            <p className="text-lg font-medium text-green-600">{message}</p>
                            <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
                            <Button asChild className="mt-4">
                                <Link href="/client">Go to Dashboard</Link>
                            </Button>
                        </>
                    )}

                    {status === "error" && (
                        <>
                            <XCircle className="h-12 w-12 text-red-500" />
                            <p className="text-lg font-medium text-red-600">{message}</p>
                            <Button asChild variant="outline" className="mt-4">
                                <Link href="/tasks">Back to Market</Link>
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>
        </>
    );
}