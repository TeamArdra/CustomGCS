import { Link, useLocation } from 'react-router-dom';
import { Home, Map, ListChecks, Settings as SettingsIcon, FileText, Activity, Sliders } from 'lucide-react';

const navigation = [
  { name: 'Dashboard', path: '/', icon: Home },
  { name: 'Mission', path: '/mission', icon: Map },
  { name: 'Pre-flight', path: '/preflight', icon: ListChecks },
  { name: 'Calibration', path: '/calibration', icon: Activity },
  { name: 'Parameters', path: '/parameters', icon: Sliders },
  { name: 'Logs', path: '/logs', icon: FileText },
  { name: 'Settings', path: '/settings', icon: SettingsIcon },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col bg-gray-900">
      {/* Logo */}
      <div className="p-7 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-white">CustomGCS</h1>
        <p className="text-sm text-gray-400">Ground Control Station</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-5 space-y-2.5">
        {navigation.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-5 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <p className="text-xs text-gray-500">Version 0.0.1</p>
      </div>
    </aside>
  );
}
