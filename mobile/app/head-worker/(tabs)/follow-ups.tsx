import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  Text,
  View,
  type ListRenderItemInfo,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { RotateCcw } from "lucide-react-native";

import FollowUpActionPanel from "../../../components/workflow/FollowUpActionPanel";
import StaffScreenHeader from "../../../components/workflow/StaffScreenHeader";
import WorkflowCaseCard from "../../../components/workflow/WorkflowCaseCard";
import WorkflowCaseDetails from "../../../components/workflow/WorkflowCaseDetails";
import WorkflowDetailModal from "../../../components/workflow/WorkflowDetailModal";
import WorkflowStateView from "../../../components/workflow/WorkflowStateView";
import { colors } from "../../../constants/colors";
import { useAuth } from "../../../providers/AuthProvider";
import { getFollowUps } from "../../../services/workflow";
import type {
  WorkflowApiErrorInfo,
  WorkflowItem,
  WorkflowStatus,
} from "../../../types/workflow";
import {
  WORKFLOW_STATUSES,
  getWorkflowStatusLabel,
  toWorkflowApiError,
} from "../../../utils/workflow";

const LIST_LIMIT = 50;
type StatusFilter = WorkflowStatus | null;

function caseKey(item: WorkflowItem): string {
  return item.prediction_id;
}

export default function HeadWorkerFollowUpsScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [items, setItems] = useState<WorkflowItem[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>(null);
  const [selectedItem, setSelectedItem] = useState<WorkflowItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalBusy, setModalBusy] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [error, setError] = useState<WorkflowApiErrorInfo | null>(null);
  const activeRef = useRef(true);
  const requestIdRef = useRef(0);
  const logoutRef = useRef(false);
  const hasFocusedRef = useRef(false);
  const selectedStatusRef = useRef<StatusFilter>(null);

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
    async (asRefresh: boolean, status: StatusFilter) => {
      const requestId = ++requestIdRef.current;
      if (asRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const response = await getFollowUps({
          limit: LIST_LIMIT,
          status: status ?? undefined,
        });
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

  useFocusEffect(
    useCallback(() => {
      void loadItems(hasFocusedRef.current, selectedStatusRef.current);
      hasFocusedRef.current = true;

      return () => {
        requestIdRef.current += 1;
      };
    }, [loadItems]),
  );

  const handleLogout = useCallback(async () => {
    if (logoutRef.current) return;
    logoutRef.current = true;
    setLogoutBusy(true);
    try {
      await returnToLogin();
    } finally {
      logoutRef.current = false;
      if (activeRef.current) setLogoutBusy(false);
    }
  }, [returnToLogin]);

  const handleRefresh = useCallback(() => {
    void loadItems(true, selectedStatus);
  }, [loadItems, selectedStatus]);

  const handleRetry = useCallback(() => {
    void loadItems(false, selectedStatus);
  }, [loadItems, selectedStatus]);

  const handleStatusChange = useCallback(
    (status: StatusFilter) => {
      if (status === selectedStatus) return;
      setItems([]);
      setError(null);
      setLoading(true);
      selectedStatusRef.current = status;
      setSelectedStatus(status);
      void loadItems(false, status);
    },
    [loadItems, selectedStatus],
  );

  const handleOpenItem = useCallback((item: WorkflowItem) => {
    setSelectedItem(item);
  }, []);

  const handleCloseModal = useCallback(() => {
    if (!modalBusy) setSelectedItem(null);
  }, [modalBusy]);

  const handleActionSuccess = useCallback(
    (updatedItem: WorkflowItem) => {
      setItems((currentItems) => {
        const remainsVisible =
          selectedStatusRef.current === null ||
          updatedItem.status === selectedStatusRef.current;
        if (!remainsVisible) {
          return currentItems.filter(
            (item) => item.prediction_id !== updatedItem.prediction_id,
          );
        }
        return currentItems.map((item) =>
          item.prediction_id === updatedItem.prediction_id ? updatedItem : item,
        );
      });
      setSelectedItem(null);
      void loadItems(true, selectedStatusRef.current);
    },
    [loadItems],
  );

  const handleDataStale = useCallback(() => {
    setSelectedItem(null);
    void loadItems(true, selectedStatusRef.current);
  }, [loadItems]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<WorkflowItem>) => (
      <WorkflowCaseCard item={item} onPress={handleOpenItem} showVerdict />
    ),
    [handleOpenItem],
  );

  const errorNotice = useMemo(
    () =>
      error ? (
        <View
          className="mx-4 mb-3 rounded-2xl border border-danger bg-danger-soft p-4"
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
            accessibilityLabel="Coba muat ulang daftar tindak lanjut"
            className="mt-3 min-h-11 flex-row items-center justify-center gap-2 rounded-xl border border-danger bg-white px-4 active:opacity-70"
          >
            <RotateCcw size={16} color={colors.danger} />
            <Text className="text-sm font-outfit_bold text-danger">
              Coba lagi
            </Text>
          </Pressable>
        </View>
      ) : null,
    [error, handleRetry],
  );

  return (
    <View className="flex-1 bg-white">
      <StaffScreenHeader
        title="Kepala Pekerja"
        subtitle="Catat pemisahan dan urutan penanganan setiap kasus."
        onLogout={handleLogout}
        logoutBusy={logoutBusy}
      />

      <View className="border-y border-neutral-border bg-white pb-3 pt-4">
        <Text className="px-4 text-sm font-outfit_bold text-neutral-foreground">
          Filter status
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10, gap: 8 }}
          accessibilityLabel="Pilihan filter status tindak lanjut"
        >
          <Pressable
            onPress={() => handleStatusChange(null)}
            accessibilityRole="button"
            accessibilityLabel="Tampilkan semua status"
            accessibilityState={{ selected: selectedStatus === null }}
            className={`min-h-11 justify-center rounded-full border px-4 active:opacity-70 ${
              selectedStatus === null
                ? "border-primary bg-primary"
                : "border-neutral-border bg-white"
            }`}
          >
            <Text
              className={`text-xs font-outfit_bold ${
                selectedStatus === null ? "text-white" : "text-neutral-foreground"
              }`}
            >
              Semua
            </Text>
          </Pressable>
          {WORKFLOW_STATUSES.map((status) => {
            const selected = selectedStatus === status;
            return (
              <Pressable
                key={status}
                onPress={() => handleStatusChange(status)}
                accessibilityRole="button"
                accessibilityLabel={`Filter ${getWorkflowStatusLabel(status)}`}
                accessibilityState={{ selected }}
                className={`min-h-11 justify-center rounded-full border px-4 active:opacity-70 ${
                  selected
                    ? "border-primary bg-primary"
                    : "border-neutral-border bg-white"
                }`}
              >
                <Text
                  className={`text-xs font-outfit_bold ${
                    selected ? "text-white" : "text-neutral-foreground"
                  }`}
                >
                  {getWorkflowStatusLabel(status)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View className="flex-1">
        {loading ? (
          <WorkflowStateView
            state="loading"
            title="Memuat tindak lanjut"
            message="Kasus sesuai filter sedang disiapkan."
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
            ListHeaderComponent={errorNotice}
            ListEmptyComponent={
              <WorkflowStateView
                state="empty"
                title="Tidak ada kasus pada status ini"
                message="Pilih status lain atau tarik layar untuk memuat ulang."
                compact
              />
            }
            contentContainerStyle={{ paddingTop: 16, paddingHorizontal: 16, paddingBottom: 100 }}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <WorkflowDetailModal
        visible={Boolean(selectedItem)}
        title="Detail Tindak Lanjut"
        subtitle="Tinjau hasil deteksi, validasi dokter, dan status penanganan."
        onClose={handleCloseModal}
        closeLabel="Tutup detail tindak lanjut"
        busy={modalBusy}
      >
        {selectedItem ? (
          <>
            <WorkflowCaseDetails item={selectedItem} />
            <FollowUpActionPanel
              item={selectedItem}
              onSuccess={handleActionSuccess}
              onUnauthenticated={returnToLogin}
              onDataStale={handleDataStale}
              onBusyChange={setModalBusy}
            />
          </>
        ) : null}
      </WorkflowDetailModal>
    </View>
  );
}
