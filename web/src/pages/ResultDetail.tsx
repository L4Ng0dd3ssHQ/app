import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getAnalysis } from "../storage";
import type { Analysis } from "../types";
import AnalysisView from "../components/AnalysisView";

export default function ResultDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      setData(getAnalysis(id));
    }
    setLoading(false);
  }, [id]);

  return (
    <div data-testid="result-detail-screen">
      <div className="flex items-center justify-between px-4 pt-5 pb-3 border-b border-brand-50 bg-bg sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          data-testid="back-btn"
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-brand-50"
        >
          <ArrowLeft size={22} className="text-ink" />
        </button>
        <div className="font-extrabold text-ink">Saved Analysis</div>
        <div className="w-10" />
      </div>
      {loading ? (
        <div className="flex justify-center py-16 text-muted">Loading…</div>
      ) : !data ? (
        <div className="flex justify-center py-16 text-muted">Analysis not found.</div>
      ) : (
        <AnalysisView data={data} />
      )}
    </div>
  );
}
