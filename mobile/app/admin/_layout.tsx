import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Image } from "react-native";
import { Redirect, Stack, useSegments } from "expo-router";
import { supabase as supabaseClient } from "../../services/supabase";
import { colors } from "../../constants/colors";

export default function AdminLayout() {
  const segments = useSegments();
  const [session, setSession] = useState<boolean | null>(null);

  useEffect(() => {
    if (!supabaseClient) {
      setSession(false);
      return;
    }
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setSession(!!session);
    });
  }, []);

  if (session === null) {
    return (
      <View className="flex-1 items-center justify-center bg-white gap-4">
        <Image
          source={require("../../assets/logo-chickenshii-nobg.png")}
          className="h-16 w-16"
          resizeMode="contain"
        />
        <ActivityIndicator size="small" color={colors.primary} />
        <Text className="text-sm font-outfit_medium text-neutral-muted">
          Memuat dashboard...
        </Text>
      </View>
    );
  }

  const isLoginPage = segments.includes("login");

  if (!session && !isLoginPage) {
    return <Redirect href="/admin/login" />;
  }

  if (session && isLoginPage) {
    return <Redirect href="/admin" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
