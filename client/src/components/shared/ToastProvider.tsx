"use client";

import React from "react";
import { Toaster } from "react-hot-toast";

export const ToastProvider: React.FC = () => {
  return (
    <Toaster
      position="bottom-right"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: {
          background: "#ffffff",
          color: "#111827",
          border: "1px solid #e2e8f0",
          padding: "12px 16px",
          borderRadius: "12px",
          fontSize: "13px",
          fontWeight: 500,
          boxShadow:
            "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)",
        },
        success: {
          iconTheme: {
            primary: "#10b981",
            secondary: "#ffffff",
          },
          style: {
            borderLeft: "4px solid #10b981",
          },
        },
        error: {
          iconTheme: {
            primary: "#ef4444",
            secondary: "#ffffff",
          },
          style: {
            borderLeft: "4px solid #ef4444",
          },
        },
      }}
    />
  );
};
