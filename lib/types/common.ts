// Shared type definitions for the application

export interface Category {
  id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  parentId?: string | null;
}

export interface Institution {
  id: string;
  name: string;
  logo?: string | null;
}

export interface Account {
  id: string;
  name: string;
  type: string;
  institutionId: string;
  institution?: Institution;
}
