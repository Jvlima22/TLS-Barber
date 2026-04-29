// scripts/export-db.ts
// Gera um arquivo SQL completo com DDL + todos os dados reais do banco
import { PrismaClient } from "@prisma/client"
import fs from "fs"
import path from "path"

const prisma = new PrismaClient()

function escapeString(val: unknown): string {
  if (val === null || val === undefined) return "NULL"
  if (typeof val === "boolean") return val ? "TRUE" : "FALSE"
  if (typeof val === "number") return String(val)
  if (val instanceof Date) return `'${val.toISOString()}'`
  if (Array.isArray(val)) {
    // PostgreSQL array literal: ARRAY['a','b']
    const items = val.map((v) => `'${String(v).replace(/'/g, "''")}'`).join(",")
    return `ARRAY[${items}]::text[]`
  }
  return `'${String(val).replace(/'/g, "''")}'`
}

function toInsert(table: string, rows: Record<string, unknown>[]): string {
  if (!rows || rows.length === 0) return `-- Nenhum dado em "${table}"\n`
  const cols = Object.keys(rows[0])
  const lines = rows.map((row) => {
    const vals = cols.map((c) => escapeString(row[c])).join(", ")
    return `  (${vals})`
  })
  return (
    `INSERT INTO "${table}" (${cols.map((c) => `"${c}"`).join(", ")}) VALUES\n` +
    lines.join(",\n") +
    `\nON CONFLICT DO NOTHING;\n`
  )
}

async function main() {
  const ddl = `
-- ============================================================
-- GB-BARBEARIA — MIGRATION COMPLETA (DDL + DADOS REAIS)
-- Gerado em: ${new Date().toISOString()}
-- Execute no SQL Editor do Supabase (novo projeto)
-- ============================================================

-- Enums
DO $$ BEGIN
  CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- TABELAS
-- ============================================================

CREATE TABLE IF NOT EXISTS "User" (
  "id"            TEXT         NOT NULL,
  "email"         TEXT         NOT NULL,
  "name"          TEXT,
  "createdAt"     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "emailVerified" TIMESTAMPTZ,
  "image"         TEXT,
  "role"          "Role"       NOT NULL DEFAULT 'USER',
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

CREATE TABLE IF NOT EXISTS "Account" (
  "userId"            TEXT    NOT NULL,
  "type"              TEXT    NOT NULL,
  "provider"          TEXT    NOT NULL,
  "providerAccountId" TEXT    NOT NULL,
  "refresh_token"     TEXT,
  "access_token"      TEXT,
  "expires_at"        INTEGER,
  "token_type"        TEXT,
  "scope"             TEXT,
  "id_token"          TEXT,
  "session_state"     TEXT,
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Account_pkey" PRIMARY KEY ("provider","providerAccountId"),
  CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Session" (
  "sessionToken" TEXT        NOT NULL,
  "userId"       TEXT        NOT NULL,
  "expires"      TIMESTAMPTZ NOT NULL,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Session_pkey" PRIMARY KEY ("sessionToken"),
  CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" ON "Session"("sessionToken");

CREATE TABLE IF NOT EXISTS "VerificationToken" (
  "identifier" TEXT        NOT NULL,
  "token"      TEXT        NOT NULL,
  "expires"    TIMESTAMPTZ NOT NULL,
  CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("identifier","token")
);

CREATE TABLE IF NOT EXISTS "Settings" (
  "id"          INTEGER      NOT NULL DEFAULT 1,
  "name"        TEXT         NOT NULL,
  "address"     TEXT         NOT NULL,
  "phones"      TEXT[]       NOT NULL DEFAULT '{}',
  "description" TEXT         NOT NULL,
  "imageUrl"    TEXT         NOT NULL,
  "createdAt"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "endHour"     TEXT         NOT NULL DEFAULT '19:00',
  "startHour"   TEXT         NOT NULL DEFAULT '09:00',
  CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "OperatingDay" (
  "id"        TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "dayOfWeek" INTEGER     NOT NULL,
  "startTime" TEXT        NOT NULL DEFAULT '09:00',
  "endTime"   TEXT        NOT NULL DEFAULT '19:00',
  "isOpen"    BOOLEAN     NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "OperatingDay_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "OperatingDay_dayOfWeek_key" ON "OperatingDay"("dayOfWeek");

CREATE TABLE IF NOT EXISTS "OperatingException" (
  "id"          TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "date"        TIMESTAMPTZ NOT NULL,
  "startTime"   TEXT,
  "endTime"     TEXT,
  "isOpen"      BOOLEAN     NOT NULL DEFAULT TRUE,
  "description" TEXT,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "OperatingException_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "OperatingException_date_key" ON "OperatingException"("date");

CREATE TABLE IF NOT EXISTS "Service" (
  "id"          TEXT          NOT NULL DEFAULT gen_random_uuid()::text,
  "name"        TEXT          NOT NULL,
  "description" TEXT          NOT NULL,
  "imageUrl"    TEXT          NOT NULL,
  "price"       NUMERIC(10,2) NOT NULL,
  CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Service_name_key" ON "Service"("name");

CREATE TABLE IF NOT EXISTS "Product" (
  "id"          TEXT          NOT NULL DEFAULT gen_random_uuid()::text,
  "name"        TEXT          NOT NULL,
  "description" TEXT          NOT NULL,
  "imageUrl"    TEXT          NOT NULL,
  "price"       NUMERIC(10,2) NOT NULL,
  CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Product_name_key" ON "Product"("name");

CREATE TABLE IF NOT EXISTS "Combo" (
  "id"          TEXT          NOT NULL DEFAULT gen_random_uuid()::text,
  "name"        TEXT          NOT NULL,
  "description" TEXT          NOT NULL,
  "imageUrl"    TEXT          NOT NULL,
  "price"       NUMERIC(10,2) NOT NULL,
  "service1Id"  TEXT          NOT NULL,
  "service2Id"  TEXT          NOT NULL,
  "createdAt"   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT "Combo_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Combo_service1Id_fkey" FOREIGN KEY ("service1Id") REFERENCES "Service"("id"),
  CONSTRAINT "Combo_service2Id_fkey" FOREIGN KEY ("service2Id") REFERENCES "Service"("id")
);

CREATE TABLE IF NOT EXISTS "Booking" (
  "id"                      TEXT           NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"                  TEXT           NOT NULL,
  "serviceId"               TEXT,
  "date"                    TIMESTAMPTZ    NOT NULL,
  "createdAt"               TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  "updatedAt"               TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  "paymentStatus"           "PaymentStatus",
  "stripeCheckoutSessionId" TEXT,
  "comboId"                 TEXT,
  CONSTRAINT "Booking_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Booking_userId_fkey"    FOREIGN KEY ("userId")    REFERENCES "User"("id"),
  CONSTRAINT "Booking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id"),
  CONSTRAINT "Booking_comboId_fkey"   FOREIGN KEY ("comboId")   REFERENCES "Combo"("id")
);

CREATE TABLE IF NOT EXISTS "Purchase" (
  "id"                      TEXT            NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"                  TEXT            NOT NULL,
  "productId"               TEXT            NOT NULL,
  "quantity"                INTEGER         NOT NULL DEFAULT 1,
  "stripeCheckoutSessionId" TEXT,
  "paymentStatus"           "PaymentStatus",
  "createdAt"               TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  "updatedAt"               TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Purchase_userId_fkey"    FOREIGN KEY ("userId")    REFERENCES "User"("id"),
  CONSTRAINT "Purchase_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id")
);

CREATE TABLE IF NOT EXISTS "Bank" (
  "id"        TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "name"      TEXT        NOT NULL,
  "provider"  TEXT        NOT NULL,
  "imageUrl"  TEXT,
  "isActive"  BOOLEAN     NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Bank_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Bank_provider_key" ON "Bank"("provider");

CREATE TABLE IF NOT EXISTS "BankCredential" (
  "id"            TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "bankId"        TEXT        NOT NULL,
  "clientId"      TEXT        NOT NULL,
  "clientSecret"  TEXT        NOT NULL,
  "publicKey"     TEXT,
  "customWebhook" TEXT,
  "isDefault"     BOOLEAN     NOT NULL DEFAULT FALSE,
  "environment"   TEXT        NOT NULL DEFAULT 'SANDBOX',
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "isEnabled"     BOOLEAN     NOT NULL DEFAULT TRUE,
  CONSTRAINT "BankCredential_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BankCredential_bankId_key" UNIQUE ("bankId"),
  CONSTRAINT "BankCredential_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "Bank"("id") ON DELETE CASCADE
);

-- ============================================================
-- DADOS REAIS (exportados do banco atual)
-- ============================================================
`

  // Buscar dados reais de cada tabela
  const [
    users,
    accounts,
    sessions,
    verificationTokens,
    settings,
    operatingDays,
    operatingExceptions,
    services,
    products,
    combos,
    bookings,
    purchases,
    banks,
    bankCredentials,
  ] = await Promise.all([
    prisma.user.findMany(),
    prisma.account.findMany(),
    prisma.session.findMany(),
    prisma.verificationToken.findMany(),
    prisma.settings.findMany(),
    prisma.operatingDay.findMany(),
    prisma.operatingException.findMany(),
    prisma.service.findMany(),
    prisma.product.findMany(),
    prisma.combo.findMany(),
    prisma.booking.findMany(),
    prisma.purchase.findMany(),
    prisma.bank.findMany(),
    prisma.bankCredential.findMany(),
  ])

  const dataSql = [
    `-- Settings\n` +
      toInsert("Settings", settings as unknown as Record<string, unknown>[]),
    `\n-- OperatingDay\n` +
      toInsert(
        "OperatingDay",
        operatingDays as unknown as Record<string, unknown>[],
      ),
    `\n-- OperatingException\n` +
      toInsert(
        "OperatingException",
        operatingExceptions as unknown as Record<string, unknown>[],
      ),
    `\n-- Service\n` +
      toInsert("Service", services as unknown as Record<string, unknown>[]),
    `\n-- Product\n` +
      toInsert("Product", products as unknown as Record<string, unknown>[]),
    `\n-- Bank\n` +
      toInsert("Bank", banks as unknown as Record<string, unknown>[]),
    `\n-- BankCredential\n` +
      toInsert(
        "BankCredential",
        bankCredentials as unknown as Record<string, unknown>[],
      ),
    `\n-- Combo\n` +
      toInsert("Combo", combos as unknown as Record<string, unknown>[]),
    `\n-- User\n` +
      toInsert("User", users as unknown as Record<string, unknown>[]),
    `\n-- Account\n` +
      toInsert("Account", accounts as unknown as Record<string, unknown>[]),
    `\n-- Session\n` +
      toInsert("Session", sessions as unknown as Record<string, unknown>[]),
    `\n-- VerificationToken\n` +
      toInsert(
        "VerificationToken",
        verificationTokens as unknown as Record<string, unknown>[],
      ),
    `\n-- Booking\n` +
      toInsert("Booking", bookings as unknown as Record<string, unknown>[]),
    `\n-- Purchase\n` +
      toInsert("Purchase", purchases as unknown as Record<string, unknown>[]),
  ].join("\n")

  const fullSql = ddl + dataSql

  const outPath = path.join(process.cwd(), "migration_completa.sql")
  fs.writeFileSync(outPath, fullSql, "utf-8")

  console.log(`\n✅ Arquivo gerado com sucesso: ${outPath}`)
  console.log(`   Tabelas: 14 | Dados exportados`)
  console.log(
    `   Settings: ${settings.length} | Services: ${services.length} | Products: ${products.length}`,
  )
  console.log(
    `   Banks: ${banks.length} | BankCredentials: ${bankCredentials.length}`,
  )
  console.log(
    `   Users: ${users.length} | Bookings: ${bookings.length} | Purchases: ${purchases.length}`,
  )
  console.log(
    `   OperatingDays: ${operatingDays.length} | Combos: ${combos.length}`,
  )
}

main()
  .catch((e) => {
    console.error("Erro:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
