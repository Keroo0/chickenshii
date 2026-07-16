import { View, Text, Image, TouchableOpacity, Alert } from "react-native";
import { Trash2, User } from "lucide-react-native";
import { diseaseColors, colors } from "../constants/colors";
import { HistoryItem } from "../types";

function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = d.getDate();
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, "0");
  const mins = d.getMinutes().toString().padStart(2, "0");
  return `${day} ${month} ${year}, ${hours}:${mins}`;
}

export default function HistoryListItem({
  item,
  onDelete,
}: {
  item: HistoryItem;
  onDelete: (id: string) => void;
}) {
  const dc = diseaseColors[item.prediction];

  function confirmDelete() {
    Alert.alert(
      "Hapus Riwayat",
      `Hapus riwayat prediksi "${item.prediction}"?`,
      [
        { text: "Batal", style: "cancel" },
        { text: "Hapus", style: "destructive", onPress: () => onDelete(item.id) },
      ]
    );
  }

  return (
    <View className="bg-white rounded-2xl mb-3 border border-neutral-border p-3 flex-row items-center gap-4 shadow-sm shadow-black/5">
      {/* Kiri: Gambar Kecil */}
      <View className="relative w-20 h-20 rounded-xl overflow-hidden bg-neutral-muted-soft">
        <Image
          source={{ uri: item.image_url }}
          className="w-full h-full"
          resizeMode="cover"
          accessibilityLabel={`Gambar prediksi ${item.prediction}`}
        />
        
        {/* Overlay Akurasi di Pojok Kanan Bawah Gambar */}
        <View className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70">
          <Text className="text-white text-[10px] font-outfit_bold">
            {item.confidence != null ? `${(item.confidence * 100).toFixed(0)}%` : "N/A"}
          </Text>
        </View>
      </View>

      {/* Kanan: Info Teks */}
      <View className="flex-1 justify-center py-1">
        <View className="flex-row items-start justify-between mb-1.5">
          <Text 
            className="text-base font-outfit_bold flex-1 mr-2" 
            style={{ color: dc?.color || colors.primary }}
            numberOfLines={1}
          >
            {item.prediction}
          </Text>
          <TouchableOpacity
            onPress={confirmDelete}
            activeOpacity={0.7}
            accessibilityLabel="Hapus riwayat"
            accessibilityRole="button"
            className="p-1 -mt-1 -mr-1"
          >
            <Trash2 size={16} color={colors.danger} />
          </TouchableOpacity>
        </View>
        
        <View className="flex-row items-center gap-1.5 mb-1">
          <User size={14} color={colors.muted} />
          <Text className="text-sm font-outfit_medium text-neutral-foreground" numberOfLines={1}>
            {item.worker_name}
          </Text>
        </View>
        
        <Text className="text-xs text-neutral-muted font-outfit_medium">
          {formatDate(item.created_at)}
        </Text>
      </View>
    </View>
  );
}
