import { Sidebar } from './Sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

const styles = {
  wrapper: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: 'var(--gray-1)',
    color: 'var(--gray-12)',
  },
  main: {
    flex: 1,
    padding: 'var(--space-6)',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
    position: 'relative' as const,
  }
};

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div style={styles.wrapper}>
      <Sidebar />
      <main style={styles.main}>
        {children}
      </main>
    </div>
  );
} 