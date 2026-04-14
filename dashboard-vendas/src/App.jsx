import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid,
  PieChart, Pie, Legend, LineChart, Line, Area, AreaChart
} from 'recharts';
import {
  LayoutDashboard, Users, Calendar, Trophy, TrendingUp, DollarSign,
  Target, AlertTriangle, CheckCircle, X, Zap, ArrowUpRight, ArrowDownRight,
  ChevronRight, Sparkles, LogOut, Info
} from 'lucide-react';
import Login from './login';

// ─── PALETA ───────────────────────────────────────────────────────────────
const ACCENT   = "#6366f1";
const ACCENT2  = "#8b5cf6";
const EMERALD  = "#10b981";
const ROSE     = "#f43f5e";
const AMBER    = "#f59e0b";
const SURFACE  = "#0f1117";
const CARD     = "#161b27";
const BORDER   = "#1e2535";
const TEXT_MUT = "#64748b";
const TEXT_SEC = "#94a3b8";
const TEXT_PRI = "#f1f5f9";

const PIZZA_CORES = [ROSE, ACCENT, EMERALD, AMBER, "#06b6d4", "#a855f7"];

const getFotoVendedora = (nomeCompleto) => {
  if (!nomeCompleto) return null;
  const primeiroNome = nomeCompleto.split(' ')[0].toLowerCase();
  return `/fotos/${primeiroNome}.png`;
};

const API_BASE = import.meta.env.VITE_API_URL;

// ─── UTILITÁRIOS ─────────────────────────────────────────────────────────
const fmt      = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtK     = (v) => new Intl.NumberFormat('pt-BR', { notation: 'compact', compactDisplay: 'short' }).format(v);
const firstName = (n) => n?.split(' ')[0] ?? '';

// ─── ALERTA: METAS ZERADAS (filtro multi-mês) ────────────────────────────
//
// Estilizado com inline-styles consistentes com o design system do projeto.
// O projeto não possui Tailwind configurado (sem tailwind.config / PostCSS),
// portanto usar classes tw aqui quebraria o build. A aparência e semântica
// são equivalentes ao que um alerta Tailwind produziria.
//
function MetasZeradasAlert() {
  return (
    <div
      role="alert"
      style={{
        display:       'flex',
        alignItems:    'flex-start',
        gap:           14,
        background:    `${AMBER}14`,
        border:        `1px solid ${AMBER}55`,
        borderLeft:    `4px solid ${AMBER}`,
        borderRadius:  12,
        padding:       '16px 20px',
        marginBottom:  24,
        animation:     'fadeInDown 0.3s ease',
      }}
    >
      <div style={{
        flexShrink:     0,
        width:          34,
        height:         34,
        borderRadius:   10,
        background:     `${AMBER}22`,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        marginTop:      1,
      }}>
        <AlertTriangle size={17} color={AMBER} />
      </div>

      <div>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: AMBER, letterSpacing: '0.01em' }}>
          Meta zerada
        </p>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: TEXT_SEC, lineHeight: 1.55 }}>
          O filtro selecionado abrange mais de um mês. Selecione dias em um único mês para visualizar as metas.
        </p>
      </div>

      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>
    </div>
  );
}

// ─── SUB-COMPONENTES ─────────────────────────────────────────────────────
function Pill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding:       '6px 18px',
        borderRadius:  999,
        border:        'none',
        cursor:        'pointer',
        fontSize:      11,
        fontWeight:    700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        transition:    'all .2s',
        background:    active ? ACCENT : 'transparent',
        color:         active ? '#fff' : TEXT_MUT,
        boxShadow:     active ? `0 0 16px ${ACCENT}55` : 'none',
      }}
    >
      {children}
    </button>
  );
}

function KpiCard({ icon: Icon, label, value, sub, accent, trend, trendUp, dimmed }) {
  return (
    <div
      style={{
        background:    CARD,
        border:        `1px solid ${dimmed ? BORDER : BORDER}`,
        borderRadius:  16,
        padding:       '22px 24px',
        display:       'flex',
        flexDirection: 'column',
        gap:           12,
        position:      'relative',
        overflow:      'hidden',
        transition:    'border-color .2s',
        opacity:       dimmed ? 0.45 : 1,
      }}
      onMouseEnter={e => { if (!dimmed) e.currentTarget.style.borderColor = accent ?? ACCENT; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; }}
    >
      <div style={{
        position:     'absolute',
        top: -30, right: -30,
        width:        90,
        height:       90,
        borderRadius: '50%',
        background:   (accent ?? ACCENT) + '18',
        filter:       'blur(20px)',
        pointerEvents:'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          width:          36,
          height:         36,
          borderRadius:   10,
          background:     (accent ?? ACCENT) + '22',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
        }}>
          <Icon size={17} color={accent ?? ACCENT} />
        </div>

        {trend && !dimmed && (
          <span style={{
            display:    'flex',
            alignItems: 'center',
            gap:        3,
            fontSize:   11,
            fontWeight: 700,
            color:      trendUp ? EMERALD : ROSE,
            background: (trendUp ? EMERALD : ROSE) + '18',
            padding:    '3px 8px',
            borderRadius: 6,
          }}>
            {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {trend}
          </span>
        )}

        {/* Ícone de informação quando card está zerado por bloqueio */}
        {dimmed && (
          <span style={{
            display:    'flex',
            alignItems: 'center',
            gap:        3,
            fontSize:   10,
            fontWeight: 700,
            color:      AMBER,
            background: AMBER + '18',
            padding:    '3px 8px',
            borderRadius: 6,
            letterSpacing: '0.06em',
          }}>
            <Info size={11} /> N/D
          </span>
        )}
      </div>

      <div>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: TEXT_MUT, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
          {label}
        </p>
        <p style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 800, color: TEXT_PRI, letterSpacing: '-0.02em' }}>
          {value}
        </p>
        {sub && (
          <p style={{ margin: '4px 0 0', fontSize: 12, color: TEXT_SEC }}>{sub}</p>
        )}
      </div>
    </div>
  );
}

function ProgressBar({ pct, color }) {
  return (
    <div style={{ width: '100%', height: 5, borderRadius: 999, background: '#1e2535', overflow: 'hidden' }}>
      <div style={{
        height:     '100%',
        width:      `${Math.min(pct, 100)}%`,
        borderRadius: 999,
        background: pct >= 100 ? EMERALD : (color ?? ACCENT),
        transition: 'width .6s ease',
      }} />
    </div>
  );
}

function VendedoraCard({ v, index, metaZerada }) {
  const isFirst    = index === 0;
  const gap        = v.meta - v.total;
  const avatarBorder = isFirst ? `2px solid ${ACCENT}` : `2px solid ${BORDER}`;

  return (
    <div
      style={{
        background:  CARD,
        border:      `1px solid ${isFirst ? ACCENT + '60' : BORDER}`,
        borderRadius: 16,
        padding:     20,
        position:    'relative',
        overflow:    'hidden',
        transition:  'transform .2s, border-color .2s, box-shadow .2s',
        cursor:      'default',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform   = 'translateY(-3px)';
        e.currentTarget.style.borderColor = ACCENT + '90';
        e.currentTarget.style.boxShadow   = `0 8px 32px ${ACCENT}22`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform   = 'translateY(0)';
        e.currentTarget.style.borderColor = isFirst ? ACCENT + '60' : BORDER;
        e.currentTarget.style.boxShadow   = 'none';
      }}
    >
      {/* Badge de posição */}
      <div style={{
        position:    'absolute',
        top:         12,
        right:       12,
        fontSize:    10,
        fontWeight:  800,
        padding:     '3px 9px',
        borderRadius: 6,
        background:  isFirst ? ACCENT : '#1e2535',
        color:       isFirst ? '#fff' : TEXT_MUT,
        letterSpacing: '0.05em',
      }}>
        #{index + 1}
      </div>

      {/* Avatar + nome + total */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <img
          src={getFotoVendedora(v.nome)}
          alt={v.nome}
          style={{ width: 60, height: 60, borderRadius: '50%', border: avatarBorder, objectFit: 'cover' }}
        />
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: TEXT_PRI }}>
            {firstName(v.nome)}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 20, fontWeight: 800, color: isFirst ? ACCENT : TEXT_PRI }}>
            {fmt(v.total)}
          </p>
        </div>
      </div>

      {/* Barra de progresso — oculta quando metas estão zeradas por filtro multi-mês */}
      {!metaZerada && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: TEXT_MUT, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Atingido
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: v.percentual >= 100 ? EMERALD : ACCENT }}>
              {v.percentual.toFixed(0)}%
            </span>
          </div>
          <ProgressBar pct={v.percentual} />
        </div>
      )}

      {/* Meta / Falta — oculto quando metas zeradas */}
      {!metaZerada ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <div>
            <p style={{ margin: 0, fontSize: 9, color: TEXT_MUT, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Meta (mês)
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: TEXT_SEC }}>
              {v.meta > 0 ? fmt(v.meta) : '—'}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: 9, color: TEXT_MUT, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Falta
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: gap > 0 ? ROSE : EMERALD }}>
              {v.meta === 0 ? '—' : gap > 0 ? fmt(gap) : '✓ Batida'}
            </p>
          </div>
        </div>
      ) : (
        /* Substituição discreta quando meta não é exibível */
        <div style={{ marginTop: 8, padding: '6px 10px', background: AMBER + '10', borderRadius: 8, border: `1px solid ${AMBER}30` }}>
          <p style={{ margin: 0, fontSize: 10, color: AMBER, textAlign: 'center', letterSpacing: '0.06em' }}>
            Meta indisponível — filtro multi-mês
          </p>
        </div>
      )}
    </div>
  );
}

// ─── TOOLTIPS ─────────────────────────────────────────────────────────────
const CustomBarTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1a2236', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '10px 14px', fontSize: 13, color: TEXT_PRI }}>
      <p style={{ margin: 0, fontWeight: 700 }}>{fmt(payload[0].value)}</p>
    </div>
  );
};

const CustomPieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1a2236', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '10px 14px', fontSize: 12, color: TEXT_PRI }}>
      <p style={{ margin: 0, fontWeight: 700 }}>{payload[0].name}</p>
      <p style={{ margin: '3px 0 0', color: payload[0].payload.fill }}>{fmt(payload[0].value)}</p>
    </div>
  );
};

// ─── LOADING / ERRO ───────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: SURFACE, gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulse 1.4s ease-in-out infinite' }}>
        <Sparkles size={22} color="#fff" />
      </div>
      <p style={{ margin: 0, color: TEXT_SEC, fontSize: 14, fontWeight: 500 }}>Carregando dados...</p>
      <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(.95)} }`}</style>
    </div>
  );
}

function ErrorScreen({ onRetry }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: SURFACE, gap: 12 }}>
      <AlertTriangle size={36} color={ROSE} />
      <p style={{ margin: 0, color: TEXT_PRI, fontSize: 16, fontWeight: 700 }}>Backend offline ou inacessível</p>
      <p style={{ margin: 0, color: TEXT_MUT, fontSize: 13 }}>Verifique se o servidor está rodando em {API_BASE}</p>
      <button onClick={onRetry} style={{ marginTop: 8, padding: '10px 24px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
        Tentar novamente
      </button>
    </div>
  );
}

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────
  export default function App() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [logado,      setLogado]      = useState(false);
  const [periodo,     setPeriodo]     = useState('Este Mês');
  const [dados,       setDados]       = useState(null);
  const [dataInicio,  setDataInicio]  = useState('');
  const [dataFim,     setDataFim]     = useState('');
  const [mostrarCal,  setMostrarCal]  = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [erro,        setErro]        = useState(false);
  const [ultimaAtt,   setUltimaAtt]   = useState(null);
  const intervalRef = useRef(null);

  // Verifica token persistido
  useEffect(() => {
    const token = localStorage.getItem('token_prohair');
    if (token) setLogado(true);
  }, []);

  const executarBusca = (prd = periodo, ini = dataInicio, fim = dataFim) => {
    if (!localStorage.getItem('token_prohair')) return;

    const mapa = {
      'Hoje':        'hoje',
      'Esta Semana': 'semana',
      'Este Mês':    'mes',
      'Mês Passado': 'mes_passado',
      'Personalizado': 'personalizado',
    };

    let url = `${API_BASE}/api/dashboard?periodo=${mapa[prd] ?? 'mes'}`;

    if (prd === 'Personalizado' && ini && fim) {
      const f = (d) => d.split('-').reverse().join('/');
      url += `&data_inicio=${f(ini)}&data_fim=${f(fim)}`;
      setMostrarCal(false);
    }

    return fetch(url)
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(data => {
        setDados(data);
        setErro(false);
        setUltimaAtt(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      })
      .catch(() => setErro(true))
      .finally(() => setLoading(false));
  };

  // Busca ao logar ou ao mudar período
  useEffect(() => {
    if (logado) { setLoading(true); executarBusca(); }
  }, [periodo, logado]);

  // Auto-refresh a cada 5 min
  useEffect(() => {
    if (logado) {
      intervalRef.current = setInterval(() => executarBusca(), 5 * 60 * 1000);
      return () => clearInterval(intervalRef.current);
    }
  }, [periodo, dataInicio, dataFim, logado]);

  const fazerLogout = () => {
    localStorage.removeItem('token_prohair');
    setLogado(false);
  };

  // ─── Portão de acesso ──────────────────────────────────────────────────
  if (!logado)           return <Login onLogin={() => setLogado(true)} />;
  if (loading)           return <LoadingScreen />;
  if (erro || !dados)    return <ErrorScreen onRetry={() => { setLoading(true); executarBusca(); }} />;

  // ─── Derivações ───────────────────────────────────────────────────────
  const metaZerada  = dados.metas_zeradas ?? false;
  const gapTotal    = dados.meta_empresa - dados.faturamento_geral;
  const pct         = dados.meta_empresa > 0
    ? (dados.faturamento_geral / dados.meta_empresa) * 100
    : 0;

  // Abaixo de const pct = ...
  const campanhas = dados.campanhas_wati ?? [];
  const totalGastoWati = campanhas.reduce((acc, curr) => acc + (Number(curr.gasto) || 0), 0);
  const totalVendasWati = campanhas.reduce((acc, curr) => acc + (Number(curr.vendas) || 0), 0);
  const roasMedio = totalGastoWati > 0 ? (totalVendasWati / totalGastoWati) : 0;

  const dadosGap = dados.ranking
    .map((v, i) => ({
      name:  firstName(v.nome),
      value: Math.max(v.meta - v.total, 0),
      fill:  PIZZA_CORES[i % PIZZA_CORES.length],
    }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);

  const historicoSemana = dados.historico_semana ?? [];

  // Textos dos KPI cards que dependem de metas
  const metaGapValue = metaZerada
    ? '—'
    : gapTotal > 0 ? fmt(gapTotal) : 'Batida!';
  const metaGapSub   = metaZerada
    ? 'filtro abrange múltiplos meses'
    : gapTotal > 0 ? 'para atingir a meta' : 'Meta superada! 🎉';
  const perfValue    = metaZerada ? '—' : `${pct.toFixed(1)}%`;

  return (
    <div style={{
      minHeight:   '100vh',
      display:     'flex',
      flexDirection: isMobile ? 'column' : 'row', // EMPILHA NO CELULAR
      background:  SURFACE,
      fontFamily:  "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      color:       TEXT_PRI,
    }}>

{/* ── SIDEBAR RESPONSIVA AJUSTADA ── */}
<aside style={{ 
  width: isMobile ? '100%' : 220, 
  background: CARD, 
  borderRight: isMobile ? 'none' : `1px solid ${BORDER}`,
  borderBottom: isMobile ? `1px solid ${BORDER}` : 'none', 
  display: 'flex', 
  flexDirection: isMobile ? 'row' : 'column', 
  justifyContent: isMobile ? 'space-between' : 'flex-start', // Agrupa no topo no PC
  alignItems: isMobile ? 'center' : 'stretch', 
  padding: isMobile ? '12px 20px' : '32px 0', 
  flexShrink: 0 
}}>
  {/* 1. LOGO */}
  <div style={{ padding: isMobile ? '0' : '0 24px 32px', textAlign: isMobile ? 'left' : 'center' }}>
    <img src="/logo-prohair.png" alt="Prohair Logo" style={{ width: isMobile ? 60 : 120, height: 'auto', objectFit: 'contain' }} />
  </div>

  {/* 2. MENU (Desktop) */}
  {!isMobile && (
    <div style={{ padding: '0 16px', marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: ACCENT + '18', borderLeft: `4px solid ${ACCENT}`, color: ACCENT, fontWeight: 700, fontSize: 13 }}>
        <LayoutDashboard size={18} />
        <span>Painel de Metas</span>
      </div>
    </div>
  )}

  {/* 3. PERFORMANCE (Agora logo abaixo do menu) */}
  <div style={{ 
    padding: isMobile ? '0' : '0 24px', 
    marginTop: isMobile ? 0 : 20, // TROCAMOS 'AUTO' POR 20
    textAlign: isMobile ? 'right' : 'left' 
  }}>
    <p style={{ margin: 0, fontSize: 10, color: TEXT_MUT, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
      {isMobile ? 'Perf.' : 'Performance Geral'}
    </p>
    <p style={{ margin: 0, fontSize: isMobile ? 18 : 26, fontWeight: 800, color: TEXT_PRI }}>
      {pct.toFixed(1)}%
    </p>
    {!isMobile && <ProgressBar pct={pct} color={ACCENT} />}
  </div>
</aside>

      {/* ── CONTEÚDO ── */}
      <main style={{ flex: 1, padding: '32px 36px', overflowY: 'auto' }}>

        {/* HEADER */}
        <header style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row', 
          gap: isMobile ? 20 : 0,
          alignItems: isMobile ? 'flex-start' : 'center', 
          justifyContent: 'space-between', 
          marginBottom: 36 
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>Painel Comercial</h1>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: TEXT_MUT, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
              Monitoramento em Tempo Real
              {ultimaAtt && (
                <span style={{ marginLeft: 10, color: EMERALD, fontWeight: 600 }}>
                  · atualizado às {ultimaAtt}
                </span>
              )}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Seletor de período */}
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 999, padding: '4px 6px' }}>
                {['Hoje', 'Esta Semana', 'Este Mês', 'Mês Passado'].map(p => (
                  <Pill key={p} active={periodo === p} onClick={() => { setPeriodo(p); setMostrarCal(false); }}>
                    {p}
                  </Pill>
                ))}
                <button
                  onClick={() => { setPeriodo('Personalizado'); setMostrarCal(v => !v); }}
                  style={{ width: 32, height: 32, borderRadius: 999, border: 'none', cursor: 'pointer', background: periodo === 'Personalizado' ? ACCENT : 'transparent', color: periodo === 'Personalizado' ? '#fff' : TEXT_MUT, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 4 }}
                >
                  <Calendar size={14} />
                </button>
              </div>

              {/* Pop-up calendário personalizado */}
              {mostrarCal && (
                <div style={{ position: 'absolute', top: 48, right: 0, zIndex: 50, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 16, width: 240, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Período</span>
                    <button onClick={() => setMostrarCal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT_MUT }}>
                      <X size={14} />
                    </button>
                  </div>

                  {[['Início', dataInicio, setDataInicio], ['Fim', dataFim, setDataFim]].map(([label, val, set]) => (
                    <div key={label} style={{ marginBottom: 10 }}>
                      <label style={{ display: 'block', fontSize: 10, color: TEXT_MUT, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {label}
                      </label>
                      <input
                        type="date"
                        value={val}
                        onChange={e => set(e.target.value)}
                        style={{ width: '100%', background: '#0f1117', border: `1px solid ${BORDER}`, color: TEXT_PRI, borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box', colorScheme: 'dark' }}
                      />
                    </div>
                  ))}

                  {/* Aviso inline quando as datas já indicam multi-mês */}
                  {dataInicio && dataFim && (() => {
                    const ini = new Date(dataInicio);
                    const fim = new Date(dataFim);
                    const diffMes = ini.getMonth() !== fim.getMonth() || ini.getFullYear() !== fim.getFullYear();
                    return diffMes ? (
                      <p style={{ margin: '0 0 8px', fontSize: 10, color: AMBER, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <AlertTriangle size={10} /> As metas serão zeradas neste filtro.
                      </p>
                    ) : null;
                  })()}

                  <button
                    onClick={() => executarBusca('Personalizado', dataInicio, dataFim)}
                    style={{ width: '100%', padding: '9px 0', background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12, letterSpacing: '0.07em', textTransform: 'uppercase', cursor: 'pointer', marginTop: 4, boxShadow: `0 4px 14px ${ACCENT}55` }}
                  >
                    Filtrar
                  </button>
                </div>
              )}
            </div>

            {/* Botão Sair */}
            <button
              onClick={fazerLogout}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1e2535', color: ROSE, border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: 'background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#2a3441'}
              onMouseLeave={e => e.currentTarget.style.background = '#1e2535'}
            >
              <LogOut size={14} /> Sair
            </button>
          </div>
        </header>

        {/* ── ALERTA METAS ZERADAS ── */}
        {metaZerada && <MetasZeradasAlert />}

        {/* ── KPI CARDS ── */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', // 1 COLUNA NO CELULAR
          gap: 16, 
          marginBottom: 28 
        }}>
          <KpiCard
            icon={DollarSign}
            label="Realizado Geral"
            value={fmt(dados.faturamento_geral)}
            sub="acumulado no período"
            accent={ACCENT}
          />
          <KpiCard
            icon={Target}
            label="Meta Mensal (Fixa)"
            value={metaZerada ? '—' : fmt(dados.meta_empresa)}
            sub={metaZerada ? 'indisponível para multi-mês' : 'soma das metas individuais'}
            accent={AMBER}
            dimmed={metaZerada}
          />
          <KpiCard
            icon={AlertTriangle}
            label="Gap (Falta)"
            value={metaGapValue}
            sub={metaGapSub}
            accent={metaZerada ? AMBER : gapTotal > 0 ? ROSE : EMERALD}
            dimmed={metaZerada}
          />
          <KpiCard
            icon={Trophy}
            label="Performance"
            value={perfValue}
            sub={`${dados.ranking.length} vendedoras ativas`}
            accent={ACCENT2}
            dimmed={metaZerada}
          />
        </div>

        {/* ── SEÇÃO DE MARKETING (WATI) ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{ width: 4, height: 22, borderRadius: 2, background: EMERALD }} />
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Performance Wati</h2>
          </div>

          {/* Se o filtro for multi-mês, mostramos o alerta em vez dos cards zerados */}
          {metaZerada ? (
            <div style={{ 
              background: AMBER + '10', 
              border: `1px solid ${AMBER}30`, 
              padding: '20px', 
              borderRadius: 16, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 12 
            }}>
              <Info size={20} color={AMBER} />
              <span style={{ fontSize: 13, color: TEXT_SEC }}>
                Os dados de Marketing são isolados por mês. 
                <strong style={{ color: AMBER, marginLeft: 5 }}>Selecione um único mês</strong> para visualizar o investimento e ROI.
              </span>
            </div>
          ) : (
            /* Caso contrário, mostra os cards normalmente */
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', 
              gap: 16 
            }}>
              <KpiCard icon={Zap} label="Investimento Wati" value={fmt(totalGastoWati)} accent={EMERALD} />
              <KpiCard icon={TrendingUp} label="Vendas via Wati" value={fmt(totalVendasWati)} accent={ACCENT} />
              <KpiCard icon={Trophy} label="ROAS (Marketing)" value={`${roasMedio.toFixed(2)}x`} accent={AMBER} />
            </div>
          )}
        </div>

      <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 10, 
          marginBottom: 18,
          marginTop: 32 // Espaço extra acima do ranking
        }}>
          <div style={{ width: 4, height: 22, borderRadius: 2, background: ACCENT }} />
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Ranking Elite</h2>
          
          {/* Oculta o subtítulo no mobile para não apertar o título */}
          {!isMobile && (
            <span style={{ fontSize: 11, color: TEXT_MUT, fontWeight: 500 }}>
              — Top vendedoras do período
            </span>
          )}
      </div>

        {/* ── GRÁFICOS ── */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 0.7fr', // Empilha os 3 gráficos no celular
          gap: 18, 
          marginBottom: 28 
        }}>

          {/* Barras: Performance Individual */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '24px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <TrendingUp size={16} color={ACCENT} />
              <span style={{ fontWeight: 700, fontSize: 14 }}>Performance Individual</span>
            </div>
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dados.ranking} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={BORDER} />
                  <XAxis dataKey="nome" tickFormatter={firstName} axisLine={false} tickLine={false} tick={{ fill: TEXT_MUT, fontSize: 11, fontWeight: 600 }} dy={8} interval={0} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: TEXT_MUT, fontSize: 10 }} tickFormatter={fmtK} />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: '#ffffff08' }} />
                  <Bar dataKey="total" radius={[6, 6, 0, 0]} barSize={32}>
                    {dados.ranking.map((_, i) => <Cell key={i} fill={i === 0 ? ACCENT : '#1e2a3a'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Área: Tendência Semanal */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '24px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <Zap size={16} color={EMERALD} />
              <span style={{ fontWeight: 700, fontSize: 14 }}>Tendência Semanal</span>
            </div>
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historicoSemana} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={EMERALD} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={EMERALD} stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={BORDER} />
                  <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{ fill: TEXT_MUT, fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: TEXT_MUT, fontSize: 10 }} tickFormatter={fmtK} />
                  <Tooltip
                    contentStyle={{ background: '#1a2236', border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 12, color: TEXT_PRI }}
                    formatter={v => [fmt(v), 'Vendas']}
                  />
                  <Area type="monotone" dataKey="valor" stroke={EMERALD} strokeWidth={2.5} fill="url(#areaGrad)" dot={{ r: 4, fill: EMERALD, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pizza: Distribuição do GAP — oculta quando metas zeradas */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, width: '100%' }}>
              <AlertTriangle size={15} color={ROSE} />
              <span style={{ fontWeight: 700, fontSize: 14 }}>Distribuição do GAP</span>
            </div>

            {metaZerada ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 8, color: AMBER, textAlign: 'center' }}>
                <Info size={32} />
                <span style={{ fontWeight: 700, fontSize: 13 }}>Indisponível</span>
                <span style={{ fontSize: 11, color: TEXT_MUT, lineHeight: 1.5 }}>
                  Selecione um único mês para ver a distribuição de gaps.
                </span>
              </div>
            ) : dadosGap.length > 0 ? (
              <div style={{ position: 'relative', width: '100%', height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={dadosGap} cx="50%" cy="45%" innerRadius={52} outerRadius={75} paddingAngle={4} dataKey="value" stroke="none">
                      {dadosGap.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: 20, pointerEvents: 'none' }}>
                  <span style={{ fontSize: 9, color: TEXT_MUT, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Gap Total</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: TEXT_PRI }}>{fmt(gapTotal > 0 ? gapTotal : 0)}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px', justifyContent: 'center', marginTop: 8 }}>
                  {dadosGap.map(d => (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: d.fill }} />
                      <span style={{ fontSize: 10, color: TEXT_MUT }}>{d.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 8, color: EMERALD }}>
                <CheckCircle size={36} />
                <span style={{ fontWeight: 700 }}>Meta Batida!</span>
              </div>
            )}
          </div>
        </div>

        {/* ── RANKING ELITE ── */}

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(5, 1fr)', // Uma vendedora por linha no celular
          gap: 14 
        }}>
          {dados.ranking.map((v, i) => (
            <VendedoraCard key={i} v={v} index={i} metaZerada={metaZerada} />
          ))}
        </div>

      </main>
    </div>
  );
}