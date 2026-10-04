import { router } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { useMemo, useState } from "react";
import { FlatList, Pressable, View } from "react-native";

import { Screen } from "@/components/screen";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { categoryLabel, formatMuscles, searchExercises } from "@/domain";
import { useLibrary } from "@/library-context";

export default function RecordScreen() {
  const { exercises, ready } = useLibrary();
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchExercises(exercises, query), [exercises, query]);

  return (
    <Screen>
      <Input
        value={query}
        onChangeText={setQuery}
        placeholder={ready ? "Search by name" : "Loading exercises"}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
        className="h-12 text-base"
      />
      <Text variant="muted">
        {results.length} {results.length === 1 ? "exercise" : "exercises"}
      </Text>
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        className="flex-1"
        contentContainerClassName="gap-2.5 pb-6"
        ListEmptyComponent={<Text variant="muted">No exercises match that name.</Text>}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: "/exercise/[id]", params: { id: item.id } })}
            className="border-border bg-card active:bg-accent hover:bg-accent flex-row items-center gap-3 rounded-xl border px-4 py-3.5"
          >
            <View className="flex-1 gap-2">
              <Text className="text-base font-semibold">{item.name}</Text>
              <View className="flex-row flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  <Text>{categoryLabel(item.category)}</Text>
                </Badge>
                <Text variant="muted" className="flex-1">
                  {formatMuscles(item.muscles)}
                </Text>
              </View>
            </View>
            <Icon as={ChevronRight} className="text-muted-foreground" size={18} />
          </Pressable>
        )}
      />
    </Screen>
  );
}
