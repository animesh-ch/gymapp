import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  addCustomExercise,
  addRepRecord,
  createId,
  emptyUserData,
  libraryExercises,
  removeCustomExercise,
  type CustomExercise,
  type LibraryExercise,
  type NewExerciseInput,
  type RepRecord,
  type UserData,
} from "@/domain";
import { BUILTIN_EXERCISES } from "@/library";
import { createExportFile, loadUserData, saveUserData } from "@/storage";

type LibraryContextValue = {
  ready: boolean;
  loadError: string | null;
  exercises: LibraryExercise[];
  records: RepRecord[];
  addExercise: (input: NewExerciseInput & { gifBase64: string | null }) => Promise<string>;
  addRep: (exerciseId: string, reps: number) => Promise<void>;
  deleteExercise: (exerciseId: string) => Promise<void>;
  importBackup: (data: UserData) => Promise<void>;
  buildExport: () => Promise<string>;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<UserData>(emptyUserData());
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const dataRef = useRef(data);
  const chain = useRef(Promise.resolve());

  useEffect(() => {
    let cancelled = false;
    loadUserData()
      .then((loaded) => {
        if (cancelled) return;
        dataRef.current = loaded;
        setData(loaded);
        setReady(true);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : "Saved workouts could not be read.");
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const commit = useCallback((updater: (current: UserData) => UserData) => {
    const previous = dataRef.current;
    const next = updater(previous);
    dataRef.current = next;
    setData(next);
    const job = async () => {
      const snapshot = dataRef.current;
      try {
        await saveUserData(snapshot);
      } catch (error) {
        if (dataRef.current === snapshot) {
          dataRef.current = previous;
          setData(previous);
        }
        throw error;
      }
    };
    const run = chain.current.catch(() => undefined).then(job);
    chain.current = run;
    return run;
  }, []);

  const exercises = useMemo(
    () => libraryExercises(BUILTIN_EXERCISES, data.exercises),
    [data.exercises],
  );

  const addExercise = useCallback(
    async (input: NewExerciseInput & { gifBase64: string | null }) => {
      if (!input.category) throw new Error("Choose a category.");
      const exercise: CustomExercise = {
        id: createId(),
        name: input.name.trim(),
        category: input.category,
        muscles: input.muscles,
        gifFile: null,
        gifBase64: input.gifBase64,
      };
      await commit((current) => addCustomExercise(current, exercise));
      return exercise.id;
    },
    [commit],
  );

  const addRep = useCallback(
    async (exerciseId: string, reps: number) => {
      await commit((current) =>
        addRepRecord(current, {
          id: createId(),
          exerciseId,
          reps,
          recordedAt: new Date().toISOString(),
        }),
      );
    },
    [commit],
  );

  const deleteExercise = useCallback(
    async (exerciseId: string) => {
      await commit((current) => removeCustomExercise(current, exerciseId));
    },
    [commit],
  );

  const importBackup = useCallback(
    async (backup: UserData) => {
      await commit(() => backup);
    },
    [commit],
  );

  const buildExport = useCallback(async () => createExportFile(dataRef.current), []);

  const value = useMemo<LibraryContextValue>(
    () => ({
      ready,
      loadError,
      exercises,
      records: data.records,
      addExercise,
      addRep,
      deleteExercise,
      importBackup,
      buildExport,
    }),
    [ready, loadError, exercises, data.records, addExercise, addRep, deleteExercise, importBackup, buildExport],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary(): LibraryContextValue {
  const value = useContext(LibraryContext);
  if (!value) throw new Error("useLibrary must be used within LibraryProvider");
  return value;
}
