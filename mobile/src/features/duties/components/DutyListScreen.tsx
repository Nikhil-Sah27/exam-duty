import type { ReactNode } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, toneStyles, type Tone } from "./theme";
import { useDutyRefresh } from "../hooks/useExamData";
import { formatLongDate, formatTimeRange } from "../utils/format";
import type { DutySection } from "../utils/sections";

/**
 * Shared chrome for both duty screens: header, banners, loading / error /
 * empty states, the date + time-slot section headings, and pull-to-refresh.
 *
 * SectionList has a single level of section, so `buildDutySections` flattens
 * the web's date → time-slot nesting into one section per time window and
 * flags the first of each date; the header renderer draws the date band only
 * for those. Keeping the sections flat also means the refresh control and the
 * empty state live on the same list rather than on a wrapper.
 */
export interface DutyListScreenProps<T> {
  title: string;
  subtitle: string;
  /** Right-aligned counts line under the title. */
  meta?: string | null;
  sections: DutySection<T>[];
  renderCard: (item: T) => ReactNode;
  cardKey: (item: T) => string;
  isLoading: boolean;
  error: Error | null;
  errorText: string;
  emptyTitle: string;
  emptyHint: string;
  /** Success / failure banners and any per-screen controls. */
  banners?: ReactNode;
}

export default function DutyListScreen<T>({
  title,
  subtitle,
  meta,
  sections,
  renderCard,
  cardKey,
  isLoading,
  error,
  errorText,
  emptyTitle,
  emptyHint,
  banners,
}: DutyListScreenProps<T>) {
  const { refreshing, onRefresh } = useDutyRefresh();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => cardKey(item)}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
            {meta ? <Text style={styles.meta}>{meta}</Text> : null}
            {error && (
              <Banner tone="danger" text={`${errorText} ${error.message}`} />
            )}
            {banners}
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.state}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.stateHint}>Loading…</Text>
            </View>
          ) : error ? null : (
            <View style={styles.state}>
              <Text style={styles.stateTitle}>{emptyTitle}</Text>
              <Text style={styles.stateHint}>{emptyHint}</Text>
              <Text style={styles.stateHint}>Pull down to refresh.</Text>
            </View>
          )
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            {section.isFirstOfDate && (
              <Text style={styles.sectionDate}>{formatLongDate(section.date)}</Text>
            )}
            <Text style={styles.sectionTime}>
              {formatTimeRange(section.startTime, section.endTime)}
              <Text style={styles.sectionCount}>
                {"  "}
                {section.data.length}
              </Text>
            </Text>
          </View>
        )}
        renderItem={({ item }) => <View style={styles.card}>{renderCard(item)}</View>}
      />
    </SafeAreaView>
  );
}

export function Banner({ tone, text }: { tone: Tone; text: string }) {
  const t = toneStyles[tone];
  return (
    <View
      style={[styles.banner, { backgroundColor: t.bg, borderColor: t.border }]}
    >
      <Text style={[styles.bannerText, { color: t.fg }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.screen },
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  header: { paddingTop: 8, paddingBottom: 4, gap: 4 },
  title: { fontSize: 24, fontWeight: "700", color: colors.heading },
  subtitle: { fontSize: 13, color: colors.muted, lineHeight: 18 },
  meta: { marginTop: 2, fontSize: 12, fontWeight: "600", color: colors.faint },
  sectionHeader: { paddingTop: 18, paddingBottom: 8, gap: 4 },
  sectionDate: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: colors.faint,
  },
  sectionTime: { fontSize: 14, fontWeight: "700", color: colors.body },
  sectionCount: { fontSize: 12, fontWeight: "600", color: colors.faint },
  card: { marginBottom: 10 },
  state: {
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.borderStrong,
    borderRadius: 14,
    marginTop: 24,
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  stateTitle: { fontSize: 15, fontWeight: "700", color: colors.body },
  stateHint: { fontSize: 13, color: colors.faint, textAlign: "center" },
  banner: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  bannerText: { fontSize: 13, lineHeight: 18 },
});
