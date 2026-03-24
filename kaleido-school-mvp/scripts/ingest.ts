// F03 — Data Ingestion Script
// Reads data.json from the Lab and writes all 4 tables atomically to the School database.
//
// Usage:
//   npm run ingest                              (uses default Lab output path)
//   npm run ingest -- --path /path/to/data.json (custom path)

// ─── 1. ENVIRONMENT ──────────────────────────────────────────────────────────
// dotenv reads .env from the current working directory (kaleido-school-mvp/).
// Must be the FIRST import so environment variables are available to PrismaClient.
import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { z } from "zod";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ─── ESM __dirname polyfill ───────────────────────────────────────────────────
// In ESM modules ("type": "module"), __dirname does not exist.
// We recreate it from import.meta.url (the file's own URL).
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─── 2. DATABASE CONNECTION ───────────────────────────────────────────────────
// WHY DIRECT_URL and not DATABASE_URL?
//   DATABASE_URL (port 6543) connects through PgBouncer in Transaction mode.
//   PgBouncer Transaction mode does NOT support persistent connections,
//   which means Prisma's $transaction() callback will fail with a cryptic error.
//   DIRECT_URL (port 5432) connects directly to PostgreSQL — full transaction support.
const directUrl = process.env.DIRECT_URL;
if (!directUrl) {
  console.error("[ingest] Error: DIRECT_URL is not set in environment.");
  console.error("[ingest] Make sure you are running from kaleido-school-mvp/ and .env exists.");
  process.exit(1);
}

// Prisma 7 uses the "client" engine type, which requires a driver adapter.
// We create a pg connection pool pointing at DIRECT_URL (port 5432) for
// $transaction() support — PgBouncer (port 6543) does not support interactive transactions.
const pool = new Pool({ connectionString: directUrl });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

// ─── 3. ZOD VALIDATION SCHEMA ─────────────────────────────────────────────────
// We validate the top-level structure and all scalar fields.
// The `sentences` and `practices` columns are JSONB — we only check that they
// are arrays of objects (z.record(z.unknown())). Deep validation lives in the
// LAB-SCHOOL-CONTRACT.md and is not needed for ingestion correctness.

const LabOutputSchema = z.object({
  batch_id: z.string().uuid(),

  prep_units: z.array(
    z.object({
      unit_id:        z.string().uuid(),
      batch_id:       z.string().uuid(),
      question:       z.string().min(1),
      structure_type: z.string().min(1),
      sentences:      z.array(z.record(z.string(), z.unknown())), // loose — stored as JSONB
      practices:      z.array(z.record(z.string(), z.unknown())), // loose — stored as JSONB
    })
  ),

  tier_sequences: z.array(
    z.object({
      id:                z.string().uuid(),
      batch_id:          z.string().uuid(),
      tier:              z.enum(["tier_50", "tier_80"]),
      sequence_position: z.number().int().positive(),
      unit_id:           z.string().uuid(),
    })
  ),

  qbank_unlocks: z.array(
    z.object({
      id:                            z.string().uuid(),
      batch_id:                      z.string().uuid(),
      tier:                          z.enum(["tier_50", "tier_80"]),
      question_id:                   z.string().uuid(),
      question_text:                 z.string().min(1),
      unlocked_by_sequence_position: z.number().int().positive(),
      shared_directions:             z.array(z.string()),
    })
  ),

  direction_ref: z.array(
    z.object({
      direction_id: z.string().min(1),
      argument:     z.string().min(1),
    })
  ),
});

type LabOutput = z.infer<typeof LabOutputSchema>;

// ─── 4. CLI ARGUMENT PARSING ──────────────────────────────────────────────────
// Support: npm run ingest -- --path /path/to/data.json
// If no --path flag, fall back to the Lab's default output location.
const defaultPath = resolve(__dirname, "../../kaleido-lab-mvp/outputs/data.json");
const args = process.argv.slice(2);
const pathIndex = args.indexOf("--path");
const dataPath = pathIndex !== -1 ? resolve(args[pathIndex + 1]) : defaultPath;

// ─── 5. MAIN INGESTION FUNCTION ───────────────────────────────────────────────
async function main() {
  // ── Step A: Read the file ──
  console.log(`[ingest] Reading data.json from: ${dataPath}`);
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(dataPath, "utf-8"));
  } catch (err) {
    console.error(`[ingest] Error reading or parsing file: ${err}`);
    process.exit(1);
  }

  // ── Step B: Validate structure ──
  console.log("[ingest] Validating...");
  const parseResult = LabOutputSchema.safeParse(raw);
  if (!parseResult.success) {
    console.error("[ingest] Validation failed — data.json does not match expected schema:");
    console.error(JSON.stringify(parseResult.error.format(), null, 2));
    process.exit(1);
  }
  const data: LabOutput = parseResult.data;

  console.log(
    `[ingest] Validated: ${data.prep_units.length} prep_units, ` +
    `${data.tier_sequences.length} tier_sequences entries (total rows), ` +
    `${data.qbank_unlocks.length} qbank_unlocks, ` +
    `${data.direction_ref.length} direction_ref`
  );

  // ── Step C: Run atomic transaction ──
  // WHY atomic? If any single insert fails (e.g. a FK violation), the entire
  // transaction rolls back. The database is never left in a half-ingested state.
  console.log("[ingest] Running transaction...");
  await prisma.$transaction(async (tx) => {

    // ── 1. direction_ref — no FK dependencies, safe to go first ──
    // Using upsert: if a direction_id already exists, we update the argument text.
    // This lets us re-run ingestion without conflicts.
    for (const dir of data.direction_ref) {
      await tx.directionRef.upsert({
        where:  { directionId: dir.direction_id },
        update: { argument: dir.argument },
        create: { directionId: dir.direction_id, argument: dir.argument },
      });
    }
    console.log(`  → Upserted ${data.direction_ref.length} direction_ref rows`);

    // ── 2. prep_unit — no FK dependencies, safe to go second ──
    // Note field name mapping: JSON uses snake_case, Prisma uses camelCase.
    //   unit_id        → unitId
    //   batch_id       → batchId
    //   structure_type → structureType
    for (const unit of data.prep_units) {
      await tx.prepUnit.upsert({
        where:  { unitId: unit.unit_id },
        update: {
          batchId:       unit.batch_id,
          question:      unit.question,
          structureType: unit.structure_type,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          sentences:     unit.sentences as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          practices:     unit.practices as any,
        },
        create: {
          unitId:        unit.unit_id,
          batchId:       unit.batch_id,
          question:      unit.question,
          structureType: unit.structure_type,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          sentences:     unit.sentences as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          practices:     unit.practices as any,
        },
      });
    }
    console.log(`  → Upserted ${data.prep_units.length} prep_unit rows`);

    // ── 3. tier_unit_sequence — delete-then-insert for this batch ──
    // WHY delete+insert instead of upsert?
    //   The JSON rows include an `id` field, but the DB auto-generates a fresh
    //   UUID for each insert. There is no stable natural key to upsert on
    //   (batchId+tier+sequencePosition is unique but not the PK).
    //   Deleting all rows for this batchId then re-inserting guarantees idempotency.
    await tx.tierUnitSequence.deleteMany({
      where: { batchId: data.batch_id },
    });
    await tx.tierUnitSequence.createMany({
      data: data.tier_sequences.map((seq) => ({
        // id is intentionally omitted — the DB generates it via gen_random_uuid()
        batchId:          seq.batch_id,
        tier:             seq.tier,
        sequencePosition: seq.sequence_position,
        unitId:           seq.unit_id,
      })),
    });
    console.log(
      `  → Replaced tier_unit_sequence for batch ${data.batch_id.slice(0, 8)}: ` +
      `${data.tier_sequences.length} rows`
    );

    // ── 4. qbank_unlocks — delete-then-insert for this batch ──
    // Same reasoning as tier_unit_sequence above.
    await tx.qBankUnlocks.deleteMany({
      where: { batchId: data.batch_id },
    });
    await tx.qBankUnlocks.createMany({
      data: data.qbank_unlocks.map((q) => ({
        // id is intentionally omitted — the DB generates it via gen_random_uuid()
        batchId:                    q.batch_id,
        tier:                       q.tier,
        questionId:                 q.question_id,
        questionText:               q.question_text,
        unlockedBySequencePosition: q.unlocked_by_sequence_position,
        sharedDirections:           q.shared_directions,
      })),
    });
    console.log(
      `  → Replaced qbank_unlocks for batch ${data.batch_id.slice(0, 8)}: ` +
      `${data.qbank_unlocks.length} rows`
    );

  }); // end $transaction

  console.log("[ingest] ✓ Done.");
}

// ─── 6. ENTRY POINT ──────────────────────────────────────────────────────────
main()
  .catch((err) => {
    console.error("[ingest] Fatal error:", err);
    process.exit(1);
  })
  .finally(async () => {
    // Always disconnect cleanly — otherwise Node will hang waiting for the pool
    await prisma.$disconnect();
  });
