import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  View,
} from "react-native";
import {
  CheckCircle2,
  CircleAlert,
  Play,
  ShieldCheck,
} from "lucide-react-native";

import { colors } from "../../constants/colors";
import {
  completeWorkflowTreatment,
  isolateWorkflowCase,
  startWorkflowTreatment,
} from "../../services/workflow";
import type {
  WorkflowAction,
  WorkflowActionState,
  WorkflowItem,
} from "../../types/workflow";
import {
  getWorkflowActionAvailability,
  toWorkflowApiError,
} from "../../utils/workflow";

export interface FollowUpActionPanelProps {
  item: WorkflowItem;
  onSuccess: (updatedItem: WorkflowItem) => void;
  onUnauthenticated: () => void | Promise<void>;
  onDataStale?: () => void;
  onBusyChange?: (busy: boolean) => void;
}

const CONFIRMATION_COPY: Record<
  WorkflowAction,
  { title: string; message: string; confirmLabel: string; success: string }
> = {
  isolate: {
    title: "Konfirmasi pemisahan",
    message:
      "Pastikan ayam yang terindikasi penyakit sudah dipisahkan dari ayam lain.",
    confirmLabel: "Sudah dipisahkan",
    success: "Pemisahan telah dicatat.",
  },
  start_treatment: {
    title: "Mulai penanganan?",
    message:
      "Pastikan ayam sudah dipisahkan dan hasil dokter telah memastikan penyakit.",
    confirmLabel: "Mulai penanganan",
    success: "Penanganan telah dimulai.",
  },
  complete_treatment: {
    title: "Selesaikan penanganan?",
    message:
      "Tindakan ini mencatat bahwa rangkaian penanganan kasus telah selesai.",
    confirmLabel: "Penanganan selesai",
    success: "Penanganan telah ditandai selesai.",
  },
};

function ActionButton({
  actionState,
  busy,
  active,
  onPress,
}: {
  actionState: WorkflowActionState;
  busy: boolean;
  active: boolean;
  onPress: (action: WorkflowAction) => void;
}) {
  const disabled = busy || !actionState.available;
  const Icon =
    actionState.action === "isolate"
      ? ShieldCheck
      : actionState.action === "start_treatment"
        ? Play
        : CheckCircle2;

  return (
    <View>
      <Pressable
        onPress={() => onPress(actionState.action)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={actionState.label}
        accessibilityHint={actionState.unavailableReason ?? undefined}
        accessibilityState={{ disabled, busy }}
        className={`min-h-12 flex-row items-center justify-center gap-2 rounded-xl px-5 active:opacity-70 ${
          actionState.available
            ? "bg-primary"
            : "border border-neutral-border bg-neutral-muted-soft"
        } ${busy ? "opacity-60" : ""}`}
      >
        {active ? (
          <ActivityIndicator size="small" color={colors.muted} />
        ) : (
          <Icon
            size={18}
            color={actionState.available ? "#FFFFFF" : colors.muted}
          />
        )}
        <Text
          className={`text-sm font-outfit_bold ${
            actionState.available ? "text-white" : "text-neutral-muted"
          }`}
        >
          {actionState.label}
        </Text>
      </Pressable>
      {!actionState.available && actionState.unavailableReason ? (
        <Text className="mt-1.5 px-1 text-xs font-outfit_medium leading-5 text-neutral-muted">
          {actionState.unavailableReason}
        </Text>
      ) : null}
    </View>
  );
}

function ActorRow({ label, actor }: { label: string; actor?: string }) {
  if (!actor) return null;

  return (
    <View className="flex-row items-start justify-between gap-3 py-2">
      <Text className="flex-1 text-xs font-outfit_medium text-neutral-muted">
        {label}
      </Text>
      <Text
        className="max-w-[62%] text-right text-xs font-outfit_bold text-neutral-foreground"
        selectable
      >
        {actor}
      </Text>
    </View>
  );
}

export default function FollowUpActionPanel({
  item,
  onSuccess,
  onUnauthenticated,
  onDataStale,
  onBusyChange,
}: FollowUpActionPanelProps) {
  const [busyAction, setBusyAction] = useState<WorkflowAction | null>(null);
  const mutationRef = useRef(false);
  const confirmationRef = useRef(false);
  const mountedRef = useRef(true);
  const availability = useMemo(
    () => getWorkflowActionAvailability(item),
    [item],
  );
  const actionStates = useMemo(
    () => [
      availability.isolate,
      availability.startTreatment,
      availability.completeTreatment,
    ],
    [availability],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const executeAction = useCallback(
    async (action: WorkflowAction) => {
      if (mutationRef.current) return;
      mutationRef.current = true;
      confirmationRef.current = false;
      setBusyAction(action);
      onBusyChange?.(true);

      try {
        const response =
          action === "isolate"
            ? await isolateWorkflowCase(item.prediction_id)
            : action === "start_treatment"
              ? await startWorkflowTreatment(item.prediction_id)
              : await completeWorkflowTreatment(item.prediction_id);

        onSuccess(response.data);
        Alert.alert("Tindakan tersimpan", CONFIRMATION_COPY[action].success);
      } catch (requestError: unknown) {
        const mappedError = toWorkflowApiError(requestError);
        if (mappedError.kind === "unauthenticated") {
          await onUnauthenticated();
          return;
        }
        Alert.alert(mappedError.title, mappedError.message);
        if (
          (mappedError.kind === "not_found" ||
            mappedError.kind === "conflict") &&
          onDataStale
        ) {
          onDataStale();
        }
      } finally {
        mutationRef.current = false;
        if (mountedRef.current) setBusyAction(null);
        onBusyChange?.(false);
      }
    },
    [
      item.prediction_id,
      onBusyChange,
      onDataStale,
      onSuccess,
      onUnauthenticated,
    ],
  );

  const requestConfirmation = useCallback(
    (action: WorkflowAction) => {
      if (mutationRef.current || confirmationRef.current) return;
      const actionState = actionStates.find(
        (candidate) => candidate.action === action,
      );
      if (!actionState?.available) return;

      confirmationRef.current = true;
      const copy = CONFIRMATION_COPY[action];
      Alert.alert(
        copy.title,
        copy.message,
        [
          {
            text: "Batal",
            style: "cancel",
            onPress: () => {
              confirmationRef.current = false;
            },
          },
          {
            text: copy.confirmLabel,
            onPress: () => void executeAction(action),
          },
        ],
        {
          cancelable: true,
          onDismiss: () => {
            confirmationRef.current = false;
          },
        },
      );
    },
    [actionStates, executeAction],
  );

  const hasActors = Boolean(
    item.isolated_by ||
      item.treatment_started_by ||
      item.treatment_completed_by ||
      item.closed_by,
  );

  return (
    <View className="mt-5 gap-4">
      {item.status === "requires_examination" || item.requires_examination ? (
        <View
          className="flex-row items-start gap-3 rounded-2xl border border-warning bg-warning-soft p-4"
          accessibilityLiveRegion="polite"
        >
          <CircleAlert size={20} color="#7A4E00" />
          <View className="min-w-0 flex-1">
            <Text className="text-sm font-outfit_bold text-neutral-foreground">
              Perlu pemeriksaan lebih lanjut
            </Text>
            <Text className="mt-1 text-xs font-outfit_medium leading-5 text-neutral-muted">
              Hasil dokter belum dapat dipastikan. Penanganan dikunci sampai ada
              hasil yang pasti.
            </Text>
          </View>
        </View>
      ) : item.status === "auto_closed" ? (
        <View className="rounded-2xl border border-neutral-border bg-neutral-muted-soft p-4">
          <Text className="text-sm font-outfit_bold text-neutral-foreground">
            Kasus ditutup otomatis
          </Text>
          <Text className="mt-1 text-xs font-outfit_medium leading-5 text-neutral-muted">
            Koreksi dokter menyatakan hasil efektif Healthy sehingga tidak ada
            tindakan lanjutan.
          </Text>
        </View>
      ) : item.status === "treatment_completed" ? (
        <View className="rounded-2xl border border-healthy bg-healthy-soft p-4">
          <Text className="text-sm font-outfit_bold text-neutral-foreground">
            Penanganan telah selesai
          </Text>
          <Text className="mt-1 text-xs font-outfit_medium leading-5 text-neutral-muted">
            Semua tindakan untuk kasus ini sudah dicatat.
          </Text>
        </View>
      ) : null}

      <View className="rounded-2xl border border-neutral-border bg-white p-4">
        <Text
          className="text-base font-outfit_bold text-neutral-foreground"
          accessibilityRole="header"
        >
          Tindakan operasional
        </Text>
        <Text className="mt-1 text-xs font-outfit_medium leading-5 text-neutral-muted">
          Pemisahan dapat dicatat sebelum validasi. Penanganan mengikuti status
          kasus dari sistem.
        </Text>

        <View className="mt-4 gap-4">
          {actionStates.map((actionState) => (
            <ActionButton
              key={actionState.action}
              actionState={actionState}
              busy={Boolean(busyAction)}
              active={busyAction === actionState.action}
              onPress={requestConfirmation}
            />
          ))}
        </View>
      </View>

      {hasActors ? (
        <View className="rounded-2xl border border-neutral-border bg-neutral-card p-4">
          <Text
            className="text-base font-outfit_bold text-neutral-foreground"
            accessibilityRole="header"
          >
            Pelaksana tercatat
          </Text>
          <Text className="mt-1 text-xs font-outfit_medium leading-5 text-neutral-muted">
            Identitas akun staf yang mencatat setiap perubahan status.
          </Text>
          <View className="mt-2">
            <ActorRow label="Pemisahan" actor={item.isolated_by} />
            <ActorRow
              label="Mulai penanganan"
              actor={item.treatment_started_by}
            />
            <ActorRow
              label="Selesai penanganan"
              actor={item.treatment_completed_by}
            />
            <ActorRow label="Penutupan otomatis" actor={item.closed_by} />
          </View>
        </View>
      ) : null}
    </View>
  );
}
