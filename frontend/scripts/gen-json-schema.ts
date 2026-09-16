/**
 * Emits JSON Schema (draft 2020-12) files under ./schema, one per entry in the
 * contract registry. These are DERIVED artifacts: never hand-edit them, run
 * `pnpm gen:schema` after changing lib/contract.ts. Runs on Node's native TS
 * support (no ts-node / tsx), so the `.ts` import extension below is required.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { z } from "zod";
import { CONTRACT_SCHEMAS } from "../lib/contract.ts";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "schema");
mkdirSync(outDir, { recursive: true });

for (const [name, schema] of Object.entries(CONTRACT_SCHEMAS)) {
  const jsonSchema = z.toJSONSchema(schema, { target: "draft-2020-12" });
  const withId = { $id: `${name}.schema.json`, title: name, ...jsonSchema };
  const file = join(outDir, `${name}.schema.json`);
  writeFileSync(file, JSON.stringify(withId, null, 2) + "\n");
  console.log(`wrote schema/${name}.schema.json`);
}
