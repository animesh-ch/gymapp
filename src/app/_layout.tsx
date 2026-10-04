import "../../global.css";

import { PortalHost } from "@rn-primitives/portal";
import { Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { colorScheme } from "nativewind";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { LibraryProvider } from "@/library-context";
import { NAV_THEME } from "@/lib/theme";

colorScheme.set("dark");

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider value={NAV_THEME.dark}>
        <LibraryProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShadowVisible: false,
              headerTitleStyle: { fontWeight: "700" },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="record" options={{ title: "Record exercise" }} />
            <Stack.Screen name="add" options={{ title: "Add exercise" }} />
            <Stack.Screen name="exercise/[id]" options={{ title: "Exercise" }} />
          </Stack>
          <PortalHost />
        </LibraryProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
