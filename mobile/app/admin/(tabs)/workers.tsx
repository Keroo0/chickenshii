import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import axios from "axios";
import { useRouter } from "expo-router";
import { CheckCircle, LogOut } from "lucide-react-native";

import DecorativeBackground from "../../../components/DecorativeBackground";
import { colors } from "../../../constants/colors";
import { useAuth } from "../../../providers/AuthProvider";
import staffApi from "../../../services/staffApi";
import { supabase as supabaseClient } from "../../../services/supabase";
import type { Worker } from "../../../types";
import {
  validateStaffAccountForm,
  type CreatableStaffRole,
  type StaffAccountFormInput,
} from "../../../utils/staffAccount";

type UserSection = "workers" | "staff";

const EMPTY_STAFF_FORM: StaffAccountFormInput = {
  full_name: "",
  email: "",
  password: "",
  role: "veterinarian",
};

const STAFF_ROLES: { label: string; value: CreatableStaffRole }[] = [
  { label: "Dokter Hewan", value: "veterinarian" },
  { label: "Kepala Kandang", value: "head_worker" },
];

export default function WorkersScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [section, setSection] = useState<UserSection>("workers");
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [workerError, setWorkerError] = useState<string | null>(null);
  const [staffForm, setStaffForm] = useState<StaffAccountFormInput>(EMPTY_STAFF_FORM);
  const [creatingStaff, setCreatingStaff] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [staffSuccess, setStaffSuccess] = useState<string | null>(null);

  const fetchWorkers = useCallback(async () => {
    if (!supabaseClient) return;
    try {
      const { data, error } = await supabaseClient
        .from("workers")
        .select("id, name, is_active")
        .order("name");
      if (error) throw error;
      if (data) setWorkers(data);
    } catch {
      setWorkerError("Gagal memuat data pekerja");
    }
  }, []);

  useEffect(() => {
    fetchWorkers().finally(() => setLoading(false));
  }, [fetchWorkers]);

  async function onRefresh() {
    setRefreshing(true);
    await fetchWorkers();
    setRefreshing(false);
  }

  async function handleAdd() {
    const name = newName.trim();
    if (!name || !supabaseClient) return;
    setAdding(true);
    setWorkerError(null);
    try {
      const { error } = await supabaseClient.from("workers").insert({ name });
      if (error) {
        setWorkerError(error.message);
        return;
      }
      setNewName("");
      await fetchWorkers();
    } finally {
      setAdding(false);
    }
  }

  async function handleToggle(id: string, current: boolean) {
    if (!supabaseClient) return;
    const { error } = await supabaseClient
      .from("workers")
      .update({ is_active: !current })
      .eq("id", id);
    if (error) {
      setWorkerError(error.message);
      return;
    }
    setWorkers((previous) =>
      previous.map((worker) =>
        worker.id === id ? { ...worker, is_active: !current } : worker,
      ),
    );
  }

  function updateStaffForm<Key extends keyof StaffAccountFormInput>(
    key: Key,
    value: StaffAccountFormInput[Key],
  ) {
    setStaffForm((current) => ({ ...current, [key]: value }));
  }

  async function handleCreateStaff() {
    setStaffError(null);
    setStaffSuccess(null);
    const validation = validateStaffAccountForm(staffForm);
    if (!validation.ok) {
      setStaffError(Object.values(validation.errors).join("\n"));
      return;
    }

    setCreatingStaff(true);
    try {
      await staffApi.post("/api/v1/staff-accounts", validation.data);
      setStaffForm(EMPTY_STAFF_FORM);
      setStaffSuccess("Akun staf berhasil dibuat");
    } catch (requestError) {
      if (axios.isAxiosError(requestError)) {
        const detail = requestError.response?.data?.detail;
        setStaffError(
          typeof detail === "string"
            ? detail
            : requestError.message || "Gagal membuat akun staf",
        );
      } else {
        setStaffError("Gagal membuat akun staf");
      }
    } finally {
      setCreatingStaff(false);
    }
  }

  async function handleLogout() {
    await signOut();
    router.replace("/login");
  }

  return (
    <View className="flex-1 bg-white">
      <DecorativeBackground />
      <View className="border-b border-neutral-border px-4 pb-3 pt-20">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Image
              source={require("../../../assets/logo-chickenshii-nobg.png")}
              className="h-7 w-7"
              resizeMode="contain"
            />
            <Text className="text-xl font-outfit_bold text-primary">Pengguna</Text>
          </View>
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.7}
            className="h-11 w-11 items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Keluar"
          >
            <LogOut size={20} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <View className="px-4 pt-4">
        <View className="flex-row rounded-xl bg-neutral-muted-soft p-1">
          {([
            { label: "Pekerja Kandang", value: "workers" as const },
            { label: "Akun Staf", value: "staff" as const },
          ]).map((item) => {
            const selected = section === item.value;
            return (
              <TouchableOpacity
                key={item.value}
                onPress={() => setSection(item.value)}
                activeOpacity={0.8}
                className={`min-h-11 flex-1 items-center justify-center rounded-lg px-2 ${
                  selected ? "bg-white" : ""
                }`}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                accessibilityLabel={item.label}
              >
                <Text
                  className={`text-center text-sm font-outfit_bold ${
                    selected ? "text-primary" : "text-neutral-muted"
                  }`}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {section === "workers" ? (
        <View className="flex-1 px-4 pt-4">
          <View className="mb-4 flex-row">
            <TextInput
              className="flex-1 rounded-xl border border-transparent bg-neutral-muted-soft px-4 py-3 text-neutral-foreground"
              placeholder="Nama pekerja baru"
              placeholderTextColor="#9CA3AF"
              value={newName}
              onChangeText={setNewName}
              accessibilityLabel="Nama pekerja baru"
            />
            <TouchableOpacity
              className={`ml-2 min-h-11 justify-center rounded-xl bg-primary px-5 py-3 ${
                adding || !newName.trim() ? "opacity-60" : ""
              }`}
              onPress={handleAdd}
              disabled={adding || !newName.trim()}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Tambah pekerja"
            >
              <Text className="font-outfit_bold text-white">
                {adding ? "Menambah..." : "Tambah"}
              </Text>
            </TouchableOpacity>
          </View>

          {workerError && (
            <View className="mb-3 rounded-xl border border-danger/30 bg-danger-soft p-3">
              <Text className="text-sm text-danger">{workerError}</Text>
            </View>
          )}

          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <FlatList
              data={workers}
              keyExtractor={(item) => item.id}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              renderItem={({ item }) => (
                <View className="mb-2 flex-row items-center justify-between rounded-xl border border-neutral-border bg-neutral-card px-4 py-3">
                  <Text className="flex-1 font-outfit_medium text-neutral-foreground">
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
                <Text className="mt-10 text-center text-neutral-muted">Belum ada pekerja</Text>
              }
            />
          )}
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-4 pt-4"
          contentContainerStyle={{ paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="rounded-2xl border border-neutral-border bg-white p-4">
            <Text className="text-lg font-outfit_bold text-primary">Buat Akun Staf</Text>
            <Text className="mb-5 mt-1 text-sm font-outfit_medium text-neutral-muted">
              Akun baru dapat digunakan dokter hewan atau kepala kandang untuk masuk.
            </Text>

            {staffError && (
              <View className="mb-4 rounded-xl border border-danger/30 bg-danger-soft p-3">
                <Text className="text-sm leading-5 text-danger">{staffError}</Text>
              </View>
            )}
            {staffSuccess && (
              <View className="mb-4 flex-row items-center gap-2 rounded-xl border border-healthy/30 bg-healthy-soft p-3">
                <CheckCircle size={18} color={colors.healthy} />
                <Text className="flex-1 text-sm text-healthy">{staffSuccess}</Text>
              </View>
            )}

            <View className="gap-4">
              <View>
                <Text className="mb-2 text-sm font-outfit_bold text-neutral-foreground">
                  Nama lengkap
                </Text>
                <TextInput
                  className="min-h-12 rounded-xl bg-neutral-muted-soft px-4 py-3 text-neutral-foreground"
                  value={staffForm.full_name}
                  onChangeText={(value) => updateStaffForm("full_name", value)}
                  placeholder="Nama lengkap staf"
                  placeholderTextColor="#9CA3AF"
                  accessibilityLabel="Nama lengkap staf"
                />
              </View>

              <View>
                <Text className="mb-2 text-sm font-outfit_bold text-neutral-foreground">Email</Text>
                <TextInput
                  className="min-h-12 rounded-xl bg-neutral-muted-soft px-4 py-3 text-neutral-foreground"
                  value={staffForm.email}
                  onChangeText={(value) => updateStaffForm("email", value)}
                  onBlur={() => updateStaffForm("email", staffForm.email.trim().toLowerCase())}
                  placeholder="staf@chikenshii.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel="Email staf"
                />
              </View>

              <View>
                <Text className="mb-2 text-sm font-outfit_bold text-neutral-foreground">
                  Password
                </Text>
                <TextInput
                  className="min-h-12 rounded-xl bg-neutral-muted-soft px-4 py-3 text-neutral-foreground"
                  value={staffForm.password}
                  onChangeText={(value) => updateStaffForm("password", value)}
                  placeholder="Minimal 8 karakter"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  accessibilityLabel="Password staf"
                />
              </View>

              <View>
                <Text className="mb-2 text-sm font-outfit_bold text-neutral-foreground">Peran</Text>
                <View className="flex-row gap-2">
                  {STAFF_ROLES.map((item) => {
                    const selected = staffForm.role === item.value;
                    return (
                      <TouchableOpacity
                        key={item.value}
                        onPress={() => updateStaffForm("role", item.value)}
                        activeOpacity={0.8}
                        className={`min-h-12 flex-1 items-center justify-center rounded-xl border px-2 ${
                          selected
                            ? "border-secondary bg-secondary-soft"
                            : "border-neutral-border bg-white"
                        }`}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        accessibilityLabel={item.label}
                      >
                        <Text
                          className={`text-center text-sm font-outfit_bold ${
                            selected ? "text-secondary" : "text-neutral-muted"
                          }`}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <TouchableOpacity
                onPress={handleCreateStaff}
                disabled={creatingStaff}
                activeOpacity={0.8}
                className={`mt-2 min-h-14 items-center justify-center rounded-xl bg-primary ${
                  creatingStaff ? "opacity-60" : ""
                }`}
                accessibilityRole="button"
                accessibilityLabel="Buat akun staf"
              >
                <Text className="font-outfit_bold text-white">
                  {creatingStaff ? "Membuat akun..." : "Buat Akun"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
