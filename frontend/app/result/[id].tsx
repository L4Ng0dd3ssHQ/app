import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { COLORS, SPACING, Analysis } from "../../src/theme";
import { getAnalysis } from "../../src/storage";
import AnalysisView from "../../src/AnalysisView";

export default function ResultDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const a = id ? await getAnalysis(String(id)) : null;
      setData(a);
      setLoading(false);
    })();
  }, [id]);

  return (
    <SafeAreaView style={styles.safe} testID="result-detail-screen">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} testID="back-btn">
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Saved Analysis</Text>
        <View style={{ width: 40 }} />
      </View>
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={COLORS.purple} /></View>
      ) : !data ? (
        <View style={styles.center}>
          <Text style={styles.muted}>Analysis not found.</Text>
        </View>
      ) : (
        <AnalysisView data={data} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.bg,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20 },
  title: { fontSize: 17, fontWeight: "800", color: COLORS.text },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  muted: { color: COLORS.textMuted },
});
