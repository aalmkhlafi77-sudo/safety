import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RotateCcw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class AppErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AppErrorBoundary caught an unhandled React error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  private handleReload = () => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleHardReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4 select-none"
        >
          <div className="relative w-full max-w-lg rounded-3xl glass-panel-elevated p-6 border border-rose-500/40 shadow-[0_25px_60px_rgba(0,0,0,0.9)] text-right animate-in fade-in zoom-in-95">
            {/* Header Icon */}
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-100">
                  {this.props.fallbackTitle || 'تم حماية الواجهة من الانهيار (Safe Mode)'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  تم رصد خطأ تشغيلي في واجهة العرض وتم اعتراضه بنجاح لمنع ظهور شاشة بيضاء.
                </p>
              </div>
            </div>

            {/* Error Details (Only visible in development to prevent leaking internal traces in production) */}
            {!import.meta.env.PROD && this.state.error && (
              <div className="my-4 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono text-rose-300 break-words max-h-40 overflow-y-auto">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold mb-1 font-sans">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>رسالة الخطأ التشغيلي (وضع التطوير):</span>
                </div>
                <p className="text-slate-300 selection:bg-rose-500/30 selection:text-rose-200">
                  {this.state.error.message || 'Unknown runtime error'}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleHardReload}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all border border-slate-700 cursor-pointer"
              >
                إعادة تحميل التطبيق
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="px-4 py-2 rounded-xl gold-btn-3d text-amber-950 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-lg"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>استعادة الواجهة ومتابعة العمل</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
