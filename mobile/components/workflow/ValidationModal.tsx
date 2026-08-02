import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { Check, Pencil, Stethoscope } from "lucide-react-native";

import { colors } from "../../constants/colors";
import type {
  DiseaseClass,
  ValidationUpdateRequest,
  ValidationVerdict,
  WorkflowItem,
} from "../../types/workflow";
import {
  VALIDATION_VERDICTS,
  getDiseaseCorrectionOptions,
  getDiseaseLabel,
  getValidationInputError,
  getValidationVerdictLabel,
} from "../../utils/workflow";
import WorkflowCaseDetails from "./WorkflowCaseDetails";
import WorkflowDetailModal from "./WorkflowDetailModal";

type ValidationModalMode = "create" | "read";

export interface ValidationModalProps {
  visible: boolean;
  item: WorkflowItem | null;
  mode: ValidationModalMode;
  onClose: () => void;
  onSubmit?: (request: ValidationUpdateRequest) => void | Promise<void>;
  allowEdit?: boolean;
  busy?: boolean;
}

interface ChoiceProps {
  label: string;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}

function Choice({
  label,
  selected,
  disabled,
  onPress,
  accessibilityLabel,
}: ChoiceProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: selected, disabled }}
      className={`min-h-11 flex-row items-center gap-3 rounded-xl border px-4 py-3 active:opacity-70 ${
        selected
          ? "border-primary bg-primary-soft"
          : "border-neutral-border bg-white"
      } ${disabled ? "opacity-60" : ""}`}
    >
      <View
        className={`h-5 w-5 items-center justify-center rounded-full border ${
          selected ? "border-primary bg-primary" : "border-neutral-border bg-white"
        }`}
      >
        {selected ? <Check size={13} color="#FFFFFF" strokeWidth={3} /> : null}
      </View>
      <Text
        className={`min-w-0 flex-1 text-sm font-outfit_bold ${
          selected ? "text-primary" : "text-neutral-foreground"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function ValidationModal({
  visible,
  item,
  mode,
  onClose,
  onSubmit,
  allowEdit = false,
  busy = false,
}: ValidationModalProps) {
  const [isEditing, setIsEditing] = useState(mode === "create");
  const [verdict, setVerdict] = useState<ValidationVerdict | null>(null);
  const [correctedPrediction, setCorrectedPrediction] =
    useState<DiseaseClass | null>(null);
  const [note, setNote] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const effectiveBusy = busy || submitting;
  const correctionOptions = useMemo(
    () => getDiseaseCorrectionOptions(item?.ai_class),
    [item?.ai_class],
  );

  const resetFields = useCallback(() => {
    if (mode === "read") {
      setVerdict(item?.verdict ?? null);
      setCorrectedPrediction(item?.corrected_prediction ?? null);
      setNote(item?.validation_note ?? "");
    } else {
      setVerdict(null);
      setCorrectedPrediction(null);
      setNote("");
    }
    setInputError(null);
  }, [item?.corrected_prediction, item?.validation_note, item?.verdict, mode]);

  useEffect(() => {
    if (!visible) return;
    setIsEditing(mode === "create");
    setSubmitting(false);
    resetFields();
  }, [mode, resetFields, visible]);

  const handleVerdictChange = useCallback((nextVerdict: ValidationVerdict) => {
    setVerdict(nextVerdict);
    if (nextVerdict !== "incorrect") setCorrectedPrediction(null);
    setInputError(null);
  }, []);

  const handleCorrectionChange = useCallback((disease: DiseaseClass) => {
    setCorrectedPrediction(disease);
    setInputError(null);
  }, []);

  const handleStartEdit = useCallback(() => {
    resetFields();
    setIsEditing(true);
  }, [resetFields]);

  const handleSubmit = useCallback(async () => {
    if (effectiveBusy || !onSubmit) return;

    const validationError = getValidationInputError({
      verdict,
      correctedPrediction,
      aiClass: item?.ai_class,
      note,
    });
    if (validationError) {
      setInputError(validationError);
      return;
    }

    if (!verdict) return;
    const normalizedNote = note.trim() || null;
    const request: ValidationUpdateRequest =
      verdict === "incorrect"
        ? {
            verdict,
            corrected_prediction: correctedPrediction as DiseaseClass,
            note: normalizedNote,
          }
        : {
            verdict,
            corrected_prediction: null,
            note: normalizedNote,
          };

    setSubmitting(true);
    try {
      await onSubmit(request);
    } finally {
      setSubmitting(false);
    }
  }, [correctedPrediction, effectiveBusy, item?.ai_class, note, onSubmit, verdict]);

  if (!item) return null;

  const readOnly = mode === "read" && !isEditing;
  const title =
    mode === "create"
      ? "Validasi Kasus"
      : readOnly
        ? "Detail Validasi"
        : "Edit Validasi";
  const subtitle = readOnly
    ? "Tinjau detail kasus dan hasil validasi Anda."
    : "Nilai hasil AI berdasarkan pemeriksaan profesional Anda.";
  const canEdit = mode === "read" && allowEdit && Boolean(item.validation_id);

  return (
    <WorkflowDetailModal
      visible={visible}
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      closeLabel={readOnly ? "Tutup detail validasi" : "Tutup formulir validasi"}
      busy={effectiveBusy}
      footer={
        readOnly ? (
          canEdit ? (
            <Pressable
              onPress={handleStartEdit}
              accessibilityRole="button"
              accessibilityLabel="Edit hasil validasi"
              className="min-h-12 flex-row items-center justify-center gap-2 rounded-xl border border-primary bg-white px-5 active:opacity-70"
            >
              <Pencil size={18} color={colors.primary} />
              <Text className="text-sm font-outfit_bold text-primary">
                Edit validasi
              </Text>
            </Pressable>
          ) : undefined
        ) : (
          <Pressable
            onPress={() => void handleSubmit()}
            disabled={effectiveBusy}
            accessibilityRole="button"
            accessibilityLabel={mode === "create" ? "Simpan validasi" : "Simpan perubahan validasi"}
            accessibilityState={{ disabled: effectiveBusy, busy: effectiveBusy }}
            className={`min-h-12 flex-row items-center justify-center gap-2 rounded-xl bg-primary px-5 active:opacity-70 ${
              effectiveBusy ? "opacity-60" : ""
            }`}
          >
            {effectiveBusy ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Stethoscope size={18} color="#FFFFFF" />
            )}
            <Text className="text-sm font-outfit_bold text-white">
              {effectiveBusy
                ? "Menyimpan..."
                : mode === "create"
                  ? "Simpan validasi"
                  : "Simpan perubahan"}
            </Text>
          </Pressable>
        )
      }
    >
      <WorkflowCaseDetails item={item} />

      {!readOnly ? (
        <View className="mt-5 rounded-2xl border border-neutral-border bg-neutral-card p-4">
          <Text
            className="text-base font-outfit_bold text-neutral-foreground"
            accessibilityRole="header"
          >
            Keputusan dokter
          </Text>
          <Text className="mt-1 text-sm font-outfit_medium leading-5 text-neutral-muted">
            Pilih satu hasil validasi untuk kasus ini.
          </Text>

          <View className="mt-4 gap-2" accessibilityRole="radiogroup">
            {VALIDATION_VERDICTS.map((option) => (
              <Choice
                key={option}
                label={getValidationVerdictLabel(option)}
                selected={verdict === option}
                disabled={effectiveBusy}
                onPress={() => handleVerdictChange(option)}
                accessibilityLabel={`Hasil validasi ${getValidationVerdictLabel(option)}`}
              />
            ))}
          </View>

          {verdict === "incorrect" ? (
            <View className="mt-5">
              <Text className="text-sm font-outfit_bold text-neutral-foreground">
                Label koreksi
              </Text>
              <Text className="mt-1 text-xs font-outfit_medium leading-5 text-neutral-muted">
                Wajib dipilih dan harus berbeda dari hasil AI.
              </Text>
              <View className="mt-3 gap-2" accessibilityRole="radiogroup">
                {correctionOptions.map((disease) => (
                  <Choice
                    key={disease}
                    label={getDiseaseLabel(disease)}
                    selected={correctedPrediction === disease}
                    disabled={effectiveBusy}
                    onPress={() => handleCorrectionChange(disease)}
                    accessibilityLabel={`Label koreksi ${getDiseaseLabel(disease)}`}
                  />
                ))}
              </View>
            </View>
          ) : null}

          <View className="mt-5">
            <View className="flex-row items-center justify-between gap-3">
              <Text className="text-sm font-outfit_bold text-neutral-foreground">
                Catatan (opsional)
              </Text>
              <Text className="text-xs font-outfit_medium text-neutral-muted">
                {note.length}/5.000
              </Text>
            </View>
            <TextInput
              value={note}
              onChangeText={(value) => {
                setNote(value);
                setInputError(null);
              }}
              editable={!effectiveBusy}
              maxLength={5000}
              multiline
              textAlignVertical="top"
              placeholder="Tambahkan catatan pemeriksaan bila diperlukan"
              placeholderTextColor="#9CA3AF"
              accessibilityLabel="Catatan validasi opsional"
              accessibilityState={{ disabled: effectiveBusy }}
              className="mt-2 min-h-28 rounded-2xl border border-neutral-border bg-neutral-muted-soft px-4 py-3 text-sm font-outfit_medium leading-5 text-neutral-foreground"
            />
          </View>

          {inputError ? (
            <Text
              className="mt-3 text-sm font-outfit_bold leading-5 text-danger"
              accessibilityLiveRegion="assertive"
            >
              {inputError}
            </Text>
          ) : null}
        </View>
      ) : null}
    </WorkflowDetailModal>
  );
}
