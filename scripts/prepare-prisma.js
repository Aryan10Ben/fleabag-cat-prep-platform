const fs = require("fs");
const path = require("path");

const schemaPath = path.join(__dirname, "../prisma/schema.prisma");

if (!fs.existsSync(schemaPath)) {
  console.error(`Schema file not found at ${schemaPath}`);
  process.exit(1);
}

let schemaContent = fs.readFileSync(schemaPath, "utf8");

let databaseUrl = process.env.DATABASE_URL || "";

if (!databaseUrl) {
  const envPath = path.join(__dirname, "../.env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    const match = envContent.match(/^DATABASE_URL\s*=\s*["']?([^"'\r\n]+)["']?/m);
    if (match) {
      databaseUrl = match[1];
    }
  }
}

// If DATABASE_URL is not set, do not modify the schema provider!
if (!databaseUrl) {
  console.log("[prepare-prisma] No DATABASE_URL environment variable found. Keeping existing schema provider.");
  process.exit(0);
}

let provider = "sqlite";

if (
  databaseUrl.startsWith("postgresql:") ||
  databaseUrl.startsWith("postgres:")
) {
  provider = "postgresql";
}

// Regex to capture: datasource db { ... }
const dbBlockRegex = /datasource db\s*\{[\s\S]*?\}/;

if (dbBlockRegex.test(schemaContent)) {
  const dbBlock = provider === "sqlite"
    ? `datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}`
    : `datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}`;
  schemaContent = schemaContent.replace(dbBlockRegex, dbBlock);
  fs.writeFileSync(schemaPath, schemaContent, "utf8");
  console.log(`[prepare-prisma] Dynamically set Prisma provider to: ${provider}`);
} else {
  console.warn("[prepare-prisma] Could not find datasource db block in schema.prisma!");
}
