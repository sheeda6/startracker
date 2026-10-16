"use client";

/**
 * DetailsPanelErrorBoundary — catches render errors thrown by any details
 * component (StarDetails, SolarBodyDetails, DSODetails, AsteroidDetails, etc.)
 * and shows a friendly fallback instead of crashing the whole app.
 */

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface State {
  hasError: boolean;
  message: string;
}

export class DetailsPanelErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(err: unknown): State {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    return { hasError: true, message };
  }

  componentDidCatch(err: unknown, info: React.ErrorInfo) {
    console.error("[DetailsPanelErrorBoundary] caught:", err, info);
  }

  reset = () => {
    this.setState({ hasError: false, message: "" });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-rose-500/30 bg-rose-950/30 p-6 text-center text-sm">
          <AlertTriangle className="h-8 w-8 text-rose-400" />
          <div>
            <p className="font-semibold text-rose-200">Details panel error</p>
            <p className="mt-1 text-xs text-rose-300/70 break-words max-w-[220px]">
              {this.state.message}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 border-rose-500/40 text-rose-300 hover:bg-rose-900/40"
            onClick={this.reset}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
