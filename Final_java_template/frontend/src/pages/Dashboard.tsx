import React, { useEffect, useState } from 'react';
import { getDashboardSummary } from '@/api/services';
import { DashboardSummary as DashboardSummaryType } from '@/types';
import { ShieldCheck, Users, BookOpen, Repeat, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Card } from '@/components/Card';
import { Loader2 } from 'lucide-react';

const Dashboard = () => {
  const [data, setData] = useState<DashboardSummaryType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await getDashboardSummary();
        if (res.success) {
          setData(res.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">System Overview</h1>
          <p className="text-slate-500 font-sans text-sm mt-1">Real-time metrics and compliance status.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Total Users" 
          value={data.totalUsers} 
          icon={Users} 
          color="blue" 
          badge="Active Directory" 
        />
        <StatsCard 
          title="Total Resources" 
          value={data.totalResources} 
          icon={BookOpen} 
          color="slate" 
          badge="Inventory" 
        />
        <StatsCard 
          title="Active Transactions" 
          value={data.transactionsByStatus?.['ACTIVE'] || 0} 
          icon={ShieldCheck} 
          color="emerald" 
          badge="Fully Compliant" 
        />
        <StatsCard 
          title="Pending Approvals" 
          value={data.transactionsByStatus?.['PENDING'] || 0} 
          icon={AlertTriangle} 
          color="amber" 
          badge="Action Required" 
        />
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="px-6 py-5 border-b border-slate-100">
            <h3 className="font-display font-bold text-lg text-slate-900">Transaction Status Breakdown</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {Object.entries(data.transactionsByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-600 capitalize">{status.toLowerCase()}</span>
                  <span className="font-mono text-sm font-bold text-slate-900">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

const StatsCard = ({ title, value, icon: Icon, color, badge }: any) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
  };

  const bgClasses = colors[color as keyof typeof colors];

  return (
    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between h-36 relative overflow-hidden group">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className={`text-3xl font-extrabold mt-1 font-display ${color === 'blue' ? 'text-blue-600' : 'text-slate-900'}`}>
            {value}
          </h3>
        </div>
        <div className={`p-2 rounded-xl border ${bgClasses}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md self-start border ${bgClasses}`}>
        {badge}
      </span>
    </div>
  );
};

export default Dashboard;
