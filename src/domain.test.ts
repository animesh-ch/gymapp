import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  addRepRecord,
  base64ToBytes,
  bytesToBase64,
  createId,
  emptyUserData,
  libraryExercises,
  normalizeBase64,
  parseImport,
  parseReps,
  parseStoredUserData,
  recordsForExercise,
  removeCustomExercise,
  searchExercises,
  toExportFile,
  validateNewExercise,
  type BuiltinExercise,
  type UserData,
} from "./domain.ts";

const builtin: BuiltinExercise[] = [
  { id: "bench-press", name: "Bench press", category: "push", muscles: ["chest", "triceps", "shoulders"] },
  { id: "squat", name: "Squat", category: "legs", muscles: ["quads", "glutes"] },
];

const gifBytes = new Uint8Array([71, 73, 70, 56, 57, 97]);

function backup(exercises: unknown[], records: unknown[] = []): string {
  return JSON.stringify({ version: 1, exportedAt: "2026-10-03T16:50:00.000Z", exercises, records });
}

describe("library search", () => {
  const exercises = libraryExercises(builtin, [
    {
      id: "custom-1",
      name: "Nordic curl",
      category: "legs",
      muscles: ["hamstrings"],
      gifFile: null,
      gifBase64: null,
    },
  ]);

  it("returns every exercise when the query is empty", () => {
    assert.equal(searchExercises(exercises, "   ").length, 3);
  });

  it("matches a name regardless of case", () => {
    assert.deepEqual(
      searchExercises(exercises, "BENCH").map((exercise) => exercise.id),
      ["bench-press"],
    );
  });
});

describe("reps and new exercises", () => {
  it("accepts a positive integer and rejects everything else", () => {
    assert.equal(parseReps("8"), 8);
    assert.equal(parseReps("0"), null);
    assert.equal(parseReps("1.5"), null);
    assert.equal(parseReps(""), null);
    assert.equal(parseReps("10000"), null);
  });

  it("requires a unique name, a category, and a muscle", () => {
    const existing = [{ name: "Bench press" }];
    assert.equal(validateNewExercise({ name: "  ", category: "pull", muscles: ["back"] }, existing), "Enter a name.");
    assert.equal(
      validateNewExercise({ name: "bench press", category: "pull", muscles: ["back"] }, existing),
      "An exercise with this name is already in the library.",
    );
    assert.equal(validateNewExercise({ name: "Nordic curl", category: null, muscles: ["hamstrings"] }, existing), "Choose a category.");
    assert.equal(validateNewExercise({ name: "Nordic curl", category: "legs", muscles: [] }, existing), "Choose at least one muscle.");
    assert.equal(validateNewExercise({ name: "Nordic curl", category: "legs", muscles: ["hamstrings"] }, existing), null);
  });
});

describe("records", () => {
  it("lists the newest entry first and drops entries when a custom exercise is deleted", () => {
    let data: UserData = emptyUserData();
    data = addRepRecord(data, { id: "r1", exerciseId: "squat", reps: 5, recordedAt: "2026-10-01T12:00:00.000Z" });
    data = addRepRecord(data, { id: "r2", exerciseId: "squat", reps: 8, recordedAt: "2026-10-03T12:00:00.000Z" });
    data = addRepRecord(data, { id: "r3", exerciseId: "custom-1", reps: 10, recordedAt: "2026-10-02T12:00:00.000Z" });
    assert.deepEqual(
      recordsForExercise(data.records, "squat").map((record) => record.id),
      ["r2", "r1"],
    );
    data = {
      ...data,
      exercises: [
        { id: "custom-1", name: "Nordic curl", category: "legs", muscles: ["hamstrings"], gifFile: null, gifBase64: null },
      ],
    };
    const removed = removeCustomExercise(data, "custom-1");
    assert.equal(removed.exercises.length, 0);
    assert.equal(removed.records.some((record) => record.exerciseId === "custom-1"), false);
  });
});

describe("import and export", () => {
  it("round-trips base64", () => {
    assert.equal(bytesToBase64(gifBytes), "R0lGODlh");
    assert.deepEqual(base64ToBytes("R0lGODlh"), gifBytes);
    assert.equal(normalizeBase64("data:image/gif;base64,R0lGODlh"), "R0lGODlh");
  });

  it("imports a backup that points at a built-in exercise", () => {
    const raw = backup(
      [
        {
          id: "7c1e",
          name: "Nordic curl",
          muscles: ["hamstrings"],
          category: "legs",
          gifBase64: null,
        },
      ],
      [{ id: "a91b", exerciseId: "bench-press", reps: 8, recordedAt: "2026-10-03T16:40:00.000Z" }],
    );
    const parsed = parseImport(raw, builtin);
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    assert.equal(parsed.data.exercises[0]?.gifBase64, null);
    assert.equal(parsed.data.records[0]?.exerciseId, "bench-press");
  });

  it("keeps the decoded GIF on a custom exercise", () => {
    const parsed = parseImport(
      backup([
        {
          id: "7c1e",
          name: "Nordic curl",
          muscles: ["hamstrings"],
          category: "legs",
          gifBase64: "data:image/gif;base64,R0lGODlh",
        },
      ]),
      builtin,
    );
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    assert.equal(parsed.data.exercises[0]?.gifBase64, "R0lGODlh");
  });

  it("rejects an unusable file and leaves the caller to keep existing data", () => {
    assert.equal(parseImport("{", builtin).ok, false);
    assert.equal(parseImport(JSON.stringify({ version: 2, exercises: [], records: [] }), builtin).ok, false);
    const missingExercise = parseImport(
      backup([], [{ id: "a91b", exerciseId: "missing", reps: 8, recordedAt: "2026-10-03T16:40:00.000Z" }]),
      builtin,
    );
    assert.equal(missingExercise.ok, false);
    const nameClash = parseImport(
      backup([{ id: "7c1e", name: "Bench press", muscles: ["chest"], category: "push", gifBase64: null }]),
      builtin,
    );
    assert.equal(nameClash.ok, false);
  });

  it("builds an export file with version 1", () => {
    const data: UserData = {
      version: 1,
      exercises: [
        { id: "7c1e", name: "Nordic curl", muscles: ["hamstrings"], category: "legs", gifFile: "7c1e.gif", gifBase64: null },
      ],
      records: [{ id: "a91b", exerciseId: "bench-press", reps: 8, recordedAt: "2026-10-03T16:40:00.000Z" }],
    };
    const exported = toExportFile(data, "2026-10-03T16:50:00.000Z", new Map([["7c1e", "R0lGODlh"]]));
    assert.equal(exported.version, 1);
    assert.equal(exported.exercises[0]?.gifBase64, "R0lGODlh");
    assert.equal(exported.records.length, 1);
  });

  it("reads stored user data and rejects a corrupt file", () => {
    const stored = JSON.stringify({
      version: 1,
      exercises: [
        { id: "7c1e", name: "Nordic curl", muscles: ["hamstrings"], category: "legs", gifFile: "7c1e.gif", gifBase64: null },
      ],
      records: [],
    });
    const parsed = parseStoredUserData(stored, builtin);
    assert.equal(parsed.ok, true);
    if (parsed.ok) assert.equal(parsed.data.exercises[0]?.gifFile, "7c1e.gif");
    assert.equal(parseStoredUserData("{", builtin).ok, false);
  });
});

describe("ids", () => {
  it("creates distinct ids", () => {
    assert.notEqual(createId(), createId());
  });
});
