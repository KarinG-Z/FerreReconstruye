const mysql = require('mysql2/promise');
const { loadEnvFile } = require('node:process');
const { join } = require('node:path');

try { loadEnvFile(join(__dirname, '..', '.env')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }

const { FERRE_DB_USER, FERRE_DB_PASSWORD } = process.env;
if (!FERRE_DB_USER || !FERRE_DB_PASSWORD) {
  throw new Error('Configura FERRE_DB_USER y FERRE_DB_PASSWORD en .env.');
}

module.exports = mysql.createPool({
  host: process.env.FERRE_DB_HOST || '127.0.0.1',
  port: Number(process.env.FERRE_DB_PORT || 33919),
  database: process.env.FERRE_DB_NAME || 'ferre_reconstruye_entregable2',
  user: FERRE_DB_USER,
  password: FERRE_DB_PASSWORD,
  connectionLimit: 5
});
