//TODO: sql code can break the server so before executing check for that also

import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

import { connectMongo } from "./db/mongo.js";
import { connectPostgres } from "./db/postgres.js";

import workspaceRouter from "./routes/workspace.routes.js";
// import executeRoutes from "./routes/execute_sql.routes.js";

const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: "5mb" }));

app.use("/api/workspaces", workspaceRouter);
// app.use("/api/execute", executeRoutes);

app.get("/", (req, res) => res.send({ ok: true, message: "backend running" }));

const port = process.env.PORT || 4000;

async function startServer() {
  try {
    await Promise.all([connectMongo(), connectPostgres()]);

    app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
    });
  } catch (err) {
    console.error("❌ Failed to start application:", err.message);
    process.exit(1);
  }
}

startServer();
