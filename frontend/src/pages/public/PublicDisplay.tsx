import React, { useState, useEffect, useMemo } from 'react';
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
  Monitor
} from 'lucide-react';

export const PublicDisplay: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Office filter from URL search params (e.g. ?office=Registrar or ?office=Finance)
  const initialOffice = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('office') || 'all';
  };

  const [selectedOffice, setSelectedOffice] = useState<string>(initialOffice);

  const fetchDisplay = async () => {
    try {
      const res = await api.getPublicDisplay();
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisplay();
    const interval = setInterval(fetchDisplay, 4000);
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
  }, []);

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

  // Predefined office tabs and dynamic ones extracted from service summary
  const officeTabs = useMemo(() => {
    const list = [
      { key: 'all', label: 'All Offices', icon: Monitor },
      { key: 'Registrar', label: 'Registrar Office', icon: Building2 },
      { key: 'Finance', label: 'Finance / Cashier', icon: Building2 },
      { key: 'Guidance', label: 'Guidance Office', icon: Building2 },
      { key: 'IT', label: 'IT Department', icon: Building2 },
    ];

    if (data?.services_summary) {
      data.services_summary.forEach((svc: any) => {
        if (svc.category && !list.some(tab => tab.key.toLowerCase() === svc.category.toLowerCase())) {
          list.push({
            key: svc.category,
            label: `${svc.category} Office`,
            icon: Building2
          });
        }
      });
    }

    return list;
  }, [data]);

  // Filter Now Serving tickets based on selected office
  const filteredNowServing = useMemo(() => {
    if (!data?.now_serving) return [];
    if (selectedOffice === 'all') return data.now_serving;
    return data.now_serving.filter((ticket: any) => {
      const cat = (ticket.service_category || '').toLowerCase();
      const sel = selectedOffice.toLowerCase();
      return cat.includes(sel) || (sel.includes('finance') && cat.includes('cashier'));
    });
  }, [data?.now_serving, selectedOffice]);

  // Filter Services waiting summary based on selected office
  const filteredServicesSummary = useMemo(() => {
    if (!data?.services_summary) return [];
    if (selectedOffice === 'all') return data.services_summary;
    return data.services_summary.filter((svc: any) => {
      const cat = (svc.category || '').toLowerCase();
      const sel = selectedOffice.toLowerCase();
      return cat.includes(sel) || (sel.includes('finance') && cat.includes('cashier'));
    });
  }, [data?.services_summary, selectedOffice]);

  const activeOfficeLabel = officeTabs.find(t => t.key.toLowerCase() === selectedOffice.toLowerCase())?.label || 'All Offices';

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none">
      {/* Top Banner */}
      <header className="px-6 sm:px-8 py-4 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-white rounded-2xl shadow-lg border border-white/20 flex items-center justify-center">
            <img 
              src="/logo.png" 
              alt="St. Rita's College of Balingasag Logo" 
              className="h-10 sm:h-12 w-auto object-contain"
            />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-3">
              <span>SRCB Service Monitor</span>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                LIVE DISPLAY
              </span>
              {selectedOffice !== 'all' && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-extrabold bg-brand-500/20 text-brand-300 border border-brand-500/40 rounded-full uppercase tracking-wider">
                  {activeOfficeLabel}
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              St. Rita's College of Balingasag • Real-Time Queue & Counter Dispatch
            </p>
          </div>
        </div>

        {/* Right Info: Clock & Fullscreen Control */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-brand-300">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="text-[11px] font-semibold text-slate-400">
              {currentTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>

          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen (TV Monitor Mode)'}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition shadow-sm"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Office Switcher Bar (Dedicated TV View for Registrar, Finance, etc.) */}
      <div className="px-6 py-2.5 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between gap-4 overflow-x-auto">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mr-2">
            <Filter className="w-3.5 h-3.5 text-brand-400" />
            <span>TV Display Office:</span>
          </span>

          <div className="flex items-center gap-1.5">
            {officeTabs.map(tab => {
              const isSelected = selectedOffice.toLowerCase() === tab.key.toLowerCase();
              return (
                <button
                  key={tab.key}
                  onClick={() => handleSelectOffice(tab.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                    isSelected
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30 border border-brand-400/30'
                      : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="text-[11px] text-slate-500 hidden md:block">
          URL parameter supported: <code className="text-brand-300 font-mono">?office={selectedOffice}</code>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Now Serving Big Cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-black tracking-wide uppercase text-slate-300 flex items-center gap-2">
              <Radio className="w-6 h-6 text-brand-400 animate-pulse" />
              <span>Now Calling / Serving {selectedOffice !== 'all' ? `— ${activeOfficeLabel}` : ''}</span>
            </h2>
            <span className="text-xs text-slate-400">
              Please proceed immediately to your assigned counter window
            </span>
          </div>

          {loading && !data ? (
            <div className="h-64 flex items-center justify-center text-slate-500">
              Loading real-time queue feed...
            </div>
          ) : filteredNowServing.length === 0 ? (
            <div className="h-96 rounded-3xl bg-slate-900/60 border border-slate-800/80 flex flex-col items-center justify-center text-center p-8">
              <Clock className="w-16 h-16 text-slate-700 mb-4" />
              <h3 className="text-xl font-bold text-slate-400">
                {selectedOffice === 'all'
                  ? 'No active queue calls at this moment'
                  : `No active queue calls for ${activeOfficeLabel}`}
              </h3>
              <p className="text-sm text-slate-600 mt-1 max-w-sm">
                Counters will call the next ticket shortly. Please take a seat in the waiting area.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredNowServing.map((ticket: any) => (
                <div
                  key={ticket.id}
                  className={`rounded-3xl p-6 border transition-all duration-300 relative overflow-hidden ${
                    ticket.status === 'calling'
                      ? 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-amber-950/20 border-amber-500/50 shadow-2xl shadow-amber-500/10'
                      : 'bg-gradient-to-br from-blue-950/40 via-slate-900 to-indigo-950/20 border-blue-500/40 shadow-xl'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-brand-400" />
                      {ticket.service_category}
                    </span>
                    <span
                      className={`text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                        ticket.status === 'calling'
                          ? 'bg-amber-400 text-slate-950 animate-bounce'
                          : 'bg-blue-500 text-white'
                      }`}
                    >
                      {ticket.status === 'calling' ? 'Calling Now' : 'Serving'}
                    </span>
                  </div>

                  <div className="my-3">
                    <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                      Ticket Number
                    </div>
                    <div className="text-5xl font-black tracking-tight font-mono text-white mt-1">
                      {ticket.queue_number}
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] uppercase font-bold text-slate-400">Proceed to</div>
                      <div className="text-lg font-extrabold text-brand-300">
                        {ticket.counter_number || ticket.location_or_counter || 'Window Desk'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] uppercase font-bold text-slate-400">Service</div>
                      <div className="text-xs font-bold text-slate-300 max-w-[150px] truncate">
                        {ticket.service_name}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Service Queue Summary */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black tracking-wide uppercase text-slate-300 flex items-center gap-2">
              <Users className="w-6 h-6 text-indigo-400" />
              <span>Upcoming in Line</span>
            </h2>
            {selectedOffice !== 'all' && (
              <span className="text-xs text-brand-400 font-semibold">
                {activeOfficeLabel}
              </span>
            )}
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 divide-y divide-slate-800/80">
            {filteredServicesSummary.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                No active services listed for this category.
              </div>
            ) : (
              filteredServicesSummary.map((svc: any) => (
                <div key={svc.service_id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-slate-200">{svc.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">Code: {svc.code} • {svc.category}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black font-mono text-brand-400">
                      {svc.total_waiting}
                    </div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">
                      Waiting
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-xs text-slate-400 space-y-2">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>Dedicated Office TV Configuration</span>
            </div>
            <p>
              To mount a TV in a specific office lobby, open this page with the office filter set (e.g. <code className="text-brand-300 font-mono">/display?office=Registrar</code> or <code className="text-brand-300 font-mono">/display?office=Finance</code>) and click the Fullscreen icon.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

