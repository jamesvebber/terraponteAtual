export const LISTING_CATEGORIES = [
  { value: "Alimentos da roça", emoji: "🍯" },
  { value: "Laticínios", emoji: "🧀" },
  { value: "Hortifruti", emoji: "🥬" },
  { value: "Carnes e aves", emoji: "🍗" },
  { value: "Gado e animais", emoji: "🐂" },
  { value: "Máquinas e ferramentas", emoji: "🚜" },
  { value: "Serviços rurais", emoji: "🔧" },
  { value: "Propriedades rurais", emoji: "🏡" },
  { value: "Artesanato rural", emoji: "🪵" },
  { value: "Outros", emoji: "📦" },
];

export const SALE_FORMATS_BY_CATEGORY = {
  "Alimentos da roça": [
    { value: "por unidade", label: "Por unidade" },
    { value: "por kg", label: "Por kg" },
    { value: "por caixa", label: "Por caixa" },
    { value: "por saco", label: "Por saco" },
    { value: "por dúzia", label: "Por dúzia" },
    { value: "por maço", label: "Por maço" },
  ],
  "Laticínios": [
    { value: "por kg", label: "Por kg" },
    { value: "por litro", label: "Por litro" },
    { value: "por unidade", label: "Por unidade" },
    { value: "por peça", label: "Por peça" },
  ],
  "Hortifruti": [
    { value: "por kg", label: "Por kg" },
    { value: "por caixa", label: "Por caixa" },
    { value: "por saco", label: "Por saco" },
    { value: "por maço", label: "Por maço" },
    { value: "por unidade", label: "Por unidade" },
  ],
  "Carnes e aves": [
    { value: "por kg", label: "Por kg" },
    { value: "por unidade", label: "Por unidade" },
    { value: "por peça", label: "Por peça" },
  ],
  "Gado e animais": [
    { value: "por cabeça", label: "Por cabeça" },
    { value: "por arroba", label: "Por arroba (@)" },
    { value: "por lote", label: "Por lote" },
  ],
  "Máquinas e ferramentas": [
    { value: "por unidade", label: "Por unidade" },
    { value: "por diária", label: "Por diária" },
    { value: "por hora", label: "Por hora" },
  ],
  "Serviços rurais": [
    { value: "por hora", label: "Por hora" },
    { value: "por diária", label: "Por diária" },
    { value: "por mês", label: "Por mês" },
    { value: "preço fechado", label: "Preço fechado" },
  ],
  "Propriedades rurais": [
    { value: "valor total", label: "Valor total" },
    { value: "por hectare", label: "Por hectare" },
    { value: "por alqueire", label: "Por alqueire" },
    { value: "por mês", label: "Por mês (arrendamento)" },
    { value: "por ano", label: "Por ano (arrendamento)" },
  ],
  "Artesanato rural": [
    { value: "por unidade", label: "Por unidade" },
    { value: "por kit", label: "Por kit" },
    { value: "por peça", label: "Por peça" },
  ],
  "Outros": [
    { value: "por unidade", label: "Por unidade" },
    { value: "por kg", label: "Por kg" },
    { value: "por litro", label: "Por litro" },
    { value: "por hora", label: "Por hora" },
    { value: "por mês", label: "Por mês" },
    { value: "preço fechado", label: "Preço fechado" },
  ],
};

// Sale formats that support optional package details (qty + unit)
export const FORMATS_WITH_PKG_DETAILS = [
  "por caixa", "por saco", "por peça", "por kit", "por lote",
];