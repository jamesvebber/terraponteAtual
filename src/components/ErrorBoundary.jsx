import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[TerraPonte] Erro inesperado:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center bg-background">
          <span className="text-6xl mb-4">⚠️</span>
          <h2 className="text-xl font-extrabold text-foreground mb-2">Algo deu errado</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            Ocorreu um erro inesperado. Tente recarregar o aplicativo.
          </p>
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