export const CATEGORIES = ["push", "pull", "legs", "core"] as const;
export const MUSCLES = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "forearms",
  "core",
  "glutes",
  "quads",
  "hamstrings",
  "calves",
] as const;

export type Category = (typeof CATEGORIES)[number];
export type Muscle = (typeof MUSCLES)[number];

export type BuiltinExercise = {
  id: string;
  name: string;
  category: Category;
  muscles: Muscle[];
};

export type CustomExercise = {
  id: string;
  name: string;
  category: Category;
  muscles: Muscle[];
  gifFile: string | null;
  gifBase64: string | null;
};

export type RepRecord = {
  id: string;
  exerciseId: string;
  reps: number;
  recordedAt: string;
};

export type UserData = {
  version: 1;
  exercises: CustomExercise[];
  records: RepRecord[];
};

export type ExportExercise = {
  id: string;
  name: string;
  muscles: Muscle[];
  category: Category;
  gifBase64: string | null;
};

export type ExportFile = {
  version: 1;
  exportedAt: string;
  exercises: ExportExercise[];
  records: RepRecord[];
};

export type LibraryExercise = {
  id: string;
  name: string;
  category: Category;
  muscles: Muscle[];
  source: "builtin" | "custom";
  gifFile: string | null;
  gifBase64: string | null;
};

export type NewExerciseInput = {
  name: string;
  category: Category | null;
  muscles: Muscle[];
};

export type ParseSuccess = { ok: true; data: UserData };
export type ParseFailure = { ok: false; error: string };
export type ParseResult = ParseSuccess | ParseFailure;

const MAX_NAME_LENGTH = 80;
const MAX_REPS = 9999;
const GIF_FILE_PATTERN = /^[A-Za-z0-9._-]+\.gif$/;
const ISO_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
const BASE64_PATTERN = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

export function emptyUserData(): UserData {
  return { version: 1, exercises: [], records: [] };
}

export function createId(): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return uuid;
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function categoryLabel(category: Category): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export function muscleLabel(muscle: Muscle): string {
  return muscle.charAt(0).toUpperCase() + muscle.slice(1);
}

export function formatMuscles(muscles: Muscle[]): string {
  return muscles.map(muscleLabel).join(", ");
}

export function formatRecordedAt(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function libraryExercises(builtin: BuiltinExercise[], custom: CustomExercise[]): LibraryExercise[] {
  return [
    ...builtin.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      category: exercise.category,
      muscles: exercise.muscles,
      source: "builtin" as const,
      gifFile: null,
      gifBase64: null,
    })),
    ...custom.map((exercise) => ({
      ...exercise,
      source: "custom" as const,
    })),
  ];
}

export function searchExercises(exercises: LibraryExercise[], query: string): LibraryExercise[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return exercises;
  return exercises.filter((exercise) => exercise.name.toLowerCase().includes(normalized));
}

export function recordsForExercise(records: RepRecord[], exerciseId: string): RepRecord[] {
  return records
    .filter((record) => record.exerciseId === exerciseId)
    .slice()
    .sort((left, right) => right.recordedAt.localeCompare(left.recordedAt));
}

export function parseReps(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const reps = Number(trimmed);
  if (!Number.isInteger(reps) || reps < 1 || reps > MAX_REPS) return null;
  return reps;
}

export function validateNewExercise(input: NewExerciseInput, existing: { name: string }[]): string | null {
  const name = input.name.trim();
  if (!name) return "Enter a name.";
  if (name.length > MAX_NAME_LENGTH) return `Keep the name under ${MAX_NAME_LENGTH} characters.`;
  const clash = existing.some((exercise) => exercise.name.trim().toLowerCase() === name.toLowerCase());
  if (clash) return "An exercise with this name is already in the library.";
  if (!input.category) return "Choose a category.";
  if (input.muscles.length === 0) return "Choose at least one muscle.";
  return null;
}

export function normalizeBase64(value: string): string | null {
  const stripped = value.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "").replace(/\s/g, "");
  if (!stripped || stripped.length % 4 !== 0 || !BASE64_PATTERN.test(stripped)) return null;
  return stripped;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 8192;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

export function base64ToBytes(value: string): Uint8Array {
  const normalized = normalizeBase64(value);
  if (!normalized) throw new Error("Invalid base64.");
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export function addCustomExercise(data: UserData, exercise: CustomExercise): UserData {
  return { ...data, exercises: [...data.exercises, exercise] };
}

export function addRepRecord(data: UserData, record: RepRecord): UserData {
  return { ...data, records: [...data.records, record] };
}

export function removeCustomExercise(data: UserData, exerciseId: string): UserData {
  return {
    ...data,
    exercises: data.exercises.filter((exercise) => exercise.id !== exerciseId),
    records: data.records.filter((record) => record.exerciseId !== exerciseId),
  };
}

export function toExportFile(data: UserData, exportedAt: string, gifBase64ById: Map<string, string | null>): ExportFile {
  return {
    version: 1,
    exportedAt,
    exercises: data.exercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      muscles: exercise.muscles,
      category: exercise.category,
      gifBase64: gifBase64ById.get(exercise.id) ?? exercise.gifBase64,
    })),
    records: data.records,
  };
}

export function parseImport(raw: string, builtin: BuiltinExercise[]): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return failure("This file is not valid JSON.");
  }
  if (!isRecord(parsed)) return failure("This file is not a Gymapp backup.");
  if (parsed.version !== 1) return failure("This backup uses a version this app cannot read.");
  if (!Array.isArray(parsed.exercises) || !Array.isArray(parsed.records)) {
    return failure("This backup is missing exercises or records.");
  }

  const builtinIds = new Set(builtin.map((exercise) => exercise.id));
  const builtinNames = new Set(builtin.map((exercise) => exercise.name.toLowerCase()));
  const exercises: CustomExercise[] = [];
  const seenIds = new Set<string>();
  const seenNames = new Set<string>(builtinNames);

  for (const entry of parsed.exercises) {
    const exercise = readExportExercise(entry, builtinIds, seenIds, seenNames);
    if (typeof exercise === "string") return failure(exercise);
    exercises.push({ ...exercise, gifFile: null });
  }

  const knownIds = new Set<string>([...builtinIds, ...exercises.map((exercise) => exercise.id)]);
  const records: RepRecord[] = [];
  const seenRecordIds = new Set<string>();
  for (const entry of parsed.records) {
    const record = readRecord(entry, knownIds, seenRecordIds);
    if (typeof record === "string") return failure(record);
    records.push(record);
  }

  return { ok: true, data: { version: 1, exercises, records } };
}

export function parseStoredUserData(raw: string, builtin: BuiltinExercise[]): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return failure("Saved workouts could not be read.");
  }
  if (!isRecord(parsed) || parsed.version !== 1) return failure("Saved workouts could not be read.");
  if (!Array.isArray(parsed.exercises) || !Array.isArray(parsed.records)) {
    return failure("Saved workouts could not be read.");
  }

  const builtinIds = new Set(builtin.map((exercise) => exercise.id));
  const builtinNames = new Set(builtin.map((exercise) => exercise.name.toLowerCase()));
  const exercises: CustomExercise[] = [];
  const seenIds = new Set<string>();
  const seenNames = new Set<string>(builtinNames);

  for (const entry of parsed.exercises) {
    const exercise = readStoredExercise(entry, builtinIds, seenIds, seenNames);
    if (typeof exercise === "string") return failure(exercise);
    exercises.push(exercise);
  }

  const knownIds = new Set<string>([...builtinIds, ...exercises.map((exercise) => exercise.id)]);
  const records: RepRecord[] = [];
  const seenRecordIds = new Set<string>();
  for (const entry of parsed.records) {
    const record = readRecord(entry, knownIds, seenRecordIds);
    if (typeof record === "string") return failure(record);
    records.push(record);
  }

  return { ok: true, data: { version: 1, exercises, records } };
}

function readExportExercise(
  entry: unknown,
  builtinIds: Set<string>,
  seenIds: Set<string>,
  seenNames: Set<string>,
): Omit<CustomExercise, "gifFile"> | string {
  if (!isRecord(entry)) return "An exercise in this backup is incomplete.";
  const identity = readExerciseIdentity(entry, builtinIds, seenIds, seenNames);
  if (typeof identity === "string") return identity;
  if (entry.gifBase64 === null || entry.gifBase64 === undefined || entry.gifBase64 === "") {
    return { ...identity, gifBase64: null };
  }
  if (typeof entry.gifBase64 !== "string") return "An exercise GIF in this backup could not be read.";
  const gifBase64 = normalizeBase64(entry.gifBase64);
  if (!gifBase64) return "An exercise GIF in this backup could not be read.";
  return { ...identity, gifBase64 };
}

function readStoredExercise(
  entry: unknown,
  builtinIds: Set<string>,
  seenIds: Set<string>,
  seenNames: Set<string>,
): CustomExercise | string {
  const exported = readExportExercise(entry, builtinIds, seenIds, seenNames);
  if (typeof exported === "string") return exported;
  if (!isRecord(entry)) return "An exercise in this backup is incomplete.";
  if (entry.gifFile === null || entry.gifFile === undefined || entry.gifFile === "") {
    return { ...exported, gifFile: null };
  }
  if (typeof entry.gifFile !== "string" || !GIF_FILE_PATTERN.test(entry.gifFile)) {
    return "A saved exercise GIF could not be read.";
  }
  return { ...exported, gifFile: entry.gifFile };
}

function readExerciseIdentity(
  entry: Record<string, unknown>,
  builtinIds: Set<string>,
  seenIds: Set<string>,
  seenNames: Set<string>,
): { id: string; name: string; category: Category; muscles: Muscle[] } | string {
  if (typeof entry.id !== "string" || entry.id.trim() === "" || entry.id.length > MAX_NAME_LENGTH) {
    return "An exercise in this backup is missing an id.";
  }
  const id = entry.id.trim();
  if (builtinIds.has(id) || seenIds.has(id)) return "This backup repeats an exercise id.";
  if (typeof entry.name !== "string") return "An exercise in this backup is missing a name.";
  const name = entry.name.trim();
  if (!name || name.length > MAX_NAME_LENGTH) return "An exercise in this backup has an invalid name.";
  const nameKey = name.toLowerCase();
  if (seenNames.has(nameKey)) return "An exercise name in this backup is already used.";
  if (!isCategory(entry.category)) return "An exercise in this backup has an unknown category.";
  const muscles = readMuscles(entry.muscles);
  if (typeof muscles === "string") return muscles;
  seenIds.add(id);
  seenNames.add(nameKey);
  return { id, name, category: entry.category, muscles };
}

function readMuscles(value: unknown): Muscle[] | string {
  if (!Array.isArray(value) || value.length === 0) return "An exercise in this backup needs at least one muscle.";
  const muscles: Muscle[] = [];
  for (const entry of value) {
    if (!isMuscle(entry) || muscles.includes(entry)) {
      return "An exercise in this backup has an unknown muscle.";
    }
    muscles.push(entry);
  }
  return muscles;
}

function readRecord(entry: unknown, knownIds: Set<string>, seenIds: Set<string>): RepRecord | string {
  if (!isRecord(entry)) return "A record in this backup is incomplete.";
  if (typeof entry.id !== "string" || entry.id.trim() === "" || seenIds.has(entry.id)) {
    return "A record in this backup has an invalid id.";
  }
  if (typeof entry.exerciseId !== "string" || !knownIds.has(entry.exerciseId)) {
    return "A record in this backup does not match an exercise.";
  }
  if (typeof entry.reps !== "number" || !Number.isInteger(entry.reps) || entry.reps < 1 || entry.reps > MAX_REPS) {
    return "A record in this backup has an invalid rep count.";
  }
  if (typeof entry.recordedAt !== "string" || !ISO_PATTERN.test(entry.recordedAt) || Number.isNaN(Date.parse(entry.recordedAt))) {
    return "A record in this backup has an invalid time.";
  }
  seenIds.add(entry.id);
  return {
    id: entry.id,
    exerciseId: entry.exerciseId,
    reps: entry.reps,
    recordedAt: entry.recordedAt,
  };
}

function isCategory(value: unknown): value is Category {
  return typeof value === "string" && (CATEGORIES as readonly string[]).includes(value);
}

function isMuscle(value: unknown): value is Muscle {
  return typeof value === "string" && (MUSCLES as readonly string[]).includes(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function failure(error: string): ParseFailure {
  return { ok: false, error };
}
