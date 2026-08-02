import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react-native";
import { supabase as supabaseClient } from "../../services/supabase";
import { colors } from "../../constants/colors";
import DecorativeBackground from "../../components/DecorativeBackground";

export default function AdminLoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  async function handleLogin() {
    setError(null);
    setSuccess(null);

    if (!email || !password) {
      setError("Email dan password harus diisi");
      return;
    }

    if (!supabaseClient) {
      setError("Koneksi database tidak tersedia");
      return;
    }
    setLoading(true);
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      if (error.message.includes("Invalid login")) {
        setError("Email atau password salah");
      } else if (error.message.includes("Email not confirmed")) {
        setError("Email belum diverifikasi");
      } else {
        setError(error.message);
      }
      return;
    }

    setSuccess("Login berhasil!");
    setTimeout(() => router.replace("/admin"), 800);
  }

  async function handleForgotPassword() {
    setError(null);
    setSuccess(null);

    if (!email) {
      setError("Masukkan email terlebih dahulu");
      return;
    }

    if (!supabaseClient) {
      setError("Koneksi database tidak tersedia");
      return;
    }
    setLoading(true);
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: "chikenshii://admin/login",
    });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setResetSent(true);
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
        <View className="pt-14 px-4">
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} className="h-10 w-10 items-center justify-center rounded-full bg-neutral-muted-soft">
            <ArrowLeft size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <View className="px-6 pt-10">
          {/* Branded Header */}
          <View className="items-center mb-8 gap-3">
            <View className="h-20 w-20 items-center justify-center rounded-3xl bg-primary-soft">
              <Image
                source={require("../../assets/logo-chickenshii-nobg.png")}
                className="h-14 w-14"
                resizeMode="contain"
              />
            </View>
            <View className="items-center gap-1">
              <Text className="text-3xl font-outfit_black tracking-tight text-primary">
                Admin Area
              </Text>
              <Text className="text-sm font-outfit_medium text-neutral-muted">
                Masuk untuk mengelola data prediksi
              </Text>
            </View>
          </View>

          {/* Error Message */}
          {error && (
            <View className="flex-row items-center gap-2 rounded-xl border border-danger/30 bg-danger-soft p-3 mb-4">
              <XCircle size={18} color={colors.danger} />
              <Text className="flex-1 text-sm text-danger">{error}</Text>
            </View>
          )}

          {/* Success Message */}
          {success && (
            <View className="flex-row items-center gap-2 rounded-xl border border-healthy/30 bg-healthy-soft p-3 mb-4">
              <CheckCircle size={18} color={colors.healthy} />
              <Text className="flex-1 text-sm text-healthy">{success}</Text>
            </View>
          )}

          {/* Reset Password Sent */}
          {resetSent && (
            <View className="flex-row items-center gap-2 rounded-xl border border-primary/30 bg-primary-soft p-3 mb-4">
              <CheckCircle size={18} color={colors.primary} />
              <Text className="flex-1 text-sm text-primary">
                Link reset password telah dikirim ke email Anda
              </Text>
            </View>
          )}

          {/* Form Area */}
          <View className="gap-5">
            <View>
              <Text className="text-sm font-outfit_bold text-neutral-foreground mb-2 ml-1">
                Email
              </Text>
              <TextInput
                className="bg-neutral-muted-soft border border-transparent focus:border-primary focus:bg-white rounded-2xl px-5 py-4 text-base font-outfit_medium text-neutral-foreground"
                placeholder="admin@chikenshii.com"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View>
              <Text className="text-sm font-outfit_bold text-neutral-foreground mb-2 ml-1">
                Password
              </Text>
              <View className="relative">
                <TextInput
                  className="bg-neutral-muted-soft border border-transparent focus:border-primary focus:bg-white rounded-2xl px-5 py-4 pr-12 text-base font-outfit_medium text-neutral-foreground"
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  activeOpacity={0.7}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={colors.muted} />
                  ) : (
                    <Eye size={20} color={colors.muted} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity onPress={handleForgotPassword} disabled={loading} activeOpacity={0.7}>
              <Text className="text-sm text-primary font-outfit_medium text-right">
                Lupa password?
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`bg-primary rounded-2xl py-4 mt-2 ${
                loading ? "opacity-60" : ""
              }`}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text className="text-white font-outfit_bold text-center text-base tracking-wide">
                {loading ? "Memproses..." : "Masuk"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
