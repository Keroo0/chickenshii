import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft, Server, CheckCircle, XCircle, RotateCcw } from "lucide-react-native";

import api, { saveApiUrl } from "../services/api";
import { API_URL } from "../constants/env";
import { colors } from "../constants/colors";
import DecorativeBackground from "../components/DecorativeBackground";

type ConnStatus = "idle" | "testing" | "ok" | "error";

export default function SettingsScreen() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<ConnStatus>("idle");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Show current active URL
    setUrl((api.defaults.baseURL as string) || API_URL);
  }, []);

  async function testConnection() {
    setStatus("testing");
    try {
      const res = await fetch(`${url.replace(/\/+$/, "")}/`, { method: "GET" });
      if (res.ok) {
        setStatus("ok");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  async function handleSave() {
    setSaving(true);
    const trimmed = url.trim();
    await saveApiUrl(trimmed === API_URL ? "" : trimmed);
    setSaving(false);
    Alert.alert("Tersimpan", "URL backend berhasil diperbarui.", [
      { text: "OK", onPress: () => router.back() },
    ]);
  }

  async function handleReset() {
    setUrl(API_URL);
    setStatus("idle");
    await saveApiUrl("");
    Alert.alert("Direset", `URL dikembalikan ke default:\n${API_URL}`);
  }

  const statusIcon =
    status === "ok" ? (
      <CheckCircle size={18} color={colors.healthy} />
    ) : status === "error" ? (
      <XCircle size={18} color={colors.danger} />
    ) : null;

  return (
    <View className="flex-1 bg-white relative">
      <StatusBar style="dark" />
      <DecorativeBackground />

      {/* Header */}
      <View className="border-b border-neutral-border bg-white/90 px-4 pb-3 pt-14 z-10">
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => router.back()}
            className="h-8 w-8 items-center justify-center rounded-full bg-neutral-muted-soft"
          >
            <ArrowLeft size={18} color={colors.foreground} />
          </Pressable>
          <Text className="text-xl font-outfit_bold text-primary">
            Pengaturan
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, gap: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Server URL Section */}
        <View className="gap-3">
          <View className="flex-row items-center gap-2">
            <Server size={18} color={colors.primary} />
            <Text className="text-base font-outfit_bold text-neutral-foreground">
              URL Backend Server
            </Text>
          </View>

          <Text className="text-xs font-outfit_medium text-neutral-muted leading-relaxed">
            URL khusus hanya digunakan untuk deteksi dan penyimpanan pekerja
            tanpa login. Token akun staf hanya dikirim ke server default yang
            ditetapkan saat aplikasi dibangun.
          </Text>

          <TextInput
            value={url}
            onChangeText={(t) => {
              setUrl(t);
              setStatus("idle");
            }}
            placeholder="https://example.up.railway.app"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            className="border border-neutral-border rounded-xl px-4 py-3 text-sm font-outfit_medium text-neutral-foreground bg-white"
          />

          {/* Status indicator */}
          {status !== "idle" && status !== "testing" && (
            <View
              className="flex-row items-center gap-2 rounded-xl px-4 py-3"
              style={{
                backgroundColor:
                  status === "ok" ? colors.healthySoft : colors.dangerSoft,
                borderWidth: 1,
                borderColor:
                  status === "ok" ? colors.healthy + "30" : colors.danger + "30",
              }}
            >
              {statusIcon}
              <Text
                className="text-sm font-outfit_medium"
                style={{
                  color: status === "ok" ? colors.healthy : colors.danger,
                }}
              >
                {status === "ok"
                  ? "Server terhubung!"
                  : "Gagal terhubung ke server"}
              </Text>
            </View>
          )}

          {/* Test Connection */}
          <Pressable
            onPress={testConnection}
            disabled={status === "testing" || !url.trim()}
            className="h-12 flex-row items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary-soft"
            style={{ opacity: !url.trim() ? 0.5 : 1 }}
          >
            {status === "testing" ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Server size={16} color={colors.primary} />
                <Text className="text-sm font-outfit_bold text-primary">
                  Test Koneksi
                </Text>
              </>
            )}
          </Pressable>
        </View>

        <View className="h-px bg-neutral-border" />

        {/* Actions */}
        <View className="gap-3">
          <Pressable
            onPress={handleSave}
            disabled={saving || !url.trim()}
            className="h-14 flex-row items-center justify-center gap-2 rounded-2xl bg-secondary"
            style={{ opacity: !url.trim() ? 0.5 : 1 }}
          >
            {saving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-base font-outfit_black text-white">
                Simpan
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={handleReset}
            className="h-12 flex-row items-center justify-center gap-2 rounded-xl bg-neutral-muted-soft"
          >
            <RotateCcw size={16} color={colors.muted} />
            <Text className="text-sm font-outfit_bold text-neutral-muted">
              Reset ke Default
            </Text>
          </Pressable>

          <Text className="text-xs text-center font-outfit_medium text-neutral-muted mt-2">
            Default: {API_URL}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
