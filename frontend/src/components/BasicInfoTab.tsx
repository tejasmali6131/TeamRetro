import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { CreateRetroData, Template } from '@/types/retro';

interface BasicInfoTabProps {
  register: UseFormRegister<CreateRetroData>;
  errors: FieldErrors<CreateRetroData>;
  templates: Template[];
}

export default function BasicInfoTab({ register, errors, templates }: BasicInfoTabProps) {
  return (
    <div className="space-y-6">
      {/* Session Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Session Name *
        </label>
        <input
          type="text"
          {...register('sessionName', { required: 'Session name is required' })}
          className="input-field ml-1"
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
          className="input-field ml-1"
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
          className="input-field ml-1"
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
    </div>
  );
}
