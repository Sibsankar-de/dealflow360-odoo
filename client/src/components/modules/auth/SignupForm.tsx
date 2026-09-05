"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { useAuth } from "@/context/AuthContext";

import { signupSchema } from "@/schemas/auth.schema";

export const SignupForm: React.FC = () => {
  const router = useRouter();
  const { register } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    agreeTerms?: string;
  }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setFieldErrors({});

    const result = signupSchema.safeParse({
      fullName: fullName.trim(),
      email: email.trim(),
      password,
      confirmPassword,
      agreeTerms,
    });

    if (!result.success) {
      const formattedErrors: {
        fullName?: string;
        email?: string;
        password?: string;
        confirmPassword?: string;
        agreeTerms?: string;
      } = {};
      result.error.issues.forEach((err) => {
        const field = err.path[0] as keyof typeof formattedErrors;
        if (field && !formattedErrors[field]) {
          formattedErrors[field] = err.message;
        }
      });
      setFieldErrors(formattedErrors);
      return;
    }

    setIsLoading(true);
    try {
      await register({
        userName: result.data.fullName,
        email: result.data.email,
        password: result.data.password,
      });
      router.push("/profile");
    } catch (err: unknown) {
      const errorObj = err as { data?: { message?: string }; message?: string };
      setGeneralError(
        errorObj.data?.message ||
          errorObj.message ||
          "Failed to create account. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full" noValidate>
      <div className="space-y-1 text-left">
        <h3 className="text-2xl font-bold text-text-primary tracking-tight">
          Create your account
        </h3>
        <p className="text-sm text-text-secondary font-normal">
          Get started with DealFlow360 sales operations
        </p>
      </div>

      {generalError && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-danger">
          {generalError}
        </div>
      )}

      <Input
        label="Full Name"
        type="text"
        placeholder="Rahul Sharma"
        value={fullName}
        onChange={(e) => {
          setFullName(e.target.value);
          if (fieldErrors.fullName)
            setFieldErrors((prev) => ({ ...prev, fullName: undefined }));
        }}
        error={fieldErrors.fullName}
        required
        autoComplete="name"
      />

      <Input
        label="Work Email"
        type="email"
        placeholder="rahul.sharma@acmecorp.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (fieldErrors.email)
            setFieldErrors((prev) => ({ ...prev, email: undefined }));
        }}
        error={fieldErrors.email}
        required
        autoComplete="email"
      />

      <div className="flex flex-col gap-3">
        <Input
          label="Password"
          type={showPassword ? "text" : "password"}
          placeholder="••••••"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (fieldErrors.password)
              setFieldErrors((prev) => ({ ...prev, password: undefined }));
          }}
          error={fieldErrors.password}
          required
          autoComplete="new-password"
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

        <Input
          label="Confirm Password"
          type={showConfirmPassword ? "text" : "password"}
          placeholder="••••••"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (fieldErrors.confirmPassword)
              setFieldErrors((prev) => ({
                ...prev,
                confirmPassword: undefined,
              }));
          }}
          error={fieldErrors.confirmPassword}
          required
          autoComplete="new-password"
          rightIcon={
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              className="text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            >
              {showConfirmPassword ? (
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

      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isLoading}
        loadingText="Creating Account..."
        className="w-full mt-2"
        rightIcon={<ArrowRight className="w-4 h-4" />}
      >
        Create Account
      </Button>

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
