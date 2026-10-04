import * as DocumentPicker from "expo-document-picker";
import { Image } from "expo-image";
import { router } from "expo-router";
import { ImagePlus } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";

import { Notice, Screen } from "@/components/screen";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { Toggle } from "@/components/ui/toggle";
import { CATEGORIES, MUSCLES, categoryLabel, muscleLabel, validateNewExercise, type Category, type Muscle } from "@/domain";
import { useLibrary } from "@/library-context";
import { readPickedGifBase64 } from "@/storage";

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
      <View className="gap-2">
        <Label>Name</Label>
        <Input value={name} onChangeText={setName} placeholder="Nordic curl" autoCorrect={false} className="h-12 text-base" />
      </View>
      <View className="gap-2">
        <Label>Category</Label>
        <View className="flex-row flex-wrap gap-2">
          {CATEGORIES.map((item) => (
            <Choice key={item} label={categoryLabel(item)} selected={category === item} onPress={() => setCategory(item)} />
          ))}
        </View>
      </View>
      <View className="gap-2">
        <Label>Muscles</Label>
        <View className="flex-row flex-wrap gap-2">
          {MUSCLES.map((muscle) => (
            <Choice key={muscle} label={muscleLabel(muscle)} selected={muscles.includes(muscle)} onPress={() => toggleMuscle(muscle)} />
          ))}
        </View>
      </View>
      <View className="gap-2">
        <Label>Demonstration GIF</Label>
        <Text variant="muted" className="leading-5">
          Optional. A short GIF showing how the exercise is done.
        </Text>
        {gifBase64 ? (
          <View className="border-border bg-card overflow-hidden rounded-xl border">
            <Image
              source={{ uri: `data:image/gif;base64,${gifBase64}` }}
              style={{ width: "100%", height: 180 }}
              contentFit="contain"
              accessibilityLabel="Selected demonstration"
            />
          </View>
        ) : null}
        <Button variant="outline" className="w-full" onPress={() => void chooseGif()}>
          <Icon as={ImagePlus} size={16} />
          <Text>{gifBase64 ? "Replace GIF" : "Choose GIF"}</Text>
        </Button>
        {gifBase64 ? (
          <Button variant="ghost" className="w-full" onPress={() => setGifBase64(null)}>
            <Text>Remove GIF</Text>
          </Button>
        ) : null}
      </View>
      {error ? <Notice message={error} tone="danger" /> : null}
      <Button className="h-12 w-full" size="lg" disabled={saving || !library.ready} onPress={() => void save()}>
        <Text className="text-base">Save exercise</Text>
      </Button>
    </Screen>
  );
}

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Toggle
      pressed={selected}
      onPressedChange={() => onPress()}
      variant="outline"
      className={selected ? "border-primary bg-primary" : undefined}
    >
      <Text className={selected ? "text-primary-foreground" : undefined}>{label}</Text>
    </Toggle>
  );
}
