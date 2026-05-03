import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { COLORS, RADIUS, SHADOW, SPACING, Analysis } from "../../src/theme";
import { clearHistory, deleteAnalysis, loadHistory } from "../../src/storage";

function timeAgo(iso: string) {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

function scoreColor(s: number) {
  if (s >= 75) return COLORS.good;
  if (s >= 50) return COLORS.warn;
  if (s > 0) return COLORS.bad;
  return COLORS.textMuted;
}

export default function HistoryScreen() {
  const router = useRouter();
  const [items, setItems] = useState<Analysis[]>([]);

  const refresh = React.useCallback(async () => {
    setItems(await loadHistory());
  }, []);
  useFocusEffect(React.useCallback(() => { refresh(); }, [refresh]));

  const onClear = () => {
    Alert.alert("Clear all?", "This deletes every saved analysis on this device.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: async () => { await clearHistory(); refresh(); } },
    ]);
  };

  const onDelete = (id: string) => {
    Alert.alert("Delete this analysis?", "", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { await deleteAnalysis(id); refresh(); } },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} testID="history-screen">
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>History</Text>
          <Text style={styles.subtitle}>{items.length} saved on this device</Text>
        </View>
        {items.length > 0 && (
          <TouchableOpacity onPress={onClear} testID="clear-history-btn" style={styles.clearBtn}>
            <Ionicons name="trash" size={16} color={COLORS.bad} />
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}><Ionicons name="time-outline" size={42} color={COLORS.purple} /></View>
          <Text style={styles.emptyTitle}>No analyses yet</Text>
          <Text style={styles.emptySub}>Run your first analysis and it will appear here.</Text>
          <TouchableOpacity style={styles.cta} onPress={() => router.push("/(tabs)/analyze")} testID="empty-go-analyze-btn">
            <Text style={styles.ctaText}>ANALYZE A JOB</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(x) => x.id}
          contentContainerStyle={{ padding: SPACING.md, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.row, SHADOW.card]}
              onPress={() => router.push(`/result/${item.id}`)}
              onLongPress={() => onDelete(item.id)}
              activeOpacity={0.85}
              testID={`history-item-${item.id}`}
            >
              <View style={[styles.scoreBadge, { borderColor: scoreColor(item.match_score) }]}>
                <Text style={[styles.scoreBadgeNum, { color: scoreColor(item.match_score) }]}>
                  {item.has_resume ? item.match_score : "—"}
                </Text>
              </View>
              <View style={{ flex: 1, marginLeft: SPACING.md }}>
                <Text style={styles.rowTitle} numberOfLines={2}>{item.job_title}</Text>
                <Text style={styles.rowMeta}>
                  {timeAgo(item.created_at)} · {item.required_skills.length} required · {item.missing_skills.length} gaps
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: SPACING.md, paddingTop: SPACING.md, paddingBottom: SPACING.sm,
  },
  title: { fontSize: 28, fontWeight: "900", color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  clearBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.pill, backgroundColor: "#FCE7E7",
  },
  clearText: { color: COLORS.bad, fontWeight: "700", fontSize: 12, marginLeft: 4 },

  row: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: 10,
  },
  scoreBadge: {
    width: 56, height: 56, borderRadius: 28, borderWidth: 3,
    alignItems: "center", justifyContent: "center", backgroundColor: COLORS.white,
  },
  scoreBadgeNum: { fontSize: 18, fontWeight: "900" },
  rowTitle: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  rowMeta: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: SPACING.lg },
  emptyIcon: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: COLORS.purpleSoft,
    alignItems: "center", justifyContent: "center", marginBottom: SPACING.md,
  },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: COLORS.text },
  emptySub: { fontSize: 14, color: COLORS.textMuted, marginTop: 6, marginBottom: SPACING.lg, textAlign: "center" },
  cta: { backgroundColor: COLORS.purple, paddingVertical: 14, paddingHorizontal: 32, borderRadius: RADIUS.md },
  ctaText: { color: "#fff", fontWeight: "900", letterSpacing: 1.2 },
});
