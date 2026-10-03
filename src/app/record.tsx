import { router } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput } from "react-native";

import { Screen } from "@/components";
import { categoryLabel, formatMuscles, searchExercises } from "@/domain";
import { useLibrary } from "@/library-context";
import { theme } from "@/theme";

export default function RecordScreen() {
  const { exercises, ready } = useLibrary();
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchExercises(exercises, query), [exercises, query]);

  return (
    <Screen>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={ready ? "Search by name" : "Loading exercises"}
        placeholderTextColor={theme.muted}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
        style={styles.search}
      />
      <Text style={styles.count}>
        {results.length} {results.length === 1 ? "exercise" : "exercises"}
      </Text>
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        style={styles.listFill}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No exercises match that name.</Text>}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: "/exercise/[id]", params: { id: item.id } })}
            style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
          >
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>
              {categoryLabel(item.category)} · {formatMuscles(item.muscles)}
            </Text>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: {
    backgroundColor: theme.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.line,
    color: theme.text,
    fontSize: 17,
    minHeight: 52,
    paddingHorizontal: 16,
  },
  count: {
    color: theme.muted,
    fontSize: 13,
    fontWeight: "600",
  },
  listFill: {
    flex: 1,
  },
  list: {
    gap: 10,
    paddingBottom: 24,
  },
  row: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.line,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 4,
  },
  pressed: {
    opacity: 0.82,
  },
  name: {
    color: theme.text,
    fontSize: 17,
    fontWeight: "700",
  },
  meta: {
    color: theme.muted,
    fontSize: 14,
  },
  empty: {
    color: theme.muted,
    fontSize: 15,
    paddingVertical: 12,
  },
});
