import React from "react";
import { clsx } from "clsx";

const workflowSteps = [
  { label: "Quote", active: true },
  { label: "Approve", active: false },
  { label: "Negotiate", active: false },
  { label: "Fulfill", active: false },
  { label: "Bill", active: false },
];

export const AuthBrandingPanel: React.FC<{ className?: string }> = ({
  className,
}) => {
  return (
    <div
      className={clsx(
        "relative flex flex-col justify-between bg-navy-950 text-white p-8 lg:p-12 h-full overflow-hidden select-none",
        className
      )}
    >
      {/* Background radial highlight */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header / Logo */}
      <div className="relative z-10 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-600/30">
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white leading-tight">
            DealFlow360
          </h1>
          <p className="text-xs text-text-muted font-medium">
            Sales Operations Platform
          </p>
        </div>
      </div>

      {/* Middle Content */}
      <div className="relative z-10 my-auto space-y-6 max-w-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-navy-700 bg-navy-900/80 text-xs font-medium text-brand-100">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse" />
          Enterprise B2B Sales Operations
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold tracking-wide uppercase text-brand-500">
            Welcome to DealFlow360
          </p>
          <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
            Govern every deal{" "}
            <span className="text-brand-500">with confidence.</span>
          </h2>
          <p className="text-base text-text-muted leading-relaxed font-normal pt-2">
            Discount governance, multi-level approvals, customer negotiation,
            warehouse fulfillment, and hybrid billing — unified in one
            intelligent sales workflow.
          </p>
        </div>

        {/* Flowchart Steps */}
        <div className="pt-4">
          <div className="flex flex-wrap items-center gap-2">
            {workflowSteps.map((step, idx) => (
              <React.Fragment key={step.label}>
                <div
                  className={clsx(
                    "px-4 py-2 rounded-lg text-xs font-semibold transition-colors border",
                    step.active
                      ? "bg-brand-600 border-brand-500 text-white shadow-md shadow-brand-600/20"
                      : "bg-navy-900/60 border-navy-700 text-text-muted hover:border-navy-600"
                  )}
                >
                  {step.label}
                </div>
                {idx < workflowSteps.length - 1 && (
                  <span className="text-text-muted text-xs px-0.5 font-bold">
                    &rarr;
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthBrandingPanel;
