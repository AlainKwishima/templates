import React, { useEffect, useState } from 'react';
import { getUsers } from '@/api/services';
import { User } from '@/types';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { Card } from '@/components/Card';

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await getUsers();
        if (res.success) {
          setUsers(res.data);
        }
      } catch (error) {
        console.error('Failed to fetch users', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">Users Management</h1>
          <p className="text-slate-500 font-sans text-sm mt-1">Manage system accounts and their roles.</p>
        </div>
      </div>

      <div className="overflow-x-auto w-full border border-slate-200 rounded-2xl bg-white shadow-sm">
        <table className="w-full min-w-[700px] text-left border-collapse text-xs font-semibold">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50 text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4">User ID</th>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4 text-center">Role Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/20 transition-colors">
                <td className="py-3.5 px-4 font-mono font-extrabold text-slate-900">USR-{user.id.toString().padStart(4, '0')}</td>
                <td className="py-3.5 px-4 font-bold">{user.firstName} {user.lastName}</td>
                <td className="py-3.5 px-4 text-slate-500">{user.email}</td>
                <td className="py-3.5 px-4 text-center">
                  {user.roleName === 'ADMIN' ? (
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 border border-emerald-100">
                      <ShieldCheck className="w-3.5 h-3.5" /> Admin
                    </span>
                  ) : (
                    <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 border border-blue-100">
                      User
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;
