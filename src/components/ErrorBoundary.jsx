import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[TerraPonte] Erro inesperado:", error, info);
    this.setState({ errorInfo: info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center bg-background">
          <span className="text-6xl mb-4">⚠️</span>
          <h2 className="text-xl font-extrabold text-foreground mb-2">Algo deu errado</h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-xs">
            Ocorreu um erro inesperado. Tente recarregar o aplicativo.
          </p>
          {/* Show error details in development */}
          {import.meta.env.DEV && this.state.error && (
            <details className="mb-4 max-w-lg w-full text-left">
              <summary className="text-xs text-muted-foreground cursor-pointer font-bold mb-1">Detalhes do Erro (Dev Only)</summary>
              <pre className="text-xs bg-muted p-3 rounded-xl overflow-auto max-h-48 text-destructive">
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
          <button
            onClick={() => window.location.reload()}
            className="h-12 px-8 rounded-xl bg-primary text-primary-foreground font-bold text-sm"
          >
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}