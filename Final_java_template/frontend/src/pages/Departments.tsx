import React, { useEffect, useState } from 'react';
import { getDepartments, createDepartment } from '@/api/services';
import { Department } from '@/types';
import { Loader2, Plus } from 'lucide-react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useForm } from 'react-hook-form';

const Departments = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const fetchDepartments = async () => {
    try {
      const res = await getDepartments();
      if (res.success) {
        setDepartments(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch departments', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const onSubmit = async (data: any) => {
    try {
      await createDepartment(data);
      reset();
      setShowForm(false);
      fetchDepartments();
    } catch (error) {
      console.error('Failed to create department', error);
    }
  };

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
          <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">Departments</h1>
          <p className="text-slate-500 font-sans text-sm mt-1">Manage organizational units and categories.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="w-4 h-4 mr-1.5" /> New Department
        </Button>
      </div>

      {showForm && (
        <Card className="bg-slate-50 border-blue-100">
          <div className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Department Name" {...register('name', { required: true })} />
                <Input label="Description" {...register('description', { required: true })} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" isLoading={isSubmitting}>Save Department</Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      <div className="overflow-x-auto w-full border border-slate-200 rounded-2xl bg-white shadow-sm">
        <table className="w-full min-w-[700px] text-left border-collapse text-xs font-semibold">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50 text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4">Dept ID</th>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {departments.map((dept) => (
              <tr key={dept.id} className="hover:bg-slate-50/20 transition-colors">
                <td className="py-3.5 px-4 font-mono font-extrabold text-slate-900">DEP-{dept.id.toString().padStart(3, '0')}</td>
                <td className="py-3.5 px-4 font-bold text-blue-600">{dept.name}</td>
                <td className="py-3.5 px-4 text-slate-500">{dept.description}</td>
              </tr>
            ))}
            {departments.length === 0 && (
              <tr>
                <td colSpan={3} className="py-8 text-center text-slate-500">No departments found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Departments;
