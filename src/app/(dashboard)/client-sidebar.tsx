'use client';

import { Sidebar } from '@/components/layout/sidebar';

interface ClientSidebarProps {
  isGuestMode?: boolean;
}

export function ClientSidebar({ isGuestMode = false }: ClientSidebarProps) {
  return <Sidebar isGuestMode={isGuestMode} />;
}

