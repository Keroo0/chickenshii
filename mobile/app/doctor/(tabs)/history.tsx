import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  Text,
  View,
  type ListRenderItemInfo,
} from "react-native";
import { useRouter } from "expo-router";
import { RotateCcw } from "lucide-react-native";

import StaffScreenHeader from "../../../components/workflow/StaffScreenHeader";
import ValidationModal from "../../../components/workflow/ValidationModal";
import WorkflowCaseCard from "../../../components/workflow/WorkflowCaseCard";
import WorkflowStateView from "../../../components/workflow/WorkflowStateView";
import { colors } from "../../../constants/colors";
import { useAuth } from "../../../providers/AuthProvider";
import {
  getValidationHistory,
  updateValidation,
} from "../../../services/workflow";
import type {
  ValidationUpdateRequest,
  WorkflowApiErrorInfo,
  WorkflowItem,
} from "../../../types/workflow";
import { toWorkflowApiError } from "../../../utils/workflow";

const LIST_LIMIT = 50;

function caseKey(item: WorkflowItem): string {
  return item.validation_id ?? item.prediction_id;
}

export default function DoctorValidationHistoryScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [items, setItems] = useState<WorkflowItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<WorkflowItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [error, setError] = useState<WorkflowApiErrorInfo | null>(null);
  const activeRef = useRef(true);
  const requestIdRef = useRef(0);
  const submittingRef = useRef(false);

  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
      requestIdRef.current += 1;
    };
  }, []);

  const returnToLogin = useCallback(async () => {
    setSelectedItem(null);
    await signOut().catch(() => undefined);
    if (activeRef.current) router.replace("/login");
  }, [router, signOut]);

  const loadItems = useCallback(
    async (asRefresh: boolean) => {
      const requestId = ++requestIdRef.current;
      if (asRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const response = await getValidationHistory({ limit: LIST_LIMIT });
        if (!activeRef.current || requestId !== requestIdRef.current) return;
        setItems(response.data.items);
        setError(null);
      } catch (requestError: unknown) {
        if (!activeRef.current || requestId !== requestIdRef.current) return;
        const mappedError = toWorkflowApiError(requestError);
        if (mappedError.kind === "unauthenticated") {
          await returnToLogin();
          return;
        }
        setError(mappedError);
      } finally {
        if (activeRef.current && requestId === requestIdRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [returnToLogin],
  );

  useEffect(() => {
    void loadItems(false);
  }, [loadItems]);

  const handleLogout = useCallback(async () => {
    if (logoutBusy) return;
    setLogoutBusy(true);
    try {
      await returnToLogin();
    } finally {
      if (activeRef.current) setLogoutBusy(false);
    }
  }, [logoutBusy, returnToLogin]);

  const handleRefresh = useCallback(() => {
    void loadItems(true);
  }, [loadItems]);

  const handleRetry = useCallback(() => {
    void loadItems(false);
  }, [loadItems]);

  const handleOpenItem = useCallback((item: WorkflowItem) => {
    setSelectedItem(item);
  }, []);

  const handleCloseModal = useCallback(() => {
    if (!submittingRef.current) setSelectedItem(null);
  }, []);

  const handleUpdate = useCallback(
    async (request: ValidationUpdateRequest) => {
      const validationId = selectedItem?.validation_id;
      if (
        !validationId ||
        selectedItem?.editable !== true ||
        submittingRef.current
      ) {
        return;
      }

      submittingRef.current = true;
      setSubmitting(true);
      try {
        await updateValidation(validationId, request);
        setSelectedItem(null);
        await loadItems(true);
        Alert.alert("Validasi diperbarui", "Perubahan validasi telah disimpan.");
      } catch (requestError: unknown) {
        const mappedError = toWorkflowApiError(requestError);
        if (mappedError.kind === "unauthenticated") {
          setSelectedItem(null);
          await returnToLogin();
          return;
        }
        if (
          mappedError.kind === "not_found" ||
          mappedError.kind === "conflict"
        ) {
          setSelectedItem(null);
          Alert.alert(mappedError.title, mappedError.message);
          await loadItems(true);
          return;
        }
        Alert.alert(mappedError.title, mappedError.message);
      } finally {
        submittingRef.current = false;
        if (activeRef.current) setSubmitting(false);
      }
    },
    [loadItems, returnToLogin, selectedItem],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<WorkflowItem>) => (
      <WorkflowCaseCard item={item} onPress={handleOpenItem} showVerdict />
    ),
    [handleOpenItem],
  );

  const listHeader = useMemo(
    () => (
      <View className="mb-4">
        <Text className="text-sm font-outfit_bold text-neutral-foreground">
          Riwayat Anda ({items.length})
        </Text>
        <Text className="mt-1 text-xs font-outfit_medium leading-5 text-neutral-muted">
          Riwayat hanya menampilkan validasi yang Anda berikan.
        </Text>
        {error ? (
          <View
            className="mt-3 rounded-2xl border border-danger bg-danger-soft p-4"
            accessibilityLiveRegion="polite"
          >
            <Text className="text-sm font-outfit_bold text-danger">
              {error.title}
            </Text>
            <Text className="mt-1 text-xs font-outfit_medium leading-5 text-neutral-foreground">
              {error.message}
            </Text>
            <Pressable
              onPress={handleRetry}
              accessibilityRole="button"
              accessibilityLabel="Coba muat ulang riwayat validasi"
              className="mt-3 min-h-11 flex-row items-center justify-center gap-2 rounded-xl border border-danger bg-white px-4 active:opacity-70"
            >
              <RotateCcw size={16} color={colors.danger} />
              <Text className="text-sm font-outfit_bold text-danger">
                Coba lagi
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    ),
    [error, handleRetry, items.length],
  );

  return (
    <View className="flex-1 bg-white">
      <StaffScreenHeader
        title="Dokter Hewan"
        subtitle="Tinjau riwayat validasi yang telah Anda berikan."
        onLogout={handleLogout}
        logoutBusy={logoutBusy}
      />

      <View className="flex-1 border-t border-neutral-border">
        {loading ? (
          <WorkflowStateView
            state="loading"
            title="Memuat riwayat validasi"
            message="Riwayat terbaru sedang disiapkan."
          />
        ) : error && items.length === 0 ? (
          <WorkflowStateView
            state="error"
            title={error.title}
            message={error.message}
            onRetry={handleRetry}
          />
        ) : (
          <FlatList
            data={items}
            keyExtractor={caseKey}
            renderItem={renderItem}
            ListHeaderComponent={listHeader}
            ListEmptyComponent={
              <WorkflowStateView
                state="empty"
                title="Belum ada riwayat validasi"
                message="Kasus yang sudah Anda validasi akan muncul di sini."
                compact
              />
            }
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="on-drag"
          />
        )}
      </View>

      <ValidationModal
        key={`read:${
          selectedItem?.validation_id ?? selectedItem?.prediction_id ?? "closed"
        }`}
        visible={Boolean(selectedItem)}
        item={selectedItem}
        mode="read"
        onClose={handleCloseModal}
        onSubmit={handleUpdate}
        allowEdit={
          selectedItem?.editable === true && Boolean(selectedItem.validation_id)
        }
        busy={submitting}
      />
    </View>
  );
}
