const fs = require("fs");
const path = require("path");

const schemaPath = path.join(__dirname, "../prisma/schema.prisma");

if (!fs.existsSync(schemaPath)) {
  console.error(`Schema file not found at ${schemaPath}`);
  process.exit(1);
}

let schemaContent = fs.readFileSync(schemaPath, "utf8");

const databaseUrl = process.env.DATABASE_URL || "";
let provider = "sqlite"; // Default fallback

if (
  databaseUrl.startsWith("postgresql:") ||
  databaseUrl.startsWith("postgres:")
) {
  provider = "postgresql";
}

// Regex to capture: datasource db { provider = "..." }
// Group 1 will match the start of the block up to the provider quote
// Group 2 will match the closing quote and trailing schema content
const regex = /(datasource db\s*\{[^}]*provider\s*=\s*")[^"]*(")/;

if (regex.test(schemaContent)) {
  schemaContent = schemaContent.replace(regex, `$1${provider}$2`);
  fs.writeFileSync(schemaPath, schemaContent, "utf8");
  console.log(`[prepare-prisma] Dynamically set Prisma provider to: ${provider}`);
} else {
  console.warn("[prepare-prisma] Could not find datasource db provider line in schema.prisma!");
}
