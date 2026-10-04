import { type ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CircleAlert, Info } from "lucide-react-native";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

export function Screen({
  children,
  scroll = false,
  includeTop = false,
  className,
}: {
  children: ReactNode;
  scroll?: boolean;
  includeTop?: boolean;
  className?: string;
}) {
  const insets = useSafeAreaInsets();
  const paddingTop = includeTop ? insets.top + 20 : 12;
  const paddingBottom = Math.max(insets.bottom, 16) + 12;

  if (scroll) {
    return (
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName={cn("gap-5 px-5", className)}
        contentContainerStyle={{ paddingTop, paddingBottom }}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View className={cn("flex-1 gap-4 bg-background px-5", className)} style={{ paddingTop, paddingBottom }}>
      {children}
    </View>
  );
}

export function Notice({ message, tone = "muted" }: { message: string; tone?: "muted" | "danger" }) {
  const danger = tone === "danger";
  return (
    <Alert icon={danger ? CircleAlert : Info} variant={danger ? "destructive" : "default"}>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  destructive = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => { if (!next) onCancel(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{body}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            <Text>Cancel</Text>
          </AlertDialogCancel>
          <AlertDialogAction className={destructive ? buttonVariants({ variant: "destructive" }) : undefined} onPress={onConfirm}>
            <Text className={destructive ? "text-white" : undefined}>{confirmLabel}</Text>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
