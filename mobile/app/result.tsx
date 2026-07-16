import { useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ImagePickerAsset } from "expo-image-picker";

import DecorativeBackground from "../components/DecorativeBackground";
import UploadedImageCard from "../components/UploadedImageCard";
import ConfidenceBarChart from "../components/ConfidenceBarChart";
import LowConfidenceWarning from "../components/LowConfidenceWarning";
import DiseaseInfoCard from "../components/DiseaseInfoCard";
import DiseaseCauseCard from "../components/DiseaseCauseCard";
import RecommendationCard from "../components/RecommendationCard";
import DisclaimerBanner from "../components/DisclaimerBanner";
import ResultActions from "../components/ResultActions";
import SaveWorkerModal from "../components/SaveWorkerModal";
import RetrySaveBanner from "../components/RetrySaveBanner";

import api from "../services/api";
import { supabase } from "../services/supabase";
import { diseaseInfo } from "../utils/diseaseInfo";
import { Worker, PredictionResult } from "../types";

export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ fileStr: string; resultStr: string }>();

  let file: ImagePickerAsset | null = null;
  let result: PredictionResult | null = null;

  try {
    if (params.fileStr) file = JSON.parse(params.fileStr);
    if (params.resultStr) result = JSON.parse(params.resultStr);
  } catch (e) {
    console.error("Failed to parse params", e);
  }

  // Save modal state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [workersLoading, setWorkersLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [retryFailed, setRetryFailed] = useState(false);
  const [lastSaveWorkerId, setLastSaveWorkerId] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  function handleReset() {
    router.back();
  }

  async function handleOpenSave() {
    setShowSaveModal(true);
    setWorkersLoading(true);
    try {
      const { data } = await supabase
        .from("workers")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      setWorkers(data ?? []);
    } catch {
      setWorkers([]);
    } finally {
      setWorkersLoading(false);
    }
  }

  async function handleSave(workerId: string) {
    if (!file || !result) return;
    setSaving(true);
    setRetryFailed(false);

    try {
      const formData = new FormData();
      formData.append("file", {
        uri: file.uri,
        name: file.fileName ?? "photo.jpg",
        type: file.mimeType ?? "image/jpeg",
      } as any);
      formData.append("prediction", result.class_name);
      formData.append("confidence", String(result.confidence));
      formData.append(
        "all_predictions",
        JSON.stringify(result.probabilities || {})
      );
      formData.append("worker_id", workerId);

      const response = await fetch(`${api.defaults.baseURL}/api/v1/predictions`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Gagal menyimpan data");
      }

      setShowSaveModal(false);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        // Kembali otomatis ke halaman utama setelah sukses
        router.back();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setShowSaveModal(false);
      setLastSaveWorkerId(workerId);
      setRetryFailed(true);
    } finally {
      setSaving(false);
    }
  }

  async function handleRetrySave() {
    if (!lastSaveWorkerId || !file || !result) return;
    setSaving(true);
    setRetryFailed(false);

    try {
      const formData = new FormData();
      formData.append("file", {
        uri: file.uri,
        name: file.fileName ?? "photo.jpg",
        type: file.mimeType ?? "image/jpeg",
      } as any);
      formData.append("prediction", result.class_name);
      formData.append("confidence", String(result.confidence));
      formData.append(
        "all_predictions",
        JSON.stringify(result.probabilities || {})
      );
      formData.append("worker_id", lastSaveWorkerId);

      const response = await fetch(`${api.defaults.baseURL}/api/v1/predictions`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Gagal menyimpan data");
      }

      setLastSaveWorkerId(null);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        router.back();
      }, 1500);
    } catch (err) {
      console.error(err);
      setRetryFailed(true);
    } finally {
      setSaving(false);
    }
  }

  if (!file || !result) {
    return (
      <View className="flex-1 bg-white items-center justify-center p-5">
        <Text className="text-center font-outfit_medium text-neutral-foreground">
          Data hasil tidak valid. Silakan kembali dan coba lagi.
        </Text>
      </View>
    );
  }

  const disease = diseaseInfo[result.class_name];

  return (
    <View className="flex-1 bg-white relative">
      <StatusBar style="dark" />
      <DecorativeBackground />
      
      <View className="border-b border-neutral-border bg-white/90 px-4 pb-3 pt-14 z-10">
        <Text className="text-xl font-outfit_bold text-center text-primary">
          Hasil Analisis
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
      >
        <View className="gap-6 px-5 pt-6">
          <UploadedImageCard
            uri={file.uri}
            prediction={{
              label: result.class_name,
              confidence: result.confidence,
            }}
          />

          {result.confidence < result.confidence_threshold && (
            <LowConfidenceWarning />
          )}

          <ConfidenceBarChart predictions={result.probabilities} />

          <View className="h-px bg-neutral-border" />

          {disease && (
            <>
              <DiseaseInfoCard description={disease.description} />
              <DiseaseCauseCard cause={disease.cause} />
              <RecommendationCard actions={disease.immediate_action} />
            </>
          )}

          <DisclaimerBanner />

          <ResultActions
            onReset={handleReset}
            onSave={handleOpenSave}
            saving={saving}
          />

          {retryFailed && (
            <RetrySaveBanner onRetry={handleRetrySave} loading={saving} />
          )}

          {saveSuccess && (
            <View className="flex-row items-center justify-center gap-2 rounded-xl border border-healthy/30 bg-healthy-soft p-4">
              <Text className="text-sm font-outfit_bold text-healthy text-center">
                Riwayat berhasil tersimpan!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Save Worker Modal */}
      <SaveWorkerModal
        visible={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onConfirm={handleSave}
        workers={workers}
        loading={workersLoading}
      />
    </View>
  );
}
