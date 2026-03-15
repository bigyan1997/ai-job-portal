import { useState, useEffect, useRef } from "react";
import { jobService } from "../services/jobService";
import toast from "react-hot-toast";
import html2pdf from "html2pdf.js";

const JobModal = ({ jobId, token, onClose, onApplySuccess }) => {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  // --- LIFTED STATES (Accessible by handleFinalApply) ---
  const [coverLetter, setCoverLetter] = useState("");
  const [analysisPreview, setAnalysisPreview] = useState(null);
  const [tempFile, setTempFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (jobId && token) {
      jobService
        .fetchJobDetail(token, jobId)
        .then((res) => setJob(res.data))
        .finally(() => setLoading(false));
    }
  }, [jobId, token]);

  const handleAnalyzeOnly = async (e) => {
    const file = e.target.files[0];
    if (!file || isProcessing) return;
    if (file.type !== "application/pdf") return toast.error("PDF only please.");

    setTempFile(file);
    const formData = new FormData();
    formData.append("resume", file);
    formData.append("job", jobId);

    setIsProcessing(true);
    try {
      const res = await jobService.analyzeOnly(token, formData);
      setAnalysisPreview(res.data);
      toast.success("AI Analysis ready for review!");
    } catch (err) {
      toast.error(err.message || "Analysis failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinalApply = async () => {
    if (!tempFile) return toast.error("Please upload a resume first.");

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("resume", tempFile);
      formData.append("job", jobId);

      // If the coverLetter state is empty, tell the backend to generate one.
      // If the user already generated it in the modal, we send the text.
      if (coverLetter) {
        formData.append("cover_letter", coverLetter);
        formData.append("generate_cover_letter", "false"); // Already have it
      } else {
        formData.append("generate_cover_letter", "true"); // Ask AI to do it
      }

      const res = await jobService.apply(token, formData);

      setJob((prev) => ({
        ...prev,
        ...res.data,
      }));

      setAnalysisPreview(null);
      if (onApplySuccess) onApplySuccess();
      toast.success("Applied successfully! 🚀");
    } catch (err) {
      toast.error(err.response?.data?.error || "Submission failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const activeAnalysis = job?.has_applied ? job : analysisPreview;
  const aiDetails = activeAnalysis?.ai_analysis;

  if (!job) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".pdf"
          onChange={handleAnalyzeOnly}
        />

        {/* --- HEADER --- */}
        <div className="p-10 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden flex-shrink-0">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <h3 className="text-3xl font-black tracking-tight">{job.title}</h3>
            <p className="text-blue-400 font-bold uppercase text-[10px] mt-2 tracking-widest">
              {job.company_name}
            </p>
          </div>
          <div className="relative z-10 text-center p-5 bg-white/10 rounded-[2rem] border border-white/10 backdrop-blur-md min-w-[110px]">
            <span
              className={`text-4xl font-black ${
                aiDetails?.score > 70 ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {aiDetails?.score || 0}%
            </span>
            <p className="text-[8px] uppercase tracking-widest font-black mt-1">
              AI Match
            </p>
          </div>
        </div>

        {/* --- SCROLLABLE CONTENT --- */}
        <div className="p-10 overflow-y-auto custom-scrollbar space-y-8 flex-1">
          {aiDetails ? (
            <div className="space-y-6">
              {/* STATUS CHECKLIST */}
              <div className="flex gap-4 mb-4">
                <div
                  className={`flex-1 p-4 rounded-2xl border flex items-center gap-3 ${
                    tempFile
                      ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                      : "bg-slate-50 border-slate-100 text-slate-400"
                  }`}
                >
                  <span className="text-lg">{tempFile ? "✅" : "⭕"}</span>
                  <span className="text-[10px] font-black uppercase">
                    Resume Analyzed
                  </span>
                </div>
                <div
                  className={`flex-1 p-4 rounded-2xl border flex items-center gap-3 ${
                    coverLetter
                      ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                      : "bg-slate-50 border-slate-100 text-slate-400"
                  }`}
                >
                  <span className="text-lg">{coverLetter ? "✅" : "⭕"}</span>
                  <span className="text-[10px] font-black uppercase">
                    Letter Ready
                  </span>
                </div>
              </div>

              <AnalysisGrid
                title="Matching Strengths"
                items={aiDetails.matching}
                variant="success"
                icon="✅"
              />
              <AnalysisGrid
                title="Gap Analysis (Missing)"
                items={aiDetails.missing}
                variant="danger"
                icon="🚩"
              />

              {aiDetails.missing?.length > 0 && (
                <OptimizerSection
                  activeAnalysis={aiDetails}
                  job={job}
                  token={token}
                />
              )}

              <CoverLetterSection
                job={job}
                token={token}
                resumeText={activeAnalysis?.raw_resume_text}
                coverLetter={coverLetter}
                setCoverLetter={setCoverLetter}
              />
            </div>
          ) : (
            <div className="p-12 bg-blue-50/50 rounded-[3rem] border-2 border-dashed border-blue-100 flex flex-col items-center text-center gap-4">
              <div className="text-4xl">🤖</div>
              <h4 className="font-black text-slate-900 uppercase text-sm">
                Analyze Before You Apply
              </h4>
              <button
                onClick={() => fileInputRef.current.click()}
                className="mt-2 px-8 py-3 bg-white text-blue-600 rounded-xl font-black text-[10px] uppercase shadow-sm border border-blue-100 hover:bg-blue-50"
              >
                Analyze Resume
              </button>
            </div>
          )}

          <div className="pb-10">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
              Job Description
            </h4>
            <p className="text-slate-600 leading-relaxed text-[15px] whitespace-pre-line">
              {job.description}
            </p>
          </div>
        </div>

        {/* --- FOOTER --- */}
        <div className="p-8 bg-slate-50 border-t flex justify-between items-center flex-shrink-0">
          <button
            onClick={onClose}
            className="px-8 py-4 text-slate-400 font-black uppercase text-[10px]"
          >
            Cancel
          </button>
          <div className="flex gap-3">
            {job.has_applied ? (
              <div className="px-8 py-4 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-[10px] uppercase border border-emerald-100">
                Application Submitted
              </div>
            ) : analysisPreview ? (
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="px-6 py-4 bg-slate-200 text-slate-600 rounded-2xl font-black uppercase text-[10px]"
                >
                  Change File
                </button>
                <button
                  onClick={handleFinalApply}
                  disabled={isProcessing}
                  className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl active:scale-95 transition-all"
                >
                  {isProcessing ? "Applying..." : "Confirm & Apply"}
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current.click()}
                disabled={isProcessing}
                className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl"
              >
                {isProcessing ? "Processing..." : "Analyze & Review"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: COVER LETTER SECTION ---
const CoverLetterSection = ({
  job,
  token,
  resumeText,
  coverLetter,
  setCoverLetter,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!resumeText) return toast.error("Please analyze your resume first.");
    setIsGenerating(true);
    try {
      const res = await jobService.generateCoverLetter(token, {
        job_id: job.id,
        resume_text: resumeText,
      });

      const today = new Date().toLocaleDateString("en-AU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const cleaned = res.data.cover_letter
        .replace(/\[Date\]/g, today)
        .replace(/\*\*/g, "")
        .replace(/\[.*?Address.*?\]/g, "Brentwood Aged Care, Parramatta NSW");

      setCoverLetter(cleaned);
      toast.success("Cover letter generated! ✉️");
    } catch (err) {
      toast.error("Failed to generate cover letter.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadCL = () => {
    const element = document.createElement("div");
    element.innerHTML = `<div style="padding: 50px; font-family: 'Helvetica', sans-serif; line-height: 1.8;">${coverLetter.replace(/\n/g, "<br/>")}</div>`;
    html2pdf()
      .from(element)
      .set({ filename: `Cover_Letter_${job.company_name}.pdf`, margin: 1 })
      .save();
  };

  return (
    <div className="mt-4 p-8 bg-slate-900 rounded-[2.5rem] text-white border border-white/10 shadow-xl">
      {!coverLetter ? (
        <div className="flex justify-between items-center gap-4">
          <div className="flex-1">
            <h4 className="text-[10px] font-black uppercase tracking-widest mb-1 text-blue-400">
              AI Cover Letter
            </h4>
            <p className="text-xs font-bold text-slate-300">
              Generate a tailored pitch for this role.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-6 py-3 bg-blue-600 rounded-xl font-black uppercase text-[9px]"
          >
            {isGenerating ? "Writing..." : "Generate ✨"}
          </button>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex justify-between items-center px-2">
            <h4 className="text-[10px] font-black uppercase text-blue-400">
              Your Tailored Letter
            </h4>
            <button
              onClick={() => {
                navigator.clipboard.writeText(coverLetter);
                toast.success("Copied!");
              }}
              className="text-[10px] font-black uppercase text-slate-400 hover:text-white transition-colors"
            >
              Copy Text
            </button>
          </div>
          <textarea
            className="w-full h-80 bg-white border-none rounded-2xl p-8 text-[14px] leading-7 text-black shadow-2xl resize-none outline-none font-sans"
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={downloadCL}
              className="py-4 bg-emerald-500 rounded-2xl text-white text-[10px] font-black uppercase"
            >
              📥 Download PDF
            </button>
            <button
              onClick={() => setCoverLetter("")}
              className="py-4 bg-gray-700 rounded-2xl text-[10px] font-black uppercase"
            >
              🔄 Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- SUB-COMPONENT: OPTIMIZER SECTION ---
const OptimizerSection = ({ activeAnalysis, job, token }) => {
  const [optimizedText, setOptimizedText] = useState("");
  const [isOptimizing, setIsOptimizing] = useState(false);

  const handleOptimize = async () => {
    setIsOptimizing(true);
    try {
      const res = await jobService.optimizeResume(token, {
        job_id: job.id,
        missing_skills: activeAnalysis.missing,
      });
      setOptimizedText(res.data.optimized_text);
      toast.success("Optimized! ✨");
    } catch (err) {
      toast.error("Failed to optimize.");
    } finally {
      setIsOptimizing(false);
    }
  };

  const downloadPDF = () => {
    const element = document.createElement("div");
    element.innerHTML = `<div style="padding: 40px; font-family: 'Helvetica', sans-serif; line-height: 1.6;">${optimizedText.replace(/\n/g, "<br/>")}</div>`;
    html2pdf()
      .from(element)
      .set({ filename: `Optimized_Resume.pdf`, margin: 1 })
      .save();
  };

  return (
    <div className="mt-4 p-8 bg-blue-600 rounded-[2.5rem] text-white shadow-xl shadow-blue-200">
      {!optimizedText ? (
        <div className="flex justify-between items-center gap-4">
          <div className="flex-1">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-80 text-blue-200">
              Resume Optimizer
            </h4>
            <p className="text-xs font-bold">
              Bridge these gaps before you confirm your application.
            </p>
          </div>
          <button
            onClick={handleOptimize}
            disabled={isOptimizing}
            className="px-6 py-3 bg-white text-blue-600 rounded-xl font-black uppercase text-[9px]"
          >
            {isOptimizing ? "Working..." : "🛠️ Optimize Now"}
          </button>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in duration-500">
          <div className="flex justify-between items-center">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200">
              Suggested Improvements
            </h4>
            <button
              onClick={() => {
                navigator.clipboard.writeText(optimizedText);
                toast.success("Copied!");
              }}
              className="text-[10px] font-black uppercase text-blue-300"
            >
              Copy Text
            </button>
          </div>
          <textarea
            className="w-full h-40 bg-blue-700/50 border border-blue-500 rounded-2xl p-4 text-sm font-medium text-white resize-none outline-none"
            value={optimizedText}
            onChange={(e) => setOptimizedText(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={downloadPDF}
              className="py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase text-[10px]"
            >
              📥 Download PDF
            </button>
            <button
              onClick={() => setOptimizedText("")}
              className="py-4 bg-blue-800/40 text-blue-200 rounded-2xl font-black uppercase text-[10px] border border-blue-700"
            >
              🔄 Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- SUB-COMPONENT: ANALYSIS GRID ---
const AnalysisGrid = ({ title, items, variant, icon }) => {
  const isSuccess = variant === "success";
  return (
    <div
      className={`p-6 rounded-[2rem] border ${isSuccess ? "bg-emerald-50/30 border-emerald-100" : "bg-rose-50/30 border-rose-100"}`}
    >
      <h4
        className={`text-[9px] font-black uppercase tracking-widest mb-4 flex items-center gap-2 ${isSuccess ? "text-emerald-600" : "text-rose-600"}`}
      >
        {icon} {title}
      </h4>
      <div className="flex flex-wrap gap-2">
        {items?.length > 0 ? (
          items.map((item, i) => (
            <span
              key={i}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight border ${isSuccess ? "bg-white border-emerald-200 text-emerald-700" : "bg-white border-rose-200 text-rose-700"}`}
            >
              {item}
            </span>
          ))
        ) : (
          <p className="text-[10px] text-slate-400 font-bold italic">
            No items found.
          </p>
        )}
      </div>
    </div>
  );
};

export default JobModal;
