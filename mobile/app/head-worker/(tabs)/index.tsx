import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  Text,
  View,
  type ListRenderItemInfo,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import {
  Activity,
  Bird,
  RotateCcw,
  ShieldAlert,
  Stethoscope,
} from "lucide-react-native";

import FollowUpActionPanel from "../../../components/workflow/FollowUpActionPanel";
import StaffScreenHeader from "../../../components/workflow/StaffScreenHeader";
import WorkflowCaseCard from "../../../components/workflow/WorkflowCaseCard";
import WorkflowCaseDetails from "../../../components/workflow/WorkflowCaseDetails";
import WorkflowDetailModal from "../../../components/workflow/WorkflowDetailModal";
import WorkflowStateView from "../../../components/workflow/WorkflowStateView";
import { colors } from "../../../constants/colors";
import { useAuth } from "../../../providers/AuthProvider";
import { getHeadWorkerDashboard } from "../../../services/workflow";
import type {
  DashboardCounts,
  WorkflowApiErrorInfo,
  WorkflowItem,
} from "../../../types/workflow";
import { toWorkflowApiError } from "../../../utils/workflow";

const EMPTY_COUNTS: DashboardCounts = {
  total_disease_cases: 0,
  pending_isolation: 0,
  pending_validation: 0,
  active_treatment: 0,
};

function caseKey(item: WorkflowItem): string {
  return item.prediction_id;
}

function countsAsPendingIsolation(item: WorkflowItem): boolean {
  return !item.isolated_at && !item.closed_at;
}

function countsAsPendingValidation(item: WorkflowItem): boolean {
  return !item.validation && !item.closed_at;
}

function countsAsActiveTreatment(item: WorkflowItem): boolean {
  return Boolean(
    item.treatment_started_at &&
      !item.treatment_completed_at &&
      !item.closed_at,
  );
}

function applyCountTransition(
  counts: DashboardCounts,
  previousItem: WorkflowItem,
  updatedItem: WorkflowItem,
): DashboardCounts {
  const transition = (before: boolean, after: boolean) =>
    Number(after) - Number(before);

  return {
    ...counts,
    pending_isolation: Math.max(
      0,
      counts.pending_isolation +
        transition(
          countsAsPendingIsolation(previousItem),
          countsAsPendingIsolation(updatedItem),
        ),
    ),
    pending_validation: Math.max(
      0,
      counts.pending_validation +
        transition(
          countsAsPendingValidation(previousItem),
          countsAsPendingValidation(updatedItem),
        ),
    ),
    active_treatment: Math.max(
      0,
      counts.active_treatment +
        transition(
          countsAsActiveTreatment(previousItem),
          countsAsActiveTreatment(updatedItem),
        ),
    ),
  };
}

interface SummaryRowProps {
  label: string;
  value: number;
  icon: typeof Bird;
  color: string;
  backgroundColor: string;
}

function SummaryRow({
  label,
  value,
  icon: Icon,
  color,
  backgroundColor,
}: SummaryRowProps) {
  return (
    <View className="flex-row items-center gap-3 border-b border-neutral-border-light py-3 last:border-b-0">
      <View
        className="h-11 w-11 items-center justify-center rounded-xl"
        style={{ backgroundColor }}
      >
        <Icon size={20} color={color} />
      </View>
      <Text className="min-w-0 flex-1 text-sm font-outfit_bold text-neutral-foreground">
        {label}
      </Text>
      <Text
        className="text-2xl font-outfit_black tracking-tight"
        style={{ color }}
        accessibilityLabel={`${label}: ${value}`}
      >
        {value}
      </Text>
    </View>
  );
}

export default function HeadWorkerDashboardScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [counts, setCounts] = useState<DashboardCounts>(EMPTY_COUNTS);
  const [items, setItems] = useState<WorkflowItem[]>([]);
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

  const loadDashboard = useCallback(
    async (asRefresh: boolean) => {
      const requestId = ++requestIdRef.current;
      if (asRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const response = await getHeadWorkerDashboard();
        if (!activeRef.current || requestId !== requestIdRef.current) return;
        setCounts(response.data.counts);
        setItems(response.data.latest_cases);
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
      void loadDashboard(hasFocusedRef.current);
      hasFocusedRef.current = true;

      return () => {
        requestIdRef.current += 1;
      };
    }, [loadDashboard]),
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
    void loadDashboard(true);
  }, [loadDashboard]);

  const handleRetry = useCallback(() => {
    void loadDashboard(false);
  }, [loadDashboard]);

  const handleOpenItem = useCallback((item: WorkflowItem) => {
    setSelectedItem(item);
  }, []);

  const handleCloseModal = useCallback(() => {
    if (!modalBusy) setSelectedItem(null);
  }, [modalBusy]);

  const handleActionSuccess = useCallback(
    (updatedItem: WorkflowItem) => {
      const previousItem = selectedItem;
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.prediction_id === updatedItem.prediction_id ? updatedItem : item,
        ),
      );
      if (previousItem) {
        setCounts((currentCounts) =>
          applyCountTransition(currentCounts, previousItem, updatedItem),
        );
      }
      setSelectedItem(null);
      void loadDashboard(true);
    },
    [loadDashboard, selectedItem],
  );

  const handleDataStale = useCallback(() => {
    setSelectedItem(null);
    void loadDashboard(true);
  }, [loadDashboard]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<WorkflowItem>) => (
      <WorkflowCaseCard item={item} onPress={handleOpenItem} showVerdict />
    ),
    [handleOpenItem],
  );

  const listHeader = useMemo(
    () => (
      <View className="mb-4">
        <View className="rounded-2xl border border-neutral-border bg-neutral-card px-4">
          <SummaryRow
            label="Kasus penyakit hari ini"
            value={counts.total_disease_cases}
            icon={Bird}
            color={colors.danger}
            backgroundColor={colors.dangerSoft}
          />
          <SummaryRow
            label="Belum dipisahkan"
            value={counts.pending_isolation}
            icon={ShieldAlert}
            color="#8A5B00"
            backgroundColor={colors.warningSoft}
          />
          <SummaryRow
            label="Menunggu validasi"
            value={counts.pending_validation}
            icon={Stethoscope}
            color={colors.primary}
            backgroundColor={colors.primarySoft}
          />
          <SummaryRow
            label="Penanganan aktif"
            value={counts.active_treatment}
            icon={Activity}
            color={colors.healthy}
            backgroundColor={colors.healthySoft}
          />
        </View>

        <View className="mb-3 mt-6">
          <Text className="text-base font-outfit_bold text-neutral-foreground">
            Kasus terbaru hari ini
          </Text>
          <Text className="mt-1 text-xs font-outfit_medium leading-5 text-neutral-muted">
            Buka detail untuk melihat status dan mencatat tindakan lanjutan.
          </Text>
        </View>

        {error ? (
          <View
            className="rounded-2xl border border-danger bg-danger-soft p-4"
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
              accessibilityLabel="Coba muat ulang dashboard kepala pekerja"
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
    [counts, error, handleRetry],
  );

  return (
    <View className="flex-1 bg-white">
      <StaffScreenHeader
        title="Kepala Pekerja"
        subtitle="Pantau kasus hari ini dan tindak lanjut yang berjalan."
        onLogout={handleLogout}
        logoutBusy={logoutBusy}
      />

      <View className="flex-1 border-t border-neutral-border">
        {loading ? (
          <WorkflowStateView
            state="loading"
            title="Memuat dashboard"
            message="Ringkasan kasus hari ini sedang disiapkan."
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
                title="Belum ada kasus hari ini"
                message="Kasus penyakit baru hari ini akan muncul di sini."
                compact
              />
            }
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
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
