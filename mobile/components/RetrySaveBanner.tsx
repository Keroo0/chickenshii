import { View, Text, Pressable } from "react-native";
import { RefreshCw } from "lucide-react-native";
import { colors } from "../constants/colors";

interface Props {
  onRetry: () => void;
  loading?: boolean;
}

export default function RetrySaveBanner({ onRetry, loading }: Props) {
  return (
    <View className="flex-row items-center gap-3 rounded-xl border border-danger/30 bg-danger-soft p-4">
      <View className="flex-1">
        <Text className="text-sm font-outfit_bold text-danger">
          Gagal Menyimpan
        </Text>
        <Text className="mt-1 text-xs leading-4 text-neutral-muted">
          Data prediksi tetap tersimpan. Tekan tombol di samping untuk mencoba
          lagi.
        </Text>
      </View>
      <Pressable
        onPress={onRetry}
        disabled={loading}
        className={`flex-row items-center gap-1.5 rounded-lg px-3 py-2 ${
          loading ? "bg-neutral-border" : "bg-danger"
        }`}
      >
        <RefreshCw size={14} color="white" />
        <Text className="text-xs font-outfit_bold text-white">
          {loading ? "..." : "Coba Lagi"}
        </Text>
      </Pressable>
    </View>
  );
}
