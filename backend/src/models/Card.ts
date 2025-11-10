export interface Card {
  id: string;
  retroId: string;
  columnId: string;
  content: string;
  authorId: string;
  isAnonymous: boolean;
  votes: number;
  groupId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCardDTO {
  retroId: string;
  columnId: string;
  content: string;
  isAnonymous: boolean;
}

export interface CardVote {
  id: string;
  cardId: string;
  userId: string;
  createdAt: Date;
}

export interface CardComment {
  id: string;
  cardId: string;
  userId: string;
  content: string;
  createdAt: Date;
}

export interface CardGroup {
  id: string;
  retroId: string;
  name: string;
  cards: Card[];
  createdAt: Date;
}
