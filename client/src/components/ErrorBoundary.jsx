import React from 'react';
import { RefreshCw, Home, AlertCircle } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Proviea App Error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-offwhite flex items-center justify-center p-4 text-center">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-navy/10 shadow-card space-y-5">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-black text-navy">حدث خطأ غير متوقع</h2>
              <p className="text-xs text-navy/60 leading-relaxed">
                يرجى تحديث الصفحة أو العودة للصفحة الرئيسية للمتابعة.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 bg-yellow hover:bg-yellow-dark text-navy font-bold py-3 px-4 rounded-xl text-xs transition-all shadow flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4" />
                <span>تحديث الصفحة</span>
              </button>

              <button
                onClick={this.handleReset}
                className="flex-1 bg-navy hover:bg-navy-light text-white font-bold py-3 px-4 rounded-xl text-xs transition-all shadow flex items-center justify-center gap-1.5"
              >
                <Home className="w-4 h-4" />
                <span>الرئيسية</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
