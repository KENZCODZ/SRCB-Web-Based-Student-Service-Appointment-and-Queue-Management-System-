import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { AuditLog, EmailLog } from '../../types';
import {
  FileText,
  Mail,
  Search,
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Send
} from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'audit' | 'email'>('audit');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'audit') {
        const res = await api.getAuditLogs({ search: search || undefined });
        setAuditLogs(res.data || []);
      } else {
        const res = await api.getEmailLogs(50);
        setEmailLogs(res.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Audit Trail & Transactional Logs
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Full compliance record of system operations, security changes, and transactional email deliveries.
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 self-start sm:self-auto transition flex items-center gap-1.5 text-xs font-semibold"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-600' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-2 ${
            activeTab === 'audit' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4 text-brand-600" />
          <span>System Audit Trail</span>
        </button>
        <button
          onClick={() => setActiveTab('email')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-2 ${
            activeTab === 'email' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Mail className="w-4 h-4 text-indigo-600" />
          <span>Email API Delivery Logs</span>
        </button>
      </div>

      {/* AUDIT LOGS TABLE */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-6">Timestamp</th>
                  <th className="py-4 px-6">User / Actor</th>
                  <th className="py-4 px-6">Action Trigger</th>
                  <th className="py-4 px-6">Target Entity</th>
                  <th className="py-4 px-6">IP Address</th>
                  <th className="py-4 px-6">Payload Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">Loading audit trail...</td>
                  </tr>
                ) : auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">No audit records found.</td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-4 px-6 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="py-4 px-6">
                        {log.email ? (
                          <div>
                            <div className="font-bold text-slate-900">{log.first_name} {log.middle_name ? `${log.middle_name} ` : ''}{log.last_name}</div>
                            <div className="text-[11px] text-slate-400 capitalize">{log.role} • {log.email}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">System / Anonymous</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-mono font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded text-[11px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-600">
                        {log.entity_type ? `${log.entity_type} #${log.entity_id}` : '—'}
                      </td>
                      <td className="py-4 px-6 font-mono text-[11px] text-slate-400">
                        {log.ip_address || '127.0.0.1'}
                      </td>
                      <td className="py-4 px-6 font-mono text-[11px] text-slate-500 max-w-xs truncate">
                        {log.details_json || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EMAIL DISPATCH LOGS TABLE */}
      {activeTab === 'email' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-6">Sent At</th>
                  <th className="py-4 px-6">Recipient</th>
                  <th className="py-4 px-6">Subject & Template</th>
                  <th className="py-4 px-6">Delivery Status</th>
                  <th className="py-4 px-6">API Message ID / Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">Loading email logs...</td>
                  </tr>
                ) : emailLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">No emails dispatched yet.</td>
                  </tr>
                ) : (
                  emailLogs.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-4 px-6 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {new Date(e.created_at).toLocaleString()}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900">{e.recipient_name}</div>
                        <div className="text-[11px] text-slate-400">{e.recipient_email}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-800">{e.subject}</div>
                        <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                          {e.template}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            e.status === 'sent' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {e.status === 'sent' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                          <span className="capitalize">{e.status}</span>
                        </span>
                      </td>
                      <td className="py-4 px-6 font-mono text-[11px] text-slate-400 max-w-xs truncate">
                        {e.error_message ? (
                          <span className="text-rose-600">{e.error_message}</span>
                        ) : (
                          e.external_message_id || 'dispatched'
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
