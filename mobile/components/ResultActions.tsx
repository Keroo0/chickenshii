import { View, Text, Pressable, ActivityIndicator } from 'react-native'

interface ResultActionsProps {
  onReset: () => void
  onSave: () => void
  saving?: boolean
}

export default function ResultActions({ onReset, onSave, saving }: ResultActionsProps) {
  return (
    <View className="gap-3">
      <Pressable
        onPress={onSave}
        disabled={saving}
        className="h-12 items-center justify-center rounded-xl bg-primary"
      >
        {saving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text className="text-sm font-outfit_bold text-white">Simpan</Text>
        )}
      </Pressable>
      <Pressable
        onPress={onReset}
        disabled={saving}
        className="h-12 items-center justify-center rounded-xl border border-neutral-border"
      >
        <Text className="text-sm font-outfit_bold text-neutral-foreground">
          Foto Ulang
        </Text>
      </Pressable>
    </View>
  )
}
