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
import { Loader2 } from "lucide-react";

export default function SignupPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("freelancer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
      if (role === 'client') {
        router.push("/client");
      } else {
        router.push("/dashboard");
      }
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
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
              />
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

            {error && <p className="text-sm text-red-500">{error}</p>}

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
            <Button variant="outline" className="w-full" onClick={() => window.location.href = 'http://localhost:5000/api/auth/facebook'} disabled={loading}>
              <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="facebook" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M504 256C504 119 393 8 256 8S8 119 8 256c0 125.1 87.3 229 204.3 247.2v-175h-61.5v-72.2h61.5v-53.6c0-60.8 35.8-93.5 89.9-93.5 25.8 0 52.6 4.3 52.6 4.3v57.8h-29.6c-30.8 0-40.4 19.1-40.4 38.7v46.3h69.2l-11 72.2h-58.2v175c117-18.2 204.3-122.1 204.3-247.2z"></path></svg>
              Sign up with Facebook
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
