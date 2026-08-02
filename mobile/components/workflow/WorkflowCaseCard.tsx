import { memo } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { ChevronRight, ImageIcon, UserRound } from "lucide-react-native";

import { colors } from "../../constants/colors";
import type { WorkflowItem } from "../../types/workflow";
import {
  formatWorkflowConfidence,
  formatWorkflowDate,
  getDiseaseLabel,
  getValidationVerdictLabel,
  getWorkflowDiseasePalette,
  getWorkflowDisplayClass,
  getWorkflowStatusLabel,
} from "../../utils/workflow";
import WorkflowStatusBadge from "./WorkflowStatusBadge";

export interface WorkflowCaseCardProps {
  item: WorkflowItem;
  onPress: (item: WorkflowItem) => void;
  showVerdict?: boolean;
  testID?: string;
}

function WorkflowCaseCardComponent({
  item,
  onPress,
  showVerdict = false,
  testID,
}: WorkflowCaseCardProps) {
  const displayClass = getWorkflowDisplayClass(item);
  const diseasePalette = getWorkflowDiseasePalette(displayClass);
  const accessibilityLabel = [
    `Kasus ${getDiseaseLabel(displayClass)}`,
    `status ${getWorkflowStatusLabel(item.status)}`,
    `kepercayaan AI ${formatWorkflowConfidence(item.ai_confidence)}`,
    item.worker_name ? `pekerja ${item.worker_name}` : null,
    showVerdict
      ? `hasil dokter ${getValidationVerdictLabel(item.verdict)}`
      : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Pressable
      testID={testID}
      onPress={() => onPress(item)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Membuka detail kasus"
      className="mb-3 min-h-28 flex-row gap-3 rounded-2xl border border-neutral-border bg-neutral-card p-3 active:opacity-70"
    >
      <View className="h-24 w-24 overflow-hidden rounded-xl bg-neutral-muted-soft">
        {item.image_url ? (
          <Image
            source={{ uri: item.image_url }}
            className="h-full w-full"
            resizeMode="cover"
            accessibilityLabel={`Foto kasus ${getDiseaseLabel(displayClass)}`}
          />
        ) : (
          <View className="h-full w-full items-center justify-center">
            <ImageIcon size={26} color={colors.muted} />
            <Text className="mt-1 text-[10px] font-outfit_medium text-neutral-muted">
              Tanpa foto
            </Text>
          </View>
        )}
      </View>

      <View className="min-w-0 flex-1 py-0.5">
        <View className="flex-row items-start gap-2">
          <Text
            className="min-w-0 flex-1 text-base font-outfit_bold"
            style={{ color: diseasePalette.color }}
            numberOfLines={2}
          >
            {getDiseaseLabel(displayClass)}
          </Text>
          <ChevronRight size={18} color={colors.muted} />
        </View>

        <View className="mt-1.5">
          <WorkflowStatusBadge status={item.status} compact />
        </View>

        <View className="mt-2 flex-row items-center gap-1.5">
          <UserRound size={13} color={colors.muted} />
          <Text
            className="min-w-0 flex-1 text-xs font-outfit_medium text-neutral-muted"
            numberOfLines={1}
          >
            {item.worker_name ?? "Pekerja tidak tersedia"}
          </Text>
        </View>
        <Text className="mt-1 text-xs font-outfit_medium text-neutral-muted">
          {formatWorkflowDate(item.created_at)}
        </Text>
        <Text className="mt-1 text-xs font-outfit_medium text-neutral-muted">
          Kepercayaan AI: {formatWorkflowConfidence(item.ai_confidence)}
        </Text>
        {showVerdict ? (
          <Text className="mt-1 text-xs font-outfit_bold text-primary">
            Hasil dokter: {getValidationVerdictLabel(item.verdict)}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export const WorkflowCaseCard = memo(WorkflowCaseCardComponent);

export default WorkflowCaseCard;
