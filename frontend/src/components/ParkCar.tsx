import { useState } from 'react';
import { CarFront } from 'lucide-react';
import { COLOR_OPTIONS } from '../constants/colors';

interface Props {
  isInitialized: boolean;
  onPark: (regNo: string, color: string) => void;
}

export default function ParkCar({ isInitialized, onPark }: Props) {
  const [regNo, setRegNo] = useState('');
  const [color, setColor] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNo.trim() || !color.trim()) return;
    onPark(regNo.trim(), color.trim());
    setRegNo('');
    setColor('');
  };

  return (
    <div className="card">
      <h2><CarFront size={15} /> Park a Car</h2>
      <form onSubmit={handleSubmit}>
        <label>Registration Number</label>
        <input
          type="text"
          placeholder="e.g. KA-01-AB-2211"
          value={regNo}
          onChange={(e) => setRegNo(e.target.value.toUpperCase())}
          disabled={!isInitialized}
        />
        <label>Car Color</label>
        <select
          value={color}
          onChange={(e) => setColor(e.target.value)}
          disabled={!isInitialized}
        >
          <option value="" disabled>
            Select a color
          </option>
          {COLOR_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button type="submit" disabled={!isInitialized}>
          Park Car
        </button>
      </form>
    </div>
  );
}
