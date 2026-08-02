import { Text, View } from "react-native";

import { colors } from "../../constants/colors";
import type { WorkflowStatus } from "../../types/workflow";
import { getWorkflowStatusLabel } from "../../utils/workflow";

export interface WorkflowStatusBadgeProps {
  status?: WorkflowStatus | null;
  compact?: boolean;
}

const STATUS_COLORS: Record<
  WorkflowStatus,
  { backgroundColor: string; borderColor: string; color: string }
> = {
  pending_isolation: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
    color: colors.danger,
  },
  pending_validation: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.warning,
    color: "#8A5B00",
  },
  requires_examination: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.warning,
    color: "#7A4E00",
  },
  ready_for_treatment: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    color: colors.primary,
  },
  active_treatment: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryLight,
    color: colors.primary,
  },
  treatment_completed: {
    backgroundColor: colors.healthySoft,
    borderColor: colors.healthy,
    color: "#34751C",
  },
  auto_closed: {
    backgroundColor: colors.mutedSoft,
    borderColor: colors.muted,
    color: colors.muted,
  },
};

export default function WorkflowStatusBadge({
  status,
  compact = false,
}: WorkflowStatusBadgeProps) {
  const palette = status
    ? STATUS_COLORS[status]
    : {
        backgroundColor: colors.mutedSoft,
        borderColor: colors.border,
        color: colors.muted,
      };

  return (
    <View
      accessibilityLabel={`Status: ${getWorkflowStatusLabel(status)}`}
      style={{
        alignSelf: "flex-start",
        backgroundColor: palette.backgroundColor,
        borderColor: palette.borderColor,
        borderRadius: 999,
        borderWidth: 1,
        paddingHorizontal: compact ? 8 : 10,
        paddingVertical: compact ? 3 : 5,
      }}
    >
      <Text
        className="font-outfit_bold"
        style={{ color: palette.color, fontSize: compact ? 10 : 12 }}
      >
        {getWorkflowStatusLabel(status)}
      </Text>
    </View>
  );
}
