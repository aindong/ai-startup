import { useQuery } from '@tanstack/react-query';

const API_URL = 'http://localhost:3001';

interface Agent {
  id: string;
  name: string;
  role: string;
  state: string;
}

async function fetchAgents(): Promise<Agent[]> {
  const response = await fetch(`${API_URL}/agents`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch agents');
  }

  return response.json();
}

export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: fetchAgents,
  });
} 