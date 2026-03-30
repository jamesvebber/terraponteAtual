/**
 * Smart unit system for InsumoProduct.
 * Maps categories to suggested units, and units to optional content measures.
 */

export const ALL_UNITS = [
  "unidade", "par", "kit", "peça",
  "saco", "pacote", "caixa", "balde",
  "kg", "g", "tonelada",
  "litro", "mL", "galão",
  "frasco", "ampola", "bisnaga", "dose",
  "comprimido", "cartela", "envelope",
  "rolo", "metro",
];

// Suggested units per category (first 5-6 shown as chips, rest in "outros")
export const UNIT_SUGGESTIONS = {
  "Ração":                      ["saco", "kg", "tonelada", "pacote", "g"],
  "Sal mineral":                 ["saco", "kg", "tonelada", "pacote", "g"],
  "Suplementos":                 ["saco", "kg", "litro", "pacote", "g", "frasco"],
  "Adubo":                       ["saco", "kg", "litro", "mL", "galão", "balde", "tonelada"],
  "Herbicidas":                  ["litro", "mL", "galão", "frasco", "kg"],
  "Inseticidas":                 ["litro", "mL", "frasco", "galão", "kg"],
  "Defensivos":                  ["litro", "mL", "galão", "frasco", "kg"],
  "Sementes":                    ["saco", "kg", "pacote", "g", "caixa", "unidade"],
  "Medicamentos veterinários":   ["frasco", "mL", "ampola", "bisnaga", "dose", "comprimido", "cartela", "caixa"],
  "Ferramentas":                 ["unidade", "kit", "par", "peça", "caixa", "pacote"],
  "Selaria":                     ["unidade", "par", "kit", "peça"],
  "Pet shop":                    ["unidade", "pacote", "frasco", "caixa", "kg"],
  "Equipamentos":                ["unidade", "kit", "peça"],
  "Peças":                       ["unidade", "peça", "kit", "par"],
  "Vestuário rural":              ["unidade", "par", "kit"],
  "Calçados":                    ["par", "unidade"],
  "Outros":                      ["unidade", "kg", "caixa", "pacote", "litro"],
};

// Optional content measures per unit type
export const UNIT_CONTENT_MEASURES = {
  "frasco":    ["mL", "litro", "g"],
  "ampola":    ["mL", "g"],
  "bisnaga":   ["g", "mL"],
  "caixa":     ["unidades", "comprimidos", "ampolas", "g", "kg", "mL"],
  "cartela":   ["comprimidos", "unidades"],
  "saco":      ["kg", "g", "tonelada"],
  "pacote":    ["kg", "g", "unidades"],
  "kit":       ["peças", "unidades"],
  "envelope":  ["g", "mL", "unidades"],
  "balde":     ["kg", "litro"],
  "galão":     ["litro", "mL"],
  "rolo":      ["metro", "m"],
  "dose":      ["mL", "g"],
};

// Count-type measures use "com" preposition; volume/weight use "de"
const COUNT_MEASURES = new Set(["unidades", "comprimidos", "peças", "cartelas", "ampolas", "doses", "envelopes", "bisnagas"]);

/**
 * Build human-readable label: "frasco de 50 mL", "saco de 25 kg", "cartela com 10 comprimidos", "par"
 */
export function buildUnitLabel(pkg_type, pkg_qty, pkg_unit) {
  if (!pkg_type) return "unidade";
  if (!pkg_qty || !pkg_unit) return pkg_type;
  const prep = COUNT_MEASURES.has(pkg_unit) ? "com" : "de";
  return `${pkg_type} ${prep} ${pkg_qty} ${pkg_unit}`;
}

/**
 * Derive sale_type from unit for backward compatibility
 */
export function deriveSaleType(pkg_type) {
  if (!pkg_type) return "por unidade";
  if (["kg", "g", "tonelada"].includes(pkg_type)) return "por kg";
  if (["litro", "mL"].includes(pkg_type)) return "por litro";
  if (pkg_type === "unidade") return "por unidade";
  if (pkg_type === "caixa") return "por caixa";
  return "por embalagem";
}

/**
 * Whether a unit type implies a content detail field
 */
export function hasContentDetail(pkg_type) {
  return !!UNIT_CONTENT_MEASURES[pkg_type];
}

/**
 * Get example hint for a unit + measure combo
 */
export function getUnitExample(pkg_type, pkg_unit) {
  if (!pkg_type) return "";
  const examples = {
    "frasco": "Ex: frasco de 50 mL",
    "saco": "Ex: saco de 25 kg",
    "caixa": "Ex: caixa com 12 unidades",
    "cartela": "Ex: cartela com 10 comprimidos",
    "bisnaga": "Ex: bisnaga de 30 g",
    "ampola": "Ex: ampola de 10 mL",
    "kit": "Ex: kit com 5 peças",
    "pacote": "Ex: pacote de 500 g",
    "rolo": "Ex: rolo de 50 metro",
    "balde": "Ex: balde de 10 kg",
    "galão": "Ex: galão de 20 litro",
    "envelope": "Ex: envelope de 100 g",
  };
  return examples[pkg_type] || "";
}