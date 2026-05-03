import React, { useEffect, useState } from "react";
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, SafeAreaView, Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { COLORS, RADIUS, SHADOW, SPACING, Analysis } from "../../src/theme";
import { canAnalyze, DAILY_LIMIT, incrementQuota, saveAnalysis } from "../../src/storage";
import AnalysisView from "../../src/AnalysisView";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function AnalyzeScreen() {
  const [jd, setJd] = useState("");
  const [resume, setResume] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Analysis | null>(null);
  const [remaining, setRemaining] = useState(DAILY_LIMIT);

  const refreshQuota = React.useCallback(async () => {
    const q = await canAnalyze();
    setRemaining(q.remaining);
  }, []);
  useEffect(() => { refreshQuota(); }, [refreshQuota]);
  useFocusEffect(React.useCallback(() => { refreshQuota(); }, [refreshQuota]));

  const onAnalyze = async () => {
    Keyboard.dismiss();
    if (jd.trim().length < 30) {
      Alert.alert("Job description too short", "Please paste the full job posting (at least 30 characters).");
      return;
    }
    const q = await canAnalyze();
    if (!q.allowed) {
      Alert.alert("Daily limit reached", `You've used your ${DAILY_LIMIT} free analyses today. Come back tomorrow or upgrade for more.`);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_description: jd, resume }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server error ${res.status}`);
      }
      const data: Analysis = await res.json();
      await saveAnalysis(data);
      await incrementQuota();
      await refreshQuota();
      setResult(data);
    } catch (e: any) {
      Alert.alert("Analysis failed", e?.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const onReset = () => { setResult(null); setJd(""); setResume(""); };

  if (result) {
    return (
      <SafeAreaView style={styles.safe} testID="analyze-result-screen">
        <View style={styles.resultHeader}>
          <TouchableOpacity onPress={onReset} style={styles.backBtn} testID="new-analysis-btn">
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.resultHeaderTitle}>Your Analysis</Text>
          <View style={{ width: 40 }} />
        </View>
        <AnalysisView data={result} />
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.primaryBtn} onPress={onReset} testID="run-another-btn" activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>RUN ANOTHER ANALYSIS</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} testID="analyze-screen">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={styles.title}>Analyze a Job</Text>
              <View style={styles.quotaPill}>
                <Ionicons name="flash" size={14} color={COLORS.purpleDeep} />
                <Text style={styles.quotaText}>{remaining}/{DAILY_LIMIT} left</Text>
              </View>
            </View>
            <Text style={styles.subtitle}>Paste a job description and get an instant fit report.</Text>

            <View style={[styles.inputCard, SHADOW.card]}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Job Description</Text>
                <Text style={styles.required}>REQUIRED</Text>
              </View>
              <TextInput
                style={styles.textArea}
                placeholder="Paste the full job posting here..."
                placeholderTextColor={COLORS.textMuted}
                value={jd}
                onChangeText={setJd}
                multiline
                textAlignVertical="top"
                testID="jd-input"
              />
              <Text style={styles.charCount}>{jd.length} chars</Text>
            </View>

            <View style={[styles.inputCard, SHADOW.card]}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Your Resume</Text>
                <Text style={styles.optional}>OPTIONAL</Text>
              </View>
              <TextInput
                style={styles.textArea}
                placeholder="Paste your resume to unlock match score and gap analysis..."
                placeholderTextColor={COLORS.textMuted}
                value={resume}
                onChangeText={setResume}
                multiline
                textAlignVertical="top"
                testID="resume-input"
              />
              <Text style={styles.charCount}>{resume.length} chars</Text>
            </View>

            <TouchableOpacity
              style={[styles.cta, (loading || jd.trim().length < 30) && styles.ctaDisabled]}
              onPress={onAnalyze}
              disabled={loading || jd.trim().length < 30}
              testID="analyze-btn"
              activeOpacity={0.85}
            >
              {loading ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <ActivityIndicator color="#fff" />
                  <Text style={styles.ctaText}>ANALYZING…</Text>
                </View>
              ) : (
                <>
                  <Ionicons name="sparkles" size={18} color="#fff" />
                  <Text style={styles.ctaText}>ANALYZE</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.tip}>Tip: longer JD + resume = sharper match score and bullet suggestions.</Text>
          </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: SPACING.md, paddingBottom: 40 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 28, fontWeight: "900", color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textMuted, marginBottom: SPACING.md, marginTop: 2 },
  quotaPill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: COLORS.purpleSoft, paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.pill,
  },
  quotaText: { color: COLORS.purpleDeep, fontWeight: "700", fontSize: 12, marginLeft: 4 },

  inputCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md },
  labelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  label: { fontSize: 15, fontWeight: "800", color: COLORS.text },
  required: { fontSize: 10, fontWeight: "800", color: COLORS.purple, letterSpacing: 1 },
  optional: { fontSize: 10, fontWeight: "800", color: COLORS.textMuted, letterSpacing: 1 },
  textArea: {
    minHeight: 140, maxHeight: 220, fontSize: 14, color: COLORS.text,
    backgroundColor: "#FAF7FD", borderRadius: RADIUS.md, padding: 12, lineHeight: 20,
  },
  charCount: { fontSize: 11, color: COLORS.textMuted, textAlign: "right", marginTop: 6 },

  cta: {
    flexDirection: "row", gap: 10, alignItems: "center", justifyContent: "center",
    backgroundColor: COLORS.purple, paddingVertical: 18, borderRadius: RADIUS.md, marginTop: 4,
  },
  ctaDisabled: { backgroundColor: COLORS.purpleLight },
  ctaText: { color: "#fff", fontWeight: "900", letterSpacing: 1.5, fontSize: 15, marginLeft: 6 },
  tip: { fontSize: 12, color: COLORS.textMuted, textAlign: "center", marginTop: 12 },

  resultHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    backgroundColor: COLORS.bg, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20 },
  resultHeaderTitle: { fontSize: 17, fontWeight: "800", color: COLORS.text },
  bottomBar: {
    padding: SPACING.md, backgroundColor: COLORS.bg,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  primaryBtn: { backgroundColor: COLORS.purple, paddingVertical: 16, borderRadius: RADIUS.md, alignItems: "center" },
  primaryBtnText: { color: "#fff", fontWeight: "900", letterSpacing: 1, fontSize: 14 },
});
