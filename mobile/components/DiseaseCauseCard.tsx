import { View, Text } from 'react-native'
import { AlertTriangle } from 'lucide-react-native'
import { colors } from '../constants/colors'

interface DiseaseCauseCardProps {
  cause: string
}

export default function DiseaseCauseCard({ cause }: DiseaseCauseCardProps) {
  return (
    <View className="bg-warning-soft/50 rounded-3xl p-5 mb-2">
      <View className="mb-2.5 flex-row items-center gap-2.5">
        <AlertTriangle size={20} color={colors.warning} />
        <Text className="text-lg font-outfit_bold tracking-tight text-warning">
          Penyebab
        </Text>
      </View>
      <Text className="text-sm leading-relaxed text-neutral-foreground">
        {cause}
      </Text>
    </View>
  )
}
