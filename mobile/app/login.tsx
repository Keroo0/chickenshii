import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Eye, EyeOff, XCircle } from "lucide-react-native";

import DecorativeBackground from "../components/DecorativeBackground";
import { colors } from "../constants/colors";
import { useAuth } from "../providers/AuthProvider";
import { supabase } from "../services/supabase";
import { getRoleFromUser, getRoleHomeRoute } from "../utils/auth";

export default function LoginScreen() {
  const router = useRouter();
  const { initialized, session, role } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clearingInvalidSession, setClearingInvalidSession] = useState(false);
  const [sessionResolutionError, setSessionResolutionError] = useState<
    string | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const invalidSessionSignOutRef = useRef<Promise<void> | null>(null);

  const clearUnsupportedSession = useCallback(async (): Promise<void> => {
    if (invalidSessionSignOutRef.current) {
      await invalidSessionSignOutRef.current;
      return;
    }

    setClearingInvalidSession(true);
    setSessionResolutionError(null);
    const operation = (async () => {
      if (!supabase) throw new Error("Supabase client tidak tersedia");
      const { error: signOutError } = await supabase.auth.signOut({
        scope: "local",
      });
      if (signOutError) throw signOutError;
    })();
    invalidSessionSignOutRef.current = operation;

    try {
      await operation;
    } finally {
      if (invalidSessionSignOutRef.current === operation) {
        invalidSessionSignOutRef.current = null;
        setClearingInvalidSession(false);
      }
    }
  }, []);

  useEffect(() => {
    const homeRoute = getRoleHomeRoute(role);
    if (!initialized) return;
    if (!session) {
      setSessionResolutionError(null);
      return;
    }
    if (homeRoute) {
      setSessionResolutionError(null);
      router.replace(homeRoute);
      return;
    }
    void clearUnsupportedSession().catch(() => {
      setSessionResolutionError(
        "Sesi akun tanpa role yang valid belum dapat diakhiri. Coba lagi untuk kembali ke halaman masuk.",
      );
    });
  }, [clearUnsupportedSession, initialized, role, router, session]);

  const handleRetrySessionCleanup = useCallback(() => {
    void clearUnsupportedSession().catch(() => {
      setSessionResolutionError(
        "Sesi akun tanpa role yang valid belum dapat diakhiri. Coba lagi untuk kembali ke halaman masuk.",
      );
    });
  }, [clearUnsupportedSession]);

  async function handleLogin() {
    setError(null);
    setSessionResolutionError(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setError("Email dan password harus diisi");
      return;
    }
    if (!supabase) {
      setError("Koneksi database tidak tersedia");
      return;
    }

    setLoading(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (signInError) {
        if (signInError.message.includes("Invalid login")) {
          setError("Email atau password salah");
        } else if (signInError.message.includes("Email not confirmed")) {
          setError("Email belum diverifikasi");
        } else {
          setError(signInError.message);
        }
        return;
      }

      const signedInRole = getRoleFromUser(data.user);
      const homeRoute = getRoleHomeRoute(signedInRole);
      if (!homeRoute) {
        try {
          await clearUnsupportedSession();
          setError("Akun ini tidak memiliki akses ke area staf");
        } catch {
          setSessionResolutionError(
            "Sesi akun tanpa role yang valid belum dapat diakhiri. Coba lagi untuk kembali ke halaman masuk.",
          );
        }
        return;
      }

      router.replace(homeRoute);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Gagal terhubung ke layanan autentikasi",
      );
    } finally {
      setLoading(false);
    }
  }

  const activeHomeRoute = getRoleHomeRoute(role);
  const hasUnsupportedSession = Boolean(session && !activeHomeRoute);

  if (
    !initialized ||
    clearingInvalidSession ||
    Boolean(session && activeHomeRoute) ||
    (hasUnsupportedSession && !sessionResolutionError)
  ) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-white">
        <Image
          source={require("../assets/logo-chickenshii-nobg.png")}
          className="h-16 w-16"
          resizeMode="contain"
          accessibilityLabel="Logo ChickenShii"
        />
        <ActivityIndicator
          size="small"
          color={colors.primary}
          accessibilityLabel="Memeriksa sesi staf"
        />
        <Text className="text-sm font-outfit_medium text-neutral-muted">
          Memeriksa sesi staf...
        </Text>
      </View>
    );
  }

  if (hasUnsupportedSession && sessionResolutionError) {
    return (
      <View
        className="flex-1 items-center justify-center bg-white px-6"
        accessibilityLiveRegion="assertive"
      >
        <View className="h-14 w-14 items-center justify-center rounded-full bg-danger-soft">
          <XCircle size={28} color={colors.danger} />
        </View>
        <Text className="mt-4 text-center text-lg font-outfit_bold text-neutral-foreground">
          Sesi belum dapat diakhiri
        </Text>
        <Text className="mt-2 text-center text-sm font-outfit_medium leading-5 text-neutral-muted">
          {sessionResolutionError}
        </Text>
        <TouchableOpacity
          onPress={handleRetrySessionCleanup}
          disabled={clearingInvalidSession}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Coba akhiri sesi lagi"
          accessibilityState={{ disabled: clearingInvalidSession }}
          className="mt-6 min-h-12 min-w-40 items-center justify-center rounded-xl bg-primary px-5"
        >
          <Text className="text-sm font-outfit_bold text-white">Coba lagi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <DecorativeBackground />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-4 pt-14">
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            className="h-11 w-11 items-center justify-center rounded-full bg-neutral-muted-soft"
            accessibilityRole="button"
            accessibilityLabel="Kembali"
          >
            <ArrowLeft size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <View className="px-6 pt-10">
          <View className="mb-8 items-center gap-3">
            <View className="h-20 w-20 items-center justify-center rounded-3xl bg-primary-soft">
              <Image
                source={require("../assets/logo-chickenshii-nobg.png")}
                className="h-14 w-14"
                resizeMode="contain"
                accessibilityLabel="Logo ChickenShii"
              />
            </View>
            <View className="items-center gap-1">
              <Text className="text-3xl font-outfit_black tracking-tight text-primary">
                Area Staf
              </Text>
              <Text className="text-center text-sm font-outfit_medium text-neutral-muted">
                Masuk sesuai peran untuk melanjutkan
              </Text>
            </View>
          </View>

          {error && (
            <View className="mb-4 flex-row items-center gap-2 rounded-xl border border-danger/30 bg-danger-soft p-3">
              <XCircle size={18} color={colors.danger} />
              <Text className="flex-1 text-sm text-danger">{error}</Text>
            </View>
          )}

          <View className="gap-5">
            <View>
              <Text className="mb-2 ml-1 text-sm font-outfit_bold text-neutral-foreground">
                Email
              </Text>
              <TextInput
                className="rounded-2xl border border-transparent bg-neutral-muted-soft px-5 py-4 text-base font-outfit_medium text-neutral-foreground focus:border-primary focus:bg-white"
                placeholder="nama@chikenshii.com"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Email"
              />
            </View>

            <View>
              <Text className="mb-2 ml-1 text-sm font-outfit_bold text-neutral-foreground">
                Password
              </Text>
              <View className="relative">
                <TextInput
                  className="rounded-2xl border border-transparent bg-neutral-muted-soft px-5 py-4 pr-14 text-base font-outfit_medium text-neutral-foreground focus:border-primary focus:bg-white"
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  accessibilityLabel="Password"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((visible) => !visible)}
                  className="absolute right-2 top-1 h-12 w-12 items-center justify-center"
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={colors.muted} />
                  ) : (
                    <Eye size={20} color={colors.muted} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              className={`min-h-14 items-center justify-center rounded-2xl bg-primary ${
                loading ? "opacity-60" : ""
              }`}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Masuk"
            >
              <Text className="text-center text-base font-outfit_bold tracking-wide text-white">
                {loading ? "Memproses..." : "Masuk"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
