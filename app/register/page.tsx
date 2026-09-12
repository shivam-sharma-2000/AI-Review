"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Sparkles, Loader2, MailCheck } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, verifyEmail, isAuthenticated } = useAuth();

  const [step, setStep] = React.useState<1 | 2>(1);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [verificationCode, setVerificationCode] = React.useState("");
  
  const [submitting, setSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const redirectUrl = searchParams.get("redirect") || "/businesses";

  React.useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectUrl);
    }
  }, [isAuthenticated, router, redirectUrl]);

  function validateStep1() {
    const next: Record<string, string> = {};
    if (!email.trim()) {
      next.email = "Email is required.";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        next.email = "Enter a valid email address.";
      }
    }
    if (!password) {
      next.password = "Password is required.";
    } else if (password.length < 6) {
      next.password = "Password must be at least 6 characters.";
    }
    if (password !== confirmPassword) {
      next.confirmPassword = "Passwords do not match.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!validateStep1()) return;

    setSubmitting(true);
    try {
      await register(email.trim(), password);
      toast.success("Verification code sent!", {
        description: "Please check your email for the 6-digit code.",
      });
      setStep(2);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!verificationCode.trim()) {
      setErrors({ code: "Verification code is required." });
      return;
    }

    setSubmitting(true);
    try {
      await verifyEmail(email.trim(), verificationCode.trim());
      toast.success("Email verified successfully!", {
        description: "Welcome to AI-Review!",
      });
      // The auth context will automatically redirect via the useEffect above
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed. Invalid or expired code.");
    } finally {
      setSubmitting(false);
    }
  }

  const loginLink = `/login${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-muted/30 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              {step === 1 ? <Sparkles className="size-6" /> : <MailCheck className="size-6" />}
            </div>
            <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight">
              {step === 1 ? "Create an account" : "Verify your email"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {step === 1 
                ? "Sign up to set up your business reviews page" 
                : `We sent a 6-digit code to ${email}`}
            </p>
          </div>

          <Card className="rounded-2xl border-border shadow-sm">
            <CardContent className="p-8">
              {step === 1 ? (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="rounded-xl"
                      aria-invalid={!!errors.email}
                    />
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="rounded-xl"
                      aria-invalid={!!errors.password}
                    />
                    {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="rounded-xl"
                      aria-invalid={!!errors.confirmPassword}
                    />
                    {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
                  </div>

                  <Button type="submit" className="w-full mt-2 rounded-xl" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Sending code...
                      </>
                    ) : (
                      "Continue"
                    )}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerify} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Verification Code</Label>
                    <Input
                      id="code"
                      type="text"
                      placeholder="12345678"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="rounded-xl text-center text-lg tracking-widest font-mono"
                      maxLength={8}
                      aria-invalid={!!errors.code}
                    />
                    {errors.code && <p className="text-xs text-destructive text-center">{errors.code}</p>}
                  </div>

                  <Button type="submit" className="w-full mt-2 rounded-xl" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify & Login"
                    )}
                  </Button>
                  
                  <div className="mt-4 text-center">
                    <Button 
                      type="button" 
                      variant="link" 
                      className="text-xs text-muted-foreground"
                      onClick={() => setStep(1)}
                    >
                      Change email address
                    </Button>
                  </div>
                </form>
              )}

              {step === 1 && (
                <div className="mt-6 text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link href={loginLink} className="font-semibold text-primary hover:underline">
                    Sign in
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <React.Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    }>
      <RegisterForm />
    </React.Suspense>
  );
}
