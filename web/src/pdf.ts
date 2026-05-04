import jsPDF from "jspdf";
import type { Analysis } from "./types";

const BRAND = "#7C2FB8";
const INK = "#1F1233";
const MUTED = "#6E6580";
const GOOD = "#16A34A";
const WARN = "#D97706";
const BAD = "#DC2626";

function scoreColor(s: number): string {
  if (s >= 75) return GOOD;
  if (s >= 50) return WARN;
  if (s > 0) return BAD;
  return MUTED;
}

function safeFilename(s: string): string {
  return (s || "analysis").replace(/[^a-z0-9]+/gi, "_").slice(0, 40).toLowerCase();
}

export function downloadAnalysisPDF(a: Analysis): void {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 48;
  const contentW = pageW - marginX * 2;
  let y = 56;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - 60) {
      doc.addPage();
      y = 56;
    }
  };

  // Brand strip
  doc.setFillColor(BRAND);
  doc.rect(0, 0, pageW, 8, "F");

  // Title
  doc.setTextColor(INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  const titleLines = doc.splitTextToSize(a.job_title || "Job Analysis", contentW);
  doc.text(titleLines, marginX, y);
  y += titleLines.length * 22;

  // Meta
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(MUTED);
  const date = new Date(a.created_at);
  doc.text(`LandIt Analysis · ${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`, marginX, y);
  y += 18;

  // Summary
  if (a.summary) {
    doc.setTextColor(INK);
    doc.setFontSize(11);
    const sumLines = doc.splitTextToSize(a.summary, contentW);
    doc.text(sumLines, marginX, y);
    y += sumLines.length * 14 + 10;
  }

  // Match score box
  if (a.has_resume) {
    ensureSpace(70);
    doc.setFillColor("#F4ECFB");
    doc.roundedRect(marginX, y, contentW, 60, 8, 8, "F");
    doc.setTextColor(scoreColor(a.match_score));
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.text(`${a.match_score}`, marginX + 18, y + 38);
    doc.setFontSize(10);
    doc.setTextColor(MUTED);
    doc.text("/100", marginX + 70, y + 38);
    doc.setTextColor(INK);
    doc.setFontSize(13);
    doc.text("Match Score", marginX + 100, y + 28);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(MUTED);
    const label =
      a.match_score >= 85 ? "Excellent fit" :
      a.match_score >= 70 ? "Strong fit" :
      a.match_score >= 50 ? "Decent fit" :
      a.match_score >= 30 ? "Needs work" :
      a.match_score > 0 ? "Weak match" : "No resume";
    doc.text(label, marginX + 100, y + 44);
    y += 76;
  }

  const drawSectionHeader = (title: string) => {
    ensureSpace(28);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(BRAND);
    doc.text(title.toUpperCase(), marginX, y);
    y += 6;
    doc.setDrawColor(BRAND);
    doc.setLineWidth(1);
    doc.line(marginX, y, marginX + 40, y);
    y += 14;
  };

  const drawList = (items: string[]) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(INK);
    items.forEach((item) => {
      const lines = doc.splitTextToSize(`• ${item}`, contentW - 8);
      ensureSpace(lines.length * 13 + 4);
      doc.text(lines, marginX + 4, y);
      y += lines.length * 13 + 2;
    });
    y += 6;
  };

  if (a.required_skills.length) {
    drawSectionHeader("Required Skills");
    drawList(a.required_skills);
  }
  if (a.preferred_skills.length) {
    drawSectionHeader("Preferred Skills");
    drawList(a.preferred_skills);
  }

  // Key skills
  const ks = a.key_skills;
  if (ks.technical.length || ks.tools.length || ks.soft.length) {
    drawSectionHeader("Key Skills");
    if (ks.technical.length) {
      doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(MUTED);
      ensureSpace(14); doc.text("Technical", marginX, y); y += 12;
      drawList(ks.technical);
    }
    if (ks.tools.length) {
      doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(MUTED);
      ensureSpace(14); doc.text("Tools & Platforms", marginX, y); y += 12;
      drawList(ks.tools);
    }
    if (ks.soft.length) {
      doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(MUTED);
      ensureSpace(14); doc.text("Soft Skills", marginX, y); y += 12;
      drawList(ks.soft);
    }
  }

  if (a.has_resume && a.missing_skills.length) {
    drawSectionHeader("Missing Skills (Gaps)");
    doc.setTextColor(BAD);
    a.missing_skills.forEach((m) => {
      const lines = doc.splitTextToSize(`• ${m}`, contentW - 8);
      ensureSpace(lines.length * 13 + 4);
      doc.text(lines, marginX + 4, y);
      y += lines.length * 13 + 2;
    });
    y += 6;
  }

  if (a.suggested_bullets.length) {
    drawSectionHeader("Resume Bullet Suggestions");
    a.suggested_bullets.forEach((b, i) => {
      ensureSpace(40);
      if (b.before) {
        doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); doc.setTextColor(BAD);
        doc.text("BEFORE", marginX, y); y += 10;
        doc.setFont("helvetica", "italic"); doc.setFontSize(10); doc.setTextColor(MUTED);
        const bl = doc.splitTextToSize(b.before, contentW - 8);
        ensureSpace(bl.length * 13 + 6);
        doc.text(bl, marginX + 4, y); y += bl.length * 13 + 4;
      }
      doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); doc.setTextColor(GOOD);
      ensureSpace(14); doc.text("AFTER", marginX, y); y += 10;
      doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.setTextColor(INK);
      const al = doc.splitTextToSize(b.after, contentW - 8);
      ensureSpace(al.length * 14 + 8);
      doc.text(al, marginX + 4, y); y += al.length * 14 + 10;
      if (i < a.suggested_bullets.length - 1) {
        doc.setDrawColor("#EEE6F4");
        doc.line(marginX, y, marginX + contentW, y);
        y += 8;
      }
    });
  }

  if (a.focus_guidance.length) {
    drawSectionHeader("What To Focus On");
    a.focus_guidance.forEach((f, i) => {
      doc.setFont("helvetica", "normal"); doc.setFontSize(10.5); doc.setTextColor(INK);
      const lines = doc.splitTextToSize(`${i + 1}. ${f}`, contentW - 8);
      ensureSpace(lines.length * 13 + 4);
      doc.text(lines, marginX + 4, y);
      y += lines.length * 13 + 4;
    });
  }

  // Footer on every page
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(MUTED);
    doc.text(
      `Generated by LandIt · landit · Page ${p} of ${total}`,
      marginX,
      pageH - 30,
    );
  }

  doc.save(`landit_${safeFilename(a.job_title)}.pdf`);
}
