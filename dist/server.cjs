"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_url = require("url");
var import_vite = require("vite");
var import_pg = __toESM(require("pg"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_meta = {};
import_dotenv.default.config();
var { Pool } = import_pg.default;
var PORT = process.env.PORT || 3e3;
var __filename = (0, import_url.fileURLToPath)(import_meta.url);
var __dirname = import_path.default.dirname(__filename);
var rdsConfig = {
  host: process.env.RDS_HOST || "localhost",
  port: parseInt(process.env.RDS_PORT || "5432", 10),
  database: process.env.RDS_DATABASE || "atalaia_atalaia",
  user: process.env.RDS_USER || "atalaia_atalaiacloud",
  password: process.env.RDS_PASSWORD,
  ssl: process.env.RDS_SSL === "true" ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 3e4,
  connectionTimeoutMillis: 5e3
};
var pool = null;
var dbError = null;
function getPool() {
  if (!pool) {
    if (!process.env.RDS_PASSWORD) {
      console.warn("\u26A0\uFE0F RDS_PASSWORD is not set. Database connections may fail if authentication is required.");
    }
    pool = new Pool(rdsConfig);
    pool.on("error", (err) => {
      console.error("\u274C Unexpected error on idle RDS PostgreSQL client", err);
      dbError = err.message;
    });
  }
  return pool;
}
async function initializeDatabase() {
  try {
    const client = getPool();
    console.log("\u{1F504} Initializing AWS RDS Database Schema...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS neighborhoods (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        iframe_url TEXT,
        lat DOUBLE PRECISION,
        lng DOUBLE PRECISION
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS profiles (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE,
        name VARCHAR(255),
        role VARCHAR(50),
        plan VARCHAR(50),
        approved BOOLEAN DEFAULT FALSE,
        neighborhood_id VARCHAR(255),
        primary_neighborhood_id VARCHAR(255),
        secondary_neighborhood_id VARCHAR(255)
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS cameras (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        url TEXT,
        status VARCHAR(50),
        ip VARCHAR(50),
        coordinates VARCHAR(100),
        neighborhood_id VARCHAR(255) REFERENCES neighborhoods(id) ON DELETE SET NULL
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        type VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(255),
        neighborhood_id VARCHAR(255) REFERENCES neighborhoods(id) ON DELETE SET NULL
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES profiles(id) ON DELETE CASCADE,
        amount NUMERIC(10, 2),
        due_date VARCHAR(50),
        status VARCHAR(50),
        reference_month VARCHAR(50),
        receipt_base64 TEXT,
        receipt_name VARCHAR(255),
        neighborhood_id VARCHAR(255) REFERENCES neighborhoods(id) ON DELETE SET NULL
      );
    `);
    const countRes = await client.query("SELECT COUNT(*) FROM neighborhoods");
    if (parseInt(countRes.rows[0].count, 10) === 0) {
      console.log("\u{1F331} Seeding default neighborhoods to RDS...");
      await client.query(`
        INSERT INTO neighborhoods (id, name, description, iframe_url, lat, lng) VALUES
        ('hood-demo-1', 'Atalaia Central', 'Bairro central sob monitoramento integrado Atalaia.', 'about:blank', -27.5969, -48.5495),
        ('hood-demo-2', 'Jardim Alvorada', 'Bairro monitorado com c\xE2meras de alta defini\xE7\xE3o e ronda ativa.', 'about:blank', -27.6012, -48.5410),
        ('hood-demo-3', 'Porto Seguro', 'Bairro litor\xE2neo com monitoramento patrimonial ativo.', 'about:blank', -27.5850, -48.5600);
      `);
    }
    const profilesRes = await client.query("SELECT COUNT(*) FROM profiles");
    if (parseInt(profilesRes.rows[0].count, 10) === 0) {
      console.log("\u{1F331} Seeding default profiles to RDS...");
      await client.query(`
        INSERT INTO profiles (id, email, name, role, plan, approved, neighborhood_id, primary_neighborhood_id, secondary_neighborhood_id) VALUES
        ('demo-user-id', 'morador@atalaia.com', 'Mariana Costa', 'RESIDENT', 'PREMIUM', true, 'hood-demo-1', 'hood-demo-1', 'hood-demo-2'),
        ('demo-scr-id', 'scr@atalaia.com', 'Vigia Roberto', 'SCR', 'PREMIUM', true, 'hood-demo-1', 'hood-demo-1', NULL),
        ('demo-integrator-id', 'integrador@atalaia.com', 'Gestor Anderson', 'INTEGRATOR', 'PREMIUM', true, 'hood-demo-1', 'hood-demo-1', NULL);
      `);
    }
    console.log("\u2705 AWS RDS Database initialized successfully!");
    dbError = null;
  } catch (err) {
    console.error("\u274C Failed to initialize RDS Database:", err);
    dbError = err.message || String(err);
  }
}
async function startServer() {
  const app = (0, import_express.default)();
  app.use(import_express.default.json({ limit: "15mb" }));
  await initializeDatabase();
  app.get("/api/health", async (req, res) => {
    try {
      const client = getPool();
      const dbRes = await client.query("SELECT NOW()");
      const tablesRes = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      res.json({
        status: "ok",
        database: "connected",
        timestamp: dbRes.rows[0].now,
        rds_host: rdsConfig.host,
        tables: tablesRes.rows.map((t) => t.table_name),
        error: dbError
      });
    } catch (err) {
      res.status(500).json({
        status: "error",
        database: "disconnected",
        rds_host: rdsConfig.host,
        message: err.message || String(err),
        error: dbError || err.stack
      });
    }
  });
  app.post("/api/setup-db", async (req, res) => {
    await initializeDatabase();
    if (dbError) {
      res.status(500).json({ status: "error", message: dbError });
    } else {
      res.json({ status: "success", message: "AWS RDS database initialized/migrated successfully" });
    }
  });
  app.get("/api/neighborhoods", async (req, res) => {
    try {
      const client = getPool();
      const { rows } = await client.query("SELECT * FROM neighborhoods ORDER BY name ASC");
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/neighborhoods", async (req, res) => {
    try {
      const client = getPool();
      const { id, name, description, iframe_url, lat, lng } = req.body;
      const safeId = id || `hood-${Date.now()}`;
      await client.query(
        `INSERT INTO neighborhoods (id, name, description, iframe_url, lat, lng)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET name = $2, description = $3, iframe_url = $4, lat = $5, lng = $6`,
        [safeId, name, description || "", iframe_url || "", lat || -27.5969, lng || -48.5495]
      );
      res.json({ success: true, id: safeId });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.delete("/api/neighborhoods/:id", async (req, res) => {
    try {
      const client = getPool();
      const { id } = req.params;
      await client.query("DELETE FROM neighborhoods WHERE id = $1", [id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/users", async (req, res) => {
    try {
      const client = getPool();
      const { neighborhoodId } = req.query;
      let query = "SELECT * FROM profiles";
      const params = [];
      if (neighborhoodId) {
        query += " WHERE neighborhood_id = $1 OR secondary_neighborhood_id = $1";
        params.push(neighborhoodId);
      }
      query += " ORDER BY name ASC";
      const { rows } = await client.query(query, params);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/users/upsert", async (req, res) => {
    try {
      const client = getPool();
      const { id, email, name, role, plan, approved, neighborhoodId, primaryNeighborhoodId, secondaryNeighborhoodId } = req.body;
      await client.query(
        `INSERT INTO profiles (id, email, name, role, plan, approved, neighborhood_id, primary_neighborhood_id, secondary_neighborhood_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET 
           email = EXCLUDED.email, 
           name = EXCLUDED.name, 
           role = EXCLUDED.role, 
           plan = EXCLUDED.plan, 
           approved = EXCLUDED.approved, 
           neighborhood_id = EXCLUDED.neighborhood_id, 
           primary_neighborhood_id = EXCLUDED.primary_neighborhood_id, 
           secondary_neighborhood_id = EXCLUDED.secondary_neighborhood_id`,
        [
          id,
          email,
          name,
          role || "RESIDENT",
          plan || "FREE",
          approved ?? false,
          neighborhoodId || null,
          primaryNeighborhoodId || neighborhoodId || null,
          secondaryNeighborhoodId || null
        ]
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/alerts", async (req, res) => {
    try {
      const client = getPool();
      const { neighborhoodId } = req.query;
      let query = "SELECT * FROM alerts";
      const params = [];
      if (neighborhoodId) {
        query += " WHERE neighborhood_id = $1";
        params.push(neighborhoodId);
      }
      query += " ORDER BY created_at DESC LIMIT 50";
      const { rows } = await client.query(query, params);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/alerts", async (req, res) => {
    try {
      const client = getPool();
      const { id, title, message, type, neighborhood_id, created_by } = req.body;
      const safeId = id || `alert-${Date.now()}`;
      await client.query(
        `INSERT INTO alerts (id, title, message, type, neighborhood_id, created_by, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [safeId, title, message || "", type || "INFO", neighborhood_id, created_by || "system"]
      );
      res.json({ success: true, id: safeId });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/cameras", async (req, res) => {
    try {
      const client = getPool();
      const { neighborhoodId } = req.query;
      let query = "SELECT * FROM cameras";
      const params = [];
      if (neighborhoodId) {
        query += " WHERE neighborhood_id = $1";
        params.push(neighborhoodId);
      }
      const { rows } = await client.query(query, params);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/cameras", async (req, res) => {
    try {
      const client = getPool();
      const { id, name, url, status, ip, coordinates, neighborhood_id } = req.body;
      const safeId = id || `cam-${Date.now()}`;
      await client.query(
        `INSERT INTO cameras (id, name, url, status, ip, coordinates, neighborhood_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET name = $2, url = $3, status = $4, ip = $5, coordinates = $6, neighborhood_id = $7`,
        [safeId, name, url || "", status || "ACTIVE", ip || "", coordinates || "", neighborhood_id]
      );
      res.json({ success: true, id: safeId });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/payments", async (req, res) => {
    try {
      const client = getPool();
      const { rows } = await client.query(`
        SELECT p.*, pr.name as user_name, pr.plan as user_plan
        FROM payments p
        LEFT JOIN profiles pr ON p.user_id = pr.id
        ORDER BY p.due_date DESC
      `);
      const enriched = rows.map((r) => ({
        id: r.id,
        user_id: r.user_id,
        amount: parseFloat(r.amount),
        due_date: r.due_date,
        status: r.status,
        reference_month: r.reference_month,
        receipt_base64: r.receipt_base64,
        receipt_name: r.receipt_name,
        profiles: {
          name: r.user_name || "Morador",
          plan: r.user_plan || "PREMIUM",
          neighborhood_id: r.neighborhood_id
        }
      }));
      res.json(enriched);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/payments", async (req, res) => {
    try {
      const client = getPool();
      const { id, user_id, amount, due_date, status, reference_month, neighborhood_id, receipt_base64, receipt_name } = req.body;
      const safeId = id || `pay-${Date.now()}`;
      await client.query(
        `INSERT INTO payments (id, user_id, amount, due_date, status, reference_month, neighborhood_id, receipt_base64, receipt_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET 
           user_id = EXCLUDED.user_id, 
           amount = EXCLUDED.amount, 
           due_date = EXCLUDED.due_date, 
           status = EXCLUDED.status, 
           reference_month = EXCLUDED.reference_month, 
           neighborhood_id = EXCLUDED.neighborhood_id,
           receipt_base64 = EXCLUDED.receipt_base64,
           receipt_name = EXCLUDED.receipt_name`,
        [safeId, user_id, amount, due_date, status || "PENDING", reference_month, neighborhood_id || null, receipt_base64 || null, receipt_name || null]
      );
      res.json({ success: true, id: safeId });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.put("/api/payments/:id/status", async (req, res) => {
    try {
      const client = getPool();
      const { id } = req.params;
      const { status, receipt_base64, receipt_name } = req.body;
      let query = "UPDATE payments SET status = $1";
      const params = [status];
      if (receipt_base64 !== void 0) {
        query += ", receipt_base64 = $2, receipt_name = $3";
        params.push(receipt_base64, receipt_name || null);
      }
      query += ` WHERE id = $${params.length + 1}`;
      params.push(id);
      await client.query(query, params);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\u{1F680} SaaS ATALAIA Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
