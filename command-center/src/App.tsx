import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { CalendarPanel } from './components/CalendarPanel';
import { MailPanel } from './components/MailPanel';
import { ProjectsPanel } from './components/ProjectsPanel';
import { NewItemMenu } from './components/NewItemMenu';
import { ProductLauncher } from './components/ProductLauncher';
import { ProductDetail } from './components/ProductDetail';
import { AIAssistantPanel } from './components/AIAssistantPanel';
import { useStore } from './lib/store';

function DashboardView() {
  return (
    <main className="flex-1 p-4 overflow-hidden">
      <div className="grid grid-cols-12 grid-rows-2 gap-4 h-full">
        <div className="col-span-4 row-span-2">
          <MailPanel />
        </div>
        <div className="col-span-8 row-span-1">
          <CalendarPanel />
        </div>
        <div className="col-span-8 row-span-1">
          <ProjectsPanel />
        </div>
      </div>
    </main>
  );
}

export default function App() {
  const { view, activeProductId } = useStore();

  return (
    <div className="flex h-screen w-screen bg-gradient-to-br from-ink-950 via-ink-900 to-ink-950 text-ink-100">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 relative">
        <TopBar />
        <NewItemMenu />

        {view === 'home' && <ProductLauncher />}
        {view === 'product' && activeProductId === 'ai-assistant' && <AIAssistantPanel />}
        {view === 'product' && activeProductId && activeProductId !== 'ai-assistant' && (
          <ProductDetail productId={activeProductId} />
        )}
        {(view === 'inbox' || view === 'today') && <DashboardView />}
        {(view === 'tag' || view === 'archive') && (
          <div className="flex-1 flex items-center justify-center text-ink-400">
            このビューは準備中です
          </div>
        )}
      </div>
    </div>
  );
}
