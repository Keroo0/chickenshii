import { useState } from "react";
import { View, Text, ScrollView, Pressable, Image } from "react-native";
import { ImagePickerAsset } from "expo-image-picker";
import { Bird, Camera, Scan, ClipboardCheck, LogIn, AlertTriangle, Sparkles } from "lucide-react-native";
import { StatusBar } from "expo-status-bar";
import { Link, useRouter } from "expo-router";

import DecorativeBackground from "../components/DecorativeBackground";
import ImagePickerArea from "../components/ImagePickerArea";
import LoadingOverlay from "../components/LoadingOverlay";
import UploadedImageCard from "../components/UploadedImageCard";
import api from "../services/api";
import { colors } from "../constants/colors";

type Screen = "idle" | "preview";

export default function HomeScreen() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>("idle");
  const [file, setFile] = useState<ImagePickerAsset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleReset() {
    setFile(null);
    setError(null);
    setScreen("idle");
  }

  async function handleDetect() {
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", {
        uri: file.uri,
        name: file.fileName ?? "photo.jpg",
        type: file.mimeType ?? "image/jpeg",
      } as any);

      const response = await fetch(`${api.defaults.baseURL}/api/v1/predict`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Gagal melakukan prediksi");
      }
      
      const data = await response.json();

      if (data.status === "error") {
        setError(data.message || "Gagal melakukan prediksi");
        setScreen("idle");
      } else {
        router.push({
          pathname: "/result",
          params: {
            fileStr: JSON.stringify({
              uri: file.uri,
              fileName: file.fileName ?? "photo.jpg",
              mimeType: file.mimeType ?? "image/jpeg",
            }),
            resultStr: JSON.stringify(data.data),
          },
        });
        setScreen("idle");
        setFile(null);
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        "Gagal terhubung ke server";
      setError(msg);
      setScreen("idle");
    } finally {
      setLoading(false);
    }
  }



  return (
    <View className="flex-1 bg-white relative">
      <StatusBar style="dark" />

      {/* Decorative Background Elements */}
      <DecorativeBackground />

      {/* Header */}
      <View className="border-b border-neutral-border bg-white/90 px-4 pb-3 pt-14">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2.5">
            <Image
              source={require("../assets/logo-chickenshii-nobg.png")}
              className="h-9 w-9"
              resizeMode="contain"
            />
            <Text className="text-xl font-outfit_black tracking-tight">
              <Text className="text-primary">Chicken</Text>
              <Text className="text-foreground">Shii</Text>
            </Text>
          </View>
          <View className="flex-row items-center gap-3">

            <Link href="/admin/login" asChild>
              <Pressable className="h-8 w-8 items-center justify-center rounded-full bg-neutral-muted-soft">
                <LogIn size={16} color={colors.foreground} />
              </Pressable>
            </Link>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, justifyContent: "space-between" }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-6 px-5 pb-8 pt-6">
          {/* ===== IDLE STATE ===== */}
          {screen === "idle" && !loading && (
            <>
              {/* Hero */}
              <View className="items-center gap-3 py-6">
                <Image
                  source={require("../assets/logo-chickenshii-nobg.png")}
                  className="h-28 w-28"
                  resizeMode="contain"
                  accessibilityLabel="Logo ChickenShii"
                />
                <Text className="text-center text-3xl font-outfit_black tracking-tight text-primary mt-3">
                  Deteksi Dini Penyakit Ayam
                </Text>
                <Text className="px-6 text-center text-sm font-outfit_medium text-neutral-muted leading-relaxed">
                  Unggah foto feses ayam untuk mendapatkan analisis cepat dari sistem AI kami.
                </Text>
              </View>

              {/* How to */}
              <View className="gap-3 mb-2">
                {[
                  {
                    icon: Camera,
                    label: "Ambil foto atau pilih dari galeri",
                    sub: "Pastikan foto feses ayam jelas dan terang",
                  },
                  {
                    icon: Scan,
                    label: "AI memindai & menganalisis",
                    sub: "Deteksi otomatis dalam hitungan detik",
                  },
                  {
                    icon: ClipboardCheck,
                    label: "Dapatkan hasil deteksi",
                    sub: "Informasi penyakit & penanganan awal",
                  },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <View
                      key={i}
                      className="flex-row items-center gap-4 rounded-2xl bg-white border border-primary-soft px-5 py-4"
                    >
                      <View className="h-8 w-8 items-center justify-center rounded-full bg-secondary">
                        <Icon size={16} color="white" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-outfit_bold text-primary">
                          {item.label}
                        </Text>
                        <Text className="mt-0.5 text-xs font-outfit_medium text-neutral-muted">
                          {item.sub}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              <ImagePickerArea
                onImageSelect={(asset) => {
                  setFile(asset);
                  setScreen("preview");
                }}
              />

              {/* Early Detection Warning */}
              <View className="flex-row items-center gap-3 rounded-2xl bg-secondary-soft border border-secondary/20 px-4 py-3">
                <AlertTriangle size={18} color={colors.secondary} />
                <Text className="flex-1 text-xs font-outfit_medium text-secondary leading-relaxed">
                  Ini adalah deteksi dini berbasis AI. Hasil belum tentu akurat — konsultasikan dengan dokter hewan untuk diagnosis pasti.
                </Text>
              </View>

              {error && (
                <View className="rounded-xl border border-danger/30 bg-danger-soft p-4">
                  <Text className="text-center text-sm text-danger">
                    {error}
                  </Text>
                </View>
              )}
            </>
          )}

          {/* ===== PREVIEW STATE ===== */}
          {screen === "preview" && file && !loading && (
            <>
              <UploadedImageCard uri={file.uri} />
              <Pressable
                onPress={handleDetect}
                className="h-14 flex-row items-center justify-center gap-2 rounded-2xl bg-secondary mt-2"
              >
                <Scan size={18} color="white" />
                <Text className="text-base font-outfit_black tracking-wide text-white">
                  Mulai Analisis
                </Text>
                <Sparkles size={16} color="white" />
              </Pressable>
              <Pressable
                onPress={handleReset}
                className="h-14 items-center justify-center rounded-2xl bg-neutral-muted-soft"
              >
                <Text className="text-sm font-outfit_bold text-neutral-muted">
                  Batal
                </Text>
              </Pressable>
            </>
          )}

          {/* ===== LOADING ===== */}
          <LoadingOverlay visible={loading} />



          {/* Error on preview */}
          {screen === "idle" && error && file && (
            <>
              <UploadedImageCard uri={file.uri} />
              <View className="rounded-xl border border-danger/30 bg-danger-soft p-4">
                <Text className="text-center text-sm text-danger">{error}</Text>
              </View>
              <Pressable
                onPress={handleReset}
                className="h-14 items-center justify-center rounded-2xl bg-danger-soft border border-danger/20 mt-2"
              >
                <Text className="text-sm font-outfit_bold text-danger">
                  Foto Ulang
                </Text>
              </Pressable>
            </>
          )}
        </View>

        {/* Footer */}
        <View className="border-t border-neutral-border/50 px-5 pb-8 pt-5">
          <Text className="text-center text-xs font-outfit_medium text-neutral-muted">
            © 2026 <Text className="text-primary">Chicken</Text><Text className="text-foreground">Shii</Text> v1.0.0 — Versi Demo
          </Text>
          <Text className="mt-1.5 text-center text-xs text-neutral-muted/80">
            Tidak untuk diagnosis medis · Konsultasi dengan dokter hewan
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
