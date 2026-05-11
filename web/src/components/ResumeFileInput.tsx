import { useRef, useState } from "react";
import { AlertCircle, FileText, Loader2, Upload, X } from "lucide-react";
import { ParseError, parseResumeFile, type ParseResult } from "../parseResume";

type Props = {
  onParsed: (result: ParseResult) => void;
  disabled?: boolean;
};

const ACCEPT = ".pdf,.docx,.txt,.md,.markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown";

export default function ResumeFileInput({ onParsed, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [filename, setFilename] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setErr(null);
    setBusy(true);
    setFilename(file.name);
    try {
      const result = await parseResumeFile(file);
      onParsed(result);
    } catch (e) {
      setErr(e instanceof ParseError ? e.message : "Couldn't read this file.");
      setFilename(null);
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setFilename(null);
    setErr(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="mb-2.5">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          if (disabled) return;
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        onClick={() => !disabled && !busy && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !disabled && !busy) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={0}
        data-testid="resume-file-dropzone"
        className={`cursor-pointer rounded-xl border-2 border-dashed p-3 transition-colors flex items-center gap-3 ${
          drag ? "border-brand-500 bg-brand-50" : "border-brand-200 bg-brand-50/40 hover:bg-brand-50/70"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {busy ? (
          <Loader2 size={18} className="text-brand-500 animate-spin shrink-0" />
        ) : filename ? (
          <FileText size={18} className="text-brand-500 shrink-0" />
        ) : (
          <Upload size={18} className="text-brand-500 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          {busy ? (
            <div className="text-sm font-semibold text-ink">Parsing {filename}...</div>
          ) : filename ? (
            <>
              <div className="text-sm font-bold text-ink truncate">{filename}</div>
              <div className="text-[11px] text-muted">Parsed - text loaded below (editable)</div>
            </>
          ) : (
            <>
              <div className="text-sm font-bold text-ink">Drop resume or click to upload</div>
              <div className="text-[11px] text-muted">PDF, DOCX, TXT, MD - max 5 MB</div>
            </>
          )}
        </div>
        {filename && !busy && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              reset();
            }}
            className="text-muted hover:text-ink p-1"
            title="Clear"
            type="button"
          >
            <X size={16} />
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>
      {err && (
        <div data-testid="resume-file-error" className="mt-1.5 flex items-start gap-1.5 text-[11px] text-bad">
          <AlertCircle size={12} className="shrink-0 mt-0.5" />
          <span>{err}</span>
        </div>
      )}
    </div>
  );
}
