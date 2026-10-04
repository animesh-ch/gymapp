import { Image } from "expo-image";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Keyboard, View } from "react-native";

import { ConfirmDialog, Notice, Screen } from "@/components/screen";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { categoryLabel, formatMuscles, formatRecordedAt, parseReps, recordsForExercise } from "@/domain";
import { exerciseGifSource } from "@/gifs";
import { useLibrary } from "@/library-context";

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
        <View className="border-border bg-card overflow-hidden rounded-xl border">
          <Image source={gif} style={{ width: "100%", height: 220 }} contentFit="contain" accessibilityLabel={`${exercise.name} demonstration`} />
        </View>
      ) : (
        <View className="border-border bg-card h-40 items-center justify-center rounded-xl border">
          <Text variant="muted">No demonstration GIF</Text>
        </View>
      )}
      <View className="flex-row flex-wrap items-center gap-2">
        <Badge>
          <Text>{categoryLabel(exercise.category)}</Text>
        </Badge>
        <Text variant="muted">{formatMuscles(exercise.muscles)}</Text>
      </View>
      <Text variant="muted">{exercise.source === "builtin" ? "Included with the app" : "Added on this device"}</Text>
      <Card className="gap-4 py-5">
        <CardContent className="gap-3">
          <Label>Repetitions</Label>
          <Input
            value={reps}
            onChangeText={setReps}
            keyboardType="number-pad"
            inputMode="numeric"
            maxLength={4}
            placeholder="8"
            className="h-16 text-center text-3xl font-bold"
          />
          {error ? <Notice message={error} tone="danger" /> : null}
          <Button className="h-12 w-full" size="lg" disabled={saving || !library.ready} onPress={() => void saveReps()}>
            <Text className="text-base">Save reps</Text>
          </Button>
        </CardContent>
      </Card>
      <View className="gap-3">
        <Label>Previous entries</Label>
        {history.length === 0 ? <Notice message="No reps logged yet." /> : null}
        {history.map((record) => (
          <View key={record.id} className="border-border bg-card flex-row items-center justify-between gap-3 rounded-xl border px-4 py-3">
            <Text className="font-semibold">{record.reps} reps</Text>
            <Text variant="muted">{formatRecordedAt(record.recordedAt)}</Text>
          </View>
        ))}
      </View>
      {exercise.source === "custom" ? (
        <Button variant="destructive" className="w-full" onPress={() => setConfirmDelete(true)}>
          <Text>Delete exercise</Text>
        </Button>
      ) : null}
      <ConfirmDialog
        open={confirmDelete}
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
