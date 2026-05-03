import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { COLORS, RADIUS, SHADOW, SPACING } from "../../src/theme";
import { canAnalyze, DAILY_LIMIT, loadHistory } from "../../src/storage";

export default function HomeScreen() {
  const router = useRouter();
  const [remaining, setRemaining] = useState(DAILY_LIMIT);
  const [historyCount, setHistoryCount] = useState(0);

  const refresh = React.useCallback(async () => {
    const q = await canAnalyze();
    setRemaining(q.remaining);
    const list = await loadHistory();
    setHistoryCount(list.length);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  useFocusEffect(React.useCallback(() => { refresh(); }, [refresh]));

  return (
    <SafeAreaView style={styles.safe} testID="home-screen">
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>LandIt</Text>
            <Text style={styles.brandSub}>JOB MATCH ANALYZER</Text>
          </View>
          <View style={styles.quotaPill} testID="quota-pill">
            <Ionicons name="flash" size={14} color={COLORS.purpleDeep} />
            <Text style={styles.quotaText}>{remaining}/{DAILY_LIMIT} left today</Text>
          </View>
        </View>

        {/* Hero gradient */}
        <LinearGradient
          colors={["#A56BD6", "#7C2FB8", "#4B0F8B"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[styles.hero, SHADOW.card]}
        >
          <Text style={styles.heroEyebrow}>LAND IT.</Text>
          <Text style={styles.heroTitle}>Land the interview.{"\n"}Skip the guesswork.</Text>
          <Text style={styles.heroBody}>
            Paste any job description and your resume — get a match score, missing skills, and ready-to-paste resume bullets in seconds.
          </Text>
          <TouchableOpacity
            style={styles.heroCta}
            onPress={() => router.push("/(tabs)/analyze")}
            testID="hero-analyze-btn"
            activeOpacity={0.85}
          >
            <Text style={styles.heroCtaText}>ANALYZE A JOB</Text>
            <Ionicons name="arrow-forward" size={18} color={COLORS.purpleDeep} />
          </TouchableOpacity>
          <Text style={styles.heroNote}>1× scan = 1 credit. Free 3/day.</Text>
        </LinearGradient>

        {/* Quick stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, SHADOW.card]} testID="stat-history">
            <Ionicons name="time" size={22} color={COLORS.purple} />
            <Text style={styles.statNum}>{historyCount}</Text>
            <Text style={styles.statLabel}>Past scans</Text>
          </View>
          <View style={[styles.statCard, SHADOW.card]} testID="stat-quota">
            <Ionicons name="flash" size={22} color={COLORS.purple} />
            <Text style={styles.statNum}>{remaining}</Text>
            <Text style={styles.statLabel}>Scans today</Text>
          </View>
        </View>

        {/* How it works */}
        <Text style={styles.sectionHead}>HOW IT WORKS</Text>
        <View style={[styles.howCard, SHADOW.card]}>
          {[
            { n: "1", t: "Paste a job description", s: "From LinkedIn, Indeed, or anywhere" },
            { n: "2", t: "Drop in your resume (optional)", s: "Get personalized match scoring" },
            { n: "3", t: "Get tailored output", s: "Score, gaps, rewritten bullets, focus list" },
          ].map((x) => (
            <View key={x.n} style={styles.howRow}>
              <View style={styles.howDot}><Text style={styles.howDotText}>{x.n}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.howTitle}>{x.t}</Text>
                <Text style={styles.howSub}>{x.s}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Featured value */}
        <Text style={styles.sectionHead}>WHY IT WORKS</Text>
        <View style={styles.benefitsRow}>
          {[
            { i: "speedometer", t: "10× faster", s: "Tailor a resume in 30 seconds" },
            { i: "bulb", t: "Real bullets", s: "Copy-paste ready" },
            { i: "shield-checkmark", t: "Honest score", s: "Not a vague vibe check" },
          ].map((b) => (
            <View key={b.i} style={[styles.benefitCard, SHADOW.card]}>
              <Ionicons name={b.i as any} size={22} color={COLORS.purple} />
              <Text style={styles.benefitTitle}>{b.t}</Text>
              <Text style={styles.benefitSub}>{b.s}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.startOrder]}
          onPress={() => router.push("/(tabs)/analyze")}
          testID="start-analyze-btn"
          activeOpacity={0.85}
        >
          <Text style={styles.startOrderText}>START ANALYZING</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: SPACING.md, paddingBottom: 40 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.md },
  brand: { fontSize: 32, fontWeight: "900", color: COLORS.text, letterSpacing: -0.5 },
  brandSub: { fontSize: 10, fontWeight: "800", color: COLORS.purple, marginTop: -2, letterSpacing: 1.5 },
  quotaPill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: COLORS.purpleSoft, paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: RADIUS.pill,
  },
  quotaText: { color: COLORS.purpleDeep, fontWeight: "700", fontSize: 12, marginLeft: 4 },

  hero: { borderRadius: RADIUS.xl, padding: 24, marginBottom: SPACING.md },
  heroEyebrow: { color: "#fff", opacity: 0.85, fontSize: 11, fontWeight: "800", letterSpacing: 2, marginBottom: 10 },
  heroTitle: { color: "#fff", fontSize: 30, fontWeight: "900", lineHeight: 34, marginBottom: 12 },
  heroBody: { color: "#F0E4FB", fontSize: 14, lineHeight: 20, marginBottom: 18 },
  heroCta: {
    backgroundColor: "#fff", flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: RADIUS.md, alignSelf: "flex-start", paddingHorizontal: 20,
  },
  heroCtaText: { color: COLORS.purpleDeep, fontWeight: "900", letterSpacing: 1, fontSize: 14, marginRight: 6 },
  heroNote: { color: "#E9D8F8", fontSize: 11, marginTop: 12 },

  statsRow: { flexDirection: "row", gap: 12, marginBottom: SPACING.md },
  statCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: "flex-start" },
  statNum: { fontSize: 28, fontWeight: "900", color: COLORS.text, marginTop: 4 },
  statLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: "600" },

  sectionHead: { fontSize: 11, fontWeight: "800", letterSpacing: 1.5, color: COLORS.textMuted, marginBottom: 8, marginTop: 8 },
  howCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md },
  howRow: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 10, gap: 12 },
  howDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.purple, alignItems: "center", justifyContent: "center", marginRight: 8 },
  howDotText: { color: "#fff", fontWeight: "900" },
  howTitle: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  howSub: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },

  benefitsRow: { flexDirection: "row", gap: 10, marginBottom: SPACING.lg },
  benefitCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 12 },
  benefitTitle: { fontSize: 14, fontWeight: "800", color: COLORS.text, marginTop: 8 },
  benefitSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },

  startOrder: {
    backgroundColor: COLORS.purple, paddingVertical: 18, borderRadius: RADIUS.md,
    alignItems: "center", marginTop: 4,
  },
  startOrderText: { color: "#fff", fontWeight: "900", fontSize: 16, letterSpacing: 1 },
});
