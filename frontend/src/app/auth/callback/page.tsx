"use client";

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const token = searchParams.get('token');

        if (token) {
            // In a real app, you might want to fetch user details or validate the token here
            // For now, we assume if we have a token, we are good.
            // Usually you'd store this in a context or cookie.
            // Since the original login code had "localStorage.setItem('token', data.token);" commented out,
            // I'll stick to provided patterns or just redirect.
            // But we probably need to persist it.
            localStorage.setItem('token', token);

            // Redirect to dashboard
            router.push('/dashboard');
        } else {
            // If no token, something went wrong, go back to login
            router.push('/login?error=oauth_failed');
        }
    }, [router, searchParams]);

    return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Logging you in...</p>
            </div>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CallbackContent />
        </Suspense>
    );
}
