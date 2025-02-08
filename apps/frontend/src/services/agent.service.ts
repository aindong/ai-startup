export interface Agent {
  id: string;
  name: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BUSY';
  createdAt: string;
  updatedAt: string;
} 