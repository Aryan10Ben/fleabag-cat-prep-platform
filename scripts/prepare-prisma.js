const fs = require("fs");
const path = require("path");

const schemaPath = path.join(__dirname, "../prisma/schema.prisma");

if (!fs.existsSync(schemaPath)) {
  console.error(`Schema file not found at ${schemaPath}`);
  process.exit(1);
}

let schemaContent = fs.readFileSync(schemaPath, "utf8");

const databaseUrl = process.env.DATABASE_URL || "";

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

// Regex to capture: datasource db { provider = "..." }
const regex = /(datasource db\s*\{[^}]*provider\s*=\s*")[^"]*(")/;

if (regex.test(schemaContent)) {
  schemaContent = schemaContent.replace(regex, `$1${provider}$2`);
  fs.writeFileSync(schemaPath, schemaContent, "utf8");
  console.log(`[prepare-prisma] Dynamically set Prisma provider to: ${provider}`);
} else {
  console.warn("[prepare-prisma] Could not find datasource db provider line in schema.prisma!");
}
