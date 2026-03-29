/**
 * /p/:slug — resolves a slug like "queijo-corrego-do-ouro" back to the real listing
 * by searching title+city fields. Falls back to /marketplace if not found.
 */
import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";

export default function SlugRedirect() {
  const { slug } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    async function resolve() {
      // Try listings first
      const listings = await base44.entities.Listing.list("-created_date", 200);
      const listing = listings.find((l) => toSlug(l.title, l.city) === slug);
      if (listing) { navigate(`/marketplace/${listing.id}`, { replace: true }); return; }

      // Try insumos
      const insumos = await base44.entities.InsumoProduct.list("-created_date", 200);
      const insumo = insumos.find((p) => toSlug(p.product_name, p.city) === slug);
      if (insumo) { navigate(`/insumos/${insumo.id}`, { replace: true }); return; }

      navigate("/marketplace", { replace: true });
    }
    resolve();
  }, [slug, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export function toSlug(name = "", city = "") {
  return `${name}-${city}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}