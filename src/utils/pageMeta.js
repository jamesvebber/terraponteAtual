/**
 * Updates document <head> meta tags for social/OG previews.
 * Called client-side when public pages load their data.
 * Note: helps browser bookmarks / history; WhatsApp crawlers see the static index.html fallback.
 */
export function setPageMeta({ title, description, imageUrl, canonicalUrl }) {
  const FALLBACK_IMAGE = "https://terraponte.app/og-cover.png";
  const img = imageUrl || FALLBACK_IMAGE;

  document.title = title ? `${title} – TerraPonte` : "TerraPonte – Mercado Rural Digital";

  const set = (sel, attr, val) => {
    const el = document.querySelector(sel);
    if (el) el.setAttribute(attr, val);
  };

  set('meta[property="og:title"]', "content", document.title);
  set('meta[property="og:description"]', "content", description || "");
  set('meta[property="og:image"]', "content", img);
  set('meta[property="og:url"]', "content", canonicalUrl || "https://terraponte.app");
  set('meta[name="twitter:title"]', "content", document.title);
  set('meta[name="twitter:description"]', "content", description || "");
  set('meta[name="twitter:image"]', "content", img);
  set('link[rel="canonical"]', "href", canonicalUrl || "https://terraponte.app");

  // description tag
  const descEl = document.querySelector('meta[name="description"]');
  if (descEl) descEl.setAttribute("content", description || "");
}

/** Restore defaults when leaving a public page */
export function resetPageMeta() {
  setPageMeta({
    title: "TerraPonte – Mercado Rural Digital",
    description: "Compre direto de quem produz. Anúncios reais de gado, hortifruti, laticínios, máquinas e insumos rurais da sua região.",
    imageUrl: "https://terraponte.app/og-cover.png",
    canonicalUrl: "https://terraponte.app",
  });
}