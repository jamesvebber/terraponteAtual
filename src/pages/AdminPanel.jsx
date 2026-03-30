import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Loader2, Trash2, EyeOff, CheckCircle2, Flag, ArrowLeft, RefreshCw,
  ShieldCheck, Store, Users, Package, PlusCircle, Edit2, Star, StarOff,
  ShieldOff, X, Search,
} from "lucide-react";
import { toast } from "sonner";
import AdminAddProduct from "../components/admin/AdminAddProduct";

const TABS = [
  { id: "stores", label: "Lojas" },
  { id: "products", label: "Produtos" },
  { id: "listings", label: "Anúncios" },
  { id: "users", label: "Usuários" },
];

const VERIFY_COLORS = {
  nao_verificada: "bg-gray-100 text-gray-500",
  em_analise: "bg-blue-100 text-blue-700",
  verificada: "bg-green-100 text-green-700",
  representante_oficial: "bg-amber-100 text-amber-700",
};

const VERIFY_LABELS = {
  nao_verificada: "Não verificada",
  em_analise: "Em análise",
  verificada: "Verificada",
  representante_oficial: "Rep. Oficial",
};

export default function AdminPanel() {
  const navigate = useNavigate();
  const { user, isLoadingAuth } = useAuth();
  const [tab, setTab] = useState("stores");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [listings, setListings] = useState([]);
  const [users, setUsers] = useState([]);

  const [addProductOpen, setAddProductOpen] = useState(false);

  useEffect(() => {
    if (!isLoadingAuth && user?.role !== "admin") navigate("/");
  }, [isLoadingAuth, user]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [st, pr, ls, us] = await Promise.all([
      base44.entities.SupplierProfile.list("-created_date", 200),
      base44.entities.InsumoProduct.list("-created_date", 200),
      base44.entities.Listing.list("-created_date", 200),
      base44.entities.User.list(),
    ]);
    setStores(st);
    setProducts(pr);
    setListings(ls);
    setUsers(us);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Stores actions
  const verifyStore = async (store, level) => {
    await base44.entities.SupplierProfile.update(store.id, {
      verification_status: level,
      verified_at: new Date().toISOString(),
      verified_by: user.email,
    });
    setStores(prev => prev.map(s => s.id === store.id ? { ...s, verification_status: level } : s));
    toast.success("Status de verificação atualizado.");
  };

  const suspendStore = async (store) => {
    const newVal = !store.is_suspended;
    await base44.entities.SupplierProfile.update(store.id, { is_suspended: newVal });
    setStores(prev => prev.map(s => s.id === store.id ? { ...s, is_suspended: newVal } : s));
    toast.success(newVal ? "Loja suspensa." : "Loja reativada.");
  };

  const deleteStore = async (id) => {
    if (!confirm("Excluir esta loja?")) return;
    await base44.entities.SupplierProfile.delete(id);
    setStores(prev => prev.filter(s => s.id !== id));
    toast.success("Loja removida.");
  };

  // Products actions
  const deleteProduct = async (id) => {
    if (!confirm("Excluir este produto?")) return;
    await base44.entities.InsumoProduct.delete(id);
    setProducts(prev => prev.filter(p => p.id !== id));
    toast.success("Produto removido.");
  };

  const toggleProductStatus = async (product) => {
    const newStatus = product.status === "active" ? "inactive" : "active";
    await base44.entities.InsumoProduct.update(product.id, { status: newStatus });
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, status: newStatus } : p));
    toast.success(newStatus === "active" ? "Produto ativado." : "Produto desativado.");
  };

  // Listings actions
  const setListingStatus = async (id, status) => {
    await base44.entities.Listing.update(id, { status });
    setListings(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    toast.success("Status do anúncio atualizado.");
  };

  const toggleFeatured = async (listing) => {
    const featured = !listing.featured;
    await base44.entities.Listing.update(listing.id, { featured });
    setListings(prev => prev.map(l => l.id === listing.id ? { ...l, featured } : l));
    toast.success(featured ? "Anúncio destacado." : "Destaque removido.");
  };

  const deleteListing = async (id) => {
    if (!confirm("Excluir este anúncio?")) return;
    await base44.entities.Listing.delete(id);
    setListings(prev => prev.filter(l => l.id !== id));
    toast.success("Anúncio removido.");
  };

  if (isLoadingAuth || (loading && !stores.length)) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (user?.role !== "admin") return null;

  const q = search.toLowerCase();

  const filteredStores = stores.filter(s =>
    !q || s.store_name?.toLowerCase().includes(q) || s.city?.toLowerCase().includes(q)
  );
  const filteredProducts = products.filter(p =>
    !q || p.product_name?.toLowerCase().includes(q) || p.supplier_name?.toLowerCase().includes(q) || p.city?.toLowerCase().includes(q)
  );
  const filteredListings = listings.filter(l =>
    !q || l.title?.toLowerCase().includes(q) || l.seller_name?.toLowerCase().includes(q) || l.city?.toLowerCase().includes(q)
  );
  const filteredUsers = users.filter(u =>
    !q || u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
  );

  return (
    <div className="px-4 pt-5 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate("/")} className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-extrabold text-foreground">Painel Admin</h1>
          <p className="text-xs text-muted-foreground">{stores.length} lojas · {products.length} produtos · {listings.length} anúncios · {users.length} usuários</p>
        </div>
        <button onClick={loadAll} className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center">
          <RefreshCw className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          className="w-full h-11 pl-9 pr-9 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="Buscar em todos..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-muted rounded-xl p-1 mb-4 gap-1 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all select-none whitespace-nowrap px-2 ${tab === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* STORES TAB */}
      {tab === "stores" && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground font-medium">{filteredStores.length} lojas</p>
          {filteredStores.map(store => (
            <div key={store.id} className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                  {store.logo_url
                    ? <img src={store.logo_url} alt="" className="w-full h-full object-cover" />
                    : <Store className="h-5 w-5 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sm text-foreground">{store.store_name}</p>
                    {store.is_suspended && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Suspensa</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{store.supplier_type} · {[store.city, store.region].filter(Boolean).join(", ")}</p>
                  <p className="text-xs text-muted-foreground">{store.whatsapp}</p>
                  <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${VERIFY_COLORS[store.verification_status] || VERIFY_COLORS.nao_verificada}`}>
                    {VERIFY_LABELS[store.verification_status] || "Não verificada"}
                  </span>
                </div>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                <button onClick={() => verifyStore(store, "verificada")}
                  className="h-8 px-3 rounded-lg bg-green-100 text-green-700 text-xs font-bold flex items-center gap-1 select-none">
                  <ShieldCheck className="h-3.5 w-3.5" /> Verificar
                </button>
                <button onClick={() => verifyStore(store, "representante_oficial")}
                  className="h-8 px-3 rounded-lg bg-amber-100 text-amber-700 text-xs font-bold flex items-center gap-1 select-none">
                  <ShieldCheck className="h-3.5 w-3.5" /> Rep. Oficial
                </button>
                <button onClick={() => suspendStore(store)}
                  className={`h-8 px-3 rounded-lg text-xs font-bold flex items-center gap-1 select-none ${store.is_suspended ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                  <ShieldOff className="h-3.5 w-3.5" /> {store.is_suspended ? "Reativar" : "Suspender"}
                </button>
                <button onClick={() => deleteStore(store.id)}
                  className="h-8 w-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center select-none">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
          {filteredStores.length === 0 && <EmptyMsg />}
        </div>
      )}

      {/* PRODUCTS TAB */}
      {tab === "products" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-medium">{filteredProducts.length} produtos</p>
            <Button size="sm" className="rounded-xl gap-1.5 text-xs" onClick={() => setAddProductOpen(true)}>
              <PlusCircle className="h-3.5 w-3.5" /> Adicionar para loja
            </Button>
          </div>
          {filteredProducts.map(p => (
            <div key={p.id} className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-start gap-3 mb-3">
                {p.image_url && (
                  <img src={p.image_url} alt="" className="h-12 w-12 rounded-xl object-cover bg-muted shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-foreground line-clamp-1">{p.product_name}</p>
                  <p className="text-xs text-muted-foreground">{p.supplier_name} · {p.city}</p>
                  <p className="text-xs text-green-600 font-bold">R$ {p.price?.toFixed(2).replace(".", ",")}</p>
                  <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${p.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {p.status === "active" ? "Ativo" : "Inativo"}
                  </span>
                </div>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => toggleProductStatus(p)}
                  className={`h-8 px-3 rounded-lg text-xs font-bold flex items-center gap-1 select-none ${p.status === "active" ? "bg-muted text-muted-foreground" : "bg-green-100 text-green-700"}`}>
                  {p.status === "active" ? <><EyeOff className="h-3.5 w-3.5" /> Desativar</> : <><CheckCircle2 className="h-3.5 w-3.5" /> Ativar</>}
                </button>
                <button onClick={() => deleteProduct(p.id)}
                  className="h-8 w-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center select-none">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
          {filteredProducts.length === 0 && <EmptyMsg />}
        </div>
      )}

      {/* LISTINGS TAB */}
      {tab === "listings" && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground font-medium">{filteredListings.length} anúncios</p>
          {filteredListings.map(l => (
            <div key={l.id} className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-foreground line-clamp-1">{l.title}</p>
                  <p className="text-xs text-muted-foreground">{l.seller_name} · {l.city}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${l.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {l.status}
                    </span>
                    {l.featured && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">⭐ Destaque</span>}
                    {l.report_count > 0 && <span className="text-[10px] font-bold text-orange-600">⚠️ {l.report_count} denúncias</span>}
                  </div>
                </div>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {l.status !== "active"
                  ? <button onClick={() => setListingStatus(l.id, "active")} className="h-8 px-3 rounded-lg bg-green-100 text-green-700 text-xs font-bold flex items-center gap-1 select-none"><CheckCircle2 className="h-3.5 w-3.5" /> Ativar</button>
                  : <button onClick={() => setListingStatus(l.id, "paused")} className="h-8 px-3 rounded-lg bg-muted text-muted-foreground text-xs font-bold flex items-center gap-1 select-none"><EyeOff className="h-3.5 w-3.5" /> Pausar</button>
                }
                <button onClick={() => toggleFeatured(l)}
                  className={`h-8 px-3 rounded-lg text-xs font-bold flex items-center gap-1 select-none ${l.featured ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"}`}>
                  {l.featured ? <><StarOff className="h-3.5 w-3.5" /> Remover destaque</> : <><Star className="h-3.5 w-3.5" /> Destacar</>}
                </button>
                <button onClick={() => setListingStatus(l.id, "rejected")} className="h-8 px-3 rounded-lg bg-red-50 text-red-600 text-xs font-bold flex items-center gap-1 select-none">
                  <Flag className="h-3.5 w-3.5" /> Rejeitar
                </button>
                <button onClick={() => deleteListing(l.id)} className="h-8 w-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center select-none">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
          {filteredListings.length === 0 && <EmptyMsg />}
        </div>
      )}

      {/* USERS TAB */}
      {tab === "users" && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium mb-3">{filteredUsers.length} usuários</p>
          {filteredUsers.map(u => (
            <div key={u.id} className="bg-card border border-border rounded-2xl px-4 py-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-primary">{(u.full_name || u.email || "?")[0].toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{u.full_name || "—"}</p>
                <p className="text-xs text-muted-foreground truncate">{u.email}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${u.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-muted text-muted-foreground"}`}>
                {u.role || "user"}
              </span>
            </div>
          ))}
          {filteredUsers.length === 0 && <EmptyMsg />}
        </div>
      )}

      <AdminAddProduct
        open={addProductOpen}
        onClose={() => setAddProductOpen(false)}
        stores={stores}
        onSaved={(newProduct) => {
          setProducts(prev => [newProduct, ...prev]);
          setAddProductOpen(false);
          toast.success("Produto adicionado com sucesso!");
        }}
      />
    </div>
  );
}

function EmptyMsg() {
  return (
    <div className="text-center py-12">
      <p className="text-4xl mb-3">🔍</p>
      <p className="text-sm font-bold text-foreground">Nenhum item encontrado</p>
    </div>
  );
}