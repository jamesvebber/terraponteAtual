import { Toaster } from "@/components/ui/toaster"
import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './components/Layout';
import Home from './pages/Home';
import Marketplace from './pages/Marketplace';
import ListingDetail from './pages/ListingDetail';
import Insumos from './pages/Insumos';
import Vender from './pages/Vender';
import Profile from './pages/Profile';
import SellerProfile from './pages/SellerProfile';
import EditSellerProfile from './pages/EditSellerProfile';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfUse from './pages/TermsOfUse';
import SupportPage from './pages/SupportPage';
import MinhaLoja from './pages/MinhaLoja';
import InsumoDetail from './pages/InsumoDetail';
import SlugRedirect from './pages/SlugRedirect';
import SobreNos from './pages/SobreNos';
import PublicSellerPage from './pages/PublicSellerPage';
import PublicStorePage from './pages/PublicStorePage';
import AdminModeration from './pages/AdminModeration';
import MeusAnuncios from './pages/MeusAnuncios';
import EditListing from './pages/EditListing';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
    // auth_required: allow guest browsing — protected pages handle it individually
  }

  // Render the main app
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/marketplace/:id" element={<ListingDetail />} />
        <Route path="/insumos" element={<Insumos />} />
        <Route path="/vender" element={<Vender />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/seller/:sellerName" element={<SellerProfile />} />
        <Route path="/edit-seller-profile" element={<EditSellerProfile />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfUse />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/minha-loja" element={<MinhaLoja />} />
        <Route path="/insumos/:id" element={<InsumoDetail />} />
        <Route path="/p/:slug" element={<SlugRedirect />} />
        <Route path="/sobre" element={<SobreNos />} />
        <Route path="/produtor/:slug" element={<PublicSellerPage />} />
        <Route path="/loja/:slug" element={<PublicStorePage />} />
        <Route path="/admin/moderation" element={<AdminModeration />} />
        <Route path="/meus-anuncios" element={<MeusAnuncios />} />
        <Route path="/editar-anuncio/:id" element={<EditListing />} />
        {/* Clean share URLs */}
        <Route path="/store/:slug" element={<PublicStorePage />} />
        <Route path="/product/:slug" element={<SlugRedirect />} />
        <Route path="/user/:slug" element={<PublicSellerPage />} />
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
  );
};


function App() {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = (e) => document.documentElement.classList.toggle('dark', e.matches);
    apply(mq);
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App