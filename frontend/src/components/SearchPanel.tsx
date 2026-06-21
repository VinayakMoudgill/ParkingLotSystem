import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import { api } from '../api/parking';

interface Props {
  isInitialized: boolean;
}

interface ColorRow {
  slot: number;
  reg: string;
}

interface ColorResult {
  color: string;
  rows: ColorRow[];
}

interface RegResult {
  reg: string;
  slot: number | null;
}

export default function SearchPanel({ isInitialized }: Props) {
  const [colorInput, setColorInput] = useState('');
  const [regInput, setRegInput] = useState('');
  const [colorResult, setColorResult] = useState<ColorResult | null>(null);
  const [regResult, setRegResult] = useState<RegResult | null>(null);

  const searchByColor = async (e: React.FormEvent) => {
    e.preventDefault();
    const color = colorInput.trim();
    if (!color) return;
    setRegResult(null);
    try {
      const [regsRes, slotsRes] = await Promise.all([
        api.getRegistrationsByColor(color),
        api.getSlotsByColor(color),
      ]);
      const regs: string[] = regsRes.data;
      const slots: number[] = slotsRes.data;
      // Both arrays are sorted by slot number, so index i pairs them
      const rows: ColorRow[] = slots.map((slot, i) => ({ slot, reg: regs[i] ?? '—' }));
      setColorResult({ color, rows });
    } catch {
      setColorResult({ color, rows: [] });
    }
  };

  const searchByReg = async (e: React.FormEvent) => {
    e.preventDefault();
    const reg = regInput.trim();
    if (!reg) return;
    setColorResult(null);
    try {
      const res = await api.getSlotByRegistration(reg);
      setRegResult({ reg, slot: res.data.slot_number });
    } catch {
      setRegResult({ reg, slot: null });
    }
  };

  return (
    <div className="card">
      <h2><Search size={15} /> Search</h2>

      <form onSubmit={searchByColor} style={{ marginBottom: '1rem' }}>
        <label>Search by Color</label>
        <div className="input-row">
          <input
            type="text"
            placeholder="e.g. white"
            value={colorInput}
            onChange={(e) => setColorInput(e.target.value)}
            disabled={!isInitialized}
          />
          <button type="submit" disabled={!isInitialized}>Go</button>
        </div>
      </form>

      <form onSubmit={searchByReg}>
        <label>Search by Registration</label>
        <div className="input-row">
          <input
            type="text"
            placeholder="e.g. KA-01-AB-2211"
            value={regInput}
            onChange={(e) => setRegInput(e.target.value.toUpperCase())}
            disabled={!isInitialized}
          />
          <button type="submit" disabled={!isInitialized}>Go</button>
        </div>
      </form>

      <AnimatePresence mode="wait">
        {/* ── Color search results as a table ── */}
        {colorResult && (
          <motion.div
            key="color-res"
            className="result-block"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <div className="result-title">
              {colorResult.rows.length} car{colorResult.rows.length === 1 ? '' : 's'} found in{' '}
              <span className="result-highlight">{colorResult.color}</span>
            </div>
            {colorResult.rows.length > 0 ? (
              <table className="result-table">
                <thead>
                  <tr>
                    <th>Slot No.</th>
                    <th>Registration No.</th>
                  </tr>
                </thead>
                <tbody>
                  {colorResult.rows.map((row) => (
                    <tr key={row.slot}>
                      <td className="cell-slot">#{row.slot}</td>
                      <td>{row.reg}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="result-empty">No cars of this color are parked.</div>
            )}
          </motion.div>
        )}

        {/* ── Registration search result as a table ── */}
        {regResult && (
          <motion.div
            key="reg-res"
            className="result-block"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            {regResult.slot !== null ? (
              <table className="result-table">
                <thead>
                  <tr>
                    <th>Registration No.</th>
                    <th>Slot No.</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{regResult.reg}</td>
                    <td className="cell-slot">#{regResult.slot}</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <div className="result-empty">
                Car <strong>{regResult.reg}</strong> is not in the parking lot.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
