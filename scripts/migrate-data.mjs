import { createClient } from '@base44/sdk';

const oldAppId = '69c716a35da7111840683290';
const newAppId = '69dfb3adbd6697c3cbfea68e';
const apiKey = '670df9dd423a45fbbf5d367c6ebd9514';

const oldClient = createClient({ appId: oldAppId, headers: { api_key: apiKey } });
const newClient = createClient({ appId: newAppId, headers: { api_key: apiKey } });

const entities = [
  'AgriculturalInput',
  'EmailCampaign',
  'EmailLog', 
  'EmailPreference',
  'InsumoProduct',
  'Listing',
  'MarketPrice',
  'ProductListing',
  'Report',
  'SellerProfile',
  'StoreAnnouncement',
  'StoreReport',
  'StoreVerificationRequest',
  'SupplierProfile'
];

console.log('Iniciando migração...\n');

for (const entity of entities) {
  try {
    console.log(`\nMigraando ${entity}...`);
    const oldRecords = await oldClient.list(entity);
    
    if (!oldRecords || oldRecords.length === 0) {
      console.log(`  - Nenhum registro encontrado`);
      continue;
    }
    
    console.log(`  - ${oldRecords.length} registros encontrados`);
    
    let migrated = 0;
    for (const record of oldRecords) {
      const { _id, ...data } = record;
      try {
        await newClient.create(entity, data);
        migrated++;
      } catch (err) {
        console.log(`  Erro ao migrar registro: ${err.message}`);
      }
    }
    
    console.log(`  - ${migrated} registros migrados`);
  } catch (err) {
    console.log(`  Erro ao buscar ${entity}: ${err.message}`);
  }
}

console.log('\nMigração concluída!');