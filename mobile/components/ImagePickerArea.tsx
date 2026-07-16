import { useState } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Camera, Image } from 'lucide-react-native'
import { colors, brown } from '../constants/colors'
import { compressImage } from '../utils/compressImage'

interface Props {
  onImageSelect: (asset: ImagePicker.ImagePickerAsset) => void
  disabled?: boolean
}

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/jpg']
const MAX_SIZE = 5 * 1024 * 1024

export default function ImagePickerArea({ onImageSelect, disabled }: Props) {
  const [loading, setLoading] = useState(false)

  const pick = async (source: 'camera' | 'gallery') => {
    if (loading || disabled) return

    const launcher = source === 'camera'
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync

    const permResult = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (!permResult.granted) {
      alert('Izin akses diperlukan untuk melanjutkan.')
      return
    }

    setLoading(true)
    try {
      const result = await launcher({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      })

      if (result.canceled || !result.assets?.[0]) return

      const asset = result.assets[0]

      if (!ALLOWED_MIME.includes(asset.mimeType ?? '')) {
        alert('Format file tidak didukung. Gunakan JPG atau PNG.')
        return
      }

      if ((asset.fileSize ?? 0) > MAX_SIZE) {
        alert('Ukuran file melebihi 5MB. Kompres gambar terlebih dahulu.')
        return
      }

      const compressedUri = await compressImage(asset.uri)
      onImageSelect({ ...asset, uri: compressedUri })
    } finally {
      setLoading(false)
    }
  }

  const busy = loading || disabled

  return (
    <View className="gap-3">
      <View className="flex-row gap-3">
        <TouchableOpacity
          onPress={() => pick('camera')}
          disabled={busy}
          activeOpacity={0.7}
          className="flex-1 flex-col items-center gap-2 rounded-2xl border-[1.5px] border-brown bg-brown/5 px-4 py-5"
        >
          {busy ? (
            <ActivityIndicator color={brown.DEFAULT} />
          ) : (
            <Camera size={28} color={brown.DEFAULT} />
          )}
          <Text className="text-sm font-outfit_bold text-brown">
            Ambil Foto
          </Text>
          <Text className="text-xs text-brown/60">Kamera</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => pick('gallery')}
          disabled={busy}
          activeOpacity={0.7}
          className="flex-1 flex-col items-center gap-2 rounded-2xl border-[1.5px] border-healthy bg-healthy/5 px-4 py-5"
        >
          {busy ? (
            <ActivityIndicator color={colors.healthy} />
          ) : (
            <Image size={28} color={colors.healthy} />
          )}
          <Text className="text-sm font-outfit_bold text-healthy">
            Dari Galeri
          </Text>
          <Text className="text-xs text-healthy/60">Galeri</Text>
        </TouchableOpacity>
      </View>

      <Text className="text-center text-xs text-neutral-muted">
        Maksimal 5MB · Format JPG/PNG · Khusus foto feses ayam
      </Text>
    </View>
  )
}
