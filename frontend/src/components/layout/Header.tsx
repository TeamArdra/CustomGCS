import { useConnectionStore } from '../../store';
import { useState, useEffect, useCallback } from 'react';
import { connectionService } from '../../services/api';
import { vehicleService } from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import type { ConnectionDevice } from '../../services/api/connection';

const FLIGHT_MODES = ['STABILIZE', 'ACRO', 'GUIDED', 'AUTO', 'LOITER', 'LAND', 'RTL'];

const FALLBACK_DEVICES: ConnectionDevice[] = [
	{ id: 'tcp:127.0.0.1:5760', label: 'TCP (127.0.0.1:5760)', kind: 'network' as const },
	{ id: 'udp:127.0.0.1:14555', label: 'UDP (127.0.0.1:14555)', kind: 'network' as const },
	{ id: 'udp:127.0.0.1:14550', label: 'UDP (127.0.0.1:14550)', kind: 'network' as const },
	{ id: 'tcp:192.168.1.100:5760', label: 'TCP (192.168.1.100:5760)', kind: 'network' as const },
];

export default function Header() {
	const { isConnected, mockMode, setMockMode, setConnected } = useConnectionStore();
	const { connect: connectWs, disconnect: disconnectWs } = useWebSocket();
	const displayConnected = isConnected;

	const [currentTime, setCurrentTime] = useState(new Date());
	const [selectedDevice, setSelectedDevice] = useState('tcp:127.0.0.1:5760');
	const [availableDevices, setAvailableDevices] = useState<ConnectionDevice[]>(FALLBACK_DEVICES);
	const [isScanning, setIsScanning] = useState(false);
	const [isConnecting, setIsConnecting] = useState(false);
	const [backendReachable, setBackendReachable] = useState(true);
	const [flightMode, setFlightMode] = useState('GUIDED');
	const [isArmed, setIsArmed] = useState(false);
	const [isSendingControl, setIsSendingControl] = useState(false);
	const [quickAction, setQuickAction] = useState<string | null>(null);
	const [lowLatency, setLowLatency] = useState(false);
	const [isApplyingLatency, setIsApplyingLatency] = useState(false);

	const loadDevices = useCallback(async () => {
		if (mockMode) {
			setAvailableDevices(FALLBACK_DEVICES);
			return;
		}

		try {
			const scannedDevices = await connectionService.listPorts();
			const nextDevices = scannedDevices.length > 0 ? scannedDevices : FALLBACK_DEVICES;
			setAvailableDevices(nextDevices);

			setSelectedDevice((previous) => {
				if (nextDevices.some((device) => device.id === previous)) {
					return previous;
				}
				return nextDevices[0].id;
			});
		} catch {
			setAvailableDevices(FALLBACK_DEVICES);
		}
	}, [mockMode]);

	useEffect(() => {
		const timer = setInterval(() => setCurrentTime(new Date()), 1000);
		return () => clearInterval(timer);
	}, []);

	useEffect(() => {
		let isCancelled = false;

		const syncBackendHealth = async () => {
			if (mockMode) {
				setBackendReachable(true);
				return true;
			}

			try {
				const healthy = await connectionService.health();
				if (!isCancelled) {
					setBackendReachable(healthy);
				}
				return healthy;
			} catch {
				if (!isCancelled) {
					setBackendReachable(false);
				}
				return false;
			}
		};

		const syncConnectionStatus = async () => {
			if (mockMode) {
				return;
			}

			try {
				const healthy = await syncBackendHealth();

				if (!healthy) {
					setConnected(false);
					disconnectWs();
					return;
				}

				const status = await connectionService.status();

				if (isCancelled) {
					return;
				}

				setConnected(status.connected);

				if (status.connected) {
					await connectWs();
				} else {
					disconnectWs();
				}
			} catch {
				if (!isCancelled) {
					setConnected(false);
					disconnectWs();
				}
			}
		};

		const syncTelemetryProfile = async () => {
			if (mockMode) {
				setLowLatency(false);
				return;
			}

			try {
				const profile = await connectionService.getTelemetryProfile();
				if (!isCancelled) {
					setLowLatency(Boolean(profile.low_latency));
				}
			} catch {
				if (!isCancelled) {
					setLowLatency(false);
				}
			}
		};

		void syncBackendHealth();
		void loadDevices();
		void syncConnectionStatus();
		void syncTelemetryProfile();
		const timer = setInterval(() => {
			void syncBackendHealth();
			void loadDevices();
			void syncConnectionStatus();
			void syncTelemetryProfile();
		}, 5000);

		return () => {
			isCancelled = true;
			clearInterval(timer);
		};
	}, [mockMode, setConnected, connectWs, disconnectWs, loadDevices]);

	const handleRescanDevices = async () => {
		if (mockMode || isScanning) {
			return;
		}

		setIsScanning(true);
		try {
			await loadDevices();
		} finally {
			setIsScanning(false);
		}
	};

	const formatTime = (date: Date) => {
		return date.toISOString().split('T')[0] + ' @' + 
					 date.toTimeString().split(' ')[0];
	};

	const handleModeSwitch = async (targetMockMode: boolean) => {
		if (targetMockMode === mockMode) {
			return;
		}

		if (targetMockMode && !mockMode && isConnected) {
			disconnectWs();
			try {
				await connectionService.disconnect();
			} catch {
				// no-op, local state still resets
			}
			setConnected(false);
		}

		setMockMode(targetMockMode);
		if (targetMockMode) {
			setIsArmed(false);
		}
	};

	const handleConnect = async () => {
		if (mockMode) {
			setConnected(!isConnected);
			return;
		}

		if (isConnecting) {
			return;
		}

		if (displayConnected) {
			disconnectWs();
			try {
				await connectionService.disconnect();
			} catch {
				// no-op, local UI still updates
			}
			setConnected(false);
			setIsArmed(false);
			return;
		}

		setIsConnecting(true);
		try {
			const healthy = await connectionService.health();
			setBackendReachable(healthy);

			if (!healthy) {
				setConnected(false);
				return;
			}

			await connectionService.connect(selectedDevice);
			const telemetryProfile = await connectionService.getTelemetryProfile();
			setLowLatency(Boolean(telemetryProfile.low_latency));
			await connectWs();
			const info = await vehicleService.getVehicleInfo();
			setIsArmed(Boolean(info?.armed));
			if (info?.mode) {
				setFlightMode(String(info.mode));
			}
			setConnected(true);
		} catch {
			setBackendReachable(false);
			setConnected(false);
		} finally {
			setIsConnecting(false);
		}
	};

	const handleLowLatencyToggle = async () => {
		if (mockMode || !backendReachable || isApplyingLatency) {
			return;
		}

		setIsApplyingLatency(true);
		try {
			const nextValue = !lowLatency;
			const profile = await connectionService.setTelemetryProfile(nextValue);
			setLowLatency(Boolean(profile.low_latency));
		} finally {
			setIsApplyingLatency(false);
		}
	};

	const handleFlightModeChange = async (mode: string) => {
		setFlightMode(mode);

		if (mockMode || !displayConnected) {
			return;
		}

		setIsSendingControl(true);
		try {
			await vehicleService.setMode(mode);
		} finally {
			setIsSendingControl(false);
		}
	};

	const handleArmToggle = async () => {
		if (mockMode) {
			setIsArmed((prev) => !prev);
			return;
		}

		if (!displayConnected || isSendingControl) {
			return;
		}

		setIsSendingControl(true);
		try {
			if (isArmed) {
				await vehicleService.disarm();
				setIsArmed(false);
			} else {
				await vehicleService.arm();
				setIsArmed(true);
			}
		} finally {
			setIsSendingControl(false);
		}
	};

	const handleQuickAction = async (action: 'rtl' | 'land' | 'loiter') => {
		if (mockMode || !displayConnected || isSendingControl || quickAction) {
			return;
		}

		setQuickAction(action.toUpperCase());
		try {
			if (action === 'rtl') {
				await vehicleService.rtl();
				setFlightMode('RTL');
			} else if (action === 'land') {
				await vehicleService.land();
				setFlightMode('LAND');
			} else {
				await vehicleService.loiter();
				setFlightMode('LOITER');
			}
		} finally {
			setQuickAction(null);
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
				{/* Backend Status */}
				<div className="flex items-center gap-2 rounded bg-[#323232] border border-[#3a3a3a] px-2.5 py-1.5">
					<span
						className={`h-2 w-2 rounded-full ${
							mockMode
								? 'bg-blue-400'
								: backendReachable
								? 'bg-emerald-400'
								: 'bg-rose-400'
						}`}
					/>
					<span className="text-xs text-gray-300">
						{mockMode ? 'Mock Mode' : backendReachable ? 'Backend Online' : 'Backend Offline'}
					</span>
				</div>

				<button
					onClick={() => void handleLowLatencyToggle()}
					disabled={mockMode || !backendReachable || isApplyingLatency}
					className={`px-3 py-2 rounded border text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
						lowLatency
							? 'bg-cyan-600 border-cyan-500 text-white hover:bg-cyan-500'
							: 'bg-[#3a3a3a] border-[#4a4a4a] text-white hover:bg-[#454545]'
					}`}
				>
					{isApplyingLatency ? 'Applying...' : lowLatency ? 'Low Latency: ON' : 'Low Latency: OFF'}
				</button>

				{/* MOCK/LIVE Toggle */}
				<div className="flex items-center gap-1 rounded bg-[#323232] border border-[#3a3a3a] p-0.5">
					<button
						onClick={() => void handleModeSwitch(true)}
						className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
							mockMode
								? 'bg-blue-500 text-white'
								: 'text-gray-400 hover:text-gray-300'
						}`}
					>
						MOCK
					</button>
					<button
						onClick={() => void handleModeSwitch(false)}
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
					value={selectedDevice}
					onChange={(event) => setSelectedDevice(event.target.value)}
				>
					{availableDevices.map((device) => (
						<option key={device.id} value={device.id}>
							{device.label}
						</option>
					))}
				</select>

				<button
					onClick={() => void handleRescanDevices()}
					disabled={mockMode || isScanning}
					className="px-3 py-2 rounded bg-[#3a3a3a] border border-[#4a4a4a] text-white text-xs font-semibold transition-colors hover:bg-[#454545] disabled:opacity-40 disabled:cursor-not-allowed"
				>
					{isScanning ? 'Scanning...' : 'Rescan'}
				</button>

				{/* Flight Mode */}
				<select
					className="px-3 py-2 rounded bg-[#3a3a3a] border border-[#4a4a4a] text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
					disabled={!mockMode && !displayConnected}
					value={flightMode}
					onChange={(event) => void handleFlightModeChange(event.target.value)}
				>
					{FLIGHT_MODES.map((mode) => (
						<option key={mode} value={mode}>
							{mode}
						</option>
					))}
				</select>

				<button
					onClick={() => void handleQuickAction('rtl')}
					disabled={Boolean(quickAction) || (!mockMode && !displayConnected)}
					className="px-3 py-2 rounded bg-[#3a3a3a] border border-[#4a4a4a] text-white text-xs font-semibold transition-colors hover:bg-[#454545] disabled:opacity-40 disabled:cursor-not-allowed"
				>
					{quickAction === 'RTL' ? 'RTL...' : 'RTL'}
				</button>
				<button
					onClick={() => void handleQuickAction('land')}
					disabled={Boolean(quickAction) || (!mockMode && !displayConnected)}
					className="px-3 py-2 rounded bg-[#3a3a3a] border border-[#4a4a4a] text-white text-xs font-semibold transition-colors hover:bg-[#454545] disabled:opacity-40 disabled:cursor-not-allowed"
				>
					{quickAction === 'LAND' ? 'LAND...' : 'LAND'}
				</button>
				<button
					onClick={() => void handleQuickAction('loiter')}
					disabled={Boolean(quickAction) || (!mockMode && !displayConnected)}
					className="px-3 py-2 rounded bg-[#3a3a3a] border border-[#4a4a4a] text-white text-xs font-semibold transition-colors hover:bg-[#454545] disabled:opacity-40 disabled:cursor-not-allowed"
				>
					{quickAction === 'LOITER' ? 'LOITER...' : 'LOITER'}
				</button>

				{/* Arm/Disarm */}
				<button
					onClick={() => void handleArmToggle()}
					disabled={isSendingControl || (!mockMode && !displayConnected)}
					className={`px-4 py-2 rounded text-sm font-semibold transition-colors shadow-lg disabled:opacity-40 disabled:cursor-not-allowed ${
						isArmed
							? 'bg-rose-600 hover:bg-rose-700 text-white'
							: 'bg-amber-500 hover:bg-amber-600 text-gray-900'
					}`}
				>
					{isSendingControl ? 'Sending...' : isArmed ? 'DISARM' : 'ARM'}
				</button>

				{/* Connect Button */}
				<button
					onClick={() => void handleConnect()}
					disabled={isConnecting || (!mockMode && (!selectedDevice || !backendReachable))}
					className={`px-6 py-2 rounded text-sm font-semibold transition-colors shadow-lg disabled:opacity-40 disabled:cursor-not-allowed ${
						displayConnected
							? 'bg-rose-600 hover:bg-rose-700 text-white'
							: 'bg-green-500 hover:bg-green-600 text-gray-900'
					}`}
				>
					{isConnecting ? 'Connecting...' : displayConnected ? 'Disconnect' : 'Connect'}
				</button>
			</div>
		</header>
	);
}
