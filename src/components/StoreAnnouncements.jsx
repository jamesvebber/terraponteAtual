import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Pencil, Trash2, Camera, X, Loader2, Megaphone } from "lucide-react";
import { toast } from "sonner";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose,
} from "@/components/ui/drawer";

const CATEGORIES = ["Promoção", "Novo produto", "Compra de safra", "Evento", "Assistência técnica", "Horário", "Entrega", "Outro"];

const CATEGORY_EMOJI = {
  "Promoção": "🏷️", "Novo produto": "🆕", "Compra de safra": "🌾", "Evento": "📅",
  "Assistência técnica": "🔧", "Horário": "🕐", "Entrega": "🚚", "Outro": "📢",
};

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "hoje";
  if (days === 1) return "ontem";
  if (days < 7) return `há ${days} dias`;
  if (days < 30) return `há ${Math.floor(days / 7)} sem.`;
  return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

// ── Public feed (read-only) ──────────────────────────────────────────
export function AnnouncementsFeed({ storeId }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.StoreAnnouncement
      .filter({ store_id: storeId, active: true }, "-created_date", 20)
      .then(data => { setPosts(data); setLoading(false); });
  }, [storeId]);

  if (loading) return (
    <div className="space-y-3">
      {[1,2].map(i => <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />)}
    </div>
  );

  if (posts.length === 0) return null;

  return (
    <div className="mt-5">
      <div className="flex items-center gap-2 mb-3">
        <Megaphone className="h-4 w-4 text-primary" />
        <h2 className="text-base font-extrabold text-foreground">Novidades da loja</h2>
      </div>
      <div className="space-y-3">
        {posts.map(post => (
          <div key={post.id} className="bg-card border border-border rounded-2xl overflow-hidden">
            {post.image_url && (
              <img src={post.image_url} alt={post.title} className="w-full h-40 object-cover" />
            )}
            <div className="p-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {CATEGORY_EMOJI[post.category] || "📢"} {post.category || "Aviso"}
                </span>
                <span className="text-[11px] text-muted-foreground font-medium">{timeAgo(post.created_date)}</span>
              </div>
              <h3 className="font-bold text-foreground text-sm leading-snug mb-1">{post.title}</h3>
              {post.body && <p className="text-sm text-muted-foreground leading-relaxed">{post.body}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Owner management ─────────────────────────────────────────────────
export function AnnouncementsManager({ storeProfile }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [form, setForm] = useState({ title: "", body: "", category: "Outro" });

  const load = () => {
    base44.entities.StoreAnnouncement
      .filter({ store_id: storeProfile.id }, "-created_date", 30)
      .then(data => { setPosts(data); setLoading(false); });
  };

  useEffect(() => { load(); }, [storeProfile.id]);

  const openNew = () => {
    setEditing(null);
    setForm({ title: "", body: "", category: "Outro" });
    setImageFile(null);
    setImagePreview(null);
    setDrawerOpen(true);
  };

  const openEdit = (post) => {
    setEditing(post);
    setForm({ title: post.title, body: post.body || "", category: post.category || "Outro" });
    setImageFile(null);
    setImagePreview(post.image_url || null);
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Informe um título."); return; }
    setSaving(true);
    let image_url = editing?.image_url || null;
    if (imageFile) {
      const res = await base44.integrations.Core.UploadFile({ file: imageFile });
      image_url = res.file_url;
    }
    if (imagePreview === null) image_url = null;

    const data = { ...form, image_url, store_id: storeProfile.id, store_name: storeProfile.store_name, active: true };
    if (editing) {
      await base44.entities.StoreAnnouncement.update(editing.id, data);
      toast.success("Aviso atualizado!");
    } else {
      await base44.entities.StoreAnnouncement.create(data);
      toast.success("Aviso publicado!");
    }
    setSaving(false);
    setDrawerOpen(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remover este aviso?")) return;
    setPosts(ps => ps.filter(p => p.id !== id));
    await base44.entities.StoreAnnouncement.delete(id);
    toast.success("Aviso removido.");
  };

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      <Button className="w-full h-12 rounded-xl font-bold gap-2 mb-4" onClick={openNew}>
        <PlusCircle className="h-5 w-5" /> Novo aviso
      </Button>

      {posts.length === 0 ? (
        <div className="text-center py-12 px-4">
          <Megaphone className="h-14 w-14 text-muted-foreground/25 mx-auto mb-4" />
          <p className="text-base font-bold text-foreground mb-1">Nenhum aviso ainda</p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Publique promoções, novidades e informações para seus clientes.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <div key={post.id} className={`bg-card border border-border rounded-2xl overflow-hidden ${!post.active ? "opacity-60" : ""}`}>
              {post.image_url && (
                <img src={post.image_url} alt={post.title} className="w-full h-32 object-cover" />
              )}
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {CATEGORY_EMOJI[post.category] || "📢"} {post.category || "Aviso"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{timeAgo(post.created_date)}</span>
                    </div>
                    <p className="font-bold text-sm text-foreground leading-snug">{post.title}</p>
                    {post.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{post.body}</p>}
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => openEdit(post)} className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                      <Pencil className="h-3.5 w-3.5 text-foreground" />
                    </button>
                    <button onClick={() => handleDelete(post.id)} className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center">
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{editing ? "Editar aviso" : "Novo aviso"}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 space-y-4 pb-2 overflow-y-auto max-h-[60vh]">
            {/* Category */}
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Tipo</p>
              <div className="grid grid-cols-4 gap-1.5">
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => setForm(f => ({ ...f, category: cat }))}
                    className={`py-2 px-1 rounded-xl text-[11px] font-bold border transition-colors select-none text-center leading-tight ${
                      form.category === cat ? "bg-primary text-primary-foreground border-primary" : "bg-muted border-transparent text-muted-foreground"
                    }`}>
                    {CATEGORY_EMOJI[cat]}<br />{cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Título *</p>
              <Input className="h-11 rounded-xl" placeholder="Ex: Promoção de ração bovina" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>

            {/* Body */}
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Descrição</p>
              <Textarea className="rounded-xl text-sm min-h-[80px]" placeholder="Detalhes do aviso..." value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />
            </div>

            {/* Image */}
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Foto (opcional)</p>
              {imagePreview ? (
                <div className="relative rounded-2xl overflow-hidden h-36">
                  <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                  <button onClick={() => { setImageFile(null); setImagePreview(null); }}
                    className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/50 flex items-center justify-center">
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-3 h-14 px-4 rounded-xl border-2 border-dashed border-border bg-muted/40 cursor-pointer">
                  <Camera className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground font-medium">Adicionar foto</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); }
                  }} />
                </label>
              )}
            </div>
          </div>
          <DrawerFooter>
            <Button className="w-full rounded-xl" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? "Salvar alterações" : "Publicar aviso"}
            </Button>
            <DrawerClose asChild>
              <Button variant="ghost" className="w-full rounded-xl text-muted-foreground">Cancelar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}