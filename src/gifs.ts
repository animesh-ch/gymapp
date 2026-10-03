import type { ImageSource } from "expo-image";

import type { LibraryExercise } from "@/domain";
import { customGifUri } from "@/storage";

export const builtinGifSources: Record<string, ImageSource> = {
  "bench-press": require("../assets/exercises/bench-press.gif"),
  "incline-dumbbell-press": require("../assets/exercises/incline-dumbbell-press.gif"),
  "overhead-press": require("../assets/exercises/overhead-press.gif"),
  "push-up": require("../assets/exercises/push-up.gif"),
  dip: require("../assets/exercises/dip.gif"),
  "lateral-raise": require("../assets/exercises/lateral-raise.gif"),
  "pull-up": require("../assets/exercises/pull-up.gif"),
  "lat-pulldown": require("../assets/exercises/lat-pulldown.gif"),
  "barbell-row": require("../assets/exercises/barbell-row.gif"),
  "dumbbell-row": require("../assets/exercises/dumbbell-row.gif"),
  "face-pull": require("../assets/exercises/face-pull.gif"),
  "biceps-curl": require("../assets/exercises/biceps-curl.gif"),
  squat: require("../assets/exercises/squat.gif"),
  deadlift: require("../assets/exercises/deadlift.gif"),
  "romanian-deadlift": require("../assets/exercises/romanian-deadlift.gif"),
  "leg-press": require("../assets/exercises/leg-press.gif"),
  lunge: require("../assets/exercises/lunge.gif"),
  "leg-curl": require("../assets/exercises/leg-curl.gif"),
  "calf-raise": require("../assets/exercises/calf-raise.gif"),
  plank: require("../assets/exercises/plank.gif"),
  crunch: require("../assets/exercises/crunch.gif"),
  "hanging-leg-raise": require("../assets/exercises/hanging-leg-raise.gif"),
};

export function exerciseGifSource(exercise: LibraryExercise): ImageSource | null {
  if (exercise.source === "builtin") return builtinGifSources[exercise.id] ?? null;
  if (exercise.gifBase64) {
    return { uri: `data:image/gif;base64,${exercise.gifBase64}` };
  }
  if (exercise.gifFile) {
    const uri = customGifUri(exercise.gifFile);
    return uri ? { uri } : null;
  }
  return null;
}
