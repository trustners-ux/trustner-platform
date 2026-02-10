import { useState } from "react";
import { Heart, Shield, Car, ArrowRight, Check, Star, Phone, Mail, Download, FileText, Clock, ChevronLeft, ChevronRight, Search, Activity, TrendingUp, Users, Plus, Award, RefreshCw, CheckCircle, Menu, X, LogIn, LogOut, Home, Bell } from "lucide-react";
import { LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// ══════════════════════════════════════════════════
// TRUSTNER INSURANCE BROKERS - Complete Platform
// ══════════════════════════════════════════════════

// ─── Landing Page ─────────────────────────────────
const LandingPage = ({ onNavigate }) => (
  <div className="min-h-screen bg-white">
    <section className="bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 text-white py-20 px-4">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="text-5xl font-bold mb-6 leading-tight">Your Trusted Insurance Partner</h1>
          <p className="text-xl text-blue-100 mb-8">Compare Health, Life & Motor insurance from 20+ insurers. Best coverage at the lowest price.</p>
          <div className="flex gap-4 flex-wrap">
            <button onClick={() => onNavigate("health")} className="bg-white text-blue-700 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition flex items-center gap-2">Get Started <ArrowRight size={20} /></button>
            <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-bold hover:bg-white hover:text-blue-700 transition">Learn More</button>
          </div>
        </div>
        <div className="hidden md:block">
          <div className="bg-white bg-opacity-10 rounded-2xl p-8 border border-white border-opacity-20 space-y-6">
            {[["Instant Comparison", "Compare 100+ plans in seconds"], ["Best Prices", "Save up to 40% on premiums"], ["Online Purchase", "Get insured in 5 minutes"]].map(([t, s], i) => (
              <div key={i} className="flex items-center gap-4"><div className="bg-green-400 rounded-full p-3"><Check size={24} /></div><div><p className="font-semibold">{t}</p><p className="text-sm text-blue-100">{s}</p></div></div>
            ))}
          </div>
        </div>
      </div>
    </section>

    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-4 text-gray-900">What Would You Like to Insure?</h2>
        <p className="text-center text-gray-600 mb-12">Choose from our wide range of insurance products.</p>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { id: "health", icon: Heart, title: "Health Insurance", desc: "Complete health coverage for you and your family with cashless treatment at 12,000+ hospitals", color: "bg-red-50 border-red-200", btn: "bg-red-600 hover:bg-red-700" },
            { id: "life", icon: Shield, title: "Life Insurance", desc: "Secure your family's future with comprehensive life insurance plans starting at just ₹25/day", color: "bg-blue-50 border-blue-200", btn: "bg-blue-600 hover:bg-blue-700" },
            { id: "motor", icon: Car, title: "Motor Insurance", desc: "Hassle-free car and bike insurance with quick claim settlement in 24 hours", color: "bg-green-50 border-green-200", btn: "bg-green-600 hover:bg-green-700" }
          ].map(cat => {
            const Icon = cat.icon;
            return (
              <div key={cat.id} className={`${cat.color} border-2 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2`}>
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4"><Icon size={32} className="text-white" /></div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{cat.title}</h3>
                <p className="text-gray-700 mb-6">{cat.desc}</p>
                <button onClick={() => onNavigate(cat.id)} className={`w-full ${cat.btn} text-white py-3 rounded-lg font-bold transition flex items-center justify-center gap-2`}>Get Quote <ArrowRight size={20} /></button>
              </div>
            );
          })}
        </div>
      </div>
    </section>

    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-8">
          {[["1", "Compare Plans", "Browse multiple insurance plans"], ["2", "Get Quotes", "Receive instant quotes from 20+ insurers"], ["3", "Choose Best", "Select the best value plan"], ["4", "Buy Online", "Complete purchase in minutes"]].map(([n, t, d], i) => (
            <div key={i}><div className="bg-blue-600 rounded-full w-16 h-16 flex items-center justify-center text-white text-2xl font-bold mb-4">{n}</div><h3 className="text-xl font-bold text-gray-900 mb-2">{t}</h3><p className="text-gray-600">{d}</p></div>
          ))}
        </div>
      </div>
    </section>

    <section className="bg-gradient-to-r from-blue-700 to-blue-800 text-white py-16 px-4">
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-12">
        {[["50,000+", "Happy Customers", Users], ["20+", "Insurance Partners", TrendingUp], ["98%", "Claim Settlement", Check]].map(([v, l, Icon], i) => (
          <div key={i} className="text-center"><div className="flex justify-center mb-4"><Icon size={48} /></div><p className="text-5xl font-bold mb-2">{v}</p><p className="text-blue-100 text-lg">{l}</p></div>
        ))}
      </div>
    </section>

    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">What Our Customers Say</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { name: "Rajesh Kumar", city: "Mumbai", text: "Found the perfect health insurance within 15 minutes. Great savings!" },
            { name: "Priya Sharma", city: "Bangalore", text: "The process was smooth and transparent. Got my policy in 2 days!" },
            { name: "Amit Patel", city: "Delhi", text: "Excellent customer support and the cheapest premium I could find." }
          ].map((t, i) => (
            <div key={i} className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition">
              <div className="flex items-center gap-1 mb-4">{[1,2,3,4,5].map(j => <Star key={j} size={20} className="fill-yellow-400 text-yellow-400" />)}</div>
              <p className="text-gray-700 mb-6 italic">"{t.text}"</p>
              <p className="font-semibold text-gray-900">{t.name}</p>
              <p className="text-sm text-gray-600">{t.city}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="bg-gradient-to-br from-blue-700 to-blue-800 text-white py-20 px-4 text-center">
      <h2 className="text-5xl font-bold mb-6">Ready to Protect What Matters?</h2>
      <p className="text-xl text-blue-100 mb-8">Get instant quotes from 20+ insurers. Save up to 40%.</p>
      <button onClick={() => onNavigate("health")} className="bg-white text-blue-700 px-10 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition">Compare Plans Now</button>
    </section>
  </div>
);

// ─── Quote Wizard ─────────────────────────────────
const QuoteWizard = ({ title, stepsData, plans, onNavigate }) => {
  const [step, setStep] = useState(1);
  const total = stepsData.length + 1;
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <button onClick={() => onNavigate("home")} className="text-blue-600 font-semibold flex items-center gap-1"><ChevronLeft size={20} /> Back</button>
        </div>
        <div className="mb-6"><div className="flex justify-between mb-2">{Array.from({ length: total }, (_, i) => <span key={i} className={`text-sm flex-1 text-center ${step >= i + 1 ? "text-blue-600 font-bold" : "text-gray-400"}`}>Step {i + 1}</span>)}</div><div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: ((step / total) * 100) + "%" }} /></div></div>

        {step <= stepsData.length ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">{stepsData[step - 1]}</div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Recommended Plans</h2>
            {plans.map(plan => (
              <div key={plan.id} className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-500 hover:shadow-lg transition">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="min-w-40"><p className="text-xl font-bold text-gray-900">{plan.insurer}</p><p className="text-sm text-gray-600">{plan.name}</p><div className="flex items-center gap-1 mt-1"><Star size={14} className="fill-yellow-400 text-yellow-400" /><span className="text-sm font-semibold">{plan.rating}</span></div></div>
                  <div><p className="text-sm text-gray-600">Premium</p><p className="text-2xl font-bold text-blue-600">{plan.premium}</p></div>
                  <div><p className="text-sm text-gray-600">Cover</p><p className="text-lg font-bold">{plan.cover}</p></div>
                  <ul className="space-y-1 max-w-xs">{plan.features.map((f, i) => <li key={i} className="flex items-center gap-2 text-sm text-gray-700"><Check size={14} className="text-green-600 flex-shrink-0" />{f}</li>)}</ul>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition">Buy Now</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {step <= stepsData.length && (
          <div className="flex justify-between">
            <button onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1} className="flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-gray-300 font-semibold disabled:opacity-50"><ChevronLeft size={20} /> Back</button>
            <button onClick={() => setStep(step + 1)} className="flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition">{step === stepsData.length ? "View Plans" : "Next"} <ChevronRight size={20} /></button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Health Insurance ─────────────────────────────
const HealthQuote = ({ onNavigate }) => {
  const [f, sf] = useState({ name: "", age: "", gender: "", city: "", conditions: [], si: "5L", smoker: false });
  const u = (k, v) => sf(p => ({ ...p, [k]: v }));
  const plans = [
    { id: 1, insurer: "Star Health", name: "Comprehensive Plan", premium: "₹15,450/yr", cover: "₹10,00,000", features: ["99% Cashless", "No Waiting", "24/7 Support", "12,000+ Hospitals"], rating: 4.8 },
    { id: 2, insurer: "HDFC Ergo", name: "Optima Health", premium: "₹14,200/yr", cover: "₹10,00,000", features: ["Quick Settlement", "Family Floater", "Pre-hospitalization"], rating: 4.6 },
    { id: 3, insurer: "ICICI Lombard", name: "Complete Health", premium: "₹16,800/yr", cover: "₹10,00,000", features: ["Best Coverage", "No Co-payment", "Maternity Covered"], rating: 4.7 },
    { id: 4, insurer: "Care Health", name: "Premier Plus", premium: "₹13,500/yr", cover: "₹10,00,000", features: ["Affordable", "Good Coverage", "Easy Claims"], rating: 4.5 },
    { id: 5, insurer: "Niva Bupa", name: "ReAssure 2.0", premium: "₹12,800/yr", cover: "₹10,00,000", features: ["Lowest Price", "Cashless", "No Sub-Limits"], rating: 4.4 },
  ];
  const stepsData = [
    <div key="s1"><h2 className="text-2xl font-bold mb-6">Personal Details</h2><div className="grid md:grid-cols-2 gap-6"><div><label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label><input placeholder="Enter your name" value={f.name} onChange={e => u("name", e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-600 focus:outline-none" /></div><div><label className="block text-sm font-semibold text-gray-700 mb-2">Age</label><input type="number" placeholder="Age" value={f.age} onChange={e => u("age", e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-600 focus:outline-none" /></div><div><label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label><select value={f.gender} onChange={e => u("gender", e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg"><option value="">Select</option><option>Male</option><option>Female</option></select></div><div><label className="block text-sm font-semibold text-gray-700 mb-2">City</label><input placeholder="City" value={f.city} onChange={e => u("city", e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-600 focus:outline-none" /></div></div></div>,
    <div key="s2"><h2 className="text-2xl font-bold mb-6">Health & Coverage</h2><div className="space-y-6"><div><label className="block text-sm font-semibold text-gray-700 mb-3">Pre-existing Conditions</label><div className="grid md:grid-cols-3 gap-3">{["Diabetes", "Hypertension", "Thyroid", "Asthma", "Heart Condition", "None"].map(c => <label key={c} className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="w-5 h-5 accent-blue-600" checked={f.conditions.includes(c)} onChange={() => u("conditions", f.conditions.includes(c) ? f.conditions.filter(x => x !== c) : [...f.conditions, c])} />{c}</label>)}</div></div><label className="flex items-center cursor-pointer gap-3"><input type="checkbox" className="w-5 h-5 accent-blue-600" checked={f.smoker} onChange={e => u("smoker", e.target.checked)} /><span className="font-semibold">Smoker?</span></label></div></div>,
    <div key="s3"><h2 className="text-2xl font-bold mb-6">Sum Insured</h2><div className="grid grid-cols-5 gap-3">{["3L", "5L", "10L", "15L", "25L"].map(a => <button key={a} onClick={() => u("si", a)} className={`py-4 rounded-lg font-bold text-lg transition ${f.si === a ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>{"₹" + a}</button>)}</div></div>,
  ];
  return <QuoteWizard title="Health Insurance" stepsData={stepsData} plans={plans} onNavigate={onNavigate} />;
};

// ─── Life Insurance ───────────────────────────────
const LifeQuote = ({ onNavigate }) => {
  const [f, sf] = useState({ name: "", income: "", type: "term", amount: "50L", term: 20 });
  const u = (k, v) => sf(p => ({ ...p, [k]: v }));
  const plans = [
    { id: 1, insurer: "LIC of India", name: "Jeevan Bima", premium: "₹8,500/yr", cover: "₹50,00,000", features: ["Guaranteed Returns", "Maturity Benefit", "Best Settlement"], rating: 4.9 },
    { id: 2, insurer: "HDFC Life", name: "Click 2 Secure", premium: "₹7,800/yr", cover: "₹50,00,000", features: ["Online Purchase", "Transparent", "Flexible"], rating: 4.7 },
    { id: 3, insurer: "ICICI Prudential", name: "iProtect Smart", premium: "₹6,500/yr", cover: "₹50,00,000", features: ["Most Affordable", "Quick Approval", "No Tests up to 25L"], rating: 4.6 },
    { id: 4, insurer: "Max Life", name: "Secure Max", premium: "₹9,200/yr", cover: "₹50,00,000", features: ["Superior Coverage", "Waiver of Premium", "Critical Illness"], rating: 4.8 },
    { id: 5, insurer: "SBI Life", name: "SmartShield", premium: "₹7,100/yr", cover: "₹50,00,000", features: ["Quick Settlement", "Reliable", "Accident Rider"], rating: 4.7 },
  ];
  const stepsData = [
    <div key="s1"><h2 className="text-2xl font-bold mb-6">Personal Info</h2><div className="grid md:grid-cols-2 gap-6"><div><label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label><input value={f.name} onChange={e => u("name", e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-600 focus:outline-none" placeholder="Full name" /></div><div><label className="block text-sm font-semibold text-gray-700 mb-2">Annual Income</label><select value={f.income} onChange={e => u("income", e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg"><option value="">Select</option><option>₹2-5 Lakhs</option><option>₹5-10 Lakhs</option><option>₹10-20 Lakhs</option><option>₹20+ Lakhs</option></select></div></div></div>,
    <div key="s2"><h2 className="text-2xl font-bold mb-6">Coverage</h2><div className="space-y-6"><div><label className="block text-sm font-semibold text-gray-700 mb-3">Plan Type</label><div className="grid grid-cols-3 gap-3">{[["term", "Term Life"], ["whole", "Whole Life"], ["ulip", "ULIP"]].map(([v, l]) => <button key={v} onClick={() => u("type", v)} className={`py-3 rounded-lg font-bold transition ${f.type === v ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}>{l}</button>)}</div></div><div><label className="block text-sm font-semibold text-gray-700 mb-3">Cover Amount</label><div className="grid grid-cols-4 gap-3">{["50L", "1Cr", "2Cr", "5Cr"].map(a => <button key={a} onClick={() => u("amount", a)} className={`py-3 rounded-lg font-bold transition ${f.amount === a ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}>{"₹" + a}</button>)}</div></div><div><label className="block text-sm font-semibold text-gray-700 mb-3">Term</label><div className="grid grid-cols-3 gap-3">{[10, 20, 30].map(y => <button key={y} onClick={() => u("term", y)} className={`py-3 rounded-lg font-bold transition ${f.term === y ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}>{y + " Years"}</button>)}</div></div></div></div>,
  ];
  return <QuoteWizard title="Life Insurance" stepsData={stepsData} plans={plans} onNavigate={onNavigate} />;
};

// ─── Motor Insurance ──────────────────────────────
const MotorQuote = ({ onNavigate }) => {
  const [f, sf] = useState({ vType: "car", regNo: "", fuel: "petrol", ncb: "0", zeroDep: false, engine: false, roadside: false });
  const u = (k, v) => sf(p => ({ ...p, [k]: v }));
  const plans = [
    { id: 1, insurer: "Bajaj Allianz", name: "Comprehensive", premium: "₹6,800/yr", cover: "₹8,00,000", features: ["99% Cashless", "24/7 Roadside", "Quick Settlement"], rating: 4.7 },
    { id: 2, insurer: "HDFC Ergo", name: "Complete Motor", premium: "₹6,200/yr", cover: "₹8,00,000", features: ["Instant Policy", "Hassle-Free Claims", "Theft Cover"], rating: 4.6 },
    { id: 3, insurer: "ICICI Lombard", name: "Comprehensive Car", premium: "₹7,100/yr", cover: "₹8,00,000", features: ["Best Premium", "Personal Accident", "Consumable Covered"], rating: 4.8 },
    { id: 4, insurer: "New India Assurance", name: "Motor Complete", premium: "₹5,900/yr", cover: "₹8,00,000", features: ["Most Affordable", "Wide Network", "Govt Insurer"], rating: 4.5 },
    { id: 5, insurer: "Tata AIG", name: "Complete Cover", premium: "₹6,500/yr", cover: "₹8,00,000", features: ["Flexible Plans", "Quick Approval", "Competitive Rates"], rating: 4.6 },
  ];
  const stepsData = [
    <div key="s1"><h2 className="text-2xl font-bold mb-6">Vehicle Details</h2><div className="space-y-6"><div><label className="block text-sm font-semibold text-gray-700 mb-3">Vehicle Type</label><div className="flex gap-4">{[["car", "Car"], ["bike", "Bike"]].map(([v, l]) => <button key={v} onClick={() => u("vType", v)} className={`flex-1 py-4 rounded-lg font-bold text-lg transition ${f.vType === v ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}>{l}</button>)}</div></div><div><label className="block text-sm font-semibold text-gray-700 mb-2">Registration Number</label><input value={f.regNo} onChange={e => u("regNo", e.target.value.toUpperCase())} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-600 focus:outline-none" placeholder="e.g., DL01AB1234" /></div></div></div>,
    <div key="s2"><h2 className="text-2xl font-bold mb-6">Vehicle Info</h2><div className="space-y-6"><div><label className="block text-sm font-semibold text-gray-700 mb-3">Fuel Type</label><div className="grid grid-cols-4 gap-3">{["Petrol", "Diesel", "CNG", "Electric"].map(x => <button key={x} onClick={() => u("fuel", x.toLowerCase())} className={`py-3 rounded-lg font-bold transition ${f.fuel === x.toLowerCase() ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}>{x}</button>)}</div></div><div><label className="block text-sm font-semibold text-gray-700 mb-2">NCB %</label><select value={f.ncb} onChange={e => u("ncb", e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg"><option value="0">0%</option><option value="20">20%</option><option value="25">25%</option><option value="35">35%</option><option value="45">45%</option><option value="50">50%</option></select></div></div></div>,
    <div key="s3"><h2 className="text-2xl font-bold mb-6">Add-ons</h2><div className="space-y-4">{[["zeroDep", "Zero Depreciation", "Full claim without depreciation", "+₹3,200/yr"], ["engine", "Engine Protection", "Covers engine damage from water/oil", "+₹2,100/yr"], ["roadside", "Roadside Assistance", "Emergency towing and repairs", "+₹800/yr"]].map(([k, t, d, p]) => <div key={k} className={`border-2 rounded-lg p-6 cursor-pointer transition ${f[k] ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"}`} onClick={() => u(k, !f[k])}><label className="flex items-start cursor-pointer gap-4"><input type="checkbox" checked={f[k]} readOnly className="w-5 h-5 accent-blue-600 mt-1" /><div><p className="font-bold">{t}</p><p className="text-sm text-gray-600">{d}</p><p className="text-sm font-bold text-blue-600 mt-1">{p}</p></div></label></div>)}</div></div>,
  ];
  return <QuoteWizard title="Motor Insurance" stepsData={stepsData} plans={plans} onNavigate={onNavigate} />;
};

// ─── Customer Dashboard ───────────────────────────
const CustomerDash = ({ onNavigate }) => {
  const policies = [
    { insurer: "Star Health", type: "Health", pno: "SH-2024-001", si: "₹10,00,000", prem: "₹15,450/yr", exp: "2025-12-31", status: "Active" },
    { insurer: "HDFC Life", type: "Life", pno: "HL-2023-456", si: "₹50,00,000", prem: "₹8,500/yr", exp: "2034-06-15", status: "Active" },
    { insurer: "Bajaj Allianz", type: "Motor", pno: "BA-2024-789", si: "₹8,50,000", prem: "₹6,800/yr", exp: "2025-08-20", status: "Active" },
  ];
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-700 to-blue-600 text-white py-8 px-4"><div className="max-w-7xl mx-auto"><h1 className="text-3xl font-bold mb-1">Welcome, Rajesh!</h1><p className="text-blue-100">Manage all your insurance policies</p></div></div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {[["Active Policies", "3", "bg-blue-100 text-blue-600", FileText], ["Pending Renewals", "1", "bg-yellow-100 text-yellow-600", Clock], ["Active Claims", "0", "bg-green-100 text-green-600", CheckCircle], ["Premium Due", "₹12,450", "bg-red-100 text-red-600", TrendingUp]].map(([l, v, c, Icon], i) => (
            <div key={i} className="bg-white rounded-xl shadow-lg p-6"><div className={`w-12 h-12 rounded-lg ${c} flex items-center justify-center mb-4`}><Icon size={24} /></div><p className="text-gray-600 text-sm font-semibold mb-1">{l}</p><p className="text-3xl font-bold text-gray-900">{v}</p></div>
          ))}
        </div>
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {[["File Claim", "bg-blue-600"], ["Download Policy", "bg-green-600"], ["Contact Advisor", "bg-purple-600"], ["Renew Policy", "bg-orange-600"]].map(([l, c], i) => <button key={i} className={`${c} text-white font-bold py-4 rounded-xl transition hover:opacity-90`}>{l}</button>)}
        </div>
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <table className="w-full text-sm"><thead className="bg-gray-100"><tr>{["Insurer", "Policy No", "Sum Insured", "Premium", "Expires", "Status"].map(h => <th key={h} className="px-6 py-4 text-left font-bold text-gray-900">{h}</th>)}</tr></thead>
            <tbody>{policies.map((p, i) => <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}><td className="px-6 py-4"><p className="font-semibold">{p.insurer}</p><p className="text-xs text-gray-500">{p.type}</p></td><td className="px-6 py-4 font-mono">{p.pno}</td><td className="px-6 py-4 font-semibold">{p.si}</td><td className="px-6 py-4 font-semibold">{p.prem}</td><td className="px-6 py-4">{p.exp}</td><td className="px-6 py-4"><span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">{p.status}</span></td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── Agent Dashboard ──────────────────────────────
const AgentDash = ({ onNavigate }) => {
  const revenueData = [{ m: "Nov", p: 1500 }, { m: "Dec", p: 1850 }, { m: "Jan", p: 1680 }, { m: "Feb", p: 2010 }, { m: "Mar", p: 1920 }, { m: "Apr", p: 2150 }];
  const distData = [{ name: "Health", value: 45, color: "#3b82f6" }, { name: "Life", value: 30, color: "#10b981" }, { name: "Motor", value: 25, color: "#f59e0b" }];
  const activities = [
    ["New lead from website", "Amit Kumar", "2h ago"], ["Policy renewed", "Priya Sharma", "4h ago"], ["Commission ₹4,500 credited", "System", "6h ago"],
    ["Claim approved", "Rajiv Patel", "8h ago"], ["Quote generated", "Neha Singh", "10h ago"], ["Lead converted", "Vikram Desai", "1d ago"],
  ];
  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-r from-blue-700 to-blue-600 text-white px-6 py-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div><h1 className="text-3xl font-bold mb-1">Good Morning, Rajesh</h1><p className="text-blue-100">{new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p></div>
          <div className="flex gap-3"><button onClick={() => onNavigate("agent-leads")} className="bg-white text-blue-700 px-4 py-2 rounded-lg font-bold hover:bg-blue-50 transition">+ Add Lead</button><button onClick={() => onNavigate("health")} className="bg-blue-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-400 transition">Generate Quote</button></div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[["Total Policies", "342", "bg-blue-50 text-blue-700 border-blue-200"], ["Active Leads", "28", "bg-green-50 text-green-700 border-green-200"], ["Monthly Premium", "₹18,45,000", "bg-purple-50 text-purple-700 border-purple-200"], ["Commission", "₹2,34,500", "bg-orange-50 text-orange-700 border-orange-200"], ["Conversion", "34%", "bg-red-50 text-red-700 border-red-200"], ["Renewals Due", "12", "bg-yellow-50 text-yellow-700 border-yellow-200"]].map(([l, v, c], i) => (
            <div key={i} className={`${c} border rounded-lg p-4`}><h3 className="text-xs font-bold text-gray-700 uppercase mb-2">{l}</h3><p className="text-2xl font-bold">{v}</p></div>
          ))}
        </div>
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white rounded-lg border p-6"><h2 className="text-lg font-bold text-gray-900 mb-4">Premium Collected (6 Months)</h2><ResponsiveContainer width="100%" height={280}><LineChart data={revenueData}><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis dataKey="m" /><YAxis /><Tooltip formatter={v => ["₹" + v + "K", "Premium"]} /><Line type="monotone" dataKey="p" stroke="#2563eb" strokeWidth={3} dot={{ fill: "#2563eb", r: 5 }} /></LineChart></ResponsiveContainer></div>
          <div className="bg-white rounded-lg border p-6"><h2 className="text-lg font-bold text-gray-900 mb-4">Policy Distribution</h2><ResponsiveContainer width="100%" height={280}><PieChart><Pie data={distData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => name + ": " + value + "%"} outerRadius={80} dataKey="value">{distData.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border p-6"><h2 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h2><div className="space-y-3">{activities.map(([a, w, t], i) => <div key={i} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0"><div className="bg-blue-50 text-blue-600 p-2 rounded-lg"><Activity size={16} /></div><div><p className="text-sm font-semibold text-gray-900">{a}</p><p className="text-xs text-gray-500">{w} - {t}</p></div></div>)}</div></div>
          <div className="bg-white rounded-lg border p-6"><h2 className="text-lg font-bold text-gray-900 mb-4">Top Products</h2><table className="w-full text-sm"><thead><tr className="border-b">{["Product", "Insurer", "Sold", "Comm %"].map(h => <th key={h} className="text-left py-2 font-semibold text-gray-700">{h}</th>)}</tr></thead><tbody>{[["Health Plus", "Max Bupa", "48", "6.5%"], ["Active Life", "HDFC Life", "35", "5.2%"], ["Motor Premier", "ICICI Lombard", "42", "7.8%"], ["Family Secure", "Bajaj Allianz", "38", "4.8%"]].map(([p, ins, s, c], i) => <tr key={i} className="border-b border-gray-100 hover:bg-blue-50"><td className="py-2 font-medium">{p}</td><td className="py-2 text-gray-600">{ins}</td><td className="py-2 font-semibold">{s}</td><td className="py-2 font-bold text-blue-600">{c}</td></tr>)}</tbody></table></div>
        </div>
      </div>
    </div>
  );
};

// ─── Lead Management ──────────────────────────────
const LeadMgmt = ({ onNavigate }) => {
  const allLeads = [
    { id: "L001", name: "Amit Kumar", phone: "9876543210", type: "Health", source: "Website", status: "New", last: "2h ago" },
    { id: "L002", name: "Priya Sharma", phone: "9123456789", type: "Life", source: "Referral", status: "Contacted", last: "4h ago" },
    { id: "L003", name: "Neha Singh", phone: "8765432109", type: "Motor", source: "Website", status: "Quoted", last: "1d ago" },
    { id: "L004", name: "Rajiv Patel", phone: "9234567890", type: "Health", source: "Walk-in", status: "Negotiation", last: "2d ago" },
    { id: "L005", name: "Sanjana Roy", phone: "9345678901", type: "Life", source: "Social", status: "Won", last: "3d ago" },
    { id: "L006", name: "Vikram Desai", phone: "8456789012", type: "Health", source: "Website", status: "Won", last: "5d ago" },
    { id: "L007", name: "Aditya Verma", phone: "9567890123", type: "Motor", source: "Referral", status: "New", last: "6d ago" },
    { id: "L008", name: "Karan Nair", phone: "8678901234", type: "Health", source: "Website", status: "Lost", last: "1w ago" },
    { id: "L009", name: "Pooja Menon", phone: "9789012345", type: "Life", source: "Walk-in", status: "Contacted", last: "1w ago" },
    { id: "L010", name: "Rohit Singh", phone: "8890123456", type: "Motor", source: "Website", status: "Quoted", last: "1w ago" },
  ];
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [sel, setSel] = useState(null);
  const filtered = allLeads.filter(l => (!filter || l.status === filter) && (l.name.toLowerCase().includes(search.toLowerCase()) || l.phone.includes(search)));
  const pipeline = ["New", "Contacted", "Quoted", "Negotiation", "Won", "Lost"];
  const sc = { New: "bg-blue-100 text-blue-800", Contacted: "bg-purple-100 text-purple-800", Quoted: "bg-orange-100 text-orange-800", Negotiation: "bg-yellow-100 text-yellow-800", Won: "bg-green-100 text-green-800", Lost: "bg-red-100 text-red-800" };
  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <div className="bg-white border-b px-6 py-6"><div className="max-w-7xl mx-auto"><h1 className="text-3xl font-bold text-gray-900 mb-4">Lead Management</h1><div className="flex gap-4"><div className="flex-1 relative"><Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads..." className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500" /></div><select value={filter} onChange={e => setFilter(e.target.value)} className="px-4 py-2 border rounded-lg"><option value="">All Status</option>{pipeline.map(s => <option key={s}>{s}</option>)}</select></div></div></div>
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-6 gap-3 mb-6">{pipeline.map(s => { const cnt = allLeads.filter(l => l.status === s).length; return <div key={s} onClick={() => setFilter(s === filter ? "" : s)} className={`${sc[s]} rounded-lg p-4 text-center cursor-pointer hover:shadow-md transition ${filter === s ? "ring-2 ring-blue-500" : ""}`}><p className="text-xs font-bold uppercase">{s}</p><p className="text-3xl font-bold">{cnt}</p></div>; })}</div>
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden"><table className="w-full text-sm"><thead><tr className="bg-gray-50 border-b">{["ID", "Name", "Phone", "Type", "Source", "Status", "Last", ""].map(h => <th key={h} className="text-left py-3 px-4 font-semibold text-gray-700">{h}</th>)}</tr></thead>
          <tbody>{filtered.map(l => <tr key={l.id} className="border-b border-gray-100 hover:bg-blue-50 transition"><td className="py-3 px-4 font-semibold text-blue-600">{l.id}</td><td className="py-3 px-4 font-medium">{l.name}</td><td className="py-3 px-4 text-gray-600">{l.phone}</td><td className="py-3 px-4"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">{l.type}</span></td><td className="py-3 px-4"><span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-semibold">{l.source}</span></td><td className="py-3 px-4"><span className={`${sc[l.status]} px-2 py-1 rounded text-xs font-semibold`}>{l.status}</span></td><td className="py-3 px-4 text-gray-500">{l.last}</td><td className="py-3 px-4"><button onClick={() => setSel(l)} className="text-blue-600 font-semibold">View</button></td></tr>)}</tbody></table></div>
      </div>
      {sel && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSel(null)}><div className="bg-white rounded-lg max-w-lg w-full p-6" onClick={e => e.stopPropagation()}><div className="flex justify-between mb-4"><div><h2 className="text-2xl font-bold">{sel.name}</h2><p className="text-gray-500">{sel.id}</p></div><button onClick={() => setSel(null)} className="text-2xl text-gray-400">x</button></div><div className="grid grid-cols-2 gap-4 mb-4">{[["Phone", sel.phone], ["Type", sel.type], ["Source", sel.source], ["Status", sel.status]].map(([k, v]) => <div key={k}><p className="text-xs text-gray-500 uppercase font-semibold">{k}</p><p className="font-semibold">{v}</p></div>)}</div><div className="flex gap-2"><button className="flex-1 bg-blue-700 text-white py-2 rounded-lg font-bold">Convert to Policy</button><button className="flex-1 bg-gray-200 py-2 rounded-lg font-bold">Send Quote</button></div></div></div>}
    </div>
  );
};

// ─── Policy Management ────────────────────────────
const PolicyMgmt = ({ onNavigate }) => {
  const allPolicies = [
    { id: "TIB-2025-0001", name: "Rajesh Kumar", insurer: "Max Bupa", type: "Health", si: "₹5,00,000", prem: "₹18,500", end: "2025-01-14", status: "Active" },
    { id: "TIB-2025-0002", name: "Priya Sharma", insurer: "HDFC Life", type: "Life", si: "₹20,00,000", prem: "₹35,000", end: "2025-06-19", status: "Active" },
    { id: "TIB-2025-0003", name: "Neha Singh", insurer: "ICICI Lombard", type: "Motor", si: "₹15,00,000", prem: "₹8,500", end: "2025-08-09", status: "Active" },
    { id: "TIB-2025-0004", name: "Amit Patel", insurer: "Bajaj Allianz", type: "Health", si: "₹7,50,000", prem: "₹22,000", end: "2025-01-31", status: "Expiring" },
    { id: "TIB-2025-0005", name: "Sanjana Roy", insurer: "Max Bupa", type: "Health", si: "₹5,00,000", prem: "₹16,000", end: "2024-03-14", status: "Expired" },
    { id: "TIB-2025-0006", name: "Vikram Desai", insurer: "ICICI Pru", type: "Life", si: "₹25,00,000", prem: "₹45,000", end: "2025-04-04", status: "Active" },
    { id: "TIB-2025-0007", name: "Aditya Verma", insurer: "ICICI Lombard", type: "Motor", si: "₹10,00,000", prem: "₹6,500", end: "2025-11-19", status: "Active" },
    { id: "TIB-2025-0008", name: "Pooja Menon", insurer: "Star Health", type: "Health", si: "₹10,00,000", prem: "₹28,000", end: "2025-05-11", status: "Active" },
  ];
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const filtered = allPolicies.filter(p => (!filter || p.status === filter) && (p.name.toLowerCase().includes(search.toLowerCase()) || p.id.includes(search)));
  const sty = { Active: "bg-green-100 text-green-800", Expiring: "bg-yellow-100 text-yellow-800", Expired: "bg-red-100 text-red-800" };
  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <div className="bg-white border-b px-6 py-6"><div className="max-w-7xl mx-auto"><h1 className="text-3xl font-bold text-gray-900 mb-4">Policy Management</h1><div className="flex gap-4"><div className="flex-1 relative"><Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search policies..." className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500" /></div><select value={filter} onChange={e => setFilter(e.target.value)} className="px-4 py-2 border rounded-lg"><option value="">All Status</option><option>Active</option><option>Expiring</option><option>Expired</option></select></div></div></div>
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-4 gap-4 mb-6">{[["Active", allPolicies.filter(p => p.status === "Active").length, "bg-green-50 text-green-700"], ["Expiring", allPolicies.filter(p => p.status === "Expiring").length, "bg-yellow-50 text-yellow-700"], ["Expired", allPolicies.filter(p => p.status === "Expired").length, "bg-red-50 text-red-700"], ["Under Process", 0, "bg-blue-50 text-blue-700"]].map(([l, c, cl]) => <div key={l} className={`${cl} rounded-lg p-4 cursor-pointer hover:shadow-md`} onClick={() => setFilter(l === filter ? "" : l)}><p className="text-xs font-bold uppercase">{l}</p><p className="text-3xl font-bold">{c}</p></div>)}</div>
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden"><table className="w-full text-sm"><thead><tr className="bg-gray-50 border-b">{["Policy No", "Customer", "Insurer", "Type", "Sum Insured", "Premium", "Expires", "Status"].map(h => <th key={h} className="text-left py-3 px-4 font-semibold text-gray-700">{h}</th>)}</tr></thead>
          <tbody>{filtered.map(p => <tr key={p.id} className="border-b border-gray-100 hover:bg-blue-50"><td className="py-3 px-4 font-semibold text-blue-600">{p.id}</td><td className="py-3 px-4 font-medium">{p.name}</td><td className="py-3 px-4 text-gray-600">{p.insurer}</td><td className="py-3 px-4"><span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-semibold">{p.type}</span></td><td className="py-3 px-4">{p.si}</td><td className="py-3 px-4 font-semibold">{p.prem}</td><td className="py-3 px-4 text-gray-600">{p.end}</td><td className="py-3 px-4"><span className={`${sty[p.status]} px-2 py-1 rounded text-xs font-semibold`}>{p.status}</span></td></tr>)}</tbody></table></div>
      </div>
    </div>
  );
};

// ─── Commission Tracker ───────────────────────────
const CommTracker = ({ onNavigate }) => {
  const monthlyData = [{ m: "Sep", c: 180 }, { m: "Oct", c: 215 }, { m: "Nov", c: 189 }, { m: "Dec", c: 256 }, { m: "Jan", c: 235 }, { m: "Feb", c: 198 }];
  const comms = [
    { pol: "TIB-0001", name: "Rajesh Kumar", ins: "Max Bupa", prem: "₹18,500", rate: "6.5%", amt: "₹1,203", status: "Paid", date: "2025-01-15" },
    { pol: "TIB-0002", name: "Priya Sharma", ins: "HDFC Life", prem: "₹35,000", rate: "5.2%", amt: "₹1,820", status: "Paid", date: "2025-01-20" },
    { pol: "TIB-0003", name: "Neha Singh", ins: "ICICI Lombard", prem: "₹8,500", rate: "7.8%", amt: "₹663", status: "Pending", date: "2025-02-01" },
    { pol: "TIB-0004", name: "Amit Patel", ins: "Bajaj Allianz", prem: "₹22,000", rate: "4.8%", amt: "₹1,056", status: "Processing", date: "2025-02-03" },
    { pol: "TIB-0006", name: "Vikram Desai", ins: "ICICI Pru", prem: "₹45,000", rate: "5.2%", amt: "₹2,340", status: "Paid", date: "2025-01-18" },
    { pol: "TIB-0009", name: "Pooja Menon", ins: "Star Health", prem: "₹28,000", rate: "6.5%", amt: "₹1,820", status: "Paid", date: "2025-01-22" },
  ];
  const ss = { Paid: "bg-green-100 text-green-800", Pending: "bg-yellow-100 text-yellow-800", Processing: "bg-blue-100 text-blue-800" };
  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <div className="bg-white border-b px-6 py-6"><div className="max-w-7xl mx-auto"><h1 className="text-3xl font-bold text-gray-900">Commission Tracker</h1></div></div>
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-4 gap-4 mb-8">{[["Total Earned", "₹18,45,600", "bg-blue-50 text-blue-700"], ["This Month", "₹2,34,500", "bg-green-50 text-green-700"], ["Pending", "₹56,000", "bg-yellow-50 text-yellow-700"], ["Paid Out", "₹16,11,100", "bg-purple-50 text-purple-700"]].map(([l, v, c]) => <div key={l} className={`${c} rounded-lg p-6`}><p className="text-xs font-bold uppercase text-gray-700 mb-2">{l}</p><p className="text-2xl font-bold">{v}</p></div>)}</div>
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white rounded-lg border p-6"><h2 className="text-lg font-bold mb-4">Monthly Commission Trend</h2><ResponsiveContainer width="100%" height={280}><BarChart data={monthlyData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="m" /><YAxis /><Tooltip formatter={v => ["₹" + v + "K", "Commission"]} /><Bar dataKey="c" fill="#2563eb" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div>
          <div className="bg-white rounded-lg border p-6"><h2 className="text-lg font-bold mb-4">By Insurance Type</h2>{[["Health", 45, "₹8.28L"], ["Life", 35, "₹6.43L"], ["Motor", 20, "₹3.75L"]].map(([n, p, a]) => <div key={n} className="mb-4"><div className="flex justify-between mb-1"><span className="font-semibold text-gray-700">{n}</span><span className="text-blue-600 font-bold">{p + "%"}</span></div><div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full" style={{ width: p + "%" }} /></div><p className="text-xs text-gray-500 mt-1">{a}</p></div>)}</div>
        </div>
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden"><div className="p-4 border-b"><h2 className="text-lg font-bold">Commission Details</h2></div><table className="w-full text-sm"><thead><tr className="bg-gray-50 border-b">{["Policy", "Customer", "Insurer", "Premium", "Rate", "Commission", "Status", "Date"].map(h => <th key={h} className="text-left py-3 px-4 font-semibold text-gray-700">{h}</th>)}</tr></thead>
          <tbody>{comms.map((c, i) => <tr key={i} className="border-b border-gray-100 hover:bg-blue-50"><td className="py-3 px-4 font-semibold text-blue-600">{c.pol}</td><td className="py-3 px-4">{c.name}</td><td className="py-3 px-4 text-gray-600">{c.ins}</td><td className="py-3 px-4">{c.prem}</td><td className="py-3 px-4 font-semibold">{c.rate}</td><td className="py-3 px-4 font-bold">{c.amt}</td><td className="py-3 px-4"><span className={`${ss[c.status]} px-2 py-1 rounded text-xs font-semibold`}>{c.status}</span></td><td className="py-3 px-4 text-gray-600">{c.date}</td></tr>)}</tbody></table></div>
      </div>
    </div>
  );
};

// ─── Reports ──────────────────────────────────────
const Reports = ({ onNavigate }) => {
  const [range, setRange] = useState("12m");
  const trendData = [{ m: "Mar", p: 1800 }, { m: "Apr", p: 2100 }, { m: "May", p: 1950 }, { m: "Jun", p: 2350 }, { m: "Jul", p: 2050 }, { m: "Aug", p: 2400 }, { m: "Sep", p: 2200 }, { m: "Oct", p: 2550 }, { m: "Nov", p: 2280 }, { m: "Dec", p: 2750 }, { m: "Jan", p: 2450 }, { m: "Feb", p: 2400 }];
  const distData = [{ name: "Health", value: 45, color: "#3b82f6" }, { name: "Life", value: 30, color: "#10b981" }, { name: "Motor", value: 25, color: "#f59e0b" }];
  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <div className="bg-white border-b px-6 py-6"><div className="max-w-7xl mx-auto"><div className="flex justify-between items-center mb-4"><h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1><button className="bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"><Download size={18} /> Download</button></div><div className="flex gap-2">{[["1m", "Last Month"], ["3m", "3 Months"], ["6m", "6 Months"], ["12m", "12 Months"]].map(([v, l]) => <button key={v} onClick={() => setRange(v)} className={`px-4 py-2 rounded-lg font-bold transition ${range === v ? "bg-blue-700 text-white" : "bg-gray-200"}`}>{l}</button>)}</div></div></div>
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-4 gap-4 mb-8">{[["Total Premium", "₹2.4 Cr", "bg-blue-50 text-blue-700"], ["Policies Issued", "342", "bg-green-50 text-green-700"], ["Claims Ratio", "4.2%", "bg-red-50 text-red-700"], ["Avg Policy Value", "₹72,000", "bg-purple-50 text-purple-700"]].map(([l, v, c]) => <div key={l} className={`${c} rounded-lg p-6`}><p className="text-xs font-bold uppercase text-gray-700 mb-2">{l}</p><p className="text-2xl font-bold">{v}</p></div>)}</div>
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white rounded-lg border p-6"><h2 className="text-lg font-bold mb-4">Premium Trend</h2><ResponsiveContainer width="100%" height={280}><AreaChart data={trendData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="m" /><YAxis /><Tooltip formatter={v => ["₹" + v + "K", "Premium"]} /><Area type="monotone" dataKey="p" stroke="#2563eb" fill="#dbeafe" /></AreaChart></ResponsiveContainer></div>
          <div className="bg-white rounded-lg border p-6"><h2 className="text-lg font-bold mb-4">By Type</h2><ResponsiveContainer width="100%" height={280}><PieChart><Pie data={distData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => name + ": " + value + "%"} outerRadius={80} dataKey="value">{distData.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
        </div>
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden"><div className="p-4 border-b"><h2 className="text-lg font-bold">Top Insurers</h2></div><table className="w-full text-sm"><thead><tr className="bg-gray-50 border-b">{["Insurer", "Policies", "Premium", "% of Total"].map(h => <th key={h} className="text-left py-3 px-4 font-semibold text-gray-700">{h}</th>)}</tr></thead><tbody>{[["Max Bupa", "48", "₹56.4L", "23.5%"], ["HDFC Life", "45", "₹54.0L", "22.5%"], ["ICICI Lombard", "52", "₹42.5L", "17.7%"], ["Bajaj Allianz", "38", "₹36.6L", "15.2%"]].map(([n, p, pr, pct], i) => <tr key={i} className="border-b hover:bg-blue-50"><td className="py-3 px-4 font-semibold">{n}</td><td className="py-3 px-4 text-blue-600 font-bold">{p}</td><td className="py-3 px-4">{pr}</td><td className="py-3 px-4 font-bold">{pct}</td></tr>)}</tbody></table></div>
      </div>
    </div>
  );
};

// ─── Login Page ───────────────────────────────────
const LoginPage = ({ onLogin }) => {
  const [tab, setTab] = useState("customer");
  const [phone, setPhone] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8"><div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"><Shield size={32} className="text-white" /></div><h1 className="text-3xl font-bold text-gray-900">Trustner</h1><p className="text-gray-600">Insurance Brokers</p></div>
        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">{["customer", "agent"].map(t => <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 rounded-lg font-bold transition capitalize ${tab === t ? "bg-blue-600 text-white" : "text-gray-600"}`}>{t}</button>)}</div>
        {!showOtp ? (
          <div className="space-y-4"><div><label className="block text-sm font-semibold text-gray-700 mb-2">Mobile Number</label><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-600 focus:outline-none" /></div><button onClick={() => setShowOtp(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition">Send OTP</button></div>
        ) : (
          <div className="space-y-4"><div><label className="block text-sm font-semibold text-gray-700 mb-2">Enter OTP</label><input type="text" placeholder="6-digit OTP" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-center text-2xl tracking-widest" maxLength={6} /></div><button onClick={() => onLogin(tab)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition">Verify & Login</button><button onClick={() => setShowOtp(false)} className="w-full text-blue-600 font-semibold">Change Number</button></div>
        )}
        <p className="text-center text-sm text-gray-500 mt-6">By continuing, you agree to our Terms & Privacy Policy</p>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════
export default function TrustnerApp() {
  const [page, setPage] = useState("home");
  const [userType, setUserType] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const nav = (p) => { setPage(p); setMobileMenu(false); };
  const login = (type) => { setUserType(type); nav(type === "agent" ? "agent-dashboard" : "home"); };
  const logout = () => { setUserType(null); nav("home"); };

  const cLinks = [{ id: "home", label: "Home", I: Home }, { id: "health", label: "Health", I: Heart }, { id: "life", label: "Life", I: Shield }, { id: "motor", label: "Motor", I: Car }, { id: "my-dashboard", label: "My Policies", I: FileText }];
  const aLinks = [{ id: "agent-dashboard", label: "Dashboard", I: Home }, { id: "agent-leads", label: "Leads", I: Users }, { id: "agent-policies", label: "Policies", I: FileText }, { id: "agent-commissions", label: "Commissions", I: TrendingUp }, { id: "agent-reports", label: "Reports", I: Award }];
  const links = userType === "agent" ? aLinks : cLinks;

  return (
    <div className="min-h-screen bg-gray-50">
      {page !== "login" && (
        <nav className="bg-white shadow-md sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => nav(userType === "agent" ? "agent-dashboard" : "home")}><div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center"><Shield size={24} className="text-white" /></div><div><span className="text-xl font-bold text-blue-700">Trustner</span><span className="text-xs text-gray-500 block -mt-1">Insurance Brokers</span></div></div>
            <div className="hidden md:flex items-center gap-1">{links.map(l => <button key={l.id} onClick={() => nav(l.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition ${page === l.id ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-100"}`}><l.I size={18} />{l.label}</button>)}</div>
            <div className="flex items-center gap-3">
              {userType === "agent" && <span className="hidden md:inline bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold">Agent Portal</span>}
              {userType ? <button onClick={logout} className="flex items-center gap-2 text-gray-600 hover:text-red-600 font-semibold text-sm px-3 py-2 hover:bg-red-50 rounded-lg transition"><LogOut size={18} />Logout</button> : <button onClick={() => nav("login")} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition"><LogIn size={18} />Login</button>}
              <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-2">{mobileMenu ? <X size={24} /> : <Menu size={24} />}</button>
            </div>
          </div>
          {mobileMenu && <div className="md:hidden bg-white border-t px-4 py-4 space-y-2">{links.map(l => <button key={l.id} onClick={() => nav(l.id)} className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg font-semibold ${page === l.id ? "bg-blue-50 text-blue-700" : "text-gray-600"}`}><l.I size={20} />{l.label}</button>)}</div>}
        </nav>
      )}

      {page === "home" && <LandingPage onNavigate={nav} />}
      {page === "health" && <HealthQuote onNavigate={nav} />}
      {page === "life" && <LifeQuote onNavigate={nav} />}
      {page === "motor" && <MotorQuote onNavigate={nav} />}
      {page === "my-dashboard" && <CustomerDash onNavigate={nav} />}
      {page === "login" && <LoginPage onLogin={login} />}
      {page === "agent-dashboard" && <AgentDash onNavigate={nav} />}
      {page === "agent-leads" && <LeadMgmt onNavigate={nav} />}
      {page === "agent-policies" && <PolicyMgmt onNavigate={nav} />}
      {page === "agent-commissions" && <CommTracker onNavigate={nav} />}
      {page === "agent-reports" && <Reports onNavigate={nav} />}

      {page !== "login" && (
        <footer className="bg-gray-900 text-white py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div><div className="flex items-center gap-2 mb-4"><Shield size={28} className="text-blue-400" /><span className="text-2xl font-bold">Trustner</span></div><p className="text-gray-400 text-sm">Your trusted insurance partner. Compare, choose, and buy insurance online.</p></div>
              <div><h3 className="font-bold text-lg mb-4">Insurance</h3><div className="space-y-2 text-sm text-gray-400">{["Health Insurance", "Life Insurance", "Motor Insurance", "Travel Insurance"].map(l => <p key={l} className="hover:text-white cursor-pointer transition">{l}</p>)}</div></div>
              <div><h3 className="font-bold text-lg mb-4">Company</h3><div className="space-y-2 text-sm text-gray-400">{["About Us", "Careers", "Press", "Contact"].map(l => <p key={l} className="hover:text-white cursor-pointer transition">{l}</p>)}</div></div>
              <div><h3 className="font-bold text-lg mb-4">Support</h3><div className="space-y-2 text-sm text-gray-400"><p className="flex items-center gap-2"><Phone size={16} /> 1800-XXX-XXXX (Toll Free)</p><p className="flex items-center gap-2"><Mail size={16} /> support@trustner.in</p><p className="flex items-center gap-2"><Clock size={16} /> Mon-Sat: 9AM - 7PM</p></div></div>
            </div>
            <div className="border-t border-gray-800 pt-8 flex flex-wrap justify-between text-sm text-gray-500"><p>2025 Trustner Insurance Brokers Pvt. Ltd. All rights reserved.</p><div className="flex gap-6">{["Privacy Policy", "Terms of Service", "Disclaimer"].map(l => <p key={l} className="hover:text-white cursor-pointer">{l}</p>)}</div></div>
          </div>
        </footer>
      )}
    </div>
  );
}
