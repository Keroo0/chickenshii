import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { LineChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";
import { Microscope, Syringe, Bug, LogOut, ChevronRight } from "lucide-react-native";
import { supabase } from "../../../services/supabase";
import { colors, diseaseColors } from "../../../constants/colors";
import DecorativeBackground from "../../../components/DecorativeBackground";
import HistoryListItem from "../../../components/HistoryListItem";
import { HistoryItem } from "../../../types";

const DISEASES = ["Salmonellosis", "New Castle Disease", "Coccidiosis"] as const;

const DISEASE_ICONS: Record<string, typeof Microscope> = {
  Salmonellosis: Microscope,
  "New Castle Disease": Syringe,
  Coccidiosis: Bug,
};

const PERIODS = [
  { label: "Mingguan", value: "week" as const },
  { label: "Bulanan", value: "month" as const },
  { label: "Tahunan", value: "year" as const },
];

const screenWidth = Dimensions.get("window").width;

export default function OverviewScreen() {
  const router = useRouter();
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);
  const [diseaseCounts, setDiseaseCounts] = useState<Record<string, number>>({});
  const [chartData, setChartData] = useState<{ labels: string[]; data: number[][] }>({
    labels: [],
    data: [[], [], []],
  });
  const [recentHistory, setRecentHistory] = useState<HistoryItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const now = new Date();
    let startDate: Date;
    let labels: string[] = [];

    if (period === "week") {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        labels.push(d.toLocaleDateString("id-ID", { weekday: "short" }));
      }
    } else if (period === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i += Math.ceil(daysInMonth / 6)) {
        labels.push(`${i}`);
      }
    } else {
      startDate = new Date(now.getFullYear(), 0, 1);
      labels = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    }

    try {
      const { data: predictions } = await supabase
        .from("predictions")
        .select("id, prediction, created_at")
        .is("deleted_at", null)
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true });

      if (!predictions || predictions.length === 0) {
        setDiseaseCounts({});
        const emptyData = labels.map(() => 0);
        setChartData({ labels, data: [emptyData, emptyData, emptyData] });
        return;
      }

      // Count diseases
      const counts: Record<string, number> = {};
      for (const p of predictions) {
        if (DISEASES.includes(p.prediction as any)) {
          counts[p.prediction] = (counts[p.prediction] || 0) + 1;
        }
      }
      setDiseaseCounts(counts);

      // Build chart data
      const chartArrays: number[][] = [[], [], []];
      
      if (period === "week") {
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          const dayStr = d.toISOString().slice(0, 10);
          DISEASES.forEach((disease, idx) => {
            const count = predictions.filter(
              (p) => p.prediction === disease && p.created_at.slice(0, 10) === dayStr
            ).length;
            chartArrays[idx].push(count);
          });
        }
      } else if (period === "month") {
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const step = Math.ceil(daysInMonth / 6);
        for (let i = 1; i <= daysInMonth; i += step) {
          const dayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
          DISEASES.forEach((disease, idx) => {
            const count = predictions.filter(
              (p) => p.prediction === disease && p.created_at.slice(0, 10) === dayStr
            ).length;
            chartArrays[idx].push(count);
          });
        }
      } else {
        for (let m = 0; m < 12; m++) {
          DISEASES.forEach((disease, idx) => {
            const count = predictions.filter(
              (p) =>
                p.prediction === disease &&
                new Date(p.created_at).getMonth() === m
            ).length;
            chartArrays[idx].push(count);
          });
        }
      }

      setChartData({ labels, data: chartArrays });
      
      // Fetch Recent History (Top 3)
      const { data: recentPreds } = await supabase
        .from("predictions")
        .select("id, image_url, prediction, confidence, created_at, worker_id")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(3);

      if (recentPreds && recentPreds.length > 0) {
        const workerIds = [...new Set(recentPreds.map((p) => p.worker_id).filter(Boolean))];
        let workerMap: Record<string, string> = {};
        if (workerIds.length > 0) {
          const { data: workers } = await supabase
            .from("workers")
            .select("id, name")
            .in("id", workerIds);
          if (workers) {
            workerMap = Object.fromEntries(workers.map((w) => [w.id, w.name]));
          }
        }
        setRecentHistory(
          recentPreds.map((p) => ({
            id: p.id,
            image_url: p.image_url,
            prediction: p.prediction,
            confidence: p.confidence,
            worker_name: workerMap[p.worker_id] || "Unknown",
            created_at: p.created_at,
          }))
        );
      } else {
        setRecentHistory([]);
      }
    } catch {
      setDiseaseCounts({});
      setChartData({ labels, data: [[], [], []] });
      setRecentHistory([]);
    }
  }, [period]);

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/admin/login");
  }

  const currentPeriodLabel = PERIODS.find((p) => p.value === period)?.label || "Bulanan";

  const hasData = chartData.data.some((arr) => arr.length > 0 && arr.some((v) => v > 0));

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ paddingTop: 80, paddingHorizontal: 16, paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <DecorativeBackground />
      {/* Header */}
      <View className="flex-row items-center justify-between mb-6">
        <View className="flex-row items-center gap-2">
          <Image
            source={require("../../../assets/logo-chickenshii-nobg.png")}
            className="h-7 w-7"
            resizeMode="contain"
          />
          <Text className="text-xl font-outfit_bold text-primary">Overview</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} activeOpacity={0.7}>
          <LogOut size={20} color={colors.danger} />
        </TouchableOpacity>
      </View>

      {/* Disease Cards */}
      <View className="flex-row gap-3 mb-6">
        {DISEASES.map((disease) => {
          const dc = diseaseColors[disease];
          const count = diseaseCounts[disease] || 0;
          const Icon = DISEASE_ICONS[disease];
          return (
            <View
              key={disease}
              className="flex-1 rounded-2xl p-4 border"
              style={{ backgroundColor: dc?.soft || colors.mutedSoft, borderColor: dc?.color || colors.border }}
            >
              <View className="flex-row items-center gap-1.5 mb-2">
                <Icon size={14} color={dc?.color || colors.muted} />
                <Text className="text-xs font-outfit_bold" style={{ color: dc?.color || colors.muted }}>
                  {disease}
                </Text>
              </View>
              <Text className="text-2xl font-outfit_bold" style={{ color: dc?.color || colors.foreground }}>
                {count}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Period Filter Dropdown */}
      <View className="mb-4">
        <TouchableOpacity
          onPress={() => setShowPeriodPicker(!showPeriodPicker)}
          activeOpacity={0.7}
          className="flex-row items-center justify-between bg-neutral-card border border-neutral-border rounded-xl px-4 py-3"
        >
          <Text className="text-sm font-outfit_medium text-neutral-foreground">
            {currentPeriodLabel}
          </Text>
          <Text className="text-xs text-neutral-muted">▼</Text>
        </TouchableOpacity>
        {showPeriodPicker && (
          <View className="mt-1 bg-white border border-neutral-border rounded-xl overflow-hidden">
            {PERIODS.map((p) => (
              <TouchableOpacity
                key={p.value}
                onPress={() => {
                  setPeriod(p.value);
                  setShowPeriodPicker(false);
                }}
                activeOpacity={0.7}
                className={`px-4 py-3 border-b border-neutral-border-light ${
                  period === p.value ? "bg-primary-soft" : ""
                }`}
              >
                <Text
                  className={`text-sm font-outfit_medium ${
                    period === p.value ? "text-primary" : "text-neutral-foreground"
                  }`}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Line Chart */}
      {loading ? (
        <View className="h-60 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <View className="bg-neutral-card rounded-2xl p-4 border border-neutral-border mb-4">
          <Text className="text-sm font-outfit_bold text-neutral-foreground mb-3">
            Tren Penyakit
          </Text>
          <LineChart
            data={{
              labels: chartData.labels,
              datasets: DISEASES.map((disease, idx) => {
                const arr = chartData.data[idx];
                const isEmpty = !arr || arr.length === 0 || arr.every(v => v === 0);
                return {
                  data: arr && arr.length > 0 ? arr : chartData.labels.map(() => 0),
                  color: isEmpty ? () => "transparent" : () => diseaseColors[disease]?.color || colors.muted,
                  strokeWidth: isEmpty ? 0 : 2,
                  withDots: !isEmpty,
                };
              }),
            }}
            width={screenWidth - 64}
            height={200}
            yAxisSuffix=""
            yAxisLabel=""
            fromZero
            chartConfig={{
              backgroundColor: "transparent",
              backgroundGradientFrom: colors.card,
              backgroundGradientTo: colors.card,
              decimalPlaces: 0,
              color: () => colors.muted,
              labelColor: () => colors.muted,
              propsForDots: {
                r: "4",
                strokeWidth: "2",
              },
              propsForBackgroundLines: {
                strokeDasharray: "",
                stroke: colors.border,
              },
            }}
            bezier
            style={{ borderRadius: 12 }}
          />
          {/* Legend */}
          <View className="flex-row justify-center gap-4 mt-3">
            {DISEASES.map((disease) => (
              <View key={disease} className="flex-row items-center gap-1.5">
                <View
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: diseaseColors[disease]?.color || colors.muted }}
                />
                <Text className="text-xs text-neutral-muted">
                  {disease}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Recent History Section */}
      <View className="mb-6 mt-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-sm font-outfit_bold text-neutral-foreground">Riwayat Terbaru</Text>
        </View>
        
        {recentHistory.map((item) => (
          <HistoryListItem 
            key={item.id} 
            item={item} 
            onDelete={async (id) => {
              await supabase.from("predictions").update({ deleted_at: new Date().toISOString() }).eq("id", id);
              onRefresh(); // re-fetch data
            }} 
          />
        ))}

        {recentHistory.length > 0 ? (
          <TouchableOpacity 
            onPress={() => router.push("/admin/history")} 
            activeOpacity={0.7}
            className="flex-row items-center justify-center gap-2 py-3 bg-primary-soft rounded-xl border border-primary/20"
          >
            <Text className="text-primary font-outfit_bold text-sm">Tampilkan semua riwayat</Text>
            <ChevronRight size={16} color={colors.primary} />
          </TouchableOpacity>
        ) : (
          <View className="bg-neutral-card rounded-2xl p-8 border border-neutral-border items-center">
            <Text className="text-sm text-neutral-muted">Belum ada riwayat</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
