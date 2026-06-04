import React, { useEffect, useState } from 'react';
import { getTransactions, createTransaction, updateTransactionStatus, getResources, getUsers } from '@/api/services';
import { Transaction, Resource, User } from '@/types';
import { Loader2, Plus, Play, CheckCircle2, XCircle } from 'lucide-react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Select } from '@/components/Select';
import { useForm } from 'react-hook-form';

const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const fetchData = async () => {
    try {
      const [txData, resData, usrData] = await Promise.all([
        getTransactions(), getResources(), getUsers()
      ]);
      if (txData.success) setTransactions(txData.data);
      if (resData.success) setResources(resData.data);
      if (usrData.success) setUsers(usrData.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onSubmit = async (data: any) => {
    try {
      await createTransaction({
        userId: parseInt(data.userId),
        resourceId: parseInt(data.resourceId),
      });
      reset();
      setShowForm(false);
      fetchData();
    } catch (error) {
      console.error('Failed to create transaction', error);
    }
  };

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      await updateTransactionStatus(id, status);
      fetchData();
    } catch (error) {
      console.error('Failed to update status', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'PENDING':
        return <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 border border-amber-100">Pending</span>;
      case 'ACTIVE':
        return <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 border border-blue-100">Active</span>;
      case 'COMPLETED':
        return <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 border border-emerald-100">Completed</span>;
      case 'CANCELLED':
        return <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 border border-slate-200">Cancelled</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">Transactions Log</h1>
          <p className="text-slate-500 font-sans text-sm mt-1">Manage borrowing, enrollment, and operations.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="w-4 h-4 mr-1.5" /> New Transaction
        </Button>
      </div>

      {showForm && (
        <Card className="bg-slate-50 border-blue-100">
          <div className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select 
                  label="User" 
                  {...register('userId', { required: true })}
                  options={users.map(u => ({ value: u.id, label: `${u.firstName} ${u.lastName} (${u.email})` }))}
                />
                <Select 
                  label="Resource" 
                  {...register('resourceId', { required: true })}
                  options={resources.map(r => ({ value: r.id, label: `${r.code} - ${r.name}` }))}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" isLoading={isSubmitting}>Issue Transaction</Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      <div className="overflow-x-auto w-full border border-slate-200 rounded-2xl bg-white shadow-sm">
        <table className="w-full min-w-[700px] text-left border-collapse text-xs font-semibold">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50 text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4">TXN ID</th>
              <th className="py-3 px-4">Resource</th>
              <th className="py-3 px-4">User</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-slate-50/20 transition-colors">
                <td className="py-3.5 px-4 font-mono font-extrabold text-slate-900">TXN-{tx.id.toString().padStart(5, '0')}</td>
                <td className="py-3.5 px-4 font-bold text-blue-600">{tx.resource?.code}</td>
                <td className="py-3.5 px-4 text-slate-600">{tx.user?.email}</td>
                <td className="py-3.5 px-4 text-slate-500 font-mono">{new Date(tx.transactionDate).toLocaleDateString()}</td>
                <td className="py-3.5 px-4 text-center">
                  {getStatusBadge(tx.status)}
                </td>
                <td className="py-3.5 px-4 text-right">
                  {tx.status === 'PENDING' && (
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleStatusUpdate(tx.id, 'ACTIVE')} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Activate">
                        <Play className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleStatusUpdate(tx.id, 'CANCELLED')} className="p-1 text-rose-600 hover:bg-rose-50 rounded" title="Cancel">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {tx.status === 'ACTIVE' && (
                    <button onClick={() => handleStatusUpdate(tx.id, 'COMPLETED')} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded" title="Complete">
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">No transactions found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Transactions;
