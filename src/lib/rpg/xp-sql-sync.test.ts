import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { XP_ACTIONS, XP_RULES } from "./xp";

const migration = readFileSync(join(process.cwd(), "supabase/migrations/20261029000000_init.sql"), "utf8");

describe("synchronisation XP TypeScript ↔ SQL", () => {
  it("la table xp_rules reprend exactement les règles de xp.ts", () => {
    const seed = migration.match(/insert into public\.xp_rules[^;]+;/)?.[0];
    expect(seed).toBeDefined();

    const rows = [...seed!.matchAll(/\('([a-z_]+)',\s*(\d+),\s*(\d+)\)/g)].map(([, action, xp, cap]) => ({
      action,
      xp: Number(xp),
      dailyCap: Number(cap),
    }));

    expect(rows.map((r) => r.action).sort()).toEqual([...XP_ACTIONS].sort());
    for (const row of rows) {
      const rule = XP_RULES[row.action as keyof typeof XP_RULES];
      expect({ xp: row.xp, dailyCap: row.dailyCap }).toEqual({ xp: rule.xp, dailyCap: rule.dailyCap });
    }
  });
});
