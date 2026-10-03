import { Directory, File, Paths } from "expo-file-system";
import { Platform } from "react-native";

import {
  base64ToBytes,
  bytesToBase64,
  emptyUserData,
  parseStoredUserData,
  toExportFile,
  type ExportFile,
  type UserData,
} from "@/domain";
import { BUILTIN_EXERCISES } from "@/library";

const STORAGE_KEY = "gymapp.user-data.v1";
const ROOT_FOLDER = "gymapp";
const GIF_FOLDER = "gifs";
const DATA_FILE = "data.json";

export async function loadUserData(): Promise<UserData> {
  if (Platform.OS === "web") return loadWeb();
  return loadNative();
}

export async function saveUserData(data: UserData): Promise<void> {
  if (Platform.OS === "web") {
    saveWeb(data);
    return;
  }
  await saveNative(data);
}

export async function createExportFile(data: UserData): Promise<string> {
  const gifBase64ById = new Map<string, string | null>();
  for (const exercise of data.exercises) {
    if (exercise.gifBase64) {
      gifBase64ById.set(exercise.id, exercise.gifBase64);
      continue;
    }
    if (exercise.gifFile && Platform.OS !== "web") {
      const file = gifFile(exercise.gifFile);
      gifBase64ById.set(exercise.id, file.exists ? await file.base64() : null);
      continue;
    }
    gifBase64ById.set(exercise.id, null);
  }
  const exported: ExportFile = toExportFile(data, new Date().toISOString(), gifBase64ById);
  return JSON.stringify(exported, null, 2);
}

export function exportFileName(exportedAt: string): string {
  const day = exportedAt.slice(0, 10);
  return `gymapp-backup-${day}.json`;
}

export async function readPickedText(asset: { uri: string; file?: Blob; base64?: string | null }): Promise<string> {
  if (asset.file) return asset.file.text();
  if (Platform.OS === "web") {
    if (asset.base64) return new TextDecoder().decode(base64ToBytes(asset.base64));
    const response = await fetch(asset.uri);
    return response.text();
  }
  return new File(asset.uri).text();
}

export async function readPickedGifBase64(asset: {
  uri: string;
  file?: Blob;
  base64?: string | null;
}): Promise<string> {
  if (asset.file) {
    const bytes = new Uint8Array(await asset.file.arrayBuffer());
    return bytesToBase64(bytes);
  }
  if (asset.base64) {
    const normalized = asset.base64.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "");
    return bytesToBase64(base64ToBytes(normalized));
  }
  if (Platform.OS === "web") {
    const response = await fetch(asset.uri);
    const bytes = new Uint8Array(await response.arrayBuffer());
    return bytesToBase64(bytes);
  }
  return new File(asset.uri).base64();
}

export function customGifUri(fileName: string): string | null {
  if (Platform.OS === "web") return null;
  return gifFile(fileName).uri;
}

function loadWeb(): UserData {
  const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
  if (!raw) return emptyUserData();
  const parsed = parseStoredUserData(raw, BUILTIN_EXERCISES);
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.data;
}

function saveWeb(data: UserData): void {
  globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

async function loadNative(): Promise<UserData> {
  const file = dataFile();
  if (!file.exists) return emptyUserData();
  const parsed = parseStoredUserData(await file.text(), BUILTIN_EXERCISES);
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.data;
}

async function saveNative(data: UserData): Promise<void> {
  const gifs = gifDirectory();
  gifs.create({ intermediates: true, idempotent: true });
  const kept = new Set<string>();

  const exercises = data.exercises.map((exercise) => {
    if (exercise.gifBase64) {
      const fileName = `${exercise.id}.gif`;
      const file = gifFile(fileName);
      file.create({ overwrite: true, intermediates: true });
      file.write(base64ToBytes(exercise.gifBase64));
      kept.add(fileName);
      return { ...exercise, gifFile: fileName, gifBase64: null };
    }
    if (exercise.gifFile) kept.add(exercise.gifFile);
    return { ...exercise, gifBase64: null };
  });

  for (const entry of gifs.list()) {
    if (entry instanceof File && !kept.has(entry.name)) entry.delete();
  }

  const file = dataFile();
  file.create({ overwrite: true, intermediates: true });
  file.write(JSON.stringify({ version: 1, exercises, records: data.records }));
}

function gifDirectory(): Directory {
  const directory = new Directory(Paths.document, ROOT_FOLDER, GIF_FOLDER);
  directory.create({ intermediates: true, idempotent: true });
  return directory;
}

function dataFile(): File {
  return new File(Paths.document, ROOT_FOLDER, DATA_FILE);
}

function gifFile(fileName: string): File {
  return new File(Paths.document, ROOT_FOLDER, GIF_FOLDER, fileName);
}
