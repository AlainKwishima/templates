import React, { useEffect, useState } from 'react';
import { getResources, createResource, getDepartments } from '@/api/services';
import { Resource, Department } from '@/types';
import { Loader2, Plus, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Select } from '@/components/Select';
import { useForm } from 'react-hook-form';

const Resources = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const fetchData = async () => {
    try {
      const [resData, deptData] = await Promise.all([getResources(), getDepartments()]);
      if (resData.success) setResources(resData.data);
      if (deptData.success) setDepartments(deptData.data);
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
      // Convert department string to object with ID expected by backend
      const payload = {
        ...data,
        department: { id: parseInt(data.departmentId) }
      };
      await createResource(payload);
      reset();
      setShowForm(false);
      fetchData();
    } catch (error) {
      console.error('Failed to create resource', error);
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
          <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">Resources Inventory</h1>
          <p className="text-slate-500 font-sans text-sm mt-1">Manage books, equipment, and assets.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="w-4 h-4 mr-1.5" /> New Resource
        </Button>
      </div>

      {showForm && (
        <Card className="bg-slate-50 border-blue-100">
          <div className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Resource Name" {...register('name', { required: true })} />
                <Input label="Code (e.g. BOK-101)" {...register('code', { required: true })} />
                <Input label="Description" {...register('description', { required: true })} />
                <Select 
                  label="Department" 
                  {...register('departmentId', { required: true })}
                  options={departments.map(d => ({ value: d.id, label: d.name }))}
                />
                <Select 
                  label="Status" 
                  {...register('status', { required: true })}
                  options={[
                    { value: 'AVAILABLE', label: 'Available' },
                    { value: 'UNAVAILABLE', label: 'Unavailable' },
                    { value: 'MAINTENANCE', label: 'Maintenance' },
                  ]}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" isLoading={isSubmitting}>Save Resource</Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      <div className="overflow-x-auto w-full border border-slate-200 rounded-2xl bg-white shadow-sm">
        <table className="w-full min-w-[700px] text-left border-collapse text-xs font-semibold">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50 text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4">Code</th>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Department</th>
              <th className="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {resources.map((resource) => (
              <tr key={resource.id} className="hover:bg-slate-50/20 transition-colors">
                <td className="py-3.5 px-4 font-mono font-extrabold text-slate-900">{resource.code}</td>
                <td className="py-3.5 px-4 font-bold text-blue-600">{resource.name}</td>
                <td className="py-3.5 px-4 text-slate-500">{resource.department?.name}</td>
                <td className="py-3.5 px-4 text-center">
                  {resource.status === 'AVAILABLE' ? (
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 border border-emerald-100">
                      <ShieldCheck className="w-3.5 h-3.5" /> Available
                    </span>
                  ) : (
                    <span className="bg-rose-50 text-rose-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 border border-rose-100">
                      <ShieldAlert className="w-3.5 h-3.5" /> {resource.status}
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {resources.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500">No resources found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Resources;
