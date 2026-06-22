import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Layers } from 'lucide-react';
import Car from './Car';
import type { FloorView } from './FloorManager';

interface Props {
  floors: FloorView[];
  isInitialized: boolean;
  canManage: boolean;
  onDeleteSlot: (floorId: string, slotNo: number) => void;
}

export default function ParkingGrid({
  floors,
  isInitialized,
  canManage,
  onDeleteSlot,
}: Props) {
  if (!isInitialized) {
    return (
      <div className="card grid-card">
        <h2>Parking Lot — Live View</h2>
        <div className="placeholder-text">
          <div className="placeholder-icon">P</div>
          <p>Initialize the parking lot to see the live grid come alive.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card grid-card">
      <div className="grid-header">
        <h2>Parking Lot — Live View</h2>
        <div className="entry-tag">→ Entry from this side</div>
      </div>

      {floors.map((floor) => (
        <div key={floor.id} className="floor-block">
          <div className="floor-label">
            <span className="floor-name"><Layers size={13} /> {floor.name}</span>
            <span className="floor-count">{floor.occupied}/{floor.total} occupied</span>
          </div>

          <div className="parking-grid">
            {floor.slots.map((slot) => {
              const car = slot.occupied
                ? { registration_no: slot.registration_no!, color: slot.color! }
                : null;
              return (
                <div key={slot.slot_no} className={`slot ${car ? 'occupied' : 'available'}`}>
                  <div className="slot-number">
                    SLOT {slot.slot_no}
                    {canManage && !car && (
                      <button
                        className="slot-delete-btn"
                        title={`Delete ${floor.name} slot ${slot.slot_no}`}
                        onClick={() => onDeleteSlot(floor.id, slot.slot_no)}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>

                  <div className="slot-stage">
                    {/* initial={false} → cars already parked show instantly on load;
                        a freshly parked car still animates in (drive-in). */}
                    <AnimatePresence mode="wait" initial={false}>
                      {car ? (
                        <motion.div
                          key={`car-${car.registration_no}`}
                          className="car-wrap"
                          initial={{ x: -70, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ x: 110, opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 130, damping: 15 }}
                        >
                          <Car color={car.color} />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="free"
                          className="free-badge"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <span className="pulse-dot" />
                          FREE
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="slot-info">
                    {car ? (
                      <div>
                        <div className="slot-reg">{car.registration_no}</div>
                        <div className="slot-color">
                          <span className="color-dot" style={{ background: dotColor(car.color) }} />
                          {car.color}
                        </div>
                      </div>
                    ) : (
                      <div className="slot-empty-label">Available</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function dotColor(color: string): string {
  const map: Record<string, string> = {
    white: '#e8eaed', black: '#2c2c34', red: '#e74c3c', blue: '#3b82f6',
    green: '#22c55e', yellow: '#facc15', silver: '#cbd5e1', grey: '#94a3b8',
    gray: '#94a3b8', orange: '#fb923c', purple: '#a855f7', brown: '#a87b51',
    pink: '#ec4899',
  };
  return map[color.toLowerCase()] ?? '#8b95a5';
}
