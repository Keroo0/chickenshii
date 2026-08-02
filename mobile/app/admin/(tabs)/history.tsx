import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Download, LogOut, Search } from "lucide-react-native";
import { TextInput } from "react-native";
import { supabase as supabaseClient } from "../../../services/supabase";
import { colors } from "../../../constants/colors";
import HistoryListItem from "../../../components/HistoryListItem";
import { HistoryItem } from "../../../types";

export default function HistoryScreen() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = useCallback(async () => {
    try {
      if (!supabaseClient) {
        setHistory([]);
        return;
      }
      const { data: predictions } = await supabaseClient
        .from("predictions")
        .select("id, image_url, prediction, confidence, created_at, worker_id")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (!predictions || predictions.length === 0) {
        setHistory([]);
        return;
      }

      const workerIds = [
        ...new Set(predictions.map((p) => p.worker_id).filter(Boolean)),
      ];
      let workerMap: Record<string, string> = {};
      if (workerIds.length > 0) {
        const { data: workers } = await supabaseClient
          .from("workers")
          .select("id, name")
          .in("id", workerIds);
        if (workers) {
          workerMap = Object.fromEntries(workers.map((w) => [w.id, w.name]));
        }
      }

      const items: HistoryItem[] = predictions.map((p) => ({
        id: p.id,
        image_url: p.image_url,
        prediction: p.prediction,
        confidence: p.confidence,
        worker_name: workerMap[p.worker_id] || "Unknown",
        created_at: p.created_at,
      }));
      setHistory(items);
    } catch {
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const filteredHistory = history.filter((item) => {
    return (
      !searchQuery ||
      item.worker_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.prediction.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  async function handleDelete(id: string) {
    if (!supabaseClient) return;
    await supabaseClient
      .from("predictions")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    setHistory((prev) => prev.filter((h) => h.id !== id));
  }

  async function handleExportCSV() {
    if (filteredHistory.length === 0) {
      Alert.alert("Tidak ada data", "Tidak ada data untuk diekspor.");
      return;
    }

    const header = "Tanggal,Prediksi,Confidence,Pekerja";
    const rows = filteredHistory.map((item) => {
      const date = new Date(item.created_at).toLocaleDateString("id-ID");
      return `${date},${item.prediction},${item.confidence.toFixed(1)}%,${item.worker_name}`;
    });
    const csv = [header, ...rows].join("\n");

    const fileName = `chikenshii_${new Date().toISOString().slice(0, 10)}.csv`;
    const file = new File(Paths.cache, fileName);
    file.write(csv);

    await Sharing.shareAsync(file.uri, {
      mimeType: "text/csv",
      dialogTitle: "Ekspor Riwayat",
      UTI: "public.comma-separated-values-text",
    });
  }

  async function handleLogout() {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
    router.replace("/admin/login");
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="pt-20 px-4 pb-3 border-b border-neutral-border">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <Image
              source={require("../../../assets/logo-chickenshii-nobg.png")}
              className="h-7 w-7"
              resizeMode="contain"
            />
            <Text className="text-xl font-outfit_bold text-primary">Riwayat</Text>
          </View>
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={handleExportCSV}
              activeOpacity={0.7}
              className="flex-row items-center gap-1.5 rounded-lg bg-secondary-soft px-3 py-1.5"
            >
              <Download size={14} color={colors.secondary} />
              <Text className="text-xs font-outfit_bold text-secondary">Export</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} activeOpacity={0.7}>
              <LogOut size={20} color={colors.danger} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <View className="flex-row items-center bg-neutral-card border border-neutral-border rounded-xl px-3 py-2.5">
          <Search size={18} color={colors.muted} />
          <TextInput
            className="flex-1 ml-2 text-neutral-foreground text-sm"
            placeholder="Cari pekerja atau prediksi..."
            placeholderTextColor="#9CA3AF"
            onChangeText={setSearchQuery}
            accessibilityLabel="Cari riwayat"
          />
        </View>
      </View>

      {/* List */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredHistory}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <HistoryListItem item={item} onDelete={handleDelete} />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ListEmptyComponent={
            <Text className="text-center text-neutral-muted mt-10">
              Belum ada riwayat
            </Text>
          }
        />
      )}
    </View>
  );
}
