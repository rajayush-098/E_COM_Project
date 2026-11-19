import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected error occurred.',
    };
  }

  componentDidCatch(error: Error) {
    console.error('GIFTLY ErrorBoundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      let displayMessage = this.state.errorMessage;
      try {
        const parsed = JSON.parse(this.state.errorMessage);
        if (parsed.error) {
          displayMessage = `Database request error (${parsed.operationType || 'read'}): ${parsed.error}`;
        }
      } catch {
        // Keep raw error string
      }

      return (
        <div className="min-h-screen bg-[#F8F9F7] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-[#E8ECE8] rounded-2xl p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-[#F28C52]/15 text-[#C75D21] flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h1 className="font-display text-xl font-bold text-[#202A27] mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-[#777F7B] mb-6 leading-relaxed break-words">
              {displayMessage}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#26734D] text-white text-sm font-medium hover:bg-[#1E5C3D] transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Storefront
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
