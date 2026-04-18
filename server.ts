import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.join(__dirname, "database.json");

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes for local file database ---

  // Initialize DB file
  async function initDB() {
    try {
      await fs.access(DB_FILE);
    } catch {
      await fs.writeFile(DB_FILE, JSON.stringify([]));
    }
  }
  await initDB();

  app.get("/api/records", async (req, res) => {
    try {
      const data = await fs.readFile(DB_FILE, "utf-8");
      res.json(JSON.parse(data));
    } catch (error) {
      res.status(500).json({ error: "Failed to read database" });
    }
  });

  app.post("/api/records", async (req, res) => {
    try {
      const data = await fs.readFile(DB_FILE, "utf-8");
      const records = JSON.parse(data);
      
      const newRecord = {
        id: Date.now().toString() + Math.random().toString(36).substring(7),
        ...req.body,
        createdAt: new Date().toISOString()
      };
      
      records.push(newRecord);
      
      // Cleanup older than 24 hours (86400000 ms)
      const now = Date.now();
      const filteredRecords = records.filter((r: any) => {
        return (now - new Date(r.createdAt).getTime()) < 86400000;
      });

      await fs.writeFile(DB_FILE, JSON.stringify(filteredRecords, null, 2));
      res.json(newRecord);
    } catch (error) {
      res.status(500).json({ error: "Failed to write to database" });
    }
  });

  app.delete("/api/records/student/:studentId", async (req, res) => {
    try {
      const data = await fs.readFile(DB_FILE, "utf-8");
      const records = JSON.parse(data);
      
      const filteredRecords = records.filter((r: any) => r.studentId !== req.params.studentId);
      await fs.writeFile(DB_FILE, JSON.stringify(filteredRecords, null, 2));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete from database" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
