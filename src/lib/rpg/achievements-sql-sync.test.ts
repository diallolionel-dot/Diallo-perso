import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ACHIEVEMENTS } from "./achievements";

const migration = readFileSync(join(process.cwd(), "supabase/migrations/20261030000000_phase2_tracking.sql"), "utf8");

describe("synchronisation succès TypeScript ↔ SQL", () => {
  it("chaque succès débloquable en base existe dans le catalogue, et inversement", () => {
    const sqlCodes = [...migration.matchAll(/array_append\(v_codes, '([a-z_0-9]+)'\)/g)].map((m) => m[1]);
    expect(sqlCodes.sort()).toEqual(ACHIEVEMENTS.map((a) => a.code).sort());
  });
});
