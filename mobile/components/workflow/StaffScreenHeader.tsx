import { ActivityIndicator, Image, Pressable, Text, View } from "react-native";
import { LogOut } from "lucide-react-native";

import { colors } from "../../constants/colors";

export interface StaffScreenHeaderProps {
  title: string;
  subtitle: string;
  onLogout: () => void | Promise<void>;
  logoutBusy?: boolean;
  logoutLabel?: string;
}

export default function StaffScreenHeader({
  title,
  subtitle,
  onLogout,
  logoutBusy = false,
  logoutLabel = "Keluar dari akun",
}: StaffScreenHeaderProps) {
  return (
    <View className="bg-white px-4 pb-5 pt-14">
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1 flex-row items-start gap-3">
          <Image
            source={require("../../assets/logo-chickenshii-nobg.png")}
            className="h-11 w-11"
            resizeMode="contain"
            accessibilityLabel="Logo ChickenShii"
          />
          <View className="min-w-0 flex-1 pt-0.5">
            <Text
              className="text-xl font-outfit_bold tracking-tight text-neutral-foreground"
              accessibilityRole="header"
            >
              {title}
            </Text>
            <Text className="mt-1 text-sm font-outfit_medium leading-5 text-neutral-muted">
              {subtitle}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => void onLogout()}
          disabled={logoutBusy}
          accessibilityRole="button"
          accessibilityLabel={logoutLabel}
          accessibilityHint="Mengakhiri sesi dan kembali ke halaman masuk"
          accessibilityState={{ disabled: logoutBusy, busy: logoutBusy }}
          className="h-11 w-11 items-center justify-center rounded-xl bg-danger-soft active:opacity-70"
          hitSlop={4}
        >
          {logoutBusy ? (
            <ActivityIndicator size="small" color={colors.danger} />
          ) : (
            <LogOut size={20} color={colors.danger} />
          )}
        </Pressable>
      </View>
    </View>
  );
}
