import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import { router } from "expo-router";
import { File, Paths } from "expo-file-system";
import { Download, Dumbbell, Plus, Upload } from "lucide-react-native";
import { useState } from "react";
import { Platform, View } from "react-native";

import { ConfirmDialog, Notice, Screen } from "@/components/screen";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { parseImport, type UserData } from "@/domain";
import { useLibrary } from "@/library-context";
import { BUILTIN_EXERCISES } from "@/library";
import { exportFileName, readPickedText } from "@/storage";

export default function HomeScreen() {
  const library = useLibrary();
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"muted" | "danger">("muted");
  const [pendingImport, setPendingImport] = useState<UserData | null>(null);
  const [busy, setBusy] = useState(false);

  function show(text: string, tone: "muted" | "danger" = "muted") {
    setMessageTone(tone);
    setMessage(text);
  }

  async function onExport() {
    setBusy(true);
    try {
      const json = await library.buildExport();
      const exportedAt = new Date().toISOString();
      const filename = exportFileName(exportedAt);
      if (Platform.OS === "web") {
        downloadTextFile(filename, json);
        show("Backup downloaded.");
        return;
      }
      const file = new File(Paths.cache, filename);
      file.create({ overwrite: true, intermediates: true });
      file.write(json);
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        show("Sharing is not available on this device.", "danger");
        return;
      }
      await Sharing.shareAsync(file.uri, {
        mimeType: "application/json",
        UTI: "public.json",
        dialogTitle: "Export Gymapp backup",
      });
    } catch (error) {
      show(error instanceof Error ? error.message : "Could not export the backup.", "danger");
    } finally {
      setBusy(false);
    }
  }

  async function onImport() {
    setBusy(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/json", "text/plain", "text/json", "*/*"],
        copyToCacheDirectory: true,
        base64: false,
        multiple: false,
      });
      if (result.canceled || !result.assets[0]) return;
      const text = await readPickedText(result.assets[0]);
      const parsed = parseImport(text, BUILTIN_EXERCISES);
      if (!parsed.ok) {
        show(parsed.error, "danger");
        return;
      }
      setPendingImport(parsed.data);
    } catch (error) {
      show(error instanceof Error ? error.message : "Could not read that file.", "danger");
    } finally {
      setBusy(false);
    }
  }

  async function confirmImport() {
    const next = pendingImport;
    if (!next) return;
    setPendingImport(null);
    setBusy(true);
    try {
      await library.importBackup(next);
      show("Backup imported.");
    } catch (error) {
      show(error instanceof Error ? error.message : "Could not import that backup.", "danger");
    } finally {
      setBusy(false);
    }
  }

  const disabled = busy || !library.ready;

  return (
    <Screen includeTop scroll>
      <View className="gap-2 pt-6">
        <Text variant="muted" className="uppercase tracking-[0.22em]">
          Workout log
        </Text>
        <Text variant="h1" className="text-left text-5xl">
          Gymapp
        </Text>
        <Text className="text-muted-foreground text-base leading-6">
          Log reps for an exercise. The library and your history stay on this device.
        </Text>
      </View>
      <View className="gap-3">
        <Button className="h-14 w-full" size="lg" onPress={() => router.push("/record")}>
          <Icon as={Dumbbell} size={18} />
          <Text className="text-base">Record exercise</Text>
        </Button>
        <Button className="h-14 w-full" size="lg" variant="outline" onPress={() => router.push("/add")}>
          <Icon as={Plus} size={18} />
          <Text className="text-base">Add new exercise</Text>
        </Button>
      </View>
      <Card>
        <CardHeader>
          <CardTitle>Backup</CardTitle>
          <CardDescription>
            Export writes a JSON file. Import replaces custom exercises and rep history. The built-in library stays in the app.
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-3">
          <Button className="w-full" variant="secondary" disabled={disabled} onPress={() => void onExport()}>
            <Icon as={Download} size={16} />
            <Text>Export backup</Text>
          </Button>
          <Button className="w-full" variant="secondary" disabled={disabled} onPress={() => void onImport()}>
            <Icon as={Upload} size={16} />
            <Text>Import backup</Text>
          </Button>
          {library.loadError ? <Notice message={library.loadError} tone="danger" /> : null}
          {message ? <Notice message={message} tone={messageTone} /> : null}
        </CardContent>
      </Card>
      <ConfirmDialog
        open={pendingImport !== null}
        title="Replace local data?"
        body="This replaces your custom exercises and rep history with the file. The built-in library stays as it shipped."
        confirmLabel="Import"
        onCancel={() => setPendingImport(null)}
        onConfirm={() => void confirmImport()}
      />
    </Screen>
  );
}

function downloadTextFile(filename: string, contents: string) {
  const blob = new Blob([contents], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
