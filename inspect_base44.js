import { base44 } from './src/api/base44Client.js';
console.log('Base44 Integrations:', Object.keys(base44.integrations || {}));
console.log('Base44 Entities:', Object.keys(base44.entities || {}));
