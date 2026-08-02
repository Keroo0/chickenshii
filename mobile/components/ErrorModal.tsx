import { Modal, View, Text, Pressable } from "react-native";
import { AlertTriangle } from "lucide-react-native";
import { colors } from "../constants/colors";

interface ErrorModalProps {
  visible: boolean;
  title?: string;
  message: string | null;
  onClose: () => void;
}

export default function ErrorModal({
  visible,
  title = "Terjadi Kesalahan",
  message,
  onClose,
}: ErrorModalProps) {
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Overlay Backdrop */}
      <View className="flex-1 items-center justify-center bg-black/50 px-5">
        {/* Modal Card (shadcn dialog style) */}
        <View className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-lg">
          <View className="p-6">
            <View className="flex-row items-center gap-3 mb-2">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-danger-soft">
                <AlertTriangle size={20} color={colors.danger} />
              </View>
              <Text className="flex-1 text-xl font-outfit_bold text-foreground">
                {title}
              </Text>
            </View>
            <Text className="mt-2 text-sm font-outfit_medium text-neutral-muted leading-relaxed">
              {message}
            </Text>
          </View>
          
          {/* Footer Actions */}
          <View className="flex-row justify-end bg-neutral-muted-soft/30 px-6 py-4">
            <Pressable
              onPress={onClose}
              className="rounded-xl bg-foreground px-6 py-3"
            >
              <Text className="text-sm font-outfit_bold text-white">
                Tutup
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
