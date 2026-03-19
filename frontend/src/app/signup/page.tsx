"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Logo from "@/components/logo";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff } from "lucide-react";

export default function SignupPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("freelancer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Password Validation
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasLength = password.length >= 8;

    if (!hasUpperCase || !hasNumber || !hasSymbol || !hasLength) {
      setError("Password does not meet strict requirements.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name: firstName, last_name: lastName, email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      console.log("User created:", data.user);

      // Redirect to email verification
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary py-12">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader className="text-center">
          <Logo className="justify-center mb-4" />
          <CardTitle className="font-headline text-2xl">Create an Account</CardTitle>
          <CardDescription>Join our community of freelancers and clients in Nepal.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="first-name">First name</Label>
                <Input
                  id="first-name"
                  placeholder="Ram"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last-name">Last name</Label>
                <Input
                  id="last-name"
                  placeholder="Bahadur"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="ram@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Password Validation Checklist */}
            {isPasswordFocused && (
              <div className="text-xs space-y-1 text-muted-foreground bg-muted/50 p-3 rounded-md animate-in fade-in slide-in-from-top-2">
                <p className="font-medium mb-1">Password must contain:</p>
                <div className={`flex items-center gap-2 ${password.length >= 8 ? "text-green-600 dark:text-green-500" : ""}`}>
                  {password.length >= 8 ? "✓" : "○"} At least 8 characters
                </div>
                <div className={`flex items-center gap-2 ${/[A-Z]/.test(password) ? "text-green-600 dark:text-green-500" : ""}`}>
                  {/[A-Z]/.test(password) ? "✓" : "○"} One uppercase letter
                </div>
                <div className={`flex items-center gap-2 ${/[0-9]/.test(password) ? "text-green-600 dark:text-green-500" : ""}`}>
                  {/[0-9]/.test(password) ? "✓" : "○"} One number
                </div>
                <div className={`flex items-center gap-2 ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? "text-green-600 dark:text-green-500" : ""}`}>
                  {/[!@#$%^&*(),.?":{}|<>]/.test(password) ? "✓" : "○"} One special character
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label>I want to:</Label>
              <RadioGroup defaultValue="freelancer" className="grid grid-cols-2 gap-4" onValueChange={setRole} value={role}>
                <div>
                  <RadioGroupItem value="freelancer" id="freelancer" className="peer sr-only" />
                  <Label
                    htmlFor="freelancer"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    Work as a Freelancer
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="client" id="client" className="peer sr-only" />
                  <Label
                    htmlFor="client"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    Hire for a Project
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md text-sm text-red-600 dark:text-red-500 flex flex-col gap-2">
                <p>{error}</p>
                {error.toLocaleLowerCase().includes("already exists") && (
                  <Link href="/login" className="font-semibold underline flex items-center gap-1">
                    Log in instead →
                  </Link>
                )}
              </div>
            )}

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : "Sign Up"}
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid gap-2">
            <Button variant="outline" className="w-full" onClick={() => window.location.href = 'http://localhost:5000/api/auth/google'} disabled={loading}>
              <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
              Sign up with Google
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline">
              Log in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
