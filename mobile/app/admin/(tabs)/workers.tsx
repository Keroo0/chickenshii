import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Switch,
  ActivityIndicator,
  Image,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { LogOut } from "lucide-react-native";
import { supabase as supabaseClient } from "../../../services/supabase";
import { colors } from "../../../constants/colors";
import DecorativeBackground from "../../../components/DecorativeBackground";
import { Worker } from "../../../types";

export default function WorkersScreen() {
  const router = useRouter();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkers = useCallback(async () => {
    if (!supabaseClient) return;
    try {
      const { data } = await supabaseClient
        .from("workers")
        .select("id, name, is_active")
        .order("name");
      if (data) setWorkers(data);
    } catch {
      setError("Gagal memuat data pekerja");
    }
  }, []);

  useEffect(() => {
    fetchWorkers().finally(() => setLoading(false));
  }, [fetchWorkers]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWorkers();
    setRefreshing(false);
  };

  async function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    setAdding(true);
    setError(null);
    if (!supabaseClient) return;
    const { error } = await supabaseClient.from("workers").insert({ name });
    setAdding(false);
    if (error) {
      setError(error.message);
      return;
    }
    setNewName("");
    fetchWorkers();
  }

  async function handleToggle(id: string, current: boolean) {
    if (!supabaseClient) return;
    await supabaseClient.from("workers").update({ is_active: !current }).eq("id", id);
    setWorkers((prev) =>
      prev.map((w) => (w.id === id ? { ...w, is_active: !current } : w))
    );
  }

  async function handleLogout() {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
    router.replace("/admin/login");
  }

  return (
    <View className="flex-1 bg-white">
      <DecorativeBackground />
      {/* Header */}
      <View className="pt-20 px-4 pb-3 border-b border-neutral-border">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Image
              source={require("../../../assets/logo-chickenshii-nobg.png")}
              className="h-7 w-7"
              resizeMode="contain"
            />
            <Text className="text-xl font-outfit_bold text-primary">Pekerja</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} activeOpacity={0.7}>
            <LogOut size={20} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-1 px-4 pt-4">
        {/* Add Worker Form */}
        <View className="flex-row mb-4">
          <TextInput
            className="flex-1 bg-neutral-muted-soft border border-transparent rounded-xl px-4 py-3 text-neutral-foreground"
            placeholder="Nama pekerja baru"
            placeholderTextColor="#9CA3AF"
            value={newName}
            onChangeText={setNewName}
            accessibilityLabel="Nama pekerja baru"
          />
          <TouchableOpacity
            className={`bg-primary rounded-xl px-5 py-3 ml-2 ${
              adding || !newName.trim() ? "opacity-60" : ""
            }`}
            onPress={handleAdd}
            disabled={adding || !newName.trim()}
            activeOpacity={0.8}
            accessibilityLabel="Tambah pekerja"
          >
            <Text className="text-white font-outfit_bold">Tambah</Text>
          </TouchableOpacity>
        </View>

        {/* Error */}
        {error && (
          <View className="mb-3 rounded-xl border border-danger/30 bg-danger-soft p-3">
            <Text className="text-sm text-danger">{error}</Text>
          </View>
        )}

        {/* Workers List */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={workers}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            renderItem={({ item }) => (
              <View className="flex-row items-center justify-between py-3 px-4 bg-neutral-card rounded-xl mb-2 border border-neutral-border">
                <Text className="text-neutral-foreground font-outfit_medium flex-1">
                  {item.name}
                </Text>
                <Switch
                  value={item.is_active ?? false}
                  onValueChange={() => handleToggle(item.id, item.is_active ?? false)}
                  trackColor={{ false: "#E5E7EB", true: colors.healthy }}
                  thumbColor="#FFFFFF"
                  accessibilityLabel={`Aktifkan ${item.name}`}
                />
              </View>
            )}
            contentContainerStyle={{ paddingBottom: 100 }}
            ListEmptyComponent={
              <Text className="text-center text-neutral-muted mt-10">
                Belum ada pekerja
              </Text>
            }
          />
        )}
      </View>
    </View>
  );
}
