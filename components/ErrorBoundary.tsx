import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  // FIX: Refactored to use a constructor for state initialization for broader compatibility.
  // This resolves issues in environments that may not fully support the class field syntax,
  // which was causing `this.setState` and `this.props` to be undefined.
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error: error, errorInfo: errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          color: 'white', 
          background: 'var(--app-bg)', 
          height: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: 'sans-serif'
        }}>
          <div className="glass glass-danger p-8 max-w-2xl w-full">
            <h1 className="text-2xl font-bold text-red-300">Ha ocurrido un error en la aplicación.</h1>
            <p className="mt-2 text-red-200">
              Por favor, intenta recargar la página. Si el problema persiste, contacta a soporte.
            </p>
            <details className="mt-4 p-4 bg-black/30 rounded-lg text-sm">
              <summary className="cursor-pointer font-semibold">Detalles del Error</summary>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', marginTop: '1rem' }}>
                {this.state.error?.toString()}
                <br />
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
             <button
                onClick={() => window.location.reload()}
                className="btn-primary mt-6 w-full"
            >
                Recargar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
