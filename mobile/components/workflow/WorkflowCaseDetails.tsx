import { Image, Text, View } from "react-native";
import { ImageIcon, Info, Stethoscope, UserRound } from "lucide-react-native";

import { colors } from "../../constants/colors";
import type { WorkflowItem } from "../../types/workflow";
import {
  formatWorkflowConfidence,
  formatWorkflowDate,
  getDiseaseLabel,
  getValidationVerdictLabel,
  getWorkflowDiseasePalette,
  getWorkflowDisplayClass,
} from "../../utils/workflow";
import WorkflowStatusBadge from "./WorkflowStatusBadge";

export interface WorkflowCaseDetailsProps {
  item: WorkflowItem;
  showProbabilities?: boolean;
  showRecommendation?: boolean;
  showAuditTimeline?: boolean;
}

interface DetailRowProps {
  label: string;
  value: string;
  valueColor?: string;
}

function DetailRow({ label, value, valueColor }: DetailRowProps) {
  return (
    <View className="flex-row items-start justify-between gap-4 border-b border-neutral-border-light py-3 last:border-b-0">
      <Text className="flex-1 text-sm font-outfit_medium text-neutral-muted">
        {label}
      </Text>
      <Text
        className="max-w-[62%] text-right text-sm font-outfit_bold text-neutral-foreground"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </Text>
    </View>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Text
      className="mb-3 text-base font-outfit_bold text-neutral-foreground"
      accessibilityRole="header"
    >
      {children}
    </Text>
  );
}

export default function WorkflowCaseDetails({
  item,
  showProbabilities = true,
  showRecommendation = true,
  showAuditTimeline = true,
}: WorkflowCaseDetailsProps) {
  const effectiveClass = getWorkflowDisplayClass(item);
  const effectivePalette = getWorkflowDiseasePalette(effectiveClass);
  const probabilities = Object.entries(item.ai_probabilities ?? {}).sort(
    ([, left], [, right]) => right - left,
  );
  const recommendation = item.recommendation_data;
  const hasRecommendation = Boolean(
    recommendation?.description ||
      recommendation?.cause ||
      recommendation?.immediate_action,
  );
  const auditRows = [
    ["Kasus dibuat", item.created_at],
    ["Dipisahkan", item.isolated_at],
    ["Validasi dibuat", item.validation_created_at],
    ["Validasi diperbarui", item.validation_updated_at],
    ["Penanganan dimulai", item.treatment_started_at],
    ["Penanganan selesai", item.treatment_completed_at],
    ["Kasus ditutup", item.closed_at],
  ] as const;

  return (
    <View className="gap-4">
      <View className="h-56 overflow-hidden rounded-2xl bg-neutral-muted-soft">
        {item.image_url ? (
          <Image
            source={{ uri: item.image_url }}
            className="h-full w-full"
            resizeMode="cover"
            accessibilityLabel={`Foto kasus ${getDiseaseLabel(effectiveClass)}`}
          />
        ) : (
          <View className="h-full items-center justify-center gap-2">
            <ImageIcon size={32} color={colors.muted} />
            <Text className="text-sm font-outfit_medium text-neutral-muted">
              Foto tidak tersedia
            </Text>
          </View>
        )}
      </View>

      <View className="rounded-2xl border border-neutral-border bg-neutral-card p-4">
        <View className="flex-row items-center justify-between gap-3">
          <View className="min-w-0 flex-1">
            <Text className="text-xs font-outfit_medium uppercase tracking-wide text-neutral-muted">
              Label kasus
            </Text>
            <Text
              className="mt-1 text-xl font-outfit_bold tracking-tight"
              style={{ color: effectivePalette.color }}
            >
              {getDiseaseLabel(effectiveClass)}
            </Text>
          </View>
          <WorkflowStatusBadge status={item.status} />
        </View>
      </View>

      <View className="rounded-2xl border border-neutral-border bg-white p-4">
        <SectionTitle>Informasi deteksi</SectionTitle>
        <DetailRow label="Hasil AI" value={getDiseaseLabel(item.ai_class)} />
        <DetailRow
          label="Kepercayaan AI"
          value={formatWorkflowConfidence(item.ai_confidence)}
        />
        <View className="flex-row items-center gap-2 py-3">
          <UserRound size={16} color={colors.muted} />
          <View className="min-w-0 flex-1">
            <Text className="text-xs font-outfit_medium text-neutral-muted">
              Pekerja
            </Text>
            <Text className="text-sm font-outfit_bold text-neutral-foreground">
              {item.worker_name ?? "Belum tersedia"}
            </Text>
          </View>
        </View>
        <DetailRow label="Waktu deteksi" value={formatWorkflowDate(item.created_at)} />
      </View>

      {showProbabilities && probabilities.length > 0 ? (
        <View className="rounded-2xl border border-neutral-border bg-white p-4">
          <SectionTitle>Rincian kepercayaan AI</SectionTitle>
          {probabilities.map(([disease, confidence]) => (
            <DetailRow
              key={disease}
              label={disease}
              value={formatWorkflowConfidence(confidence)}
              valueColor={getWorkflowDiseasePalette(disease).color}
            />
          ))}
        </View>
      ) : null}

      {item.verdict ? (
        <View className="rounded-2xl border border-primary bg-primary-soft p-4">
          <View className="mb-3 flex-row items-center gap-2">
            <Stethoscope size={18} color={colors.primary} />
            <SectionTitle>Hasil Dokter Hewan</SectionTitle>
          </View>
          <DetailRow
            label="Keputusan"
            value={getValidationVerdictLabel(item.verdict)}
            valueColor={colors.primary}
          />
          {item.corrected_prediction ? (
            <DetailRow
              label="Label koreksi"
              value={getDiseaseLabel(item.corrected_prediction)}
            />
          ) : null}
          {item.validation_note ? (
            <View className="pt-3">
              <Text className="text-xs font-outfit_medium text-neutral-muted">
                Catatan dokter
              </Text>
              <Text className="mt-1 text-sm font-outfit_medium leading-5 text-neutral-foreground">
                {item.validation_note}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {showRecommendation && hasRecommendation ? (
        <View className="rounded-2xl border border-neutral-border bg-neutral-card p-4">
          <SectionTitle>Rekomendasi awal</SectionTitle>
          {recommendation?.description ? (
            <View className="mb-3">
              <Text className="text-xs font-outfit_bold text-neutral-muted">
                Ringkasan
              </Text>
              <Text className="mt-1 text-sm font-outfit_medium leading-5 text-neutral-foreground">
                {recommendation.description}
              </Text>
            </View>
          ) : null}
          {recommendation?.cause ? (
            <View className="mb-3">
              <Text className="text-xs font-outfit_bold text-neutral-muted">Penyebab</Text>
              <Text className="mt-1 text-sm font-outfit_medium leading-5 text-neutral-foreground">
                {recommendation.cause}
              </Text>
            </View>
          ) : null}
          {recommendation?.immediate_action ? (
            <View>
              <Text className="text-xs font-outfit_bold text-neutral-muted">
                Tindakan awal
              </Text>
              <Text className="mt-1 text-sm font-outfit_medium leading-5 text-neutral-foreground">
                {recommendation.immediate_action}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {showAuditTimeline && auditRows.some(([, value]) => Boolean(value)) ? (
        <View className="rounded-2xl border border-neutral-border bg-white p-4">
          <SectionTitle>Riwayat waktu</SectionTitle>
          {auditRows.map(([label, value]) =>
            value ? (
              <DetailRow key={label} label={label} value={formatWorkflowDate(value)} />
            ) : null,
          )}
        </View>
      ) : null}

      <View className="flex-row items-start gap-2 rounded-2xl bg-primary-soft p-4">
        <Info size={18} color={colors.primary} />
        <Text className="min-w-0 flex-1 text-xs font-outfit_medium leading-5 text-primary">
          Hasil AI merupakan dukungan keputusan awal dan bukan diagnosis akhir.
        </Text>
      </View>
    </View>
  );
}
