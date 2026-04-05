/**
 * safeParseJson — safely parses Prisma JSONB fields.
 *
 * PrismaPg returns JSONB columns as either a parsed object OR a raw JSON
 * string depending on the driver version. This utility normalises both.
 */
export function safeParseJson<T>(value: unknown): T {
  if (typeof value === "string") {
    return JSON.parse(value) as T;
  }
  return value as T;
}
