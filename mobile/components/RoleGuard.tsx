import { useEffect, type PropsWithChildren } from "react";
import { ActivityIndicator, Image, Text, View } from "react-native";
import { Redirect } from "expo-router";

import { colors } from "../constants/colors";
import { useAuth } from "../providers/AuthProvider";
import type { StaffRole } from "../types";
import { getRoleHomeRoute } from "../utils/auth";

interface RoleGuardProps extends PropsWithChildren {
  requiredRole: StaffRole;
}

export default function RoleGuard({ children, requiredRole }: RoleGuardProps) {
  const { initialized, session, role, signOut } = useAuth();

  useEffect(() => {
    if (initialized && session && !role) void signOut();
  }, [initialized, role, session, signOut]);

  if (!initialized) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-white">
        <Image
          source={require("../assets/logo-chickenshii-nobg.png")}
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

  if (!session || !role) return <Redirect href="/login" />;
  if (role !== requiredRole) {
    return <Redirect href={getRoleHomeRoute(role) ?? "/login"} />;
  }

  return children;
}
