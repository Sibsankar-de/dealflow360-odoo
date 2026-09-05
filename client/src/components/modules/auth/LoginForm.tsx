"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Please enter your work email.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setIsLoading(true);
    // Simulate sign in authentication workflow
    setTimeout(() => {
      setIsLoading(false);
    }, 1200);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 w-full">
      <div className="space-y-1 text-left">
        <h3 className="text-2xl font-bold text-text-primary tracking-tight">
          Welcome back
        </h3>
        <p className="text-sm text-text-secondary font-normal">
          Sign in to your sales workspace
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-danger">
          {error}
        </div>
      )}

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

      {/* Password with Forgot Password link & toggle */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-text-primary select-none">
            Password <span className="text-danger font-semibold">*</span>
          </label>
          <button
            type="button"
            className="text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors cursor-pointer"
            onClick={() => alert("Password reset link will be sent to your email.")}
          >
            Forgot password?
          </button>
        </div>

        <Input
          type={showPassword ? "text" : "password"}
          placeholder="••••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            >
              {showPassword ? (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.025 10.025 0 014.122-.963c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21M3 3l18 18"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          }
        />
      </div>

      {/* Remember me */}
      <div className="pt-1">
        <Checkbox
          label="Remember me on this device"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
        />
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isLoading}
        loadingText="Signing In..."
        className="w-full"
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
        Sign In
      </Button>

      {/* Role Disclaimer Box */}
      <div className="p-3.5 rounded-xl border border-border bg-surface/70 text-xs text-text-secondary flex items-start gap-2.5">
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

      {/* Switch to Signup */}
      <div className="text-center pt-2">
        <p className="text-xs text-text-secondary font-normal">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-semibold text-brand-600 hover:text-brand-700 transition-colors"
          >
            Sign up
          </Link>
        </p>
      </div>
    </form>
  );
};

export default LoginForm;
