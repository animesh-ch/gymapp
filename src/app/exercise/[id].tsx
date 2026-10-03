import { Image } from "expo-image";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Keyboard, StyleSheet, Text, TextInput, View } from "react-native";

import { ConfirmDialog, FieldLabel, Notice, PrimaryButton, Screen } from "@/components";
import { categoryLabel, formatMuscles, formatRecordedAt, parseReps, recordsForExercise } from "@/domain";
import { exerciseGifSource } from "@/gifs";
import { useLibrary } from "@/library-context";
import { theme } from "@/theme";

export default function ExerciseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const exerciseId = Array.isArray(id) ? id[0] : id;
  const library = useLibrary();
  const exercise = library.exercises.find((item) => item.id === exerciseId);
  const history = recordsForExercise(library.records, exerciseId ?? "");
  const [reps, setReps] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!exercise) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "Exercise" }} />
        <Notice message={library.ready ? "That exercise is not in the library." : "Loading exercises."} />
      </Screen>
    );
  }

  const gif = exerciseGifSource(exercise);

  async function saveReps() {
    const parsed = parseReps(reps);
    if (!parsed || !exerciseId) {
      setError("Enter the number of repetitions.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await library.addRep(exerciseId, parsed);
      setReps("");
      Keyboard.dismiss();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save those reps.");
    } finally {
      setSaving(false);
    }
  }

  async function removeExercise() {
    if (!exerciseId) return;
    setConfirmDelete(false);
    try {
      await library.deleteExercise(exerciseId);
      router.back();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete the exercise.");
    }
  }

  return (
    <Screen scroll>
      <Stack.Screen options={{ title: exercise.name }} />
      {gif ? (
        <Image source={gif} style={styles.gif} contentFit="contain" accessibilityLabel={`${exercise.name} demonstration`} />
      ) : (
        <View style={styles.gifMissing}>
          <Text style={styles.gifMissingText}>No demonstration GIF</Text>
        </View>
      )}
      <Text style={styles.meta}>
        {categoryLabel(exercise.category)} · {formatMuscles(exercise.muscles)}
      </Text>
      <Text style={styles.source}>{exercise.source === "builtin" ? "Included with the app" : "Added on this device"}</Text>
      <FieldLabel>Repetitions</FieldLabel>
      <TextInput
        value={reps}
        onChangeText={setReps}
        keyboardType="number-pad"
        inputMode="numeric"
        maxLength={4}
        placeholder="8"
        placeholderTextColor={theme.muted}
        style={styles.reps}
      />
      {error ? <Notice message={error} tone="danger" /> : null}
      <PrimaryButton label="Save reps" disabled={saving || !library.ready} onPress={() => void saveReps()} />
      <FieldLabel>Previous entries</FieldLabel>
      {history.length === 0 ? <Notice message="No reps logged yet." /> : null}
      {history.map((record) => (
        <View key={record.id} style={styles.entry}>
          <Text style={styles.entryReps}>{record.reps} reps</Text>
          <Text style={styles.entryTime}>{formatRecordedAt(record.recordedAt)}</Text>
        </View>
      ))}
      {exercise.source === "custom" ? (
        <PrimaryButton label="Delete exercise" variant="danger" onPress={() => setConfirmDelete(true)} />
      ) : null}
      <ConfirmDialog
        visible={confirmDelete}
        title="Delete this exercise?"
        body="It leaves the library, and the reps you logged for it are removed. Built-in exercises stay."
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => void removeExercise()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  gif: {
    width: "100%",
    height: 220,
    backgroundColor: theme.surface,
    borderRadius: 18,
  },
  gifMissing: {
    width: "100%",
    height: 160,
    borderRadius: 18,
    backgroundColor: theme.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.line,
  },
  gifMissingText: {
    color: theme.muted,
    fontSize: 15,
  },
  meta: {
    color: theme.text,
    fontSize: 16,
    fontWeight: "600",
  },
  source: {
    color: theme.muted,
    fontSize: 14,
  },
  reps: {
    backgroundColor: theme.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.line,
    color: theme.text,
    fontSize: 32,
    fontWeight: "700",
    minHeight: 72,
    paddingHorizontal: 16,
  },
  entry: {
    backgroundColor: theme.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.line,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  entryReps: {
    color: theme.text,
    fontSize: 16,
    fontWeight: "700",
  },
  entryTime: {
    color: theme.muted,
    fontSize: 14,
  },
});
