import { Stack } from "expo-router";

import RoleGuard from "../../components/RoleGuard";

export default function DoctorLayout() {
  return (
    <RoleGuard requiredRole="veterinarian">
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </RoleGuard>
  );
}
