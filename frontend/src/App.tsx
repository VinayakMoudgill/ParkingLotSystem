import { Routes, Route } from 'react-router-dom';
import './App.css';
import ParkingPage from './pages/ParkingPage';
import AdminPage from './pages/AdminPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<ParkingPage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  );
}

export default App;
