import { View, Text } from 'react-native'
import { CircleAlert } from 'lucide-react-native'
import { colors } from '../constants/colors'

export default function LowConfidenceWarning() {
  return (
    <View className="flex-row items-start gap-3 rounded-xl border border-danger/30 bg-danger-soft p-3">
      <CircleAlert size={20} color={colors.danger} className="mt-0.5" />
      <View className="flex-1 gap-1">
        <Text className="text-sm font-outfit_bold text-danger">
          Confidence Rendah
        </Text>
        <Text className="text-xs leading-4 text-neutral-muted">
          Hasil kurang meyakinkan. Disarankan mengambil ulang foto dengan
          pencahayaan dan framing yang lebih baik.
        </Text>
      </View>
    </View>
  )
}
