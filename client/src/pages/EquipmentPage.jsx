import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/Common/DataTable';
import Badge from '../components/Common/Badge';
import Modal from '../components/Common/Modal';
import { Wrench, Plus, AlertTriangle, ShieldCheck, History } from 'lucide-react';
import { toast } from 'sonner';

const EquipmentPage = () => {
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'maintenance'
  const [selectedGym, setSelectedGym] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [reportingItem, setReportingItem] = useState(null);
  const [issueDescription, setIssueDescription] = useState('');
  const [serviceVendor, setServiceVendor] = useState('Campus Maintenance Wing');

  const { isSuperAdmin, isGymManager, isStaff, assignedGymId } = useAuth();
  const queryClient = useQueryClient();

  const { data: gyms } = useQuery({
    queryKey: ['gymsList'],
    queryFn: async () => {
      const res = await api.get('/gyms');
      return res.data.gyms;
    },
  });

  const [newEquip, setNewEquip] = useState({
    name: '',
    code: '',
    gymId: assignedGymId || '',
    category: 'STRENGTH',
    quantity: 1,
    condition: 'EXCELLENT',
    status: 'AVAILABLE',
    notes: '',
  });

  const { data: equipment, isLoading } = useQuery({
    queryKey: ['equipment', selectedGym, selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedGym) params.append('gymId', selectedGym);
      if (selectedCategory) params.append('category', selectedCategory);

      const res = await api.get(`/equipment?${params.toString()}`);
      return res.data.equipment;
    },
  });

  const { data: maintenanceLogs } = useQuery({
    queryKey: ['maintenanceLogs'],
    queryFn: async () => {
      const res = await api.get('/equipment/maintenance/logs');
      return res.data.logs;
    },
    enabled: activeTab === 'maintenance',
  });

  const addEquipmentMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/equipment', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Equipment added to gym inventory!');
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      setIsAddOpen(false);
      setNewEquip({
        name: '',
        code: '',
        gymId: assignedGymId || '',
        category: 'STRENGTH',
        quantity: 1,
        condition: 'EXCELLENT',
        status: 'AVAILABLE',
        notes: '',
      });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to add equipment.');
    },
  });

  const reportIssueMutation = useMutation({
    mutationFn: async ({ id, issueDescription, serviceVendor }) => {
      const res = await api.post(`/equipment/${id}/maintenance`, {
        issueDescription,
        serviceVendor,
        status: 'REPORTED',
      });
      return res.data;
    },
    onSuccess: () => {
      toast.warning('Maintenance issue logged. Equipment tagged as UNDER_MAINTENANCE.');
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      setReportingItem(null);
      setIssueDescription('');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to report issue.');
    },
  });

  const columns = [
    {
      header: 'Equipment Name',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-white block">
            {row.name}
          </span>
          <span className="font-mono text-[11px] text-slate-500">{row.code}</span>
        </div>
      ),
    },
    {
      header: 'Category',
      render: (row) => (
        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          {row.category}
        </span>
      ),
    },
    {
      header: 'Facility',
      render: (row) => <Badge variant={row.gymId?.code}>{row.gymId?.name}</Badge>,
    },
    {
      header: 'Quantity',
      render: (row) => (
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
          {row.availableQuantity} / {row.quantity} Available
        </span>
      ),
    },
    {
      header: 'Condition',
      render: (row) => (
        <span
          className={`text-xs font-bold ${
            row.condition === 'EXCELLENT'
              ? 'text-emerald-600 dark:text-emerald-400'
              : row.condition === 'GOOD'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-amber-600 dark:text-amber-400'
          }`}
        >
          {row.condition}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (row) => <Badge variant={row.status}>{row.status}</Badge>,
    },
    {
      header: 'Action',
      render: (row) => (
        <div>
          {row.status === 'AVAILABLE' ? (
            <button
              onClick={() => setReportingItem(row)}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 transition flex items-center gap-1"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Report Issue</span>
            </button>
          ) : (
            <span className="text-xs text-amber-500 font-medium">Under Service</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 rounded-3xl">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Equipment Inventory & Maintenance
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track asset health, availability, and service logs across campus facilities
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-3 py-1.5 rounded-xl transition ${
                activeTab === 'inventory'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Inventory
            </button>
            <button
              onClick={() => setActiveTab('maintenance')}
              className={`px-3 py-1.5 rounded-xl transition ${
                activeTab === 'maintenance'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Service Logs
            </button>
          </div>

          {(isSuperAdmin || isGymManager) && (
            <button
              onClick={() => {
                if (assignedGymId) {
                  setNewEquip((prev) => ({ ...prev, gymId: assignedGymId }));
                }
                setIsAddOpen(true);
              }}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-brand-600 hover:bg-brand-500 text-white flex items-center gap-1.5 transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Equipment</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'inventory' ? (
        <DataTable
          columns={columns}
          data={equipment || []}
          isLoading={isLoading}
          emptyMessage="No equipment records found."
        />
      ) : (
        /* Maintenance Logs Table */
        <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/80 uppercase font-bold text-slate-400">
              <tr>
                <th className="px-4 py-3">Equipment</th>
                <th className="px-4 py-3">Reported By</th>
                <th className="px-4 py-3">Issue Description</th>
                <th className="px-4 py-3">Service Vendor</th>
                <th className="px-4 py-3">Reported Date</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(maintenanceLogs || []).map((log) => (
                <tr key={log._id}>
                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                    {log.equipmentId?.name} ({log.equipmentId?.code})
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {log.reportedBy?.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                    {log.issueDescription}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{log.serviceVendor}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(log.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={log.status}>{log.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Equipment Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Equipment to Inventory"
        maxWidth="max-w-lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newEquip.name || !newEquip.code || !newEquip.gymId) {
              return toast.error('Please complete name, code, and facility');
            }
            addEquipmentMutation.mutate(newEquip);
          }}
          className="space-y-3.5 text-xs"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                Equipment Name
              </label>
              <input
                type="text"
                required
                value={newEquip.name}
                onChange={(e) => setNewEquip({ ...newEquip, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                placeholder="e.g. Precor Commercial Treadmill"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                Asset Code (Unique)
              </label>
              <input
                type="text"
                required
                value={newEquip.code}
                onChange={(e) => setNewEquip({ ...newEquip, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 uppercase rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                placeholder="e.g. BG-CAR-010"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                Gym Facility
              </label>
              <select
                required
                value={newEquip.gymId}
                onChange={(e) => setNewEquip({ ...newEquip, gymId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                <option value="">Select Gym...</option>
                {gyms?.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={newEquip.category}
                onChange={(e) => setNewEquip({ ...newEquip, category: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                <option value="CARDIO">CARDIO</option>
                <option value="STRENGTH">STRENGTH</option>
                <option value="FREE_WEIGHTS">FREE WEIGHTS</option>
                <option value="ACCESSORIES">ACCESSORIES</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={newEquip.quantity}
                onChange={(e) => setNewEquip({ ...newEquip, quantity: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                Condition
              </label>
              <select
                value={newEquip.condition}
                onChange={(e) => setNewEquip({ ...newEquip, condition: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                <option value="EXCELLENT">EXCELLENT</option>
                <option value="GOOD">GOOD</option>
                <option value="FAIR">FAIR</option>
                <option value="POOR">POOR</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addEquipmentMutation.isPending}
              className="px-4 py-2 font-bold rounded-xl bg-brand-600 hover:bg-brand-500 text-white transition"
            >
              {addEquipmentMutation.isPending ? 'Adding...' : 'Add Equipment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Report Issue Modal */}
      <Modal
        isOpen={!!reportingItem}
        onClose={() => setReportingItem(null)}
        title="Report Equipment Maintenance Issue"
        maxWidth="max-w-md"
      >
        {reportingItem && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!issueDescription) return toast.error('Enter issue description');
              reportIssueMutation.mutate({
                id: reportingItem._id,
                issueDescription,
                serviceVendor,
              });
            }}
            className="space-y-3.5 text-xs"
          >
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 block mb-0.5">Asset</span>
              <p className="font-bold text-slate-900 dark:text-white">
                {reportingItem.name} ({reportingItem.code})
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                Describe Defect / Maintenance Need
              </label>
              <textarea
                rows={3}
                required
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                placeholder="e.g. Cable fraying on right weight stack, needs replacement."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                Assigned Service Team
              </label>
              <input
                type="text"
                value={serviceVendor}
                onChange={(e) => setServiceVendor(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReportingItem(null)}
                className="px-4 py-2 font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={reportIssueMutation.isPending}
                className="px-4 py-2 font-bold rounded-xl bg-amber-600 hover:bg-amber-500 text-white transition"
              >
                {reportIssueMutation.isPending ? 'Logging...' : 'Submit Issue Ticket'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default EquipmentPage;
