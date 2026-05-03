import React from "react";
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Linking, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, RADIUS, SHADOW, SPACING } from "../../src/theme";

export default function AboutScreen() {
  return (
    <SafeAreaView style={styles.safe} testID="about-screen">
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>About</Text>

        <LinearGradient
          colors={["#A56BD6", "#7C2FB8", "#4B0F8B"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[styles.hero, SHADOW.card]}
        >
          <Text style={styles.heroEyebrow}>LANDIT</Text>
          <Text style={styles.heroTitle}>One job posting → one clear plan.</Text>
          <Text style={styles.heroBody}>
            Paste any job description and (optionally) your resume. Our AI returns the skills that matter, your real fit score, gaps, and ready-to-paste resume bullets.
          </Text>
        </LinearGradient>

        <Text style={styles.head}>WHO IT'S FOR</Text>
        <View style={[styles.card, SHADOW.card]}>
          {[
            { i: "rocket", t: "High-volume applicants", s: "Tailor 10× faster" },
            { i: "swap-horizontal", t: "Career changers", s: "See the real gaps before applying" },
            { i: "school", t: "Entry to mid-level", s: "Stop guessing what recruiters want" },
          ].map((x) => (
            <View key={x.i} style={styles.row}>
              <View style={styles.dot}><Ionicons name={x.i as any} size={18} color="#fff" /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{x.t}</Text>
                <Text style={styles.rowSub}>{x.s}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.head}>PRIVACY</Text>
        <View style={[styles.card, SHADOW.card]}>
          <Text style={styles.body}>
            • No account required.{"\n"}
            • Your scans are stored locally on your device.{"\n"}
            • Job descriptions and resumes are sent to the AI only at the moment of analysis.
          </Text>
        </View>

        <Text style={styles.head}>PRICING</Text>
        <View style={[styles.card, SHADOW.card]}>
          <View style={styles.priceRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.planTitle}>Free</Text>
              <Text style={styles.planSub}>3 analyses / day</Text>
            </View>
            <Text style={styles.planPrice}>$0</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.priceRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.planTitle, { color: COLORS.purple }]}>Pro · Coming Soon</Text>
              <Text style={styles.planSub}>Unlimited scans, saved resumes, job tracking</Text>
            </View>
            <Text style={[styles.planPrice, { color: COLORS.purple }]}>$7/mo</Text>
          </View>
          <TouchableOpacity
            style={styles.notifyBtn}
            onPress={() => Linking.openURL("mailto:hello@example.com?subject=LandIt%20Pro%20notify%20me")}
            testID="notify-pro-btn"
            activeOpacity={0.85}
          >
            <Text style={styles.notifyText}>NOTIFY ME WHEN PRO LAUNCHES</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.foot}>v1.0 · Built with care</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: SPACING.md, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: "900", color: COLORS.text, marginBottom: SPACING.md },
  hero: { borderRadius: RADIUS.xl, padding: 24, marginBottom: SPACING.md },
  heroEyebrow: { color: "#fff", opacity: 0.85, fontSize: 11, fontWeight: "800", letterSpacing: 2, marginBottom: 8 },
  heroTitle: { color: "#fff", fontSize: 24, fontWeight: "900", lineHeight: 28, marginBottom: 10 },
  heroBody: { color: "#F0E4FB", fontSize: 14, lineHeight: 20 },
  head: { fontSize: 11, fontWeight: "800", letterSpacing: 1.5, color: COLORS.textMuted, marginBottom: 8, marginTop: 6 },
  card: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 8, gap: 12 },
  dot: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.purple, alignItems: "center", justifyContent: "center", marginRight: 8 },
  rowTitle: { fontSize: 15, fontWeight: "800", color: COLORS.text },
  rowSub: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  body: { fontSize: 14, color: COLORS.text, lineHeight: 22 },
  priceRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  planTitle: { fontSize: 16, fontWeight: "800", color: COLORS.text },
  planSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  planPrice: { fontSize: 18, fontWeight: "900", color: COLORS.text },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 8 },
  notifyBtn: { backgroundColor: COLORS.purple, paddingVertical: 14, borderRadius: RADIUS.md, alignItems: "center", marginTop: 12 },
  notifyText: { color: "#fff", fontWeight: "900", letterSpacing: 1.2, fontSize: 13 },
  foot: { textAlign: "center", color: COLORS.textMuted, fontSize: 12, marginTop: SPACING.md },
});
