import { View, Text, Modal, ActivityIndicator } from 'react-native'
import { colors } from '../constants/colors'

interface Props {
  visible: boolean
}

export default function LoadingOverlay({ visible }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 items-center justify-center bg-black/50">
        <View className="items-center gap-4 rounded-2xl bg-white px-8 py-10">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-base font-outfit_bold text-neutral-foreground">
            Mendeteksi Penyakit...
          </Text>
          <Text className="text-center text-sm text-neutral-muted">
            Proses ini mungkin membutuhkan beberapa detik
          </Text>
        </View>
      </View>
    </Modal>
  )
}
