import { buildUnitLabel } from "./insumoUnits";

/**
 * Format the main price display label for an InsumoProduct.
 * Examples:
 *   "R$ 20,00 / frasco de 50 mL"
 *   "R$ 120,00 / saco de 25 kg"
 *   "R$ 35,00 / caixa com 12 unidades"
 *   "R$ 3,90 / kg"
 */
export function formatInsumoPrice(product) {
  const { price, pkg_type, pkg_qty, pkg_unit, sale_type, unit } = product;
  if (!price) return "";

  const fmt = (n) => `R$ ${Number(n).toFixed(2).replace(".", ",")}`;

  // New system: pkg_type present
  if (pkg_type) {
    const label = buildUnitLabel(pkg_type, pkg_qty, pkg_unit);
    return `${fmt(price)} / ${label}`;
  }

  // Legacy: sale_type fallback
  if (sale_type) {
    const label = sale_type.replace("por ", "");
    return `${fmt(price)} / ${label}`;
  }

  // Older legacy: unit string
  if (unit) return `${fmt(price)} / ${unit}`;
  return fmt(price);
}

/**
 * If sold by weight/volume package, return equivalent unit price string.
 * Example: "≈ R$ 1,98/kg"
 */
export function formatEquivalentPrice(product) {
  const { price, pkg_type, pkg_qty, pkg_unit, sale_type } = product;
  if (!pkg_qty || !price) return null;

  // Only show equivalent for weight/volume units
  const weightVolume = { kg: 1, g: 0.001, tonelada: 1000, litro: 1, mL: 0.001, "ml": 0.001 };

  // When pkg_type is itself a weight/vol unit (legacy "por kg" etc.)
  if (pkg_type && weightVolume[pkg_type]) {
    return null; // price IS already per unit, no need for equivalent
  }

  // When there's a content measure that is weight/vol
  if (pkg_unit && weightVolume[pkg_unit] && pkg_qty) {
    const qty = parseFloat(pkg_qty);
    const mult = weightVolume[pkg_unit];
    const baseQty = qty * mult;
    if (baseQty <= 0) return null;

    // Normalize to base unit
    const isWeight = ["kg", "g", "tonelada"].includes(pkg_unit);
    const baseUnit = isWeight ? "kg" : "litro";
    const equiv = price / baseQty;
    return `≈ R$ ${equiv.toFixed(2).replace(".", ",")}/${baseUnit}`;
  }

  return null;
}

/**
 * Build the unit display label stored on the entity (for backward compat export).
 */
export { buildUnitLabel };