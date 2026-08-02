import { Stack } from "expo-router";

import RoleGuard from "../../components/RoleGuard";

export default function HeadWorkerLayout() {
  return (
    <RoleGuard requiredRole="head_worker">
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </RoleGuard>
  );
}
