// connectors/db.js
const knex = require('knex');
require('dotenv').config();

const db = knex({
  client: process.env.DB_CLIENT,        // "pg"
  connection: {
    host: process.env.DB_HOST,          // "localhost"
    port: process.env.DB_PORT,          // 5432
    user: process.env.DB_USER,          // "postgres"
    password: process.env.DB_PASSWORD,  // "8112"
    database: process.env.DB_DATABASE   // "foodtruckdb" or "postgres"
  }
});

module.exports = db;
