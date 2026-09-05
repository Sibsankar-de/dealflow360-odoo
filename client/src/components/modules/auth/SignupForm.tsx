"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";

export const SignupForm: React.FC = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your work email.");
      return;
    }

    if (!password) {
      setError("Please enter a password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!agreeTerms) {
      setError("You must agree to the terms and privacy policy.");
      return;
    }

    setIsLoading(true);
    // Simulate sign up registration workflow
    setTimeout(() => {
      setIsLoading(false);
    }, 1200);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      <div className="space-y-1 text-left">
        <h3 className="text-2xl font-bold text-text-primary tracking-tight">
          Create your account
        </h3>
        <p className="text-sm text-text-secondary font-normal">
          Get started with DealFlow360 sales operations
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-danger">
          {error}
        </div>
      )}

      {/* Full Name */}
      <Input
        label="Full Name"
        type="text"
        placeholder="Rahul Sharma"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        required
        autoComplete="name"
      />

      {/* Work Email */}
      <Input
        label="Work Email"
        type="email"
        placeholder="rahul.sharma@acmecorp.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
      />

      {/* Password & Confirm Password */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Password"
          type="password"
          placeholder="••••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
        />

        <Input
          label="Confirm Password"
          type="password"
          placeholder="••••••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
        />
      </div>

      {/* Terms agreement */}
      <div className="pt-1">
        <Checkbox
          label={
            <span className="text-xs text-text-secondary">
              I agree to the{" "}
              <a
                href="#terms"
                onClick={(e) => e.preventDefault()}
                className="font-medium text-brand-600 hover:text-brand-700 underline"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="#privacy"
                onClick={(e) => e.preventDefault()}
                className="font-medium text-brand-600 hover:text-brand-700 underline"
              >
                Privacy Policy
              </a>
            </span>
          }
          checked={agreeTerms}
          onChange={(e) => setAgreeTerms(e.target.checked)}
          required
        />
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isLoading}
        loadingText="Creating Account..."
        className="w-full mt-2"
        rightIcon={
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
            />
          </svg>
        }
      >
        Create Account
      </Button>

      {/* Role Disclaimer Box */}
      <div className="p-3 rounded-xl border border-border bg-surface/70 text-xs text-text-secondary flex items-start gap-2">
        <svg
          className="w-4 h-4 text-text-muted shrink-0 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
        <span>
          Access is governed by your organization&apos;s role configuration.
          Contact your administrator if you need elevated permissions.
        </span>
      </div>

      {/* Switch to Login */}
      <div className="text-center pt-1">
        <p className="text-xs text-text-secondary font-normal">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-brand-600 hover:text-brand-700 transition-colors"
          >
            Log in
          </Link>
        </p>
      </div>
    </form>
  );
};

export default SignupForm;
