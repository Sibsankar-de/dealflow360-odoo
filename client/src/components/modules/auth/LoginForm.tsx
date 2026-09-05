"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { useAuth } from "@/context/AuthContext";

import { loginSchema } from "@/schemas/auth.schema";

export const LoginForm: React.FC = () => {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setFieldErrors({});

    const result = loginSchema.safeParse({
      email: email.trim(),
      password,
    });

    if (!result.success) {
      const formattedErrors: { email?: string; password?: string } = {};
      result.error.issues.forEach((err) => {
        const field = err.path[0] as "email" | "password";
        if (field && !formattedErrors[field]) {
          formattedErrors[field] = err.message;
        }
      });
      setFieldErrors(formattedErrors);
      return;
    }

    setIsLoading(true);
    try {
      await login(result.data);
      router.push("/profile");
    } catch (err: unknown) {
      const errorObj = err as { data?: { message?: string }; message?: string };
      setGeneralError(
        errorObj.data?.message ||
          errorObj.message ||
          "Failed to sign in. Please check your credentials."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 w-full" noValidate>
      <div className="space-y-1 text-left">
        <h3 className="text-2xl font-bold text-text-primary tracking-tight">
          Welcome back
        </h3>
        <p className="text-sm text-text-secondary font-normal">
          Sign in to your sales workspace
        </p>
      </div>

      {generalError && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-danger">
          {generalError}
        </div>
      )}

      <Input
        label="Work Email"
        type="email"
        placeholder="rahul.sharma@acmecorp.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
        }}
        error={fieldErrors.email}
        required
        autoComplete="email"
      />

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-text-primary select-none">
            Password <span className="text-danger font-semibold">*</span>
          </label>
          <button
            type="button"
            className="text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors cursor-pointer"
            onClick={() =>
              alert("Password reset link will be sent to your email.")
            }
          >
            Forgot password?
          </button>
        </div>

        <Input
          type={showPassword ? "text" : "password"}
          placeholder="••••••"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
          }}
          error={fieldErrors.password}
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
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          }
        />
      </div>

      <div className="pt-1">
        <Checkbox
          label="Remember me on this device"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isLoading}
        loadingText="Signing In..."
        className="w-full"
        rightIcon={<ArrowRight className="w-4 h-4" />}
      >
        Sign In
      </Button>

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
