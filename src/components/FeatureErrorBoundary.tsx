import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, X } from 'lucide-react';

interface Props {
  children: ReactNode;
  featureName: string;
  onClose?: () => void;
  onDismiss?: () => void;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class FeatureErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unknown runtime error',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.warn(`[FeatureErrorBoundary caught in ${this.props.featureName}]:`, error, errorInfo);
    }
  }

  private handleClose = () => {
    this.setState({ hasError: false, errorMessage: '' });
    if (this.props.onDismiss) {
      this.props.onDismiss();
    }
    if (this.props.onClose) {
      this.props.onClose();
    }
  };

  public render() {
    if (this.state.hasError) {
      const isProd = import.meta.env.PROD;
      return (
        <div
          dir="rtl"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
        >
          <div className="w-full max-w-md rounded-2xl glass-panel-elevated p-6 border border-amber-500/40 shadow-2xl text-right">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  حماية نافذة {this.props.featureName}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  تم رصد خطأ غير متوقع وتم عزل النافذة بنجاح لحماية استقرار الخزنة.
                </p>
              </div>
            </div>

            {!isProd && this.state.errorMessage && (
              <div className="my-3 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-amber-300 break-words max-h-28 overflow-y-auto">
                {this.state.errorMessage}
              </div>
            )}

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={this.handleClose}
                className="px-4 py-2 rounded-xl gold-btn-3d text-slate-950 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg"
              >
                <X className="w-3.5 h-3.5" />
                <span>إغلاق النافذة والعودة للخزنة</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
