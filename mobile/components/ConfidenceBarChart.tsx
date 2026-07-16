import { View, Text } from 'react-native'
import { colors, diseaseColors } from '../constants/colors'

interface Props {
  predictions: Record<string, number>
}

export default function ConfidenceBarChart({ predictions }: Props) {
  const entries = Object.entries(predictions || {})
  if (entries.length === 0) return null

  // Urutkan persentase dari yang tertinggi ke terendah
  const sortedEntries = entries.sort((a, b) => b[1] - a[1])

  return (
    <View className="gap-3">
      <Text className="text-base font-outfit_bold text-neutral-foreground mb-1">
        Persentase Kemungkinan
      </Text>
      
      <View className="gap-4">
        {sortedEntries.map(([label, value]) => {
          const percentage = +(value * 100).toFixed(1)
          const barColor = diseaseColors[label]?.color || colors.primary
          const softColor = diseaseColors[label]?.soft || colors.primarySoft

          return (
            <View key={label} className="flex-col gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-outfit_medium text-neutral-foreground">
                  {label}
                </Text>
                <Text className="text-sm font-outfit_bold" style={{ color: barColor }}>
                  {percentage}%
                </Text>
              </View>
              {/* Latar Belakang Bar */}
              <View 
                className="h-2.5 w-full rounded-full overflow-hidden" 
                style={{ backgroundColor: softColor }}
              >
                {/* Isi Progress Bar */}
                <View 
                  className="h-full rounded-full" 
                  style={{ 
                    width: `${percentage}%`, 
                    backgroundColor: barColor 
                  }} 
                />
              </View>
            </View>
          )
        })}
      </View>
    </View>
  )
}
