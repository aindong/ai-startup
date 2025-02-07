import { Box, Container, Heading, Text } from '@radix-ui/themes';
import { AppLayout } from './components/Layout';

function App() {
  return (
    <AppLayout>
      <Container size="2">
        <Box style={{ 
          padding: '24px',
          backgroundColor: 'var(--gray-3)',
          borderRadius: 'var(--radius-3)',
          border: '1px solid var(--gray-6)'
        }}>
          <Heading size="8" mb="2">
            Welcome to MetaSekai
          </Heading>
          <Text size="4" color="gray">
            Your AI agents are ready to assist you
          </Text>
        </Box>
      </Container>
    </AppLayout>
  );
}

export default App;
