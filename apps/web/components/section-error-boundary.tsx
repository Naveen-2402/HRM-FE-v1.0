"use client";

import React from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";

interface Props {
  sectionName: string;
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class SectionErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full py-24 flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4 p-8 border border-border bg-card rounded-xl shadow-sm text-center min-w-lg max-w-lg">
            <div className="size-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="size-6 text-destructive" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">Failed to load {this.props.sectionName}</h3>
              <p className="text-sm text-muted-foreground">We encountered an issue displaying this section.</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => this.setState({ hasError: false })}
              className="hover:cursor-pointer mt-2"
            >
              <RefreshCcw className="mr-2 size-4" /> Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}