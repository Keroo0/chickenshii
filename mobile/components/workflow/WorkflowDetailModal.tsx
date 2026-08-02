import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { X } from "lucide-react-native";

import { colors } from "../../constants/colors";

export interface WorkflowDetailModalProps {
  visible: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  subtitle?: string;
  footer?: ReactNode;
  closeLabel?: string;
  busy?: boolean;
  testID?: string;
}

export default function WorkflowDetailModal({
  visible,
  title,
  children,
  onClose,
  subtitle,
  footer,
  closeLabel = "Tutup detail",
  busy = false,
  testID,
}: WorkflowDetailModalProps) {
  const handleClose = () => {
    if (!busy) onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-end bg-black/50"
      >
        <View
          testID={testID}
          className="overflow-hidden rounded-t-3xl bg-white"
          style={styles.dialog}
          accessibilityViewIsModal
          accessibilityLabel={title}
        >
          <View className="flex-row items-start justify-between gap-3 border-b border-neutral-border px-5 py-4">
            <View className="min-w-0 flex-1 pt-1">
              <Text
                className="text-xl font-outfit_bold tracking-tight text-neutral-foreground"
                accessibilityRole="header"
              >
                {title}
              </Text>
              {subtitle ? (
                <Text className="mt-1 text-sm font-outfit_medium leading-5 text-neutral-muted">
                  {subtitle}
                </Text>
              ) : null}
            </View>
            <Pressable
              onPress={handleClose}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel={closeLabel}
              accessibilityState={{ disabled: busy }}
              className="h-11 w-11 items-center justify-center rounded-xl bg-neutral-muted-soft active:opacity-70"
              hitSlop={4}
            >
              <X size={21} color={colors.foreground} />
            </Pressable>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>

          {footer ? (
            <View className="border-t border-neutral-border bg-white px-5 pb-6 pt-4">
              {footer}
            </View>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    height: "92%",
    maxHeight: 820,
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },
});
