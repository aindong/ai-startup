import { Heading, Text } from '@radix-ui/themes';
import { DashboardIcon, PersonIcon, GearIcon } from '@radix-ui/react-icons';
import { useState } from 'react';
import styles from './Sidebar.module.css';

const containerStyles = {
  sidebar: {
    width: '280px',
    backgroundColor: 'var(--gray-2)',
    borderRight: '1px solid var(--gray-5)',
    padding: 'var(--space-4)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-6)',
  },
  logo: {
    padding: 'var(--space-2)',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-1)',
  },
};

export function Sidebar() {
  const [activeItem, setActiveItem] = useState('dashboard');

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
    { id: 'agents', label: 'Agents', icon: PersonIcon },
    { id: 'settings', label: 'Settings', icon: GearIcon },
  ];

  return (
    <aside style={containerStyles.sidebar}>
      <div style={containerStyles.logo}>
        <Heading as="h1" size="6" weight="bold">
          MetaSekai
        </Heading>
      </div>
      
      <nav style={containerStyles.nav}>
        {navItems.map(({ id, label, icon: Icon }) => (
          <div
            key={id}
            className={`${styles.navItem} ${activeItem === id ? styles.navItemActive : ''}`}
            onClick={() => setActiveItem(id)}
          >
            <Icon className={styles.navIcon} />
            <Text size="2" weight={activeItem === id ? "medium" : "regular"}>
              {label}
            </Text>
          </div>
        ))}
      </nav>
    </aside>
  );
} 