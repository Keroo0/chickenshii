import { Redirect, Stack, useSegments } from "expo-router";

import RoleGuard from "../../components/RoleGuard";

export default function AdminLayout() {
  const segments = useSegments();

  if (segments.includes("login")) return <Redirect href="/login" />;

  return (
    <RoleGuard requiredRole="admin">
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </RoleGuard>
  );
}
