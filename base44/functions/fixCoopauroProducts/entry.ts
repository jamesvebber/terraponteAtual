import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Mapeamento exato dos 32 produtos da Coopaouro
const CORRECTIONS = [
  { name: "Coador de leite", category: "Outros", unit: "unidade" },
  { name: "Bucha Limpeza", category: "Outros", unit: "unidade" },
  { name: "Country Boots", category: "Outros", unit: "par" },
  { name: "Botinas Mateiras", category: "Outros", unit: "par" },
  { name: "Colosso", category: "Medicamentos veterinários", unit: "frasco" },
  { name: "Turbo Calcio", category: "Medicamentos veterinários", unit: "frasco" },
  { name: "Bovitam", category: "Medicamentos veterinários", unit: "frasco" },
  { name: "Bobinam Pó", category: "Medicamentos veterinários", unit: "pacote" },
  { name: "Dectomax", category: "Medicamentos veterinários", unit: "frasco" },
  { name: "Fluatac Duo", category: "Medicamentos veterinários", unit: "frasco" },
  { name: "Cydectin", category: "Medicamentos veterinários", unit: "frasco" },
  { name: "Cidental", category: "Medicamentos veterinários", unit: "frasco" },
  { name: "Acura Max", category: "Medicamentos veterinários", unit: "frasco" },
  { name: "Acura", category: "Medicamentos veterinários", unit: "frasco" },
  { name: "Ferrodex", category: "Medicamentos veterinários", unit: "frasco" },
  { name: "Tylan 200", category: "Medicamentos veterinários", unit: "frasco" },
  { name: "Roflin", category: "Medicamentos veterinários", unit: "frasco" },
  { name: "Partomicina", category: "Medicamentos veterinários", unit: "frasco" },
  { name: "Terramicina +", category: "Medicamentos veterinários", unit: "frasco" },
  { name: "Cursotril", category: "Medicamentos veterinários", unit: "frasco" },
  { name: "Finador", category: "Medicamentos veterinários", unit: "frasco" },
  { name: "Mono vim B12", category: "Medicamentos veterinários", unit: "frasco" },
  { name: "Vitagold Potenciado", category: "Medicamentos veterinários", unit: "frasco" },
  { name: "Cef 50", category: "Medicamentos veterinários", unit: "frasco" },
  { name: "Ocitocina Forte UCB", category: "Medicamentos veterinários", unit: "frasco" },
  { name: "Rodimax Raticida", category: "Medicamentos veterinários", unit: "pacote" },
  { name: "Terramicina Pó Solúvel Antigerm 77", category: "Medicamentos veterinários", unit: "pacote" },
  { name: "Neocidol B40", category: "Medicamentos veterinários", unit: "frasco" },
  { name: "Frigoboi", category: "Medicamentos veterinários", unit: "frasco" },
  { name: "Antitóxico SM", category: "Medicamentos veterinários", unit: "frasco" },
  { name: "Áerocid Total - Spray", category: "Medicamentos veterinários", unit: "unidade" },
  { name: "Tanicid", category: "Medicamentos veterinários", unit: "frasco" },
];

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { dryRun = true } = await req.json().catch(() => ({}));

  // Fetch ALL products from Coopaouro only
  const allProducts = await base44.asServiceRole.entities.InsumoProduct.filter({ supplier_name: "Coopaouro" });

  const results = [];
  const notFound = [];
  const correctionMap = Object.fromEntries(CORRECTIONS.map(c => [c.name.toLowerCase().trim(), c]));

  for (const product of allProducts) {
    const key = (product.product_name || "").toLowerCase().trim();
    const correction = correctionMap[key];

    if (!correction) {
      // Not in our list — skip completely
      continue;
    }

    const needsCategoryFix = product.category !== correction.category;
    const needsUnitFix = product.pkg_type !== correction.unit || product.unit !== correction.unit;

    if (!needsCategoryFix && !needsUnitFix) {
      results.push({ id: product.id, name: product.product_name, status: "already_correct", category: product.category, unit: product.pkg_type });
      continue;
    }

    const updatePayload = {};
    if (needsCategoryFix) updatePayload.category = correction.category;
    if (needsUnitFix) {
      updatePayload.pkg_type = correction.unit;
      updatePayload.unit = correction.unit;
    }

    if (!dryRun) {
      await base44.asServiceRole.entities.InsumoProduct.update(product.id, updatePayload);
    }

    results.push({
      id: product.id,
      name: product.product_name,
      status: dryRun ? "would_update" : "updated",
      changes: updatePayload,
      before: {
        category: product.category,
        pkg_type: product.pkg_type,
        unit: product.unit,
      },
    });
  }

  // Check which names from the list were not found
  const foundNames = new Set(results.map(r => r.name?.toLowerCase().trim()));
  for (const c of CORRECTIONS) {
    if (!foundNames.has(c.name.toLowerCase().trim())) {
      notFound.push(c.name);
    }
  }

  return Response.json({
    dryRun,
    supplier: "Coopaouro",
    totalProductsInStore: allProducts.length,
    matchedFromList: results.length,
    updated: results.filter(r => r.status === "updated").length,
    wouldUpdate: results.filter(r => r.status === "would_update").length,
    alreadyCorrect: results.filter(r => r.status === "already_correct").length,
    notFoundInStore: notFound,
    results,
  });
});