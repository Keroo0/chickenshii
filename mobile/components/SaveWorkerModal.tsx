import { useState } from 'react'
import { View, Text, Pressable, Modal, ActivityIndicator } from 'react-native'
import { Check, Users } from 'lucide-react-native'
import { colors } from '../constants/colors'

interface SaveWorkerModalProps {
  visible: boolean
  onClose: () => void
  onConfirm: (workerId: string) => void
  workers: Array<{ id: string; name: string }>
  loading?: boolean
}

export default function SaveWorkerModal({
  visible,
  onClose,
  onConfirm,
  workers,
  loading,
}: SaveWorkerModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const handleConfirm = () => {
    if (selectedId) {
      onConfirm(selectedId)
      setSelectedId(null)
    }
  }

  const handleClose = () => {
    setSelectedId(null)
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose} accessibilityViewIsModal>
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <View className="w-full rounded-2xl bg-white p-5">
          <Text className="mb-1 text-lg font-outfit_bold text-neutral-foreground">
            Pilih Pekerja
          </Text>
          <Text className="mb-4 text-sm text-neutral-muted">
            Pilih pekerja yang melakukan prediksi
          </Text>

          {loading ? (
            <View className="h-40 items-center justify-center">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : workers.length === 0 ? (
            <View className="h-40 items-center justify-center gap-3">
              <Users size={32} color={colors.muted} />
              <Text className="text-sm text-neutral-muted text-center">
                Belum ada pekerja aktif{'\n'}Tambahkan pekerja terlebih dahulu
              </Text>
            </View>
          ) : (
            <View className="mb-4 max-h-60 gap-1">
              {workers.map((worker) => {
                const isSelected = selectedId === worker.id
                return (
                  <Pressable
                    key={worker.id}
                    onPress={() => setSelectedId(worker.id)}
                    className={`flex-row items-center justify-between rounded-xl px-4 py-3 ${
                      isSelected ? 'bg-primary-soft' : ''
                    }`}
                    accessibilityLabel={`Pekerja ${worker.name}`}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text
                      className={`text-sm ${
                        isSelected
                          ? 'font-outfit_bold text-primary'
                          : 'text-neutral-foreground'
                      }`}
                    >
                      {worker.name}
                    </Text>
                    {isSelected && <Check size={18} color={colors.primary} />}
                  </Pressable>
                )
              })}
            </View>
          )}

          <View className="gap-2">
            <Pressable
              onPress={handleConfirm}
              disabled={!selectedId || loading || workers.length === 0}
              className={`h-12 items-center justify-center rounded-xl ${
                selectedId ? 'bg-primary' : 'bg-neutral-muted-soft'
              }`}
            >
              <Text
                className={`text-sm font-outfit_bold ${
                  selectedId ? 'text-white' : 'text-neutral-muted'
                }`}
              >
                Konfirmasi
              </Text>
            </Pressable>
            <Pressable
              onPress={handleClose}
              className="h-12 items-center justify-center rounded-xl"
            >
              <Text className="text-sm font-outfit_bold text-neutral-muted">
                Batal
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}
