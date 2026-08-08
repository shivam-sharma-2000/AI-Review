"use client";

import Link from "next/link";
import { Sparkles, Building2, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    try {
      await logout();
      toast.success("Successfully logged out");
      router.push("/");
    } catch {
      toast.error("Failed to log out");
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-display">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="size-4" />
          </span>
          <span className="text-lg font-semibold tracking-tight">ReviewPilot</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          <Link href="/#features" className="transition-colors hover:text-foreground">
            Features
          </Link>
          <Link href="/#how-it-works" className="transition-colors hover:text-foreground">
            How it works
          </Link>
          <Link href="/#faq" className="transition-colors hover:text-foreground">
            FAQ
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/businesses" className="flex items-center gap-1.5">
                  <Building2 className="size-4" />
                  <span className="hidden sm:inline">My Businesses</span>
                </Link>
              </Button>
              <ThemeToggle />
              <div className="hidden items-center gap-2 px-2 text-xs text-muted-foreground sm:flex">
                <User className="size-3" />
                <span className="max-w-[120px] truncate">{user?.email}</span>
              </div>
              <Button onClick={handleLogout} variant="outline" size="sm" className="gap-1.5">
                <LogOut className="size-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </>
          ) : (
            <>
              <ThemeToggle />
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Get Started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
