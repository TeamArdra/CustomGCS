import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import DashboardPage from './pages/DashboardPage';
import MissionPage from './pages/MissionPage';
import PreflightPage from './pages/PreflightPage';
import CalibrationPage from './pages/CalibrationPage';
import ParametersPage from './pages/ParametersPage';
import LogsPage from './pages/LogsPage';
import SettingsPage from './pages/SettingsPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="mission" element={<MissionPage />} />
          <Route path="preflight" element={<PreflightPage />} />
          <Route path="calibration" element={<CalibrationPage />} />
          <Route path="parameters" element={<ParametersPage />} />
          <Route path="logs" element={<LogsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
