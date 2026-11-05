import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { BUILTIN_EXERCISES } from "./library.ts";
import { CATEGORIES, MUSCLES } from "./domain.ts";

const LEGACY_IDS = new Set([
  "bench-press",
  "incline-dumbbell-press",
  "overhead-press",
  "push-up",
  "dip",
  "lateral-raise",
  "pull-up",
  "lat-pulldown",
  "barbell-row",
  "dumbbell-row",
  "face-pull",
  "biceps-curl",
  "squat",
  "deadlift",
  "romanian-deadlift",
  "leg-press",
  "lunge",
  "leg-curl",
  "calf-raise",
  "plank",
  "crunch",
  "hanging-leg-raise",
]);

describe("built-in library", () => {
  it("ships the English wger catalog with the demonstration files that exist", () => {
    assert.ok(BUILTIN_EXERCISES.length >= 900);
    const ids = new Set<string>();
    const names = new Set<string>();
    const gifSource = fs.readFileSync(path.join(process.cwd(), "src/gifs.ts"), "utf8");
    const assetDir = path.join(process.cwd(), "assets/exercises");
    for (const exercise of BUILTIN_EXERCISES) {
      assert.equal(ids.has(exercise.id), false);
      assert.equal(names.has(exercise.name.toLowerCase()), false);
      ids.add(exercise.id);
      names.add(exercise.name.toLowerCase());
      assert.equal(exercise.id.startsWith("wger-") || LEGACY_IDS.has(exercise.id), true);
      assert.equal((CATEGORIES as readonly string[]).includes(exercise.category), true);
      assert.ok(exercise.muscles.length > 0);
      for (const muscle of exercise.muscles) {
        assert.equal((MUSCLES as readonly string[]).includes(muscle), true);
      }
    }

    const referenced = [...gifSource.matchAll(/"([^"]+)": require\("\.\.\/assets\/exercises\/([^"]+)"\)/g)];
    assert.ok(referenced.length > 200);
    for (const match of referenced) {
      assert.equal(ids.has(match[1]), true);
      assert.equal(fs.existsSync(path.join(assetDir, match[2])), true);
    }
    assert.ok(referenced.some((match) => match[2].endsWith(".gif")));

    const bench = BUILTIN_EXERCISES.find((exercise) => exercise.id === "bench-press");
    assert.ok(bench);
    assert.equal(bench.name, "Bench Press");
    assert.equal(bench.category, "push");
    assert.deepEqual(bench.muscles, ["chest", "shoulders", "triceps"]);
    for (const id of LEGACY_IDS) {
      assert.equal(BUILTIN_EXERCISES.some((exercise) => exercise.id === id), true);
    }
  });
});
