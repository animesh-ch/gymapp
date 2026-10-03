import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { LibraryProvider } from "@/library-context";
import { theme } from "@/theme";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LibraryProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: theme.bg },
            headerTintColor: theme.text,
            headerTitleStyle: { color: theme.text, fontWeight: "700" },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: theme.bg },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="record" options={{ title: "Record exercise" }} />
          <Stack.Screen name="add" options={{ title: "Add exercise" }} />
          <Stack.Screen name="exercise/[id]" options={{ title: "Exercise" }} />
        </Stack>
      </LibraryProvider>
    </SafeAreaProvider>
  );
}
