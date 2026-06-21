import { motion, AnimatePresence } from 'framer-motion';
import Car from './Car';

interface OccupiedSlot {
  slot_no: number;
  registration_no: string;
  color: string;
}

interface Props {
  totalSlots: number;
  occupiedSlots: OccupiedSlot[];
  isInitialized: boolean;
}

export default function ParkingGrid({ totalSlots, occupiedSlots, isInitialized }: Props) {
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

  const occupiedMap = new Map(occupiedSlots.map((s) => [s.slot_no, s]));
  const slots = Array.from({ length: totalSlots }, (_, i) => i + 1);

  return (
    <div className="card grid-card">
      <div className="grid-header">
        <h2>Parking Lot — Live View</h2>
        <div className="entry-tag">→ Entry from this side</div>
      </div>

      <div className="parking-grid">
        {slots.map((slot) => {
          const car = occupiedMap.get(slot);
          return (
            <div key={slot} className={`slot ${car ? 'occupied' : 'available'}`}>
              <div className="slot-number">SLOT {slot}</div>

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
