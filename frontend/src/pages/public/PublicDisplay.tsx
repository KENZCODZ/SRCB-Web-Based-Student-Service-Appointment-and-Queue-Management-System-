import React, { useState, useEffect, useMemo, useRef } from 'react';
import { api } from '../../services/api';
import { 
  Radio, 
  Users, 
  Clock, 
  Building2, 
  Maximize2, 
  Minimize2, 
  Filter, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  Monitor,
  Volume2,
  VolumeX,
  BellRing,
  ArrowUpRight,
  ShieldCheck,
  Info,
  Layers,
  Check
} from 'lucide-react';

/**
 * Normalizes an office category name to a canonical key for comparison
 */
const getCanonicalOfficeKey = (category: string): string => {
  if (!category) return '';
  const c = category.trim().toLowerCase();
  if (c === 'all') return 'all';
  if (c.includes('finance') || c.includes('cashier')) return 'Finance';
  if (c.includes('registrar')) return 'Registrar';
  if (c.includes('it') || c.includes('information technology')) return 'IT Department';
  if (c.includes('library')) return 'Library';
  if (c.includes('guidance')) return 'Guidance';
  if (c.includes('dean')) return 'Dean Office';
  return category.trim();
};

/**
 * Formats an office category for clean TV display without redundant "Office" suffixes
 */
const formatOfficeName = (category: string): string => {
  if (!category) return '';
  const trimmed = category.trim();
  const lower = trimmed.toLowerCase();

  if (lower.includes('finance') || lower.includes('cashier')) {
    return 'Finance / Cashier';
  }
  if (lower === 'it' || lower === 'it department' || lower === 'information technology' || lower === 'information technology office') {
    return 'IT Department';
  }
  if (lower === 'registrar' || lower === 'registrar office') {
    return 'Registrar Office';
  }
  if (lower === 'library' || lower === 'library office') {
    return 'Library Office';
  }
  if (lower === 'guidance' || lower === 'guidance office') {
    return 'Guidance Office';
  }
  if (lower === 'dean' || lower === 'dean office' || lower === "dean's office") {
    return 'Dean Office';
  }

  if (
    lower.endsWith('office') ||
    lower.endsWith('department') ||
    lower.endsWith('center') ||
    lower.endsWith('division') ||
    lower.endsWith('bureau') ||
    lower.endsWith('desk')
  ) {
    return trimmed;
  }

  return `${trimmed} Office`;
};

export const PublicDisplay: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('eduqueue_tv_chime') === 'true';
  });

  const previousCallingIdsRef = useRef<Set<number>>(new Set());

  // Office filter from URL search params (e.g. ?office=Registrar or ?office=Finance)
  const initialOffice = () => {
    const params = new URLSearchParams(window.location.search);
    const officeParam = params.get('office');
    if (!officeParam || officeParam.toLowerCase() === 'all') return 'all';
    return getCanonicalOfficeKey(officeParam);
  };

  const [selectedOffice, setSelectedOffice] = useState<string>(initialOffice);

  // Play pleasant two-tone professional airport/counter chime using Web Audio API
  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // First tone: E5 (659.25 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.28, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.55);

      // Second tone: C5 (523.25 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(523.25, now + 0.22);
      gain2.gain.setValueAtTime(0.32, now + 0.22);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.22);
      osc2.stop(now + 0.85);
    } catch (e) {
      // Audio might be restricted until user interaction
    }
  };

  const toggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    localStorage.setItem('eduqueue_tv_chime', String(nextState));
    if (nextState) {
      playChime();
    }
  };

  const fetchDisplay = async () => {
    try {
      const res = await api.getPublicDisplay();
      const nextData = res.data;
      setData(nextData);

      // Check for newly calling tickets to chime
      if (soundEnabled && Array.isArray(nextData?.now_serving)) {
        const currentCalling = nextData.now_serving.filter((t: any) => t.status === 'calling');
        const prevSet = previousCallingIdsRef.current;
        const hasNewCall = currentCalling.some((t: any) => !prevSet.has(t.id));

        if (hasNewCall) {
          playChime();
        }

        const newSet = new Set<number>();
        currentCalling.forEach((t: any) => newSet.add(t.id));
        previousCallingIdsRef.current = newSet;
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisplay();
    const interval = setInterval(fetchDisplay, 3500);
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      clearInterval(interval);
      clearInterval(clockInterval);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [soundEnabled]);

  const handleSelectOffice = (officeKey: string) => {
    setSelectedOffice(officeKey);
    const url = new URL(window.location.href);
    if (officeKey === 'all') {
      url.searchParams.delete('office');
    } else {
      url.searchParams.set('office', officeKey);
    }
    window.history.replaceState({}, '', url.toString());
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.error(err));
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => console.error(err));
      }
    }
  };

  // Dynamically build office tabs exclusively from registered offices in the system
  const officeTabs = useMemo(() => {
    const tabs = [
      { key: 'all', label: 'All Offices', icon: Monitor }
    ];

    const distinctOffices = new Map<string, string>(); // canonicalKeyLower -> rawCategory

    // 1. From data.registered_offices (provided by backend for active queue services)
    if (Array.isArray(data?.registered_offices)) {
      data.registered_offices.forEach((office: string) => {
        if (office && typeof office === 'string') {
          const key = getCanonicalOfficeKey(office);
          if (key && !distinctOffices.has(key.toLowerCase())) {
            distinctOffices.set(key.toLowerCase(), office);
          }
        }
      });
    }

    // 2. From services_summary (any active queue service categories)
    if (Array.isArray(data?.services_summary)) {
      data.services_summary.forEach((svc: any) => {
        if (svc?.category) {
          const key = getCanonicalOfficeKey(svc.category);
          if (key && !distinctOffices.has(key.toLowerCase())) {
            distinctOffices.set(key.toLowerCase(), svc.category);
          }
        }
      });
    }

    // 3. From now_serving (active queue entries)
    if (Array.isArray(data?.now_serving)) {
      data.now_serving.forEach((ticket: any) => {
        if (ticket?.service_category) {
          const key = getCanonicalOfficeKey(ticket.service_category);
          if (key && !distinctOffices.has(key.toLowerCase())) {
            distinctOffices.set(key.toLowerCase(), ticket.service_category);
          }
        }
      });
    }

    // Build the dynamic tabs and sort them alphabetically
    const dynamicTabs = Array.from(distinctOffices.entries()).map(([_, rawName]) => {
      const canonicalKey = getCanonicalOfficeKey(rawName);
      return {
        key: canonicalKey,
        label: formatOfficeName(rawName),
        icon: Building2
      };
    });

    dynamicTabs.sort((a, b) => a.label.localeCompare(b.label));

    return [...tabs, ...dynamicTabs];
  }, [data]);

  // Filter Now Serving tickets based on selected office
  const filteredNowServing = useMemo(() => {
    if (!data?.now_serving) return [];
    if (selectedOffice === 'all') return data.now_serving;
    const selectedKey = getCanonicalOfficeKey(selectedOffice).toLowerCase();
    return data.now_serving.filter((ticket: any) => {
      const ticketKey = getCanonicalOfficeKey(ticket.service_category || '').toLowerCase();
      return ticketKey === selectedKey;
    });
  }, [data?.now_serving, selectedOffice]);

  // Split tickets into Calling and Serving for clear visual hierarchy
  const callingTickets = useMemo(() => {
    return filteredNowServing.filter((t: any) => t.status === 'calling');
  }, [filteredNowServing]);

  const servingTickets = useMemo(() => {
    return filteredNowServing.filter((t: any) => t.status === 'serving');
  }, [filteredNowServing]);

  // Filter Services waiting summary based on selected office
  const filteredServicesSummary = useMemo(() => {
    if (!data?.services_summary) return [];
    if (selectedOffice === 'all') return data.services_summary;
    const selectedKey = getCanonicalOfficeKey(selectedOffice).toLowerCase();
    return data.services_summary.filter((svc: any) => {
      const svcKey = getCanonicalOfficeKey(svc.category || '').toLowerCase();
      return svcKey === selectedKey;
    });
  }, [data?.services_summary, selectedOffice]);

  // Calculate live aggregate stats for the public dashboard strip
  const totalWaitingCount = useMemo(() => {
    return filteredServicesSummary.reduce((acc: number, s: any) => acc + (Number(s.total_waiting) || 0), 0);
  }, [filteredServicesSummary]);

  const activeDeskCount = useMemo(() => {
    const set = new Set();
    filteredNowServing.forEach((t: any) => {
      const counter = t.counter_number || t.location_or_counter;
      if (counter) set.add(counter);
    });
    return set.size || filteredNowServing.length;
  }, [filteredNowServing]);

  const activeOfficeLabel = useMemo(() => {
    const match = officeTabs.find(t => t.key.toLowerCase() === selectedOffice.toLowerCase());
    return match ? match.label : formatOfficeName(selectedOffice);
  }, [officeTabs, selectedOffice]);

  return (
    <div className="min-h-screen bg-[#070b14] text-white flex flex-col font-sans select-none overflow-x-hidden selection:bg-brand-500 selection:text-white">
      {/* Ambient Radial TV Glow Backdrops */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/4 w-[700px] h-[700px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 -right-20 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. TOP BROADCAST HEADER (Airport/Bank High-Visibility Bar) */}
      {/* ------------------------------------------------------------- */}
      <header className="relative z-10 px-6 sm:px-10 py-4 bg-gradient-to-r from-slate-950 via-[#0c1427] to-slate-950 border-b border-slate-800/80 shadow-2xl flex flex-wrap items-center justify-between gap-4 backdrop-blur-md">
        {/* Brand & Institution Info */}
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="relative group">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 opacity-40 blur group-hover:opacity-60 transition duration-500"></div>
            <div className="relative p-2.5 bg-white rounded-2xl shadow-xl border border-white/20 flex items-center justify-center">
              <img 
                src="/logo.png" 
                alt="St. Rita's College of Balingasag Logo" 
                className="h-11 sm:h-14 w-auto object-contain drop-shadow-sm"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white uppercase">
                St. Rita's College of Balingasag
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>LIVE QUEUE</span>
              </span>
              {selectedOffice !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 text-xs font-black bg-brand-500/25 text-brand-300 border border-brand-400/50 rounded-full uppercase tracking-wider">
                  <Building2 className="w-3.5 h-3.5 text-brand-400" />
                  <span>{activeOfficeLabel}</span>
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-400 font-medium tracking-wide mt-0.5">
              EduQueue Student Services & Counter Dispatch System
            </p>
          </div>
        </div>

        {/* Right Info: Live PST Clock, Chime Alert, Fullscreen */}
        <div className="flex items-center gap-5 sm:gap-7">
          {/* Synchronized Real-World Digital Clock */}
          <div className="text-right border-r border-slate-800 pr-5 hidden sm:block">
            <div className="text-2xl sm:text-3xl lg:text-4xl font-black font-mono tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-cyan-200 to-indigo-200 drop-shadow-[0_2px_10px_rgba(56,189,248,0.25)]">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="text-xs font-bold text-slate-400 tracking-wider uppercase mt-0.5 flex items-center justify-end gap-1.5">
              <Clock className="w-3.5 h-3.5 text-brand-400" />
              <span>{currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
              <span className="text-[10px] text-slate-500">• PST</span>
            </div>
          </div>

          {/* Interactive TV Display Quick-Bar */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSound}
              title={soundEnabled ? 'Chime Sound Enabled (Click to Mute)' : 'Chime Sound Muted (Click to Enable)'}
              className={`p-3 rounded-2xl border transition-all shadow-md flex items-center gap-2 font-bold text-xs ${
                soundEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30 shadow-emerald-500/10'
                  : 'bg-slate-800/70 text-slate-400 border-slate-700/80 hover:bg-slate-700/80 hover:text-slate-200'
              }`}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-5 h-5 text-emerald-400 animate-pulse" />
                  <span className="hidden xl:inline">Chime ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-5 h-5" />
                  <span className="hidden xl:inline">Chime Muted</span>
                </>
              )}
            </button>

            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter TV Fullscreen Mode'}
              className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition shadow-md flex items-center gap-2 font-bold text-xs"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-5 h-5" />
                  <span className="hidden xl:inline">Exit TV</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-5 h-5" />
                  <span className="hidden xl:inline">TV Fullscreen</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 2. OFFICE SELECTOR TABS & LIVE STATUS STRIP */}
      {/* ------------------------------------------------------------- */}
      <div className="relative z-10 px-6 sm:px-10 py-3 bg-[#0a0f1d] border-b border-slate-800/90 flex flex-wrap items-center justify-between gap-4">
        {/* Office Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mr-1 whitespace-nowrap">
            <Filter className="w-3.5 h-3.5 text-brand-400" />
            <span>Display Office:</span>
          </span>

          <div className="flex items-center gap-2">
            {officeTabs.map(tab => {
              const isSelected = selectedOffice.toLowerCase() === tab.key.toLowerCase();
              return (
                <button
                  key={tab.key}
                  onClick={() => handleSelectOffice(tab.key)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap border ${
                    isSelected
                      ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-lg shadow-brand-500/25 border-brand-400/50 scale-[1.02]'
                      : 'bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border-slate-800'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Aggregated Statistics Ribbon */}
        <div className="flex items-center gap-4 text-xs font-bold text-slate-300">
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span>Calling: <strong className="text-white font-mono text-sm">{callingTickets.length}</strong></span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Serving: <strong className="text-white font-mono text-sm">{servingTickets.length}</strong></span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span>Waiting: <strong className="text-white font-mono text-sm">{totalWaitingCount}</strong></span>
          </div>

          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300">
            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Active Desks: <strong className="text-white font-mono text-sm">{activeDeskCount}</strong></span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. MAIN ARENA (SPLIT 2/3 NOW CALLING + 1/3 QUEUE BOARD) */}
      {/* ------------------------------------------------------------- */}
      <main className="relative z-10 flex-1 p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ========================================================= */}
        {/* LEFT ARENA: NOW CALLING & SERVING CARDS (Cols 1-8)        */}
        {/* ========================================================= */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Section Title with Live Radar */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="absolute -inset-1 rounded-full bg-amber-500/40 blur-sm animate-ping"></span>
                <Radio className="relative w-6 h-6 text-amber-400" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white">
                Now Calling & Serving {selectedOffice !== 'all' ? `— ${activeOfficeLabel}` : ''}
              </h2>
            </div>
            <span className="text-xs sm:text-sm font-semibold text-slate-400 hidden sm:inline">
              Proceed promptly when your ticket number appears
            </span>
          </div>

          {/* Loading State */}
          {loading && !data ? (
            <div className="h-96 rounded-3xl bg-slate-900/60 border border-slate-800/80 flex flex-col items-center justify-center text-slate-400 gap-3">
              <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-bold tracking-wide">Syncing real-time queue feed...</p>
            </div>
          ) : filteredNowServing.length === 0 ? (
            /* Standby Idle State (Real-World High-Tech Waiting Screen) */
            <div className="rounded-3xl bg-gradient-to-b from-slate-900/90 via-[#0d1424] to-slate-950/90 border border-slate-800 p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="relative z-10 max-w-xl mx-auto space-y-5">
                <div className="inline-flex p-4 rounded-3xl bg-slate-800/80 border border-slate-700/80 text-brand-400 shadow-xl">
                  <Clock className="w-12 h-12" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {selectedOffice === 'all'
                    ? 'Counters Are Preparing Next Tickets'
                    : `No Active Calls for ${activeOfficeLabel}`}
                </h3>
                <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                  Counters will dispatch the next ticket shortly. Please observe this screen and listen for the audio chime.
                </p>
                <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                  <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 text-xs">
                    <strong className="block text-slate-200 font-bold mb-0.5">1. Check Ticket</strong>
                    <span className="text-slate-400 text-[11px]">Keep your printed queue number ready.</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 text-xs">
                    <strong className="block text-slate-200 font-bold mb-0.5">2. Prepare ID</strong>
                    <span className="text-slate-400 text-[11px]">Have your Student ID and forms on hand.</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 text-xs">
                    <strong className="block text-slate-200 font-bold mb-0.5">3. Priority Lane</strong>
                    <span className="text-slate-400 text-[11px]">Senior / PWD lane at Counter 1.</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* ------------------------------------------------------- */}
              {/* PRIORITY HERO CALLOUT: Any Tickets Currently "Calling"  */}
              {/* ------------------------------------------------------- */}
              {callingTickets.length > 0 && (
                <div className="space-y-4">
                  {callingTickets.map((ticket: any) => (
                    <div
                      key={ticket.id}
                      className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/40 border-2 border-amber-500/80 shadow-[0_0_50px_rgba(245,158,11,0.25)] animate-call-glow relative overflow-hidden"
                    >
                      {/* Top Bar inside Calling Card */}
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-widest shadow-lg shadow-amber-400/30">
                            <BellRing className="w-4 h-4 animate-bounce" />
                            <span>PLEASE PROCEED NOW</span>
                          </span>
                          <span className="text-xs font-bold text-amber-300 bg-amber-950/80 px-3 py-1 rounded-full border border-amber-500/40">
                            {ticket.service_category}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          <span>Active Counter Calling</span>
                        </div>
                      </div>

                      {/* Giant Split Info: Massive Ticket Number + Counter Destination */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                        {/* Massive Ticket Number */}
                        <div className="md:col-span-7">
                          <span className="text-xs font-black uppercase tracking-widest text-amber-300/90 block mb-1">
                            TICKET NUMBER
                          </span>
                          <div className="text-6xl sm:text-7xl lg:text-8xl font-black font-mono tracking-wider text-white drop-shadow-[0_4px_24px_rgba(245,158,11,0.5)]">
                            {ticket.queue_number}
                          </div>
                          <p className="text-sm font-bold text-slate-300 mt-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                            <span>{ticket.service_name}</span>
                          </p>
                        </div>

                        {/* Large Directional Window Callout */}
                        <div className="md:col-span-5 flex flex-col justify-center">
                          <span className="text-xs font-black uppercase tracking-widest text-amber-200 block mb-2">
                            PROCEED IMMEDIATELY TO
                          </span>
                          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-2xl flex items-center justify-between gap-3">
                            <div>
                              <div className="text-[11px] font-black uppercase tracking-widest text-slate-800">
                                Assigned Desk / Window
                              </div>
                              <div className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-none mt-1">
                                {ticket.counter_number || ticket.location_or_counter || 'Window 1'}
                              </div>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center shadow-md flex-shrink-0">
                              <ArrowRight className="w-7 h-7 animate-pulse" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ------------------------------------------------------- */}
              {/* CURRENTLY SERVING CARDS (High-Contrast Emerald Grid)     */}
              {/* ------------------------------------------------------- */}
              {servingTickets.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                    <span>Currently In Service at Counters</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {servingTickets.map((ticket: any) => (
                      <div
                        key={ticket.id}
                        className="rounded-3xl p-6 bg-gradient-to-br from-[#0c182a] via-[#091120] to-slate-950 border border-emerald-500/35 hover:border-emerald-500/60 shadow-xl transition-all duration-300 relative group overflow-hidden"
                      >
                        {/* Top Category and Status */}
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{ticket.service_category}</span>
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span>SERVING</span>
                          </span>
                        </div>

                        {/* Large Ticket Number */}
                        <div className="my-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                            TICKET NUMBER
                          </span>
                          <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white mt-1 group-hover:text-emerald-200 transition-colors">
                            {ticket.queue_number}
                          </div>
                        </div>

                        {/* Counter and Service Destination */}
                        <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                          <div>
                            <div className="text-[10px] uppercase font-black tracking-wider text-slate-400">
                              Counter / Desk
                            </div>
                            <div className="text-lg font-black text-cyan-300 mt-0.5 flex items-center gap-1.5">
                              <ArrowRight className="w-4 h-4 text-emerald-400" />
                              <span>{ticket.counter_number || ticket.location_or_counter || 'Window Desk'}</span>
                            </div>
                          </div>
                          <div className="text-right max-w-[170px]">
                            <div className="text-[10px] uppercase font-black tracking-wider text-slate-400">
                              Service
                            </div>
                            <div className="text-xs font-bold text-slate-300 truncate mt-0.5" title={ticket.service_name}>
                              {ticket.service_name}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* RIGHT ARENA: UPCOMING QUEUE BOARD & WAITING LINE (Cols 9-12) */}
        {/* ========================================================= */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white flex items-center gap-2.5">
              <Users className="w-6 h-6 text-cyan-400" />
              <span>Upcoming in Line</span>
            </h2>
            <span className="text-xs font-bold text-cyan-400 bg-cyan-950/70 border border-cyan-500/40 px-2.5 py-0.5 rounded-full">
              {totalWaitingCount} Total Waiting
            </span>
          </div>

          {/* Service Queue Cards */}
          <div className="rounded-3xl bg-gradient-to-b from-slate-900/90 to-[#0b1222] border border-slate-800/90 shadow-2xl p-5 divide-y divide-slate-800/80">
            {filteredServicesSummary.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No active services in queue for this department.
              </div>
            ) : (
              filteredServicesSummary.map((svc: any) => (
                <div key={svc.service_id} className="py-4 first:pt-1 last:pb-1 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-black text-slate-100 truncate">
                      {svc.name || svc.service_name}
                    </div>
                    <div className="text-xs font-medium text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-cyan-300 font-bold">{svc.code || svc.service_code}</span>
                      <span>•</span>
                      <span className="truncate">{svc.category}</span>
                    </div>

                    {/* Next In Line Preview Pill */}
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Next:</span>
                      {svc.next_in_line ? (
                        <span className="px-2 py-0.5 rounded-lg bg-brand-500/20 text-brand-300 border border-brand-500/40 font-mono font-black text-xs shadow-xs">
                          {svc.next_in_line}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">No tickets in line</span>
                      )}
                    </div>
                  </div>

                  {/* Total Waiting Pill */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-3xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-blue-400">
                      {svc.total_waiting}
                    </div>
                    <div className="text-[10px] uppercase font-black tracking-wider text-slate-400">
                      In Queue
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Public Lobby Guidance Box */}
          <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-3">
            <div className="font-black text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-400" />
              <span>Public Service Protocol</span>
            </div>
            <ul className="text-xs text-slate-400 space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>Keep your printed ticket visible and listen for the audio chime.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>Tickets called 3 times without appearance may be forfeited.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>Senior Citizens, PWDs, & Pregnant students proceed to Window 1.</span>
              </li>
            </ul>
          </div>
        </div>
      </main>

      {/* ------------------------------------------------------------- */}
      {/* 4. REAL-WORLD BROADCAST MARQUEE (News & Public Advisory Strip) */}
      {/* ------------------------------------------------------------- */}
      <footer className="relative z-10 bg-slate-950 border-t border-slate-800/90 py-3 px-4 sm:px-6 flex items-center gap-4 overflow-hidden shadow-2xl">
        {/* Fixed Announcement Tag */}
        <div className="flex-shrink-0 flex items-center gap-2 px-3.5 py-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs uppercase tracking-wider shadow-md">
          <Info className="w-4 h-4 animate-pulse" />
          <span>LOBBY NOTICE</span>
        </div>

        {/* Continuous Smooth Scrolling Marquee */}
        <div className="flex-1 overflow-hidden relative">
          <div className="animate-marquee font-bold text-xs sm:text-sm text-slate-300 tracking-wide flex items-center gap-12">
            <span>🎓 Welcome to St. Rita's College of Balingasag Student Services!</span>
            <span>📄 Please prepare your Student ID card, payment receipts, and clearance forms before reaching the window.</span>
            <span>⏱️ Standard Office Hours: Monday to Friday, 8:00 AM to 5:00 PM.</span>
            <span>♿ Window 1 is dedicated for Priority Assistance: Senior Citizens, PWDs, and Expectant Mothers.</span>
            <span>🔔 Please watch this public display and listen for the chime when your ticket number is called.</span>
            <span>📌 SRCB EduQueue System — Delivering fast, organized, and respectful campus service.</span>
          </div>
        </div>

        {/* Discreet TV ID Tag */}
        <div className="hidden md:flex items-center gap-2 text-[11px] font-mono font-bold text-slate-400 flex-shrink-0 pl-2 border-l border-slate-800">
          <span>TV-DISP-01</span>
        </div>
      </footer>
    </div>
  );
};
