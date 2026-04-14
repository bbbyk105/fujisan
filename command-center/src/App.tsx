import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { CalendarPanel } from './components/CalendarPanel';
import { MailPanel } from './components/MailPanel';
import { ProjectsPanel } from './components/ProjectsPanel';
import { NewItemMenu } from './components/NewItemMenu';

export default function App() {
  return (
    <div className="flex h-screen w-screen bg-gradient-to-br from-ink-950 via-ink-900 to-ink-950 text-ink-100">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 relative">
        <TopBar />
        <NewItemMenu />

        <main className="flex-1 p-4 overflow-hidden">
          <div className="grid grid-cols-12 grid-rows-2 gap-4 h-full">
            {/* メールパネル: 左・縦長 */}
            <div className="col-span-4 row-span-2">
              <MailPanel />
            </div>

            {/* カレンダーパネル: 中央上 */}
            <div className="col-span-8 row-span-1">
              <CalendarPanel />
            </div>

            {/* プロジェクトパネル: 中央下 */}
            <div className="col-span-8 row-span-1">
              <ProjectsPanel />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
