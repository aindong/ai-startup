import { Sidebar } from './Sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div style={{ 
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: 'var(--gray-1)'
    }}>
      <Sidebar />
      <div style={{ 
        flex: 1,
        padding: 'var(--space-4)'
      }}>
        {children}
      </div>
    </div>
  );
} 