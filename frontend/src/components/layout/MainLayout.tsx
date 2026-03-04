import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function MainLayout() {
  return (
    <div className="h-screen w-full bg-slate-950 p-3 text-slate-100 md:p-4">
      <div className="flex h-full w-full overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950 shadow-2xl shadow-black/30">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-950 to-slate-900">
          <div className="p-5 pr-8 md:p-6 md:pr-10">
            <Outlet />
          </div>
        </main>
      </div>
      </div>
    </div>
  );
}
