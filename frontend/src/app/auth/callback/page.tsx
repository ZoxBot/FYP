// "use client";
 
// import { useEffect } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import { useToast } from "@/hooks/use-toast";
 
// export default function AuthCallbackPage() {
//     const router = useRouter();
//     const searchParams = useSearchParams();
//     const { toast } = useToast();
 
//     useEffect(() => {
//         const fetchUserData = async () => {
//             const token = searchParams.get("token");
//             const role = searchParams.get("role");
//             const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

//             if (token) {
//                 // Save to browser storage
//                 localStorage.setItem("token", token);
                
//                 try {
//                     // Fetch user details to populate the frontend state
//                     const res = await fetch(`${API_URL}/api/users/me`, {
//                         headers: {
//                             'Authorization': `Bearer ${token}`
//                         }
//                     });

//                     if (!res.ok) {
//                         throw new Error("Failed to fetch user data");
//                     }

//                     const data = await res.json();
                    
//                     // Handle both { user: ... } and direct user object formats
//                     const userData = data.user || data;
                    
//                     if (!userData || !userData.id) {
//                         throw new Error("Invalid user data received");
//                     }
                    
//                     // Save user data exactly as normal login does
//                     localStorage.setItem('user', JSON.stringify(userData));
//                     localStorage.setItem('userRole', userData.role || role || 'freelancer');

//                     toast({
//                         title: "Login Successful",
//                         description: "Welcome back!",
//                     });

//                     // Redirect based on role
//                     if (userData.role === "admin") {
//                         router.push("/admin/dashboard");
//                     } else if (userData.role === "client" || role === "client") {
//                         router.push("/client/dashboard");
//                     } else {
//                         router.push("/dashboard");
//                     }
//                 } catch (error) {
//                     toast({
//                         title: "Session Error",
//                         description: "Could not fetch your profile data. Please log in again.",
//                         variant: "destructive",
//                     });
//                     router.push("/login");
//                 }
//             } else {
//                 toast({
//                     title: "Authentication Failed",
//                     description: "Could not retrieve login token.",
//                     variant: "destructive",
//                 });
//                 router.push("/login");
//             }
//         };

//         fetchUserData();
//     }, [router, searchParams, toast]);
 
//     return (
//         <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white">
//             <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
//             <h1 className="text-xl font-medium">Finalizing authentication...</h1>
//             <p className="text-slate-400 mt-2">Please wait while we set up your session.</p>
//         </div>
//     );
// }

import { Suspense } from "react";
import AuthCallbackClient from "./AuthCallbackClient";

export default function AuthCallbackPage() {
    return (
        <Suspense
            fallback={
                <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                    <h1 className="text-xl font-medium">Finalizing authentication...</h1>
                    <p className="text-slate-400 mt-2">Please wait while we set up your session.</p>
                </div>
            }
        >
            <AuthCallbackClient />
        </Suspense>
    );
}