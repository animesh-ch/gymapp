import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import { router } from "expo-router";
import { File, Paths } from "expo-file-system";
import { useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

import { ConfirmDialog, Notice, PrimaryButton, Screen } from "@/components";
import { parseImport, type UserData } from "@/domain";
import { useLibrary } from "@/library-context";
import { BUILTIN_EXERCISES } from "@/library";
import { exportFileName, readPickedText } from "@/storage";
import { theme } from "@/theme";

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
    if (!pendingImport) return;
    setBusy(true);
    try {
      await library.importBackup(pendingImport);
      setPendingImport(null);
      show("Backup imported.");
    } catch (error) {
      show(error instanceof Error ? error.message : "Could not import that backup.", "danger");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen includeTop scroll>
      <Text style={styles.mark}>Gymapp</Text>
      <Text style={styles.lead}>Log reps for an exercise. The library and your history stay on this device.</Text>
      <PrimaryButton label="Record exercise" onPress={() => router.push("/record")} />
      <PrimaryButton label="Add new exercise" variant="outline" onPress={() => router.push("/add")} />
      <View style={styles.backup}>
        <Text style={styles.backupTitle}>Backup</Text>
        <Text style={styles.backupBody}>
          Export writes a JSON file. Import replaces custom exercises and rep history. The built-in library stays in the app.
        </Text>
        <PrimaryButton label="Export backup" variant="outline" disabled={busy || !library.ready} onPress={() => void onExport()} />
        <PrimaryButton label="Import backup" variant="outline" disabled={busy || !library.ready} onPress={() => void onImport()} />
        {library.loadError ? <Notice message={library.loadError} tone="danger" /> : null}
        {message ? <Notice message={message} tone={messageTone} /> : null}
      </View>
      <ConfirmDialog
        visible={pendingImport !== null}
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

const styles = StyleSheet.create({
  mark: {
    color: theme.text,
    fontSize: 42,
    fontWeight: "800",
    letterSpacing: -1,
  },
  lead: {
    color: theme.muted,
    fontSize: 17,
    lineHeight: 24,
    marginBottom: 8,
  },
  backup: {
    marginTop: 12,
    gap: 12,
  },
  backupTitle: {
    color: theme.text,
    fontSize: 20,
    fontWeight: "700",
  },
  backupBody: {
    color: theme.muted,
    fontSize: 15,
    lineHeight: 22,
  },
});
