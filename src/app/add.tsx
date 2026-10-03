import * as DocumentPicker from "expo-document-picker";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { Chip, FieldLabel, Notice, PrimaryButton, Screen } from "@/components";
import { CATEGORIES, MUSCLES, categoryLabel, muscleLabel, validateNewExercise, type Category, type Muscle } from "@/domain";
import { useLibrary } from "@/library-context";
import { readPickedGifBase64 } from "@/storage";
import { theme } from "@/theme";

const MAX_GIF_BYTES = 8 * 1024 * 1024;

export default function AddExerciseScreen() {
  const library = useLibrary();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category | null>(null);
  const [muscles, setMuscles] = useState<Muscle[]>([]);
  const [gifBase64, setGifBase64] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function toggleMuscle(muscle: Muscle) {
    setMuscles((current) => (current.includes(muscle) ? current.filter((item) => item !== muscle) : [...current, muscle]));
  }

  async function chooseGif() {
    setError(null);
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/gif", "image/png", "image/jpeg", "image/webp"],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    if (asset.size && asset.size > MAX_GIF_BYTES) {
      setError("Choose a GIF smaller than 8 MB.");
      return;
    }
    const mime = asset.mimeType ?? "";
    const filename = asset.name.toLowerCase();
    const allowed = mime.startsWith("image/") || /\.(gif|png|jpe?g|webp)$/.test(filename);
    if (!allowed) {
      setError("Choose a GIF or image file.");
      return;
    }
    try {
      setGifBase64(await readPickedGifBase64(asset));
    } catch {
      setError("That GIF could not be read.");
    }
  }

  async function save() {
    const validation = validateNewExercise({ name, category, muscles }, library.exercises);
    if (validation) {
      setError(validation);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const id = await library.addExercise({ name, category, muscles, gifBase64 });
      router.replace({ pathname: "/exercise/[id]", params: { id } });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save the exercise.");
      setSaving(false);
    }
  }

  return (
    <Screen scroll>
      <FieldLabel>Name</FieldLabel>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Nordic curl"
        placeholderTextColor={theme.muted}
        autoCorrect={false}
        style={styles.input}
      />
      <FieldLabel>Category</FieldLabel>
      <View style={styles.wrap}>
        {CATEGORIES.map((item) => (
          <Chip key={item} label={categoryLabel(item)} selected={category === item} onPress={() => setCategory(item)} />
        ))}
      </View>
      <FieldLabel>Muscles</FieldLabel>
      <View style={styles.wrap}>
        {MUSCLES.map((muscle) => (
          <Chip key={muscle} label={muscleLabel(muscle)} selected={muscles.includes(muscle)} onPress={() => toggleMuscle(muscle)} />
        ))}
      </View>
      <FieldLabel>Demonstration GIF</FieldLabel>
      <Text style={styles.hint}>Optional. A short GIF showing how the exercise is done.</Text>
      {gifBase64 ? (
        <Image
          source={{ uri: `data:image/gif;base64,${gifBase64}` }}
          style={styles.preview}
          contentFit="contain"
          accessibilityLabel="Selected demonstration"
        />
      ) : null}
      <PrimaryButton label={gifBase64 ? "Replace GIF" : "Choose GIF"} variant="outline" onPress={() => void chooseGif()} />
      {gifBase64 ? <PrimaryButton label="Remove GIF" variant="outline" onPress={() => setGifBase64(null)} /> : null}
      {error ? <Notice message={error} tone="danger" /> : null}
      <PrimaryButton label="Save exercise" disabled={saving || !library.ready} onPress={() => void save()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: theme.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.line,
    color: theme.text,
    fontSize: 17,
    minHeight: 52,
    paddingHorizontal: 16,
  },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  hint: {
    color: theme.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  preview: {
    width: "100%",
    height: 180,
    backgroundColor: theme.surface,
    borderRadius: 16,
  },
});
