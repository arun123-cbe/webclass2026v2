import React, { useState } from "react";
import { 
  Calculator, 
  Sparkles, 
  Globe, 
  Users, 
  TrendingUp, 
  Layers, 
  FileText, 
  CheckCircle, 
  ArrowRight,
  Info,
  RefreshCw,
  Copy,
  ThumbsUp,
  Clock
} from "lucide-react";

interface MarketingToolsProps {
  toolType: "roi-calc" | "seo-meta" | "ad-copy" | "persona";
}

export default function MarketingTools({ toolType }: MarketingToolsProps) {
  // Common states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  const handleCopyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(id);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  // 1. ROI Calculator States
  const [budget, setBudget] = useState(1000);
  const [cpc, setCpc] = useState(1.20);
  const [conversionRate, setConversionRate] = useState(2.5);
  const [aov, setAov] = useState(75);
  const [savedScenarios, setSavedScenarios] = useState<any[]>([]);

  // ROI Benchmarks
  const applyBenchmark = (type: "meta" | "google" | "email" | "b2b") => {
    if (type === "meta") {
      setCpc(0.98);
      setConversionRate(1.9);
      setAov(55);
    } else if (type === "google") {
      setCpc(2.32);
      setConversionRate(3.7);
      setAov(110);
    } else if (type === "email") {
      setCpc(0.15);
      setConversionRate(4.2);
      setAov(80);
    } else if (type === "b2b") {
      setCpc(4.50);
      setConversionRate(1.5);
      setAov(450);
    }
  };

  const calculatedClicks = Math.round(budget / cpc);
  const calculatedConversions = Math.round(calculatedClicks * (conversionRate / 100));
  const calculatedCpa = calculatedConversions > 0 ? (budget / calculatedConversions).toFixed(2) : "0.00";
  const calculatedRevenue = calculatedConversions * aov;
  const calculatedProfit = calculatedRevenue - budget;
  const calculatedRoi = budget > 0 ? ((calculatedProfit / budget) * 100).toFixed(1) : "0.0";

  const handleSaveScenario = () => {
    const newScenario = {
      id: Date.now(),
      budget,
      cpc,
      conversionRate,
      aov,
      clicks: calculatedClicks,
      conversions: calculatedConversions,
      roi: calculatedRoi,
      profit: calculatedProfit
    };
    setSavedScenarios([newScenario, ...savedScenarios]);
  };

  // 2. SEO States
  const [seoProduct, setSeoProduct] = useState("");
  const [seoDesc, setSeoDesc] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [seoResult, setSeoResult] = useState<any | null>(null);

  const handleGenerateSeo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seoProduct) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "seo-meta",
          payload: {
            productName: seoProduct,
            description: seoDesc,
            keywords: seoKeywords
          }
        })
      });
      if (!response.ok) throw new Error("Failed to generate SEO assets");
      const data = await response.json();
      setSeoResult(data);
    } catch (err: any) {
      setError(err.message || "An error occurred during generation.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Ad Copy States
  const [adChannel, setAdChannel] = useState("Facebook");
  const [adOffer, setAdOffer] = useState("");
  const [adAudience, setAdAudience] = useState("");
  const [adTone, setAdTone] = useState("persuasive");
  const [adResult, setAdResult] = useState<any | null>(null);

  const handleGenerateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adOffer) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "ad-copy",
          payload: {
            channel: adChannel,
            audience: adAudience,
            offer: adOffer,
            tone: adTone
          }
        })
      });
      if (!response.ok) throw new Error("Failed to generate ad copy variations");
      const data = await response.json();
      setAdResult(data);
    } catch (err: any) {
      setError(err.message || "An error occurred during generation.");
    } finally {
      setLoading(false);
    }
  };

  // 4. Persona States
  const [persName, setPersName] = useState("");
  const [persIndustry, setPersIndustry] = useState("");
  const [persAudience, setPersAudience] = useState("");
  const [persResult, setPersResult] = useState<any | null>(null);

  const handleGeneratePersona = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!persName) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "persona",
          payload: {
            productName: persName,
            industry: persIndustry,
            audienceDescription: persAudience
          }
        })
      });
      if (!response.ok) throw new Error("Failed to generate persona");
      const data = await response.json();
      setPersResult(data);
    } catch (err: any) {
      setError(err.message || "An error occurred during generation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="marketing-interactive-sandbox" className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm text-slate-900 relative overflow-hidden my-6">
      <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
          {toolType === "roi-calc" && <Calculator className="w-5 h-5" />}
          {toolType === "seo-meta" && <Globe className="w-5 h-5" />}
          {toolType === "ad-copy" && <Sparkles className="w-5 h-5" />}
          {toolType === "persona" && <Users className="w-5 h-5" />}
        </div>
        <div className="text-left">
          <span className="text-[10px] font-bold tracking-widest text-indigo-600 uppercase block font-mono">Live Practice Sandbox</span>
          <h4 className="text-lg font-bold text-slate-900 mt-0.5">
            {toolType === "roi-calc" && "Interactive ROI & Campaign Performance Simulator"}
            {toolType === "seo-meta" && "AI-Powered SEO Metadata & Content Outline Builder"}
            {toolType === "ad-copy" && "AI Persuasive Ad & Copywriting Generator"}
            {toolType === "persona" && "AI Buyer Persona Card Creator"}
          </h4>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl mb-6 text-xs sm:text-sm flex items-start gap-2.5 text-left">
          <Info className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
          <span>{error}. Please verify your network and that the server has a valid GEMINI_API_KEY.</span>
        </div>
      )}

      {/* 1. ROI CALCULATOR TOOL */}
      {toolType === "roi-calc" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-5 bg-slate-950/40 p-5 rounded-xl border border-slate-800/60">
            <h5 className="font-semibold text-sm text-slate-300 border-b border-slate-800 pb-2 flex justify-between items-center">
              <span>Adjust Variables</span>
              <span className="text-[11px] text-slate-400">Sliders</span>
            </h5>

            {/* Presets */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Industry Benchmarks</label>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  id="btn-roi-preset-meta"
                  onClick={() => applyBenchmark("meta")}
                  className="px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-left transition"
                >
                  🔵 Meta Ads Average
                </button>
                <button 
                  id="btn-roi-preset-google"
                  onClick={() => applyBenchmark("google")}
                  className="px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-left transition"
                >
                  🟢 Google Search Ads
                </button>
                <button 
                  id="btn-roi-preset-email"
                  onClick={() => applyBenchmark("email")}
                  className="px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-left transition"
                >
                  📧 Newsletter Promo
                </button>
                <button 
                  id="btn-roi-preset-b2b"
                  onClick={() => applyBenchmark("b2b")}
                  className="px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-left transition"
                >
                  💼 High-Ticket B2B
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium text-slate-300">
                <span>Ad Spend Budget ($)</span>
                <span className="font-mono text-sky-400">${budget.toLocaleString()}</span>
              </div>
              <input 
                id="input-roi-budget"
                type="range" 
                min="100" 
                max="25000" 
                step="100"
                value={budget} 
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full accent-sky-400 cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium text-slate-300">
                <span>Average Cost Per Click (CPC)</span>
                <span className="font-mono text-sky-400">${cpc.toFixed(2)}</span>
              </div>
              <input 
                id="input-roi-cpc"
                type="range" 
                min="0.05" 
                max="10.00" 
                step="0.05"
                value={cpc} 
                onChange={(e) => setCpc(Number(e.target.value))}
                className="w-full accent-sky-400 cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium text-slate-300">
                <span>Conversion Rate (%)</span>
                <span className="font-mono text-sky-400">{conversionRate.toFixed(1)}%</span>
              </div>
              <input 
                id="input-roi-cr"
                type="range" 
                min="0.1" 
                max="15.0" 
                step="0.1"
                value={conversionRate} 
                onChange={(e) => setConversionRate(Number(e.target.value))}
                className="w-full accent-sky-400 cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium text-slate-300">
                <span>Average Order Value (AOV, $)</span>
                <span className="font-mono text-sky-400">${aov.toLocaleString()}</span>
              </div>
              <input 
                id="input-roi-aov"
                type="range" 
                min="5" 
                max="1000" 
                step="5"
                value={aov} 
                onChange={(e) => setAov(Number(e.target.value))}
                className="w-full accent-sky-400 cursor-pointer"
              />
            </div>

            <button 
              id="btn-roi-save-scenario"
              onClick={handleSaveScenario}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <TrendingUp className="w-4 h-4 text-sky-400" />
              Save Scenario Compare
            </button>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/50">
                <span className="text-xs text-slate-400 block mb-1">Clicks Generated</span>
                <span className="text-xl font-bold font-mono text-slate-100">{calculatedClicks.toLocaleString()}</span>
              </div>
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/50">
                <span className="text-xs text-slate-400 block mb-1">Conversions</span>
                <span className="text-xl font-bold font-mono text-slate-100">{calculatedConversions.toLocaleString()}</span>
              </div>
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/50 col-span-2 md:col-span-1">
                <span className="text-xs text-slate-400 block mb-1">Cost Per Lead/Acq (CPA)</span>
                <span className="text-xl font-bold font-mono text-slate-100">${calculatedCpa}</span>
              </div>
            </div>

            {/* Total Return Panel */}
            <div className="bg-slate-950/80 p-5 rounded-xl border border-slate-800 relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-32 h-32 blur-[100px] rounded-full ${calculatedProfit >= 0 ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}></div>
              <div className="flex justify-between items-center relative z-10">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Calculated Return</span>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-3xl font-extrabold font-mono ${calculatedProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      ${calculatedProfit.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400">Net Profit</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block mb-1">Return on Investment</span>
                  <span className={`text-3xl font-extrabold font-mono ${calculatedProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {calculatedProfit >= 0 ? '+' : ''}{calculatedRoi}%
                  </span>
                </div>
              </div>

              {/* Graphical mini bar */}
              <div className="mt-4 bg-slate-850 h-2.5 rounded-full overflow-hidden relative">
                <div 
                  className={`h-full rounded-full transition-all duration-350 ${calculatedProfit >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} 
                  style={{ width: `${Math.min(100, Math.max(5, (calculatedRevenue / (budget || 1)) * 50))}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 mt-2 font-mono">
                <span>Spend: ${budget.toLocaleString()}</span>
                <span>Revenue: ${calculatedRevenue.toLocaleString()}</span>
              </div>
            </div>

            {/* Saved compare table */}
            {savedScenarios.length > 0 && (
              <div className="space-y-2 bg-slate-950/40 p-4 rounded-xl border border-slate-800/60 max-h-[180px] overflow-y-auto">
                <span className="text-xs font-bold text-slate-300 block">Comparison Ledger</span>
                <div className="space-y-1.5">
                  {savedScenarios.map((sc, index) => (
                    <div key={sc.id} className="flex justify-between items-center text-xs bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                      <span className="font-semibold text-slate-400">Run #{savedScenarios.length - index}</span>
                      <div className="flex gap-4 font-mono text-slate-300">
                        <span>Spend: <strong className="text-slate-100">${sc.budget}</strong></span>
                        <span>ROI: <strong className={sc.profit >= 0 ? "text-emerald-400" : "text-rose-400"}>{sc.roi}%</strong></span>
                        <span>Profit: <strong className={sc.profit >= 0 ? "text-emerald-400" : "text-rose-400"}>${sc.profit}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. SEO META TOOL */}
      {toolType === "seo-meta" && (
        <div className="space-y-6">
          <form id="form-seo-generator" onSubmit={handleGenerateSeo} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Product/Service Name</label>
              <input 
                id="input-seo-product"
                type="text" 
                placeholder="e.g. EcoSpark Toothbrush"
                value={seoProduct}
                onChange={(e) => setSeoProduct(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Primary Keyword Focus</label>
              <input 
                id="input-seo-keywords"
                type="text" 
                placeholder="e.g. biodegradable toothbrush, eco oral care"
                value={seoKeywords}
                onChange={(e) => setSeoKeywords(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Quick Description</label>
              <div className="flex gap-2">
                <input 
                  id="input-seo-desc"
                  type="text" 
                  placeholder="e.g. Bamboo handle, charcoal infused bristles"
                  value={seoDesc}
                  onChange={(e) => setSeoDesc(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
                <button 
                  id="btn-seo-generate"
                  type="submit"
                  disabled={loading || !seoProduct}
                  className="px-4 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shrink-0 transition disabled:opacity-40"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {loading ? "Optimizing..." : "Analyze"}
                </button>
              </div>
            </div>
          </form>

          {seoResult ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-slate-800/80">
              {/* Google Search Engine Preview Card */}
              <div className="lg:col-span-5 space-y-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">SERP Search Snippet Mockup</span>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1 text-left font-sans">
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                    <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">Organic</span>
                    <span className="truncate">https://www.google.com &rsaquo; shop &rsaquo; {seoProduct.toLowerCase().replace(/\s+/g, '-')}</span>
                  </div>
                  <h5 className="text-lg text-sky-400 font-medium hover:underline cursor-pointer leading-tight">
                    {seoResult.metaTitle}
                  </h5>
                  <p className="text-sm text-slate-300 line-clamp-2 leading-snug">
                    {seoResult.metaDescription}
                  </p>
                </div>
                <div className="flex gap-2 text-xs">
                  <button 
                    id="btn-seo-copy-title"
                    onClick={() => handleCopyToClipboard(seoResult.metaTitle, "title")}
                    className="flex-1 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 flex items-center justify-center gap-1.5 transition"
                  >
                    <Copy className="w-3.5 h-3.5 text-sky-400" />
                    {copySuccess === "title" ? "Copied!" : "Copy Title"}
                  </button>
                  <button 
                    id="btn-seo-copy-desc"
                    onClick={() => handleCopyToClipboard(seoResult.metaDescription, "desc")}
                    className="flex-1 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 flex items-center justify-center gap-1.5 transition"
                  >
                    <Copy className="w-3.5 h-3.5 text-sky-400" />
                    {copySuccess === "desc" ? "Copied!" : "Copy Meta"}
                  </button>
                </div>
              </div>

              {/* Suggested Blog Outline Structure */}
              <div className="lg:col-span-7 space-y-3 bg-slate-950/50 p-5 rounded-xl border border-slate-800/80">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Recommended Pillar Blog Post Outline</span>
                  <span className="text-[10px] text-sky-400 font-mono font-bold">SEO Rank Builder</span>
                </div>
                <div className="space-y-4 max-h-[220px] overflow-y-auto text-sm text-slate-300 font-sans pr-2">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide block font-mono">H1 Primary Header Title</span>
                    <h6 className="font-bold text-slate-100 text-base">{seoResult.blogOutline.title}</h6>
                    <p className="text-xs text-slate-400 mt-1 italic">{seoResult.blogOutline.introduction}</p>
                  </div>
                  <div className="space-y-3 border-l-2 border-sky-500/20 pl-3">
                    {seoResult.blogOutline.sections.map((section: any, idx: number) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-sky-400 font-mono">H2 Section</span>
                          {section.targetKeyword && (
                            <span className="text-[9px] bg-sky-400/10 text-sky-300 px-1.5 py-0.5 rounded font-mono font-semibold">
                              KW: {section.targetKeyword}
                            </span>
                          )}
                        </div>
                        <h6 className="font-semibold text-slate-200 block text-sm">{section.heading}</h6>
                        <ul className="list-disc list-inside text-xs text-slate-400 space-y-0.5 pl-1.5">
                          {section.subpoints.map((sub: string, subIdx: number) => (
                            <li key={subIdx}>{sub}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block font-mono">Blog Post Conclusion</span>
                    <p className="text-xs text-slate-400 mt-0.5">{seoResult.blogOutline.conclusion}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 bg-slate-950/20 border border-dashed border-slate-800 rounded-xl">
              <Globe className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm">Input your product data above to auto-generate SEO metadata and outlines.</p>
            </div>
          )}
        </div>
      )}

      {/* 3. AD COPY GENERATOR */}
      {toolType === "ad-copy" && (
        <div className="space-y-6">
          <form id="form-ad-generator" onSubmit={handleGenerateAd} className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-3 space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Target Channel</label>
              <select 
                id="select-ad-channel"
                value={adChannel}
                onChange={(e) => setAdChannel(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="Facebook">🔵 Facebook Feed</option>
                <option value="Instagram">🟣 Instagram Caption</option>
                <option value="Google Ads">🟡 Google PPC Search</option>
                <option value="LinkedIn">💼 LinkedIn Executive</option>
              </select>
            </div>
            <div className="sm:col-span-3 space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Target Audience Profile</label>
              <input 
                id="input-ad-audience"
                type="text" 
                placeholder="e.g. busy working moms, startup founders"
                value={adAudience}
                onChange={(e) => setAdAudience(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                required
              />
            </div>
            <div className="sm:col-span-3 space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Ad Tone of Voice</label>
              <select 
                id="select-ad-tone"
                value={adTone}
                onChange={(e) => setAdTone(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="persuasive">🔥 Persuasive & Urgency</option>
                <option value="informative">💡 Informative & Benefit-rich</option>
                <option value="humorous">😄 Witty & Humorous</option>
                <option value="professional">🛡️ Professional & High-trust</option>
              </select>
            </div>
            <div className="sm:col-span-3 space-y-1.5">
              <label className="text-xs font-medium text-slate-300">The Core Offer/Deal</label>
              <div className="flex gap-2">
                <input 
                  id="input-ad-offer"
                  type="text" 
                  placeholder="e.g. Save 50% off your first month"
                  value={adOffer}
                  onChange={(e) => setAdOffer(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  required
                />
                <button 
                  id="btn-ad-generate"
                  type="submit"
                  disabled={loading || !adOffer}
                  className="px-4 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shrink-0 transition disabled:opacity-40"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {loading ? "Writing..." : "Generate"}
                </button>
              </div>
            </div>
          </form>

          {adResult ? (
            <div className="space-y-4 pt-4 border-t border-slate-800/80">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Generated Ad Creative Variations (3)</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {adResult.ads.map((ad: any, index: number) => (
                  <div key={index} className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex flex-col h-full font-sans">
                    <div className="p-3 bg-slate-900 border-b border-slate-800/50 flex justify-between items-center">
                      <span className="text-[11px] font-bold text-sky-400 font-mono">Variation {index + 1}</span>
                      <span className="text-[10px] text-slate-400">Score: A</span>
                    </div>
                    
                    {/* Social Feed mockup design */}
                    <div className="p-4 flex-1 space-y-3 flex flex-col text-left">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[10px] text-sky-400">DM</div>
                        <div>
                          <span className="text-xs font-bold block text-slate-100">Digital Academy</span>
                          <span className="text-[10px] text-slate-500">Sponsored</span>
                        </div>
                      </div>

                      {/* Main Copy */}
                      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap flex-1">{ad.bodyCopy}</p>

                      {/* Meta card simulation */}
                      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden p-2.5">
                        <span className="text-[9px] text-sky-500 font-mono block uppercase">Headline Spotlight</span>
                        <h6 className="text-xs font-bold text-slate-100 mt-0.5 line-clamp-1">{ad.headline}</h6>
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-800/60">
                          <span className="text-[10px] text-slate-500 font-mono">Academy Sponsor</span>
                          <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded font-bold text-slate-300 tracking-wide uppercase">{ad.cta || "Learn More"}</span>
                        </div>
                      </div>

                      {/* Hashtags list */}
                      {ad.hashtags && ad.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {ad.hashtags.map((tag: string, tid: number) => (
                            <span key={tid} className="text-[10px] text-sky-400">#{tag.replace("#", "")}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="p-3 bg-slate-900 border-t border-slate-800/50 flex gap-2">
                      <button 
                        id={`btn-ad-copy-copy-${index}`}
                        onClick={() => handleCopyToClipboard(`${ad.headline}\n\n${ad.bodyCopy}\n\nCTA: ${ad.cta}`, `copy-ad-${index}`)}
                        className="flex-1 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] text-slate-300 flex items-center justify-center gap-1 transition"
                      >
                        <Copy className="w-3 h-3 text-sky-400" />
                        {copySuccess === `copy-ad-${index}` ? "Copied!" : "Copy Text"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 bg-slate-950/20 border border-dashed border-slate-800 rounded-xl">
              <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm">Customize details above to generate and test copywriting variations instantly.</p>
            </div>
          )}
        </div>
      )}

      {/* 4. BUYER PERSONA BUILDER */}
      {toolType === "persona" && (
        <div className="space-y-6">
          <form id="form-persona-generator" onSubmit={handleGeneratePersona} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Your Product Name</label>
              <input 
                id="input-persona-product"
                type="text" 
                placeholder="e.g. SwiftQuery Analytics"
                value={persName}
                onChange={(e) => setPersName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Product Category / Industry</label>
              <input 
                id="input-persona-industry"
                type="text" 
                placeholder="e.g. Enterprise SaaS, FinTech"
                value={persIndustry}
                onChange={(e) => setPersIndustry(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Target Customer Description</label>
              <div className="flex gap-2">
                <input 
                  id="input-persona-desc"
                  type="text" 
                  placeholder="e.g. data analysts at medium tech companies"
                  value={persAudience}
                  onChange={(e) => setPersAudience(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
                <button 
                  id="btn-persona-generate"
                  type="submit"
                  disabled={loading || !persName}
                  className="px-4 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shrink-0 transition disabled:opacity-40"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {loading ? "Profiling..." : "Build Persona"}
                </button>
              </div>
            </div>
          </form>

          {persResult ? (
            <div className="pt-4 border-t border-slate-800/80">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 relative overflow-hidden font-sans">
                <div className="absolute top-0 right-0 w-48 h-48 bg-sky-500/10 blur-[120px] rounded-full"></div>
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
                  {/* Left Column: Avatar & Demographics */}
                  <div className="lg:col-span-4 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-slate-850 border-2 border-sky-400 flex items-center justify-center font-bold text-2xl text-sky-400">
                        {persResult.personaName.charAt(0)}
                      </div>
                      <div className="text-left">
                        <span className="text-[10px] font-bold text-sky-400 uppercase font-mono tracking-wide">Target Persona Profile</span>
                        <h5 className="text-xl font-bold text-slate-100">{persResult.personaName}</h5>
                        <span className="text-xs text-slate-400">{persResult.demographics.occupation}</span>
                      </div>
                    </div>

                    <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 space-y-2 text-left text-xs text-slate-300">
                      <span className="font-bold text-slate-400 text-[10px] uppercase font-mono block border-b border-slate-800 pb-1">Demographics</span>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Age:</span>
                        <span className="font-semibold text-slate-200">{persResult.demographics.age}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Location:</span>
                        <span className="font-semibold text-slate-200">{persResult.demographics.location}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Estimated Income:</span>
                        <span className="font-semibold text-slate-200">{persResult.demographics.income}</span>
                      </div>
                      {persResult.demographics.familyStatus && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Family Status:</span>
                          <span className="font-semibold text-slate-200">{persResult.demographics.familyStatus}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Middle Column: Psychographics, Goals & Pain Points */}
                  <div className="lg:col-span-5 space-y-4 text-left text-xs">
                    <div className="space-y-1.5">
                      <span className="font-bold text-sky-400 text-[10px] uppercase font-mono block">Pain Points & Roadblocks</span>
                      <ul className="space-y-1 text-slate-300 list-inside pl-0">
                        {persResult.painPoints.map((pt: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-red-400 font-bold mt-0.5">&bull;</span>
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-1.5">
                      <span className="font-bold text-emerald-400 text-[10px] uppercase font-mono block">Core Goals & Motives</span>
                      <ul className="space-y-1 text-slate-300 list-inside pl-0">
                        {persResult.goals.map((gl: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-emerald-400 font-bold mt-0.5">&bull;</span>
                            <span>{gl}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Right Column: Channels & Marketing Message Angle */}
                  <div className="lg:col-span-3 space-y-4 text-left text-xs">
                    <div className="space-y-1.5">
                      <span className="font-bold text-purple-400 text-[10px] uppercase font-mono block">Preferred Acquisition Channels</span>
                      <div className="space-y-2">
                        {persResult.preferredChannels.map((ch: any, idx: number) => (
                          <div key={idx} className="bg-slate-900/40 p-2 rounded-lg border border-slate-800">
                            <span className="font-bold text-slate-200 block">{ch.channel}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{ch.reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                      <span className="font-bold text-sky-400 text-[10px] uppercase font-mono block">Marketing Headline Angle</span>
                      <p className="italic text-slate-300 font-sans leading-relaxed text-[11px]">&ldquo;{persResult.marketingAngle}&rdquo;</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 bg-slate-950/20 border border-dashed border-slate-800 rounded-xl">
              <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm">Complete form inputs to construct a detailed Ideal Customer Profile (ICP).</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
