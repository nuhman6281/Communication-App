/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the component tree, logs those errors,
 * and displays a fallback UI instead of the component tree that crashed.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/button';
import { AlertTriangle, RotateCcw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  level?: 'app' | 'page' | 'component';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to error reporting service
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);

    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Send to analytics/error tracking service (e.g., Sentry)
    if (import.meta.env.MODE === 'production') {
      // window.Sentry?.captureException(error, {
      //   contexts: {
      //     react: {
      //       componentStack: errorInfo.componentStack,
      //     },
      //   },
      // });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo } = this.state;
      const { level = 'component', showDetails = import.meta.env.MODE === 'development' } = this.props;

      // Different UI based on error level
      if (level === 'app') {
        return (
          <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="max-w-lg w-full space-y-6 text-center">
              <div className="flex justify-center">
                <div className="p-4 bg-red-100 rounded-full">
                  <AlertTriangle className="w-12 h-12 text-red-600" />
                </div>
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl font-bold">Application Error</h1>
                <p className="text-muted-foreground">
                  Something went wrong and the application encountered an unexpected error.
                </p>
              </div>

              {showDetails && error && (
                <div className="bg-muted p-4 rounded-lg text-left">
                  <p className="font-mono text-sm text-red-600 font-semibold mb-2">
                    {error.toString()}
                  </p>
                  {errorInfo && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm font-medium mb-2">
                        Component Stack
                      </summary>
                      <pre className="text-xs overflow-auto max-h-48 whitespace-pre-wrap">
                        {errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className="flex gap-2 justify-center">
                <Button onClick={this.handleReload} variant="default">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reload Page
                </Button>
                <Button onClick={this.handleGoHome} variant="outline">
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>

              {import.meta.env.MODE === 'development' && (
                <div className="text-sm text-muted-foreground">
                  <Bug className="w-4 h-4 inline mr-1" />
                  Development mode - error details shown above
                </div>
              )}
            </div>
          </div>
        );
      }

      if (level === 'page') {
        return (
          <div className="flex items-center justify-center min-h-[60vh] p-4">
            <div className="max-w-md w-full space-y-4 text-center">
              <div className="flex justify-center">
                <div className="p-3 bg-amber-100 rounded-full">
                  <AlertTriangle className="w-10 h-10 text-amber-600" />
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-semibold">Page Error</h2>
                <p className="text-muted-foreground">
                  This page encountered an error and couldn't load properly.
                </p>
              </div>

              {showDetails && error && (
                <div className="bg-muted p-3 rounded-lg text-left text-sm">
                  <p className="font-mono text-red-600">{error.toString()}</p>
                </div>
              )}

              <div className="flex gap-2 justify-center">
                <Button onClick={this.handleReset} variant="default" size="sm">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={this.handleGoHome} variant="outline" size="sm">
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>
            </div>
          </div>
        );
      }

      // Component-level error (most granular)
      return (
        <div className="border border-amber-200 bg-amber-50/50 rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <div>
                <h3 className="font-semibold text-sm">Component Error</h3>
                <p className="text-sm text-muted-foreground">
                  This component encountered an error and couldn't render.
                </p>
              </div>

              {showDetails && error && (
                <div className="bg-white/50 p-2 rounded text-xs font-mono overflow-auto max-h-32">
                  {error.toString()}
                </div>
              )}

              <Button onClick={this.handleReset} variant="outline" size="sm">
                <RotateCcw className="w-3 h-3 mr-1" />
                Retry
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
}

// Hook for error handling in functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return setError;
}
