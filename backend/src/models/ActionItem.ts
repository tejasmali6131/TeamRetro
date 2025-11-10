export interface ActionItem {
  id: string;
  retroId: string;
  title: string;
  description: string;
  assignedTo: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  dueDate: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateActionItemDTO {
  retroId: string;
  title: string;
  description: string;
  assignedTo: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate: Date;
}

export interface UpdateActionItemDTO {
  title?: string;
  description?: string;
  assignedTo?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high';
  dueDate?: Date;
}
