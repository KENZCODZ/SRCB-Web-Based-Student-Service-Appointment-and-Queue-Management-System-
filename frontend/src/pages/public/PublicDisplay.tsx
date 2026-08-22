import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Radio, Users, Clock, Building2, BellRing, Sparkles } from 'lucide-react';

export const PublicDisplay: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

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
    const interval = setInterval(fetchDisplay, 5000);
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      clearInterval(interval);
      clearInterval(clockInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none">
      {/* Top Banner */}
      <header className="px-8 py-5 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border-b border-slate-800 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center font-black text-2xl shadow-lg shadow-brand-500/30">
            E
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-3">
              SRCB Student Service Central
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                LIVE DISPLAY
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              St. Rita's College of Balingasag • Real-Time Queue Status
            </p>
          </div>
        </div>

        {/* Real-time Clock */}
        <div className="text-right">
          <div className="text-3xl font-black font-mono tracking-wider text-brand-300">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div className="text-xs font-semibold text-slate-400">
            {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Now Serving Big Cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-black tracking-wide uppercase text-slate-300 flex items-center gap-2">
              <Radio className="w-6 h-6 text-brand-400 animate-pulse" />
              <span>Now Calling / Serving</span>
            </h2>
            <span className="text-xs text-slate-400">
              Please proceed immediately to your assigned counter
            </span>
          </div>

          {loading && !data ? (
            <div className="h-64 flex items-center justify-center text-slate-500">
              Loading real-time queue feed...
            </div>
          ) : data?.now_serving?.length === 0 ? (
            <div className="h-96 rounded-3xl bg-slate-900/60 border border-slate-800/80 flex flex-col items-center justify-center text-center p-8">
              <Clock className="w-16 h-16 text-slate-700 mb-4" />
              <h3 className="text-xl font-bold text-slate-400">No active queue calls at this moment</h3>
              <p className="text-sm text-slate-600 mt-1 max-w-sm">
                Counters will call the next ticket shortly. Please take a seat and listen for announcements.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data?.now_serving?.map((ticket: any) => (
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
          <h2 className="text-xl font-black tracking-wide uppercase text-slate-300 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-400" />
            <span>Upcoming in Line</span>
          </h2>

          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 divide-y divide-slate-800/80">
            {data?.services_summary?.map((svc: any) => (
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
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/30 border border-slate-800 text-xs text-slate-400 text-center">
            Tip: You can join service queues online from your phone or student portal account.
          </div>
        </div>
      </div>
    </div>
  );
};
