import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || '系統發生非預期錯誤'
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-6 font-mono text-white">
          <div className="w-full max-w-md rounded-2xl border-2 border-rose-500/70 bg-stone-900 p-6 shadow-2xl space-y-4 text-center">
            <h2 className="text-lg font-black text-rose-400">發生錯誤</h2>
            <p className="text-xs text-stone-300 break-words max-h-40 overflow-y-auto bg-stone-950 p-3 rounded-lg border border-stone-800 text-left">
              {this.state.errorMessage}
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, errorMessage: '' })}
              className="min-h-[44px] w-full rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-black text-stone-950"
            >
              重新嘗試
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
