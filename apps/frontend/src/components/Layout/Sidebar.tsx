import { Heading, Text } from '@radix-ui/themes';

export function Sidebar() {
  return (
    <div
      style={{
        width: '280px',
        backgroundColor: 'var(--gray-3)',
        borderRight: '1px solid var(--gray-6)',
        padding: 'var(--space-4)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <Heading as="h1" size="6" weight="bold">
          MetaSekai
        </Heading>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <Text as="span" size="2" color="gray" style={{ cursor: 'pointer' }}>
            Dashboard
          </Text>
          <Text as="span" size="2" color="gray" style={{ cursor: 'pointer' }}>
            Agents
          </Text>
          <Text as="span" size="2" color="gray" style={{ cursor: 'pointer' }}>
            Settings
          </Text>
        </nav>
      </div>
    </div>
  );
} 