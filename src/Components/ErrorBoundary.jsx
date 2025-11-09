import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-900 via-purple-900 to-blue-800 p-4">
          <div className="bg-white/20 backdrop-blur-lg rounded-3xl shadow-xl p-10 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              Oops! Something went wrong
            </h2>
            <p className="text-white/80 mb-6">
              The login screen encountered an issue. Please refresh the page or
              try again later.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
