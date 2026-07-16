import { View, Text, Image } from 'react-native'

interface Props {
  uri: string
  prediction?: { label: string; confidence: number }
}

export default function UploadedImageCard({ uri, prediction }: Props) {
  return (
    <View className="overflow-hidden rounded-xl border border-neutral-border bg-primary-soft/30">
      <Image
        source={{ uri }}
        style={{ height: 250 }}
        resizeMode="contain"
      />
      {prediction && (
        <View className="absolute left-3 top-3 rounded-lg bg-black/70 px-3 py-1.5">
          <Text className="text-xs font-outfit_bold text-white">
            {prediction.label}{' '}
            {prediction.confidence.toFixed(1)}%
          </Text>
        </View>
      )}
    </View>
  )
}
