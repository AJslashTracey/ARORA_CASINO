import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--bg))]">
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
            <p className="text-soft mb-6">We're sorry, but something unexpected happened.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="btn-primary"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
