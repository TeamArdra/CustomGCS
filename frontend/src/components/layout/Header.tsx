import { useConnectionStore } from '../../store';
import { useState, useEffect } from 'react';

export default function Header() {
	const { isConnected, mockMode, setMockMode, setConnected } = useConnectionStore();
	const displayConnected = mockMode ? isConnected : false;

	const [currentTime, setCurrentTime] = useState(new Date());

	useEffect(() => {
		const timer = setInterval(() => setCurrentTime(new Date()), 1000);
		return () => clearInterval(timer);
	}, []);

	const formatTime = (date: Date) => {
		return date.toISOString().split('T')[0] + ' @' + 
					 date.toTimeString().split(' ')[0];
	};

	const handleConnect = () => {
		if (mockMode) {
			setConnected(!isConnected);
		}
	};

	return (
		<header className="h-16 bg-[#2b2b2b] border-b border-[#1a1a1a] px-6 flex items-center justify-between">
			{/* Left: Logo & Version */}
			<div className="flex items-center gap-3">
				<div>
					<h1 className="text-xl font-bold text-white tracking-wide">
						CUSTOM<span className="font-normal">GCS</span>
					</h1>
					<p className="text-xs text-gray-400">App Version: 1.0.0 (main)</p>
				</div>
			</div>

			{/* Center: Status Bar */}
			<div className="flex-1 mx-8 bg-[#323232] rounded px-4 py-1.5 border border-[#3a3a3a]">
				<p className="text-xs text-gray-300">
					{formatTime(currentTime)} — App Version: <span className="font-semibold">1.0.0 (main)</span>
				</p>
			</div>

			{/* Right: Controls */}
			<div className="flex items-center gap-3">
				{/* MOCK/LIVE Toggle */}
				<div className="flex items-center gap-1 rounded bg-[#323232] border border-[#3a3a3a] p-0.5">
					<button
						onClick={() => setMockMode(true)}
						className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
							mockMode
								? 'bg-blue-500 text-white'
								: 'text-gray-400 hover:text-gray-300'
						}`}
					>
						MOCK
					</button>
					<button
						onClick={() => setMockMode(false)}
						className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
							!mockMode
								? 'bg-purple-500 text-white'
								: 'text-gray-400 hover:text-gray-300'
						}`}
					>
						LIVE
					</button>
				</div>

				{/* Device Selection */}
				<select
					className="px-3 py-2 rounded bg-[#3a3a3a] border border-[#4a4a4a] text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
					disabled={mockMode}
				>
					<option>Select your device</option>
					<option>Serial Port (COM1)</option>
					<option>Serial Port (COM3)</option>
					<option>UDP (127.0.0.1:14550)</option>
					<option>TCP (192.168.1.100:5760)</option>
				</select>

				{/* Connect Button */}
				<button
					onClick={handleConnect}
					disabled={!mockMode}
					className={`px-6 py-2 rounded text-sm font-semibold transition-colors shadow-lg disabled:opacity-40 disabled:cursor-not-allowed ${
						displayConnected
							? 'bg-rose-600 hover:bg-rose-700 text-white'
							: 'bg-green-500 hover:bg-green-600 text-gray-900'
					}`}
				>
					{displayConnected ? 'Disconnect' : 'Connect'}
				</button>
			</div>
		</header>
	);
}
