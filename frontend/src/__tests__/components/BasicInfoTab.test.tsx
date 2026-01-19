import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import BasicInfoTab from '@/components/BasicInfoTab';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { CreateRetroData, Template } from '@/types/retro';

describe('BasicInfoTab', () => {
  const mockRegister = vi.fn().mockImplementation((name: string) => ({
    name,
    onChange: vi.fn(),
    onBlur: vi.fn(),
    ref: vi.fn(),
  })) as unknown as UseFormRegister<CreateRetroData>;

  const mockTemplates: Template[] = [
    { id: 'template-1', name: 'Mad Sad Glad', description: 'Classic retro format', isDefault: true, columns: [] },
    { id: 'template-2', name: 'Start Stop Continue', description: 'Action-oriented', isDefault: false, columns: [] },
  ];

  const defaultProps = {
    register: mockRegister,
    errors: {} as FieldErrors<CreateRetroData>,
    templates: mockTemplates,
  };

  describe('Rendering', () => {
    it('renders session name input with label', () => {
      render(<BasicInfoTab {...defaultProps} />);
      
      expect(screen.getByText(/session name/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/sprint 42 retrospective/i)).toBeInTheDocument();
    });

    it('renders context textarea with label', () => {
      render(<BasicInfoTab {...defaultProps} />);
      
      expect(screen.getByText(/context/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/add any context or goals/i)).toBeInTheDocument();
    });

    it('renders template select with label', () => {
      render(<BasicInfoTab {...defaultProps} />);
      
      expect(screen.getByText(/template \*/i)).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('renders all template options', () => {
      render(<BasicInfoTab {...defaultProps} />);
      
      expect(screen.getByText('Select a template')).toBeInTheDocument();
      expect(screen.getByText('Mad Sad Glad')).toBeInTheDocument();
      expect(screen.getByText('Start Stop Continue')).toBeInTheDocument();
    });

    it('renders empty template list when no templates provided', () => {
      render(<BasicInfoTab {...defaultProps} templates={[]} />);
      
      const select = screen.getByRole('combobox');
      expect(select.children).toHaveLength(1); // Only "Select a template" option
    });
  });

  describe('Form Registration', () => {
    it('registers sessionName field with validation', () => {
      render(<BasicInfoTab {...defaultProps} />);
      
      expect(mockRegister).toHaveBeenCalledWith('sessionName', { required: 'Session name is required' });
    });

    it('registers context field', () => {
      render(<BasicInfoTab {...defaultProps} />);
      
      expect(mockRegister).toHaveBeenCalledWith('context');
    });

    it('registers templateId field with validation', () => {
      render(<BasicInfoTab {...defaultProps} />);
      
      expect(mockRegister).toHaveBeenCalledWith('templateId', { required: 'Template is required' });
    });
  });

  describe('Error Display', () => {
    it('displays session name error message', () => {
      const errors: FieldErrors<CreateRetroData> = {
        sessionName: { type: 'required', message: 'Session name is required' },
      };
      
      render(<BasicInfoTab {...defaultProps} errors={errors} />);
      
      expect(screen.getByText('Session name is required')).toBeInTheDocument();
    });

    it('displays template error message', () => {
      const errors: FieldErrors<CreateRetroData> = {
        templateId: { type: 'required', message: 'Template is required' },
      };
      
      render(<BasicInfoTab {...defaultProps} errors={errors} />);
      
      expect(screen.getByText('Template is required')).toBeInTheDocument();
    });

    it('does not display errors when none exist', () => {
      render(<BasicInfoTab {...defaultProps} />);
      
      expect(screen.queryByText('Session name is required')).not.toBeInTheDocument();
      expect(screen.queryByText('Template is required')).not.toBeInTheDocument();
    });
  });
});
