import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Retro, CreateRetroData } from '@/types/retro';
import { Template } from '@/types/retro';
import api from '@/services/api';

interface CreateRetroFormProps {
  onSuccess: (retro: Retro) => void;
  onCancel: () => void;
}

export default function CreateRetroForm({ onSuccess, onCancel }: CreateRetroFormProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<CreateRetroData>({
    defaultValues: {
      isAnonymous: false,
      votingLimit: 5,
      timerDuration: 15,
    },
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/templates');
      setTemplates(response.data);
    } catch (error) {
      toast.error('Failed to load templates');
    }
  };

  const onSubmit = async (data: CreateRetroData) => {
    try {
      const response = await api.post('/retros', data);
      toast.success('Retrospective created successfully!');
      onSuccess(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create retrospective');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Session Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Session Name *
        </label>
        <input
          type="text"
          {...register('sessionName', { required: 'Session name is required' })}
          className="input-field"
          placeholder="e.g., Sprint 42 Retrospective"
        />
        {errors.sessionName && (
          <p className="text-red-500 text-sm mt-1">{errors.sessionName.message}</p>
        )}
      </div>

      {/* Context */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Context
        </label>
        <textarea
          {...register('context')}
          className="input-field"
          rows={3}
          placeholder="Add any context or goals for this retrospective..."
        />
      </div>

      {/* Template Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Template *
        </label>
        <select
          {...register('templateId', { required: 'Template is required' })}
          className="input-field"
        >
          <option value="">Select a template</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
        {errors.templateId && (
          <p className="text-red-500 text-sm mt-1">{errors.templateId.message}</p>
        )}
      </div>

      {/* Anonymity */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          {...register('isAnonymous')}
          id="isAnonymous"
          className="w-4 h-4 text-kone-blue rounded focus:ring-kone-blue"
        />
        <label htmlFor="isAnonymous" className="text-sm font-medium text-gray-700">
          Enable anonymous feedback
        </label>
      </div>

      {/* Settings Toggle */}
      <button
        type="button"
        onClick={() => setShowSettings(!showSettings)}
        className="text-kone-blue text-sm font-medium hover:underline"
      >
        {showSettings ? '− Hide' : '+ Show'} Advanced Settings
      </button>

      {/* Advanced Settings */}
      {showSettings && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Voting Limit
            </label>
            <input
              type="number"
              {...register('votingLimit', { min: 1, max: 20 })}
              className="input-field"
              min="1"
              max="20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timer Duration (minutes)
            </label>
            <input
              type="number"
              {...register('timerDuration', { min: 5, max: 120 })}
              className="input-field"
              min="5"
              max="120"
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary flex-1"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary flex-1"
        >
          Create Retrospective
        </button>
      </div>
    </form>
  );
}
