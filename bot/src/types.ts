export type LeadStatus =
  | 'new'
  | 'in_progress'
  | 'interaction_scheduled'
  | 'spam'
  | 'converted';

export interface Lead {
  id: string;
  name: string;
  contact: string;
  source?: string | null;
  page?: string | null;
  utm?: Record<string, string> | null;
  status: LeadStatus;
  interactionAt?: Date | null;
  createdAt: Date;
}

export interface LeadNote {
  id: string;
  leadId: string;
  text: string;
  author: string;
  createdAt: Date;
}

export interface Reminder {
  id: string;
  leadId: string;
  chatId: string;
  messageId: number;
  fireAt: Date;
  sent: boolean;
}

export interface Client {
  id: string;
  leadId: string;
  tags: string[];
  notes: string;
  nextContactAt?: Date | null;
  createdAt: Date;
}

export interface SubscribeRequest {
  telegramUsername?: string;
  email?: string;
}
