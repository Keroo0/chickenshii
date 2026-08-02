import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { CircleAlert, RotateCcw } from "lucide-react-native";

import { colors } from "../../constants/colors";

export type WorkflowViewState = "loading" | "empty" | "error";

export interface WorkflowStateViewProps {
  state: WorkflowViewState;
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  compact?: boolean;
}

const DEFAULT_COPY: Record<
  WorkflowViewState,
  { title: string; message: string }
> = {
  loading: {
    title: "Memuat data",
    message: "Mohon tunggu sebentar.",
  },
  empty: {
    title: "Belum ada data",
    message: "Data workflow akan muncul di sini ketika tersedia.",
  },
  error: {
    title: "Data belum dapat dimuat",
    message: "Periksa koneksi, lalu coba lagi.",
  },
};

export default function WorkflowStateView({
  state,
  title,
  message,
  onRetry,
  retryLabel = "Coba lagi",
  compact = false,
}: WorkflowStateViewProps) {
  const copy = DEFAULT_COPY[state];

  return (
    <View
      className="items-center justify-center px-6"
      style={{ minHeight: compact ? 180 : 320 }}
      accessibilityLiveRegion="polite"
    >
      {state === "loading" ? (
        <ActivityIndicator
          size={compact ? "small" : "large"}
          color={colors.primary}
          accessibilityLabel="Sedang memuat data"
        />
      ) : state === "error" ? (
        <View className="h-12 w-12 items-center justify-center rounded-full bg-danger-soft">
          <CircleAlert size={24} color={colors.danger} />
        </View>
      ) : null}

      <Text
        className="text-center text-base font-outfit_bold text-neutral-foreground"
        style={{ marginTop: state === "empty" ? 0 : 16 }}
      >
        {title ?? copy.title}
      </Text>
      <Text className="mt-1 max-w-xs text-center text-sm font-outfit_medium leading-5 text-neutral-muted">
        {message ?? copy.message}
      </Text>

      {state === "error" && onRetry ? (
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel={retryLabel}
          className="mt-5 min-h-11 flex-row items-center justify-center gap-2 rounded-xl bg-primary px-5 active:opacity-70"
        >
          <RotateCcw size={17} color="#FFFFFF" />
          <Text className="text-sm font-outfit_bold text-white">{retryLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
