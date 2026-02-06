import * as React from 'react';
import {
  Sidebar,
  SidebarProvider,
  SidebarInset,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { MainNav } from './main-nav';
import { Trophy } from 'lucide-react';
import Link from 'next/link';

export function AppShell({ children }: { children: React.ReactNode }) {
  // We can't use `useSelectedLayoutSegment` here because it's a client hook.
  // Instead, we will use `usePathname` in the MainNav component.
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Link
            href="/"
            className="flex items-center gap-2 text-sidebar-foreground transition-colors hover:text-sidebar-primary-foreground"
          >
            <Trophy className="h-6 w-6" />
            <span className="text-lg font-semibold">LigaManager</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <MainNav />
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
          <SidebarTrigger className="md:hidden" />
          <div className="w-full flex-1">
            {/* Can add search or other header items here */}
          </div>
          {/* User dropdown can go here */}
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
