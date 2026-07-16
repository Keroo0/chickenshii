import { View, Text } from 'react-native'
import { TriangleAlert } from 'lucide-react-native'
import { colors } from '../constants/colors'

export default function DisclaimerBanner() {
  return (
    <View className="flex-row items-start gap-3 rounded-xl border border-warning/20 bg-warning-soft p-3">
      <TriangleAlert size={20} color={colors.warning} className="mt-0.5" />
      <View className="flex-1">
        <Text className="mb-1 text-sm font-outfit_bold text-neutral-foreground">
          Deteksi Dini
        </Text>
        <Text className="text-xs leading-4 text-neutral-muted">
          Hasil ini merupakan dugaan awal dari model AI dan bukan diagnosis
          final. Pemeriksaan dokter hewan tetap diperlukan.
        </Text>
      </View>
    </View>
  )
}
