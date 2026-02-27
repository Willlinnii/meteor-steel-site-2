import React from 'react';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const isDev = process.env.NODE_ENV === 'development';

      return (
        <div className="error-boundary">
          <div className="error-boundary__content">
            <div className="error-boundary__icon" aria-hidden="true">&#9888;</div>
            <h2 className="error-boundary__title">Something Went Wrong</h2>
            <p className="error-boundary__message">
              An unexpected error occurred while loading this page.
              Please try again, or return home.
            </p>
            {isDev && this.state.error && (
              <div className="error-boundary__details">
                <code>{this.state.error.toString()}</code>
              </div>
            )}
            <div className="error-boundary__actions">
              <button
                className="error-boundary__btn error-boundary__btn--retry"
                onClick={this.handleReset}
              >
                Try Again
              </button>
              <a
                href="/"
                className="error-boundary__btn error-boundary__btn--home"
              >
                Go Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
