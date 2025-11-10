export interface Card {
  id: string;
  retroId: string;
  columnId: string;
  content: string;
  authorId: string;
  author?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  isAnonymous: boolean;
  votes: number;
  groupId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCardData {
  retroId: string;
  columnId: string;
  content: string;
  isAnonymous: boolean;
}

export interface CardComment {
  id: string;
  cardId: string;
  userId: string;
  user?: {
    firstName: string;
    lastName: string;
  };
  content: string;
  createdAt: Date;
}
