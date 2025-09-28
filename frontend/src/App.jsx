import React, { useEffect, useState } from "react";
import StatCard from "./components/StatCard.jsx";
import ChartCard from "./components/ChartCard.jsx";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export default function App() {
  const [health, setHealth] = useState("…");
  const [pd, setPd] = useState(null);
  const [varRes, setVarRes] = useState(null);
  const [anom, setAnom] = useState(null);

  useEffect(() => {
    fetch(API.replace("/api/v1","/health"))
      .then(r => r.json())
      .then(d => setHealth(d.status))
      .catch(() => setHealth("down"));
  }, []);

  const runCredit = async () => {
    const body = { ltv: 0.65, dti: 0.35, delinquency_history: 1, exposure_at_default: 150000 };
    const res = await fetch(`${API}/risk/credit/predict`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setPd(await res.json());
  };

  const runVaR = async () => {
    // fake returns
    const returns = Array.from({length: 250}, () => (Math.random()-0.5) * 0.02);
    const res = await fetch(`${API}/risk/var`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ returns, confidence: 0.95, horizon_days: 1 }) });
    setVarRes(await res.json());
  };

  const runAnom = async () => {
    const values = [...Array(100)].map(() => Math.random()*100);
    values[10] = 500; values[57] = -200; // anomalies
    const res = await fetch(`${API}/risk/anomaly`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ values, z_threshold: 3.0 }) });
    setAnom(await res.json());
  };

  useEffect(() => { runCredit(); runVaR(); runAnom(); }, []);

  const varSeries = varRes ? [{ label: "VaR@95%", value: varRes.var }, { label: "ES@95%", value: varRes.expected_shortfall }] : [];
  const pdSeries = pd ? Object.entries(pd.attributions).map(([k,v]) => ({ label: k, value: v })) : [];
  const anomSeries = anom ? anom.indices.map((i,idx) => ({ label: `idx ${i}`, value: i })) : [];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Financial Risk Dashboard</h1>
        <div className={`px-3 py-1 rounded-full text-sm ${health==="ok"?"bg-green-100 text-green-700":"bg-red-100 text-red-700"}`}>
          API: {health}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <StatCard title="PD (Probability of Default)" value={pd ? pd.pd.toFixed(3) : "…"} subtitle="Credit Risk Model" />
        <StatCard title="VaR (1d, 95%)" value={varRes ? varRes.var.toFixed(4) : "…"} subtitle="Monte Carlo" />
        <StatCard title="Anomaly Precision" value={anom ? `${Math.round(anom.precision*100)}%` : "…"} subtitle="Z-score" />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <ChartCard title="PD Feature Attributions (mock SHAP)" data={pdSeries} />
        <ChartCard title="VaR / ES Summary" data={varSeries} />
        <ChartCard title="Detected Anomaly Indices" data={anomSeries} />
      </div>

      <div className="rounded-2xl shadow p-5 bg-white">
        <div className="text-sm text-gray-600 mb-3">Stress Test What-If</div>
        <form onSubmit={async (e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          const base = Number(form.get("base"));
          const shock = Number(form.get("shock"));
          const exposures = form.get("exposures").split(",").map(s => Number(s.trim())).filter(Number.isFinite);

          const res = await fetch(`${API}/stress/whatif`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ base_rate_bps: base, shock_bps: shock, exposures }) });
          const data = await res.json();
          alert(`Total Loss: ${data.total_loss} (shock=${(data.shock*100).toFixed(2)}%)`);
        }}>
          <div className="grid md:grid-cols-4 gap-3">
            <input className="border rounded px-3 py-2" name="base" placeholder="Base rate (bps)" defaultValue="500" />
            <input className="border rounded px-3 py-2" name="shock" placeholder="Shock (bps)" defaultValue="200" />
            <input className="border rounded px-3 py-2" name="exposures" placeholder="Exposures CSV" defaultValue="100000,250000,400000" />
            <button className="bg-black text-white rounded px-4 py-2">Run</button>
          </div>
        </form>
      </div>
    </div>
  );
}