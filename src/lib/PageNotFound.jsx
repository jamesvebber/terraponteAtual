import { useNavigate } from 'react-router-dom';

export default function PageNotFound() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      <span className="text-6xl mb-4">🌾</span>
      <h1 className="text-2xl font-extrabold text-foreground mb-2">Página não encontrada</h1>
      <p className="text-sm text-muted-foreground mb-8 max-w-xs">
        A página que você procura não existe ou foi removida.
      </p>
      <button
        onClick={() => navigate('/')}
        className="h-12 px-8 rounded-xl bg-primary text-primary-foreground font-bold text-sm"
      >
        Voltar ao início
      </button>
    </div>
  );
}