import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/browser';
import ErrorCard from './shared/ErrorCard';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  sentryEventId?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Unhandled React Render Error in Popup:', error, errorInfo);

    const sentryDsn = process.env.VITE_SENTRY_DSN || '';
    if (sentryDsn) {
      const sentryEventId = Sentry.captureException(error, {
        extra: {
          componentStack: errorInfo.componentStack,
        },
      });
      this.setState({ sentryEventId });
    }
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-[320px] bg-gray-900 text-white flex items-center justify-center p-4">
          <div className="w-full max-w-sm">
            <ErrorCard
              message={this.state.error?.message ?? 'An unexpected error occurred in the extension popup.'}
              sentryEventId={this.state.sentryEventId}
              onRetry={() => this.setState({ hasError: false, error: undefined, sentryEventId: undefined })}
            />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
