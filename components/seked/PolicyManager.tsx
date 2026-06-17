"use client";

import { useState } from "react";
import useSWR from "swr";
import { Plus, Settings, Trash2, Edit } from "lucide-react";
import { 
  createPolicy, 
  updatePolicy, 
  deletePolicy, 
  getPolicies 
} from "../../lib/seked-api";
import type { SekedPolicy } from "../../types/seked";

interface PolicyFormData {
  name: string;
  sigma_threshold: number;
  ci_threshold: number;
  si_threshold: number;
}

const EMPTY_FORM: PolicyFormData = {
  name: "",
  sigma_threshold: 1.5,
  ci_threshold: 0.5,
  si_threshold: 0.5,
};

export default function PolicyManager() {
  const { data: policies, error, mutate } = useSWR<SekedPolicy[]>("/policies", getPolicies);
  const [isCreating, setIsCreating] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<SekedPolicy | null>(null);
  const [formData, setFormData] = useState<PolicyFormData>(EMPTY_FORM);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPolicy) {
        await updatePolicy(editingPolicy.name, formData);
        setEditingPolicy(null);
      } else {
        await createPolicy({ ...formData, action_rules: {} });
        setIsCreating(false);
      }
      setFormData(EMPTY_FORM);
      mutate();
    } catch (error) {
      console.error("Failed to save policy:", error);
    }
  };

  const handleEdit = (policy: SekedPolicy) => {
    setEditingPolicy(policy);
    setFormData({
      name: policy.name,
      sigma_threshold: policy.sigma_threshold,
      ci_threshold: policy.ci_threshold,
      si_threshold: policy.si_threshold,
    });
  };

  const handleDelete = async (policyName: string) => {
    if (confirm("Are you sure you want to delete this policy?")) {
      try {
        await deletePolicy(policyName);
        mutate();
      } catch (error) {
        console.error("Failed to delete policy:", error);
      }
    }
  };

  if (error) return <div className="text-red-500">Failed to load policies</div>;
  if (!policies) return <div>Loading policies...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Policy Management</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-black font-semibold rounded-lg hover:bg-brand-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Policy
        </button>
      </div>

      {/* Policy Form */}
      {(isCreating || editingPolicy) && (
        <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-4">
            {editingPolicy ? "Edit Policy" : "Create New Policy"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Policy Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
                disabled={!!editingPolicy}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Sigma Threshold (σ)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.sigma_threshold}
                onChange={(e) => setFormData({ ...formData, sigma_threshold: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Clarity Index Threshold (CI)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.ci_threshold}
                onChange={(e) => setFormData({ ...formData, ci_threshold: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Stability Index Threshold (SI)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.si_threshold}
                onChange={(e) => setFormData({ ...formData, si_threshold: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-brand-500 text-black font-semibold rounded-lg hover:bg-brand-600 transition-colors"
              >
                {editingPolicy ? "Update" : "Create"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingPolicy(null);
                  setFormData(EMPTY_FORM);
                }}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Policies List */}
      <div className="grid gap-4">
        {policies.map((policy) => (
          <div
            key={policy.name}
            className="bg-gray-900/40 rounded-lg p-6 border border-gray-800"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">{policy.name}</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">σ:</span>
                    <span className="ml-2 text-white">{policy.sigma_threshold}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">CI:</span>
                    <span className="ml-2 text-white">{policy.ci_threshold}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">SI:</span>
                    <span className="ml-2 text-white">{policy.si_threshold}</span>
                  </div>
                </div>
                {policy.created_at && (
                  <div className="text-xs text-gray-500">
                    Created: {new Date(policy.created_at).toLocaleString()}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(policy)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(policy.name)}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {policies.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No policies configured yet</p>
            <p className="text-sm">Create your first policy to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
