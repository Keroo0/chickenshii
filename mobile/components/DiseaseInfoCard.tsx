import { View, Text } from 'react-native'
import { Info } from 'lucide-react-native'
import { colors } from '../constants/colors'

interface DiseaseInfoCardProps {
  description: string
}

export default function DiseaseInfoCard({ description }: DiseaseInfoCardProps) {
  return (
    <View className="bg-neutral-muted-soft rounded-3xl p-5 mb-2">
      <View className="mb-2.5 flex-row items-center gap-2.5">
        <Info size={20} color={colors.primary} />
        <Text className="text-lg font-outfit_bold tracking-tight text-neutral-foreground">
          Pengertian
        </Text>
      </View>
      <Text className="text-sm leading-relaxed text-neutral-muted">
        {description}
      </Text>
    </View>
  )
}
