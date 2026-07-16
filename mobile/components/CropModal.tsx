import { useState } from 'react'
import { Modal, View, TouchableOpacity, Text, Dimensions } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  clamp,
} from 'react-native-reanimated'
import { RotateCw, Check, X } from 'lucide-react-native'
import * as ImageManipulator from 'expo-image-manipulator'
import { colors, brown } from '../constants/colors'

interface Props {
  visible: boolean
  uri: string
  onConfirm: (uri: string) => void
  onCancel: () => void
}

const SCREEN = Dimensions.get('window')
const CROP_SIZE = Math.min(SCREEN.width - 48, SCREEN.height * 0.55)

export default function CropModal({ visible, uri, onConfirm, onCancel }: Props) {
  const [rotation, setRotation] = useState(0)
  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)
  const baseX = useSharedValue(0)
  const baseY = useSharedValue(0)

  const pan = Gesture.Pan()
    .onBegin(() => {
      baseX.value = translateX.value
      baseY.value = translateY.value
    })
    .onUpdate((e) => {
      translateX.value = clamp(baseX.value + e.translationX, -CROP_SIZE / 2, CROP_SIZE / 2)
      translateY.value = clamp(baseY.value + e.translationY, -CROP_SIZE / 2, CROP_SIZE / 2)
    })

  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation}deg` },
    ],
  }))

  const handleRotate = () => {
    setRotation((r) => (r + 90) % 360)
  }

  const handleConfirm = async () => {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [
        { rotate: rotation },
        {
          crop: {
            originX: 0,
            originY: 0,
            width: 1024,
            height: 1024,
          },
        },
      ],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    )
    onConfirm(result.uri)
  }

  const handleCancel = () => {
    translateX.value = 0
    translateY.value = 0
    setRotation(0)
    onCancel()
  }

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <View className="flex-1 bg-black">
        <View className="flex-1 items-center justify-center">
          <GestureDetector gesture={pan}>
            <Animated.View
              style={{ width: CROP_SIZE, height: CROP_SIZE }}
              className="overflow-hidden items-center justify-center"
            >
              <Animated.Image
                source={{ uri }}
                style={[
                  {
                    width: CROP_SIZE * 1.5,
                    height: CROP_SIZE * 1.5,
                    resizeMode: 'cover' as const,
                  },
                  imageStyle,
                ]}
              />
            </Animated.View>
          </GestureDetector>

          {/* Crop overlay — border */}
          <View
            pointerEvents="none"
            style={{ width: CROP_SIZE, height: CROP_SIZE }}
            className="absolute border-2 border-white/80 rounded-lg"
          />
          {/* Grid lines */}
          <View pointerEvents="none" style={{ width: CROP_SIZE, height: CROP_SIZE }} className="absolute">
            <View className="absolute left-1/3 top-0 h-full w-px bg-white/30" />
            <View className="absolute left-2/3 top-0 h-full w-px bg-white/30" />
            <View className="absolute top-1/3 left-0 w-full h-px bg-white/30" />
            <View className="absolute top-2/3 left-0 w-full h-px bg-white/30" />
          </View>
        </View>

        <View className="pb-12 pt-4 px-6 gap-4">
          <Text className="text-white/60 text-center text-xs">
            Geser gambar untuk mengatur posisi crop
          </Text>

          <View className="flex-row justify-center gap-6">
            <TouchableOpacity
              onPress={handleCancel}
              className="w-14 h-14 rounded-full bg-white/10 items-center justify-center"
            >
              <X size={24} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleRotate}
              className="w-14 h-14 rounded-full bg-white/10 items-center justify-center"
            >
              <RotateCw size={24} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleConfirm}
              className="w-14 h-14 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.primary }}
            >
              <Check size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}
