import { Wifi, Bell, Palette, Shield } from 'lucide-react';

export default function SettingsPage() {
  const sections = [
    { name: 'Connection', icon: Wifi, description: 'MAVLink, WebSocket, Serial settings' },
    { name: 'Notifications', icon: Bell, description: 'Alert preferences and sounds' },
    { name: 'Appearance', icon: Palette, description: 'Theme, colors, and layout' },
    { name: 'Security', icon: Shield, description: 'Authentication and encryption' },
  ];

  return (
    <div className="h-full w-full bg-gradient-to-br from-slate-900/20 to-slate-950/20 p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800/50 pb-6">
        <h1 className="text-5xl font-bold text-slate-50 mb-2">Settings</h1>
        <p className="text-base text-slate-400 font-light">Application configuration and preferences</p>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section, index) => (
          <div key={index} className="rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900/80 to-slate-950/60 p-6 shadow-xl shadow-black/30 hover:border-slate-600/60 transition-colors cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-indigo-500/20 p-3 ring-1 ring-indigo-500/30">
                <section.icon className="h-6 w-6 text-indigo-300" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-200 mb-1">{section.name}</h3>
                <p className="text-sm text-slate-400">{section.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* App Info */}
      <div className="rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900/80 to-slate-950/60 p-6 shadow-xl shadow-black/30">
        <h3 className="text-lg font-semibold text-slate-200 mb-4">About</h3>
        <div className="space-y-2 text-sm text-slate-400">
          <p><span className="text-slate-500">Version:</span> 1.0.0</p>
          <p><span className="text-slate-500">Build:</span> 2026.03.04</p>
          <p><span className="text-slate-500">License:</span> MIT</p>
        </div>
      </div>
    </div>
  );
}
