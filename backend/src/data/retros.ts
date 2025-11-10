import { Retro } from '../models/Retro';

// In-memory storage for retrospectives
export const retros: Retro[] = [];

// In-memory storage for participants
export interface Participant {
  id: string;
  retroId: string;
  name: string; // Random generated name
  joinedAt: Date;
}

export const participants: Participant[] = [];

// Helper function to get all retros
export const getAllRetros = (): Retro[] => {
  return retros.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

// Helper function to get a retro by ID
export const getRetroById = (id: string): Retro | undefined => {
  return retros.find(retro => retro.id === id);
};

// Helper function to create a retro
export const createRetro = (retro: Omit<Retro, 'id' | 'createdAt' | 'updatedAt'>): Retro => {
  const now = new Date();
  const newRetro: Retro = {
    ...retro,
    id: `retro-${Date.now()}`,
    createdAt: now,
    updatedAt: now
  };
  retros.push(newRetro);
  return newRetro;
};

// Helper function to update a retro
export const updateRetro = (id: string, updates: Partial<Omit<Retro, 'id' | 'createdAt' | 'updatedAt'>>): Retro | null => {
  const index = retros.findIndex(retro => retro.id === id);
  if (index === -1) return null;
  
  retros[index] = {
    ...retros[index],
    ...updates,
    updatedAt: new Date()
  };
  
  return retros[index];
};

// Helper function to delete a retro
export const deleteRetro = (id: string): boolean => {
  const index = retros.findIndex(retro => retro.id === id);
  if (index === -1) return false;
  
  retros.splice(index, 1);
  // Also remove participants
  const participantIndices = participants
    .map((p, i) => (p.retroId === id ? i : -1))
    .filter(i => i !== -1)
    .reverse();
  
  participantIndices.forEach(i => participants.splice(i, 1));
  
  return true;
};

// Helper function to add a participant
export const addParticipant = (participant: Omit<Participant, 'id' | 'joinedAt'>): Participant => {
  const newParticipant: Participant = {
    ...participant,
    id: `participant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    joinedAt: new Date()
  };
  participants.push(newParticipant);
  return newParticipant;
};

// Helper function to get participants for a retro
export const getParticipantsByRetroId = (retroId: string): Participant[] => {
  return participants.filter(p => p.retroId === retroId);
};

// Helper function to remove a participant
export const removeParticipant = (id: string): boolean => {
  const index = participants.findIndex(p => p.id === id);
  if (index === -1) return false;
  
  participants.splice(index, 1);
  return true;
};
