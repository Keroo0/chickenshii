import { View, Text } from 'react-native'
import { HeartHandshake } from 'lucide-react-native'
import { colors } from '../constants/colors'

interface RecommendationCardProps {
  actions: string[]
}

export default function RecommendationCard({ actions }: RecommendationCardProps) {
  return (
    <View className="bg-healthy-soft rounded-3xl p-5">
      <View className="mb-4 flex-row items-center gap-2.5">
        <HeartHandshake size={20} color={colors.healthy} />
        <Text className="text-lg font-outfit_bold tracking-tight text-healthy">
          Penanganan Awal
        </Text>
      </View>
      <View className="gap-3">
        {actions.map((action, index) => (
          <View key={index} className="flex-row items-start gap-3">
            <View className="h-6 w-6 rounded-full bg-healthy items-center justify-center mt-0.5">
              <Text className="text-xs font-outfit_bold text-white">{index + 1}</Text>
            </View>
            <Text className="flex-1 text-sm font-outfit_medium leading-relaxed text-healthy">
              {action}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}
