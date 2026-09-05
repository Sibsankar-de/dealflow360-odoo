import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import SignupForm from "@/components/modules/auth/SignupForm";

export default function SignupPage() {
  return (
    <Card className="w-full shadow-xl border-border bg-card p-6 sm:p-8 rounded-2xl">
      {/* Top Tab Switcher */}
      <div className="flex items-center p-1 bg-surface rounded-xl mb-6 border border-border">
        <Link
          href="/login"
          className="flex-1 text-center py-2 text-xs font-semibold rounded-lg text-text-secondary hover:text-text-primary transition-colors"
        >
          Sign In
        </Link>
        <Link
          href="/signup"
          className="flex-1 text-center py-2 text-xs font-semibold rounded-lg bg-card text-text-primary shadow-xs transition-colors"
        >
          Create Account
        </Link>
      </div>

      <SignupForm />
    </Card>
  );
}
