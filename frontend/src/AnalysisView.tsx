import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, RADIUS, SHADOW, SPACING, Analysis } from "./theme";

function scoreColor(s: number) {
  if (s >= 75) return COLORS.good;
  if (s >= 50) return COLORS.warn;
  if (s > 0) return COLORS.bad;
  return COLORS.textMuted;
}

function scoreLabel(s: number) {
  if (s >= 85) return "Excellent fit";
  if (s >= 70) return "Strong fit";
  if (s >= 50) return "Decent fit";
  if (s >= 30) return "Needs work";
  if (s > 0) return "Weak match";
  return "No resume";
}

function Pill({ text, tone = "purple" }: { text: string; tone?: "purple" | "red" | "green" }) {
  const bg = tone === "red" ? "#FCE7E7" : tone === "green" ? "#DCFCE7" : COLORS.badge;
  const fg = tone === "red" ? "#B91C1C" : tone === "green" ? "#047857" : COLORS.purpleDeep;
  return (
    <View style={[styles.pill, { backgroundColor: bg }]} testID="skill-pill">
      <Text style={[styles.pillText, { color: fg }]}>{text}</Text>
    </View>
  );
}

function Section({ icon, title, children, testID }: any) {
  return (
    <View style={[styles.card, SHADOW.card]} testID={testID}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={20} color={COLORS.purple} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export default function AnalysisView({ data }: { data: Analysis }) {
  const sc = data.match_score;
  const color = scoreColor(sc);
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} testID="analysis-result">
      <Text style={styles.jobTitle} numberOfLines={2} testID="job-title">{data.job_title}</Text>
      {data.summary ? <Text style={styles.summary}>{data.summary}</Text> : null}

      {/* Score */}
      {data.has_resume ? (
        <View style={[styles.scoreCard, SHADOW.card]} testID="match-score-card">
          <View style={[styles.scoreCircle, { borderColor: color }]}>
            <Text style={[styles.scoreNum, { color }]} testID="match-score">{sc}</Text>
            <Text style={styles.scoreUnit}>/100</Text>
          </View>
          <View style={{ flex: 1, marginLeft: SPACING.md }}>
            <Text style={styles.scoreTitle}>Match Score</Text>
            <Text style={[styles.scoreLabel, { color }]}>{scoreLabel(sc)}</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${sc}%`, backgroundColor: color }]} />
            </View>
          </View>
        </View>
      ) : (
        <View style={[styles.scoreCard, SHADOW.card]}>
          <Ionicons name="document-text-outline" size={36} color={COLORS.purple} />
          <View style={{ flex: 1, marginLeft: SPACING.md }}>
            <Text style={styles.scoreTitle}>No resume provided</Text>
            <Text style={styles.scoreSubtle}>Add your resume next time to get a match score and gap analysis.</Text>
          </View>
        </View>
      )}

      {/* Required & Preferred */}
      {data.required_skills.length > 0 && (
        <Section icon="shield-checkmark" title="Required Skills" testID="required-section">
          <View style={styles.pillRow}>
            {data.required_skills.map((s, i) => <Pill key={`r-${i}`} text={s} />)}
          </View>
        </Section>
      )}
      {data.preferred_skills.length > 0 && (
        <Section icon="star-outline" title="Preferred Skills" testID="preferred-section">
          <View style={styles.pillRow}>
            {data.preferred_skills.map((s, i) => <Pill key={`p-${i}`} text={s} />)}
          </View>
        </Section>
      )}

      {/* Key Skills (categorized) */}
      <Section icon="grid" title="Key Skills" testID="key-skills-section">
        {data.key_skills.technical.length > 0 && (
          <>
            <Text style={styles.subhead}>Technical</Text>
            <View style={styles.pillRow}>{data.key_skills.technical.map((s, i) => <Pill key={`t-${i}`} text={s} />)}</View>
          </>
        )}
        {data.key_skills.tools.length > 0 && (
          <>
            <Text style={styles.subhead}>Tools & Platforms</Text>
            <View style={styles.pillRow}>{data.key_skills.tools.map((s, i) => <Pill key={`tl-${i}`} text={s} />)}</View>
          </>
        )}
        {data.key_skills.soft.length > 0 && (
          <>
            <Text style={styles.subhead}>Soft Skills</Text>
            <View style={styles.pillRow}>{data.key_skills.soft.map((s, i) => <Pill key={`s-${i}`} text={s} />)}</View>
          </>
        )}
      </Section>

      {/* Missing skills */}
      {data.has_resume && data.missing_skills.length > 0 && (
        <Section icon="alert-circle" title="Missing Skills" testID="missing-section">
          <View style={styles.pillRow}>
            {data.missing_skills.map((s, i) => <Pill key={`m-${i}`} text={s} tone="red" />)}
          </View>
        </Section>
      )}

      {/* Suggested Bullets */}
      {data.suggested_bullets.length > 0 && (
        <Section icon="create" title="Resume Bullet Suggestions" testID="bullets-section">
          {data.suggested_bullets.map((b, i) => (
            <View key={`b-${i}`} style={styles.bulletBlock} testID={`bullet-${i}`}>
              {b.before ? (
                <>
                  <Text style={styles.bulletLabelBefore}>BEFORE</Text>
                  <Text style={styles.bulletBefore}>{b.before}</Text>
                </>
              ) : null}
              <Text style={styles.bulletLabelAfter}>AFTER</Text>
              <Text style={styles.bulletAfter}>{b.after}</Text>
            </View>
          ))}
        </Section>
      )}

      {/* Focus */}
      {data.focus_guidance.length > 0 && (
        <Section icon="flag" title="What To Focus On" testID="focus-section">
          {data.focus_guidance.map((f, i) => (
            <View key={`f-${i}`} style={styles.focusRow}>
              <View style={styles.focusDot}><Text style={styles.focusDotText}>{i + 1}</Text></View>
              <Text style={styles.focusText}>{f}</Text>
            </View>
          ))}
        </Section>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: SPACING.md, paddingBottom: SPACING.xl },
  jobTitle: { fontSize: 24, fontWeight: "800", color: COLORS.text, marginBottom: 4 },
  summary: { fontSize: 14, color: COLORS.textMuted, marginBottom: SPACING.md, lineHeight: 20 },
  scoreCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  scoreCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
  },
  scoreNum: { fontSize: 30, fontWeight: "900" },
  scoreUnit: { fontSize: 11, color: COLORS.textMuted, marginTop: -2 },
  scoreTitle: { fontSize: 13, color: COLORS.textMuted, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase" },
  scoreLabel: { fontSize: 20, fontWeight: "800", marginTop: 2 },
  scoreSubtle: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  barTrack: { height: 8, backgroundColor: COLORS.purpleSoft, borderRadius: 4, marginTop: 10, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 4 },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: SPACING.sm, gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: COLORS.text, marginLeft: 8 },
  subhead: { fontSize: 11, fontWeight: "700", letterSpacing: 0.8, color: COLORS.textMuted, marginTop: 8, marginBottom: 6 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.pill, marginRight: 6, marginBottom: 6 },
  pillText: { fontSize: 13, fontWeight: "600" },

  bulletBlock: {
    backgroundColor: COLORS.purpleSoft,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  bulletLabelBefore: { fontSize: 10, fontWeight: "800", color: COLORS.bad, letterSpacing: 1 },
  bulletBefore: { fontSize: 13, color: COLORS.textMuted, marginTop: 4, marginBottom: 8, fontStyle: "italic" },
  bulletLabelAfter: { fontSize: 10, fontWeight: "800", color: COLORS.good, letterSpacing: 1 },
  bulletAfter: { fontSize: 14, color: COLORS.text, marginTop: 4, lineHeight: 20, fontWeight: "600" },

  focusRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: SPACING.sm },
  focusDot: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.purple,
    alignItems: "center", justifyContent: "center", marginRight: 10, marginTop: 1,
  },
  focusDotText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  focusText: { flex: 1, fontSize: 14, color: COLORS.text, lineHeight: 20 },
});
