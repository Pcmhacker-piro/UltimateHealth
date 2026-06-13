require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const collectionRoutes = require("./routes/collectionRoutes");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/ultimatehealth";

const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ||
  "http://localhost:5173,http://localhost:5174,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:5174,https://codevibeforyou.netlify.app"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const isLocalDevOrigin = (origin = "") => {
  try {
    const { hostname, port, protocol } = new URL(origin);
    const isLocalHost =
      hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
    return protocol.startsWith("http") && isLocalHost && Boolean(port);
  } catch {
    return false;
  }
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        console.warn("⚠️ [CORS] Rejected request without Origin header");
        const corsError = new Error("Not allowed by CORS");
        corsError.status = 403;
        return callback(corsError);
      }

      if (
        allowedOrigins.includes(origin) ||
        isLocalDevOrigin(origin) ||
        /^https:\/\/deploy-preview-\d+--codevibeforyou\.netlify\.app$/.test(origin)
      ) {
        return callback(null, true);
      }

      console.warn(`⚠️ [CORS] Blocked origin: ${origin}`);
      const corsError = new Error("Not allowed by CORS");
      corsError.status = 403;
      return callback(corsError);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

app.use("/api/collections", collectionRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const connectAndListen = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};

if (require.main === module) {
  connectAndListen();
}

module.exports = { app, connectAndListen };
