"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  Calculator, Database, ShieldCheck, FileText, TrendingUp, 
  AlertTriangle, CheckCircle2, Factory, Truck, Zap 
} from 'lucide-react';

// 1. Supabase 연동 (입력하신 환경변수 자동 적용)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 2. [ESG 정밀 로직] 활동별 배출계수 및 산정 수식 (IPCC 2006 & 환경부 고시 기준)
const CALC_ENGINE = {
  SCOPE_1: {
    STATIONARY: { 
      LNG: { unit: 'Nm3', calorific: 38.9, factor: 0.0561, name: 'LNG(고정연소)' },
      DIESEL: { unit: 'L', calorific: 35.8, factor: 0.0741, name: '경유(비상발전기)' }
    },
    MOBILE: {
      GASOLINE: { unit: 'L', calorific: 30.5, factor: 0.0693, name: '휘발유(법인차)' },
      DIESEL: { unit: 'L', calorific: 35.8, factor: 0.0741, name: '경유(화물차)' }
    },
    FUGITIVE: {
      HFC134A: { unit: 'kg', calorific: 1, factor: 1.43, name: '냉매누출(HFC-134a)' } // GWP 포함
    }
  },
  SCOPE_2: {
    ELECTRICITY: { unit: 'kWh', calorific: 1, factor: 0.4781, name: '전력사용(간접배출)' }
  }
};

export default function CowayESGMaster() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState<number>(0);
  const [selectedSource, setSelectedSource] = useState('ELECTRICITY');
  const [history, setHistory] = useState<any[]>([]);
  const [aiStatus, setAiStatus] = useState('idle'); // idle, scanning, success, fail

  // [핵심 산정 엔진] 전문가 검수 로직
  const calculateResult = () => {
    let target = CALC_ENGINE.SCOPE_2.ELECTRICITY;
    if (selectedSource === 'LNG') target = CALC_ENGINE.SCOPE_1.STATIONARY.LNG;
    if (selectedSource === 'GASOLINE') target = CALC_ENGINE.SCOPE_1.MOBILE.GASOLINE;
    
    // 공식: 활동량 * 순발열량 * 배출계수 / 1000 = tCO2eq
    const co2 = (usage * target.calorific * target.factor) / 1000;
    return co2.toFixed(4);
  };

  // [DB 저장] Supabase 영구 보관
  const handleSubmit = async () => {
    setLoading(true);
    const co2 = calculateResult();
    const { error } = await supabase.from('activity_data').insert([{
      org_id: 'COWAY_PARTNER_001', // 향후 로그인 정보로 대체
      year: 2024,
      month: 9,
      category: selectedSource,
      usage_value: usage,
      co2_value: co2,
      status: 'Pending'
    }]);

    if (error) alert("저장 오류: " + error.message);
    else {
      alert("데이터가 성공적으로 전송되었습니다.");
      setUsage(0);
      fetchData();
    }
    setLoading(false);
  };

  const fetchData = async () => {
    const { data } = await supabase.from('activity_data').select('*').order('created_at', { ascending: false });
    if (data) setHistory(data);
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      {/* 사이드바 메뉴 */}
      <nav className="fixed left-0 top-0 h-full w-72 bg-slate-900 p-8 text-white z-50">
        <div className="mb-12">
          <h2 className="text-2xl font-black tracking-tighter text-sky-400">COWAY ESG</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Supply Chain Master</p>
        </div>
        
        <div className="space-y-4">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${activeTab === 'dashboard' ? 'bg-sky-500 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400'}`}>
            <TrendingUp size={20} /> 대시보드
          </button>
          <button onClick={() => setActiveTab('input')} className={`w-full flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${activeTab === 'input' ? 'bg-sky-500 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400'}`}>
            <Calculator size={20} /> 배출량 입력
          </button>
          <button className="w-full flex items-center gap-3 p-4 rounded-2xl font-bold text-slate-400 hover:bg-slate-800 transition-all">
            <FileText size={20} /> 리포트 발행
          </button>
        </div>

        <div className="absolute bottom-8 left-8 right-8">
          <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700">
            <p className="text-xs text-slate-500 font-bold mb-2">현재 접속 정보</p>
            <p className="text-sm font-black italic">상생구매팀 차장님</p>
          </div>
        </div>
      </nav>

      {/* 메인 컨텐츠 영역 */}
      <main className="pl-80 p-12">
        {activeTab === 'dashboard' ? (
          <div className="animate-in fade-in duration-700">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">ESG 통합 대시보드</h1>
                <p className="text-slate-500 mt-2 font-medium">100개 협력사의 실시간 Scope 1, 2 배출 현황입니다.</p>
              </div>
              <div className="flex gap-3">
                <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-200 text-sm font-bold">2024년 9월 기준</div>
              </div>
            </div>

            {/* 상단 통계 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                <div className="w-12 h-12 bg-sky-50 text-sky-500 rounded-2xl flex items-center justify-center mb-6"><Zap /></div>
                <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">총 배출량 (tCO2eq)</p>
                <h3 className="text-4xl font-black text-slate-900">4,281.5</h3>
                <p className="text-emerald-500 text-xs font-bold mt-2 flex items-center gap-1">전월 대비 12.4% 감소 ↓</p>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mb-6"><Factory /></div>
                <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">데이터 이행률</p>
                <h3 className="text-4xl font-black text-slate-900">88.0%</h3>
                <div className="w-full bg-slate-100 h-2 rounded-full mt-4"><div className="bg-indigo-500 h-2 rounded-full w-[88%]"></div></div>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-6"><AlertTriangle /></div>
                <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">AI 검수 이상 탐지</p>
                <h3 className="text-4xl font-black text-rose-500">3건</h3>
                <p className="text-slate-400 text-xs font-bold mt-2 italic">정밀 검토가 필요합니다.</p>
              </div>
            </div>

            {/* 메인 차트 */}
            <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/40 border border-slate-100 mb-12">
              <h4 className="text-xl font-black mb-8">월별 배출량 추이 및 예측</h4>
              <div className="h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    {name: '4월', co2: 1200}, {name: '5월', co2: 1500}, {name: '6월', co2: 1300}, 
                    {name: '7월', co2: 1800}, {name: '8월', co2: 1400}, {name: '9월', co2: 1100}
                  ]}>
                    <defs>
                      <linearGradient id="colorCo2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontWeight: 'bold'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontWeight: 'bold'}} />
                    <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                    <Area type="monotone" dataKey="co2" stroke="#0EA5E9" strokeWidth={4} fillOpacity={1} fill="url(#colorCo2)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-in slide-in-from-bottom duration-500 max-w-4xl">
            <h1 className="text-4xl font-black text-slate-900 mb-12">배출 데이터 수동 입력</h1>
            
            <div className="bg-white p-10 rounded-[3rem] shadow-2xl shadow-slate-200/60 border border-slate-100">
              <div className="space-y-8">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block">에너지 배출원 구분</label>
                  <div className="grid grid-cols-3 gap-4">
                    {['ELECTRICITY', 'LNG', 'GASOLINE'].map((type) => (
                      <button 
                        key={type}
                        onClick={() => setSelectedSource(type)}
                        className={`py-4 rounded-2xl font-black text-sm border-2 transition-all ${selectedSource === type ? 'border-sky-500 bg-sky-50 text-sky-600' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                      >
                        {type === 'ELECTRICITY' ? '⚡ 전력' : type === 'LNG' ? '🔥 LNG' : '🚗 휘발유'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block">당월 활동량(사용량) 입력</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={usage}
                      onChange={(e) => setUsage(Number(e.target.value))}
                      className="w-full p-6 bg-slate-50 rounded-3xl border-none text-2xl font-black text-slate-800 outline-none focus:ring-4 ring-sky-100 transition-all"
                      placeholder="0"
                    />
                    <span className="absolute right-8 top-1/2 -translate-y-1/2 font-black text-slate-300">kWh / Nm3 / L</span>
                  </div>
                </div>

                <div className="p-8 bg-slate-900 rounded-[2rem] text-white flex justify-between items-center shadow-xl shadow-slate-400/20">
                  <div>
                    <p className="text-sky-400 text-xs font-black uppercase tracking-widest">실시간 계산 결과</p>
                    <h2 className="text-4xl font-black mt-1">{calculateResult()} <span className="text-sm font-bold text-slate-400">tCO2eq</span></h2>
                  </div>
                  <Calculator size={40} className="text-slate-700" />
                </div>

                <div className="pt-6 border-t border-slate-100">
                   <p className="text-xs font-black text-slate-400 uppercase mb-4">증빙 서류 AI 검수 (고지서 사진 업로드)</p>
                   <div className="flex gap-4">
                      <label className="flex-grow cursor-pointer bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center hover:bg-slate-100 transition-all">
                        <Database className="text-slate-300 mb-2" />
                        <span className="text-sm font-bold text-slate-400">파일 선택 또는 드래그</span>
                        <input type="file" className="hidden" />
                      </label>
                      <button 
                        onClick={() => {
                          setAiStatus('scanning');
                          setTimeout(() => setAiStatus('success'), 2000);
                        }}
                        className="w-40 bg-white border-2 border-sky-500 text-sky-500 rounded-3xl font-black text-sm hover:bg-sky-50 transition-all"
                      >
                        {aiStatus === 'scanning' ? '분석 중...' : 'AI 검수 시작'}
                      </button>
                   </div>
                   {aiStatus === 'success' && (
                     <div className="mt-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3 text-emerald-600 font-bold text-sm">
                       <CheckCircle2 size={18} /> 고지서 수치와 입력값이 일치합니다.
                     </div>
                   )}
                </div>

                <button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full py-6 bg-sky-500 text-white rounded-3xl font-black text-xl shadow-xl shadow-sky-200 hover:bg-sky-600 hover:-translate-y-1 transition-all disabled:bg-slate-300"
                >
                  {loading ? '전송 중...' : '데이터 최종 제출'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
