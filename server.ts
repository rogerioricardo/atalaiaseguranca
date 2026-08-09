import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import pg from "pg";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const { Pool } = pg;
const PORT = (process.env.PORT || 3000) as number;

// Resolve dirname since we are in ES module mode
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize PostgreSQL Connection Pool
const rdsConfig = {
  host: process.env.RDS_HOST || "localhost",
  port: parseInt(process.env.RDS_PORT || "5432", 10),
  database: process.env.RDS_DATABASE || "atalaia_atalaia",
  user: process.env.RDS_USER || "atalaia_atalaiacloud",
  password: process.env.RDS_PASSWORD,
  ssl: process.env.RDS_SSL === "true"
    ? { rejectUnauthorized: false }
    : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

let pool: pg.Pool | null = null;
let dbError: string | null = null;

function getPool(): pg.Pool {
  if (!pool) {
    if (!process.env.RDS_PASSWORD) {
      console.warn("⚠️ RDS_PASSWORD is not set. Database connections may fail if authentication is required.");
    }
    pool = new Pool(rdsConfig);
    pool.on("error", (err) => {
      console.error("❌ Unexpected error on idle RDS PostgreSQL client", err);
      dbError = err.message;
    });
  }
  return pool;
}

// Function to initialize the database schema on AWS RDS
async function initializeDatabase() {
  try {
    const client = getPool();
    console.log("🔄 Initializing AWS RDS Database Schema...");

    // 1. Create Neighborhoods Table
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

    // 2. Create Profiles Table (Multi-tenant ready, reference to neighborhood)
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

    // 3. Create Cameras Table
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

    // 4. Create Alerts Table
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

    // 5. Create Payments Table
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

    // Seed default neighborhoods if empty
    const countRes = await client.query("SELECT COUNT(*) FROM neighborhoods");
    if (parseInt(countRes.rows[0].count, 10) === 0) {
      console.log("🌱 Seeding default neighborhoods to RDS...");
      await client.query(`
        INSERT INTO neighborhoods (id, name, description, iframe_url, lat, lng) VALUES
        ('hood-demo-1', 'Atalaia Central', 'Bairro central sob monitoramento integrado Atalaia.', 'about:blank', -27.5969, -48.5495),
        ('hood-demo-2', 'Jardim Alvorada', 'Bairro monitorado com câmeras de alta definição e ronda ativa.', 'about:blank', -27.6012, -48.5410),
        ('hood-demo-3', 'Porto Seguro', 'Bairro litorâneo com monitoramento patrimonial ativo.', 'about:blank', -27.5850, -48.5600);
      `);
    }

    // Seed default profiles if empty
    const profilesRes = await client.query("SELECT COUNT(*) FROM profiles");
    if (parseInt(profilesRes.rows[0].count, 10) === 0) {
      console.log("🌱 Seeding default profiles to RDS...");
      await client.query(`
        INSERT INTO profiles (id, email, name, role, plan, approved, neighborhood_id, primary_neighborhood_id, secondary_neighborhood_id) VALUES
        ('demo-user-id', 'morador@atalaia.com', 'Mariana Costa', 'RESIDENT', 'PREMIUM', true, 'hood-demo-1', 'hood-demo-1', 'hood-demo-2'),
        ('demo-scr-id', 'scr@atalaia.com', 'Vigia Roberto', 'SCR', 'PREMIUM', true, 'hood-demo-1', 'hood-demo-1', NULL),
        ('demo-integrator-id', 'integrador@atalaia.com', 'Gestor Anderson', 'INTEGRATOR', 'PREMIUM', true, 'hood-demo-1', 'hood-demo-1', NULL);
      `);
    }

    console.log("✅ AWS RDS Database initialized successfully!");
    dbError = null;
  } catch (err: any) {
    console.error("❌ Failed to initialize RDS Database:", err);
    dbError = err.message || String(err);
  }
}

async function startServer() {
  const app = express();

  // Parse JSON payloads
  app.use(express.json({ limit: "15mb" }));

  // Run DB initialization
  await initializeDatabase();

  // --- API ROUTES ---

  // Health check endpoint
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
        tables: tablesRes.rows.map(t => t.table_name),
        error: dbError
      });
    } catch (err: any) {
      res.status(500).json({
        status: "error",
        database: "disconnected",
        rds_host: rdsConfig.host,
        message: err.message || String(err),
        error: dbError || err.stack
      });
    }
  });

  // Database schema setup trigger
  app.post("/api/setup-db", async (req, res) => {
    await initializeDatabase();
    if (dbError) {
      res.status(500).json({ status: "error", message: dbError });
    } else {
      res.json({ status: "success", message: "AWS RDS database initialized/migrated successfully" });
    }
  });

  // --- NEIGHBORHOODS API ---
  app.get("/api/neighborhoods", async (req, res) => {
    try {
      const client = getPool();
      const { rows } = await client.query("SELECT * FROM neighborhoods ORDER BY name ASC");
      res.json(rows);
    } catch (err: any) {
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
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/neighborhoods/:id", async (req, res) => {
    try {
      const client = getPool();
      const { id } = req.params;
      await client.query("DELETE FROM neighborhoods WHERE id = $1", [id]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- USERS / PROFILES API ---
  app.get("/api/users", async (req, res) => {
    try {
      const client = getPool();
      const { neighborhoodId } = req.query;
      let query = "SELECT * FROM profiles";
      const params: any[] = [];

      // Multi-tenant separation: filter by neighborhood if supplied
      if (neighborhoodId) {
        query += " WHERE neighborhood_id = $1 OR secondary_neighborhood_id = $1";
        params.push(neighborhoodId);
      }

      query += " ORDER BY name ASC";
      const { rows } = await client.query(query, params);
      res.json(rows);
    } catch (err: any) {
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
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- ALERTS API ---
  app.get("/api/alerts", async (req, res) => {
    try {
      const client = getPool();
      const { neighborhoodId } = req.query;
      let query = "SELECT * FROM alerts";
      const params: any[] = [];

      if (neighborhoodId) {
        query += " WHERE neighborhood_id = $1";
        params.push(neighborhoodId);
      }

      query += " ORDER BY created_at DESC LIMIT 50";
      const { rows } = await client.query(query, params);
      res.json(rows);
    } catch (err: any) {
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
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- CAMERAS API ---
  app.get("/api/cameras", async (req, res) => {
    try {
      const client = getPool();
      const { neighborhoodId } = req.query;
      let query = "SELECT * FROM cameras";
      const params: any[] = [];

      if (neighborhoodId) {
        query += " WHERE neighborhood_id = $1";
        params.push(neighborhoodId);
      }

      const { rows } = await client.query(query, params);
      res.json(rows);
    } catch (err: any) {
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
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- PAYMENTS API ---
  app.get("/api/payments", async (req, res) => {
    try {
      const client = getPool();
      const { rows } = await client.query(`
        SELECT p.*, pr.name as user_name, pr.plan as user_plan
        FROM payments p
        LEFT JOIN profiles pr ON p.user_id = pr.id
        ORDER BY p.due_date DESC
      `);
      // Map to shape frontend expects
      const enriched = rows.map(r => ({
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
    } catch (err: any) {
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
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/payments/:id/status", async (req, res) => {
    try {
      const client = getPool();
      const { id } = req.params;
      const { status, receipt_base64, receipt_name } = req.body;
      
      let query = "UPDATE payments SET status = $1";
      const params: any[] = [status];

      if (receipt_base64 !== undefined) {
        query += ", receipt_base64 = $2, receipt_name = $3";
        params.push(receipt_base64, receipt_name || null);
      }

      query += ` WHERE id = $${params.length + 1}`;
      params.push(id);

      await client.query(query, params);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- VITE MIDDLEWARE OR STATIC SERVING ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 SaaS ATALAIA Server running on http://localhost:${PORT}`);
  });
}

startServer();
