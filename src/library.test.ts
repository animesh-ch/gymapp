import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { BUILTIN_EXERCISES } from "./library.ts";
import { CATEGORIES, MUSCLES } from "./domain.ts";

describe("built-in library", () => {
  it("ships the starter exercises with a demonstration GIF each", () => {
    assert.equal(BUILTIN_EXERCISES.length, 22);
    const ids = new Set<string>();
    const names = new Set<string>();
    const gifSource = fs.readFileSync(path.join(process.cwd(), "src/gifs.ts"), "utf8");
    for (const exercise of BUILTIN_EXERCISES) {
      assert.equal(ids.has(exercise.id), false);
      assert.equal(names.has(exercise.name.toLowerCase()), false);
      ids.add(exercise.id);
      names.add(exercise.name.toLowerCase());
      assert.equal((CATEGORIES as readonly string[]).includes(exercise.category), true);
      assert.ok(exercise.muscles.length > 0);
      for (const muscle of exercise.muscles) {
        assert.equal((MUSCLES as readonly string[]).includes(muscle), true);
      }
      assert.equal(fs.existsSync(path.join(process.cwd(), "assets/exercises", `${exercise.id}.gif`)), true);
      assert.equal(gifSource.includes(`"${exercise.id}"`) || gifSource.includes(`${exercise.id}:`), true);
    }
  });
});
