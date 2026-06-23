'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
}

/** Catches client-side chart / lazy-chunk failures without crashing the page. */
export class ChartErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ChartErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-[260px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/30 p-6 text-center">
          <p className="text-sm font-medium text-foreground">
            {this.props.fallbackTitle ?? 'Chart failed to load'}
          </p>
          <p className="max-w-sm text-xs text-muted-foreground">
            Try refreshing the page. If the issue persists, clear your browser cache.
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => this.setState({ hasError: false })}
          >
            Retry
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
