/**
 * Format the main price display label for an InsumoProduct.
 * Examples:
 *   "R$ 79,00 por saco de 40 kg"
 *   "R$ 3,90/kg"
 *   "R$ 12,00/unidade"
 */
export function formatInsumoPrice(product) {
  const { price, sale_type, pkg_type, pkg_qty, pkg_unit, unit } = product;
  if (!price) return "";

  const fmt = (n) => `R$ ${Number(n).toFixed(2).replace(".", ",")}`;

  if (sale_type === "por embalagem" && pkg_type && pkg_qty && pkg_unit) {
    return `${fmt(price)} por ${pkg_type} de ${pkg_qty} ${pkg_unit}`;
  }

  if (sale_type) {
    const label = sale_type.replace("por ", "");
    return `${fmt(price)}/${label}`;
  }

  // Legacy fallback
  if (unit) return `${fmt(price)}/${unit}`;
  return fmt(price);
}

/**
 * If sold by package, return equivalent unit price string.
 * Example: "Equivale a R$ 1,98/kg"
 */
export function formatEquivalentPrice(product) {
  const { price, sale_type, pkg_qty, pkg_unit } = product;
  if (sale_type !== "por embalagem" || !pkg_qty || !price) return null;

  const unitLabel = pkg_unit === "g" ? "kg" : pkg_unit === "ml" ? "litro" : pkg_unit;
  let divisor = pkg_qty;

  // Convert g → kg, ml → litro for equivalent
  if (pkg_unit === "g") divisor = pkg_qty / 1000;
  if (pkg_unit === "ml") divisor = pkg_qty / 1000;

  if (divisor <= 0) return null;
  const equiv = price / divisor;
  return `Equivale a R$ ${equiv.toFixed(2).replace(".", ",")}/${unitLabel}`;
}

/**
 * Build the unit display label stored on the entity.
 */
export function buildUnitLabel(sale_type, pkg_type, pkg_qty, pkg_unit) {
  if (sale_type === "por embalagem" && pkg_type && pkg_qty && pkg_unit) {
    return `${pkg_type} ${pkg_qty}${pkg_unit}`;
  }
  if (sale_type) return sale_type.replace("por ", "");
  return "";
}