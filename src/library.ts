import type { BuiltinExercise } from "@/domain";

/**
 * Stable ids. Rep entries and backup files refer to these forever,
 * including after the app is reinstalled.
 */
export const BUILTIN_EXERCISES: BuiltinExercise[] = [
  { id: "bench-press", name: "Bench press", category: "push", muscles: ["chest", "triceps", "shoulders"] },
  { id: "incline-dumbbell-press", name: "Incline dumbbell press", category: "push", muscles: ["chest", "shoulders", "triceps"] },
  { id: "overhead-press", name: "Overhead press", category: "push", muscles: ["shoulders", "triceps"] },
  { id: "push-up", name: "Push-up", category: "push", muscles: ["chest", "triceps", "shoulders"] },
  { id: "dip", name: "Dip", category: "push", muscles: ["triceps", "chest", "shoulders"] },
  { id: "lateral-raise", name: "Lateral raise", category: "push", muscles: ["shoulders"] },
  { id: "pull-up", name: "Pull-up", category: "pull", muscles: ["back", "biceps"] },
  { id: "lat-pulldown", name: "Lat pulldown", category: "pull", muscles: ["back", "biceps"] },
  { id: "barbell-row", name: "Barbell row", category: "pull", muscles: ["back", "biceps"] },
  { id: "dumbbell-row", name: "Dumbbell row", category: "pull", muscles: ["back", "biceps"] },
  { id: "face-pull", name: "Face pull", category: "pull", muscles: ["shoulders", "back"] },
  { id: "biceps-curl", name: "Biceps curl", category: "pull", muscles: ["biceps"] },
  { id: "squat", name: "Squat", category: "legs", muscles: ["quads", "glutes"] },
  { id: "deadlift", name: "Deadlift", category: "legs", muscles: ["back", "glutes", "hamstrings"] },
  { id: "romanian-deadlift", name: "Romanian deadlift", category: "legs", muscles: ["hamstrings", "glutes"] },
  { id: "leg-press", name: "Leg press", category: "legs", muscles: ["quads", "glutes"] },
  { id: "lunge", name: "Lunge", category: "legs", muscles: ["quads", "glutes"] },
  { id: "leg-curl", name: "Leg curl", category: "legs", muscles: ["hamstrings"] },
  { id: "calf-raise", name: "Calf raise", category: "legs", muscles: ["calves"] },
  { id: "plank", name: "Plank", category: "core", muscles: ["core"] },
  { id: "crunch", name: "Crunch", category: "core", muscles: ["core"] },
  { id: "hanging-leg-raise", name: "Hanging leg raise", category: "core", muscles: ["core"] },
];
