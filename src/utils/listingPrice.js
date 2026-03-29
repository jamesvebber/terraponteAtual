/**
 * Format the main price display for a Listing.
 * Examples:
 *   "R$ 60/kg"
 *   "R$ 4.500/cabeça"
 *   "R$ 120 por caixa de 12 unidades"
 *   "R$ 1.200.000 valor total"
 *   "R$ 2.000/mês"
 */
export function formatListingPrice(listing) {
  const { price, sale_format, pkg_qty, pkg_unit, unit } = listing;
  if (!price && price !== 0) return "";

  const fmt = (n) =>
    `R$ ${Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (sale_format) {
    const base = `${fmt(price)} ${sale_format}`;
    if (pkg_qty && pkg_unit) return `${base} de ${pkg_qty} ${pkg_unit}`;
    return base;
  }

  // Legacy fallback (old listings with only `unit`)
  if (unit) return `${fmt(price)}/${unit}`;
  return fmt(price);
}