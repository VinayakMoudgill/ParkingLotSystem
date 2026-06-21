import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Car as CarIcon, ShieldCheck, LogOut, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../api/parking';
import { useAuth } from '../auth/AuthContext';
import InitializeLot from '../components/InitializeLot';
import ParkCar from '../components/ParkCar';
import ClearSlot from '../components/ClearSlot';
import ParkingGrid from '../components/ParkingGrid';
import SearchPanel from '../components/SearchPanel';
import DotField from '../components/DotField';

interface OccupiedSlot {
  slot_no: number;
  registration_no: string;
  color: string;
}

interface Toast {
  id: number;
  text: string;
  type: 'success' | 'error';
}

// A celebratory confetti burst — fired when a car successfully parks
function celebrate() {
  const colors = ['#6366f1', '#06b6d4', '#3b82f6', '#22c55e', '#a5b4fc'];
  confetti({ particleCount: 70, spread: 70, origin: { y: 0.7 }, colors });
  setTimeout(() => {
    confetti({ particleCount: 40, angle: 60, spread: 55, origin: { x: 0, y: 0.8 }, colors });
    confetti({ particleCount: 40, angle: 120, spread: 55, origin: { x: 1, y: 0.8 }, colors });
  }, 120);
}

// A number that smoothly counts up/down when its value changes
function AnimatedNumber({ value }: { value: number }) {
  const spring = useSpring(value, { stiffness: 120, damping: 18 });
  const rounded = useTransform(spring, (v) => Math.round(v).toString());
  useEffect(() => {
    spring.set(value);
  }, [spring, value]);
  return <motion.span>{rounded}</motion.span>;
}

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

export default function ParkingPage() {
  const { isLoggedIn, username, logout } = useAuth();
  const [totalSlots, setTotalSlots] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [occupiedSlots, setOccupiedSlots] = useState<OccupiedSlot[]>([]);
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (text: string, type: 'success' | 'error') => {
    setToast({ id: Date.now(), text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const refreshStatus = useCallback(async () => {
    try {
      const res = await api.getStatus();
      setOccupiedSlots(res.data);
    } catch {
      // lot not yet initialized — ignore silently
    }
  }, []);

  // On first load, restore lot state from the backend (survives navigation/refresh)
  useEffect(() => {
    api
      .getLotInfo()
      .then((res) => {
        if (res.data.initialized) {
          setTotalSlots(res.data.total_slot);
          setIsInitialized(true);
          refreshStatus();
        }
      })
      .catch(() => {
        /* backend unreachable — leave uninitialized */
      });
  }, [refreshStatus]);

  useEffect(() => {
    if (!isInitialized) return;
    const interval = setInterval(refreshStatus, 5000);
    return () => clearInterval(interval);
  }, [isInitialized, refreshStatus]);

  const errMsg = (err: unknown, fallback: string) =>
    (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message
      ? String((err as any).response.data.message)
      : fallback;

  const handleInitialize = async (noOfSlot: number) => {
    try {
      const res = await api.initializeLot(noOfSlot);
      setTotalSlots(res.data.total_slot);
      setIsInitialized(true);
      showToast(`Parking lot ready with ${res.data.total_slot} slots!`, 'success');
    } catch (err) {
      showToast(errMsg(err, 'Error initializing lot'), 'error');
    }
  };

  const handleExpand = async (incrementSlot: number) => {
    try {
      const res = await api.expandLot(incrementSlot);
      setTotalSlots(res.data.total_slot);
      showToast(`Lot expanded — now ${res.data.total_slot} slots!`, 'success');
    } catch (err) {
      showToast(errMsg(err, 'Error expanding lot'), 'error');
    }
  };

  const handlePark = async (regNo: string, color: string) => {
    try {
      const res = await api.parkCar(regNo, color);
      await refreshStatus();
      celebrate();
      showToast(`${regNo} parked at slot #${res.data.allocated_slot_number}`, 'success');
    } catch (err) {
      showToast(errMsg(err, 'Error parking car'), 'error');
    }
  };

  const handleClear = async (slotNumber?: number, regNo?: string) => {
    try {
      const res = slotNumber
        ? await api.clearBySlot(slotNumber)
        : await api.clearByReg(regNo!);
      await refreshStatus();
      showToast(`Slot #${res.data.freed_slot_number} is now free!`, 'success');
    } catch (err) {
      showToast(errMsg(err, 'Error freeing slot'), 'error');
    }
  };

  const availableCount = totalSlots - occupiedSlots.length;

  return (
    <div className="app">
      <DotField />
      <div className="bg-orb orb-1" />
      <div className="bg-orb orb-2" />
      <div className="bg-orb orb-3" />

      <motion.header
        className="app-header"
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 18 }}
      >
        <div className="header-title">
          <motion.div
            className="header-icon"
            whileHover={{ rotate: -8, scale: 1.08 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <CarIcon size={24} strokeWidth={2.5} />
          </motion.div>
          <div>
            <h1>ParkFlow</h1>
            <span className="header-sub">Smart Parking System</span>
          </div>
        </div>

        <div className="header-right">
          <AnimatePresence>
            {isInitialized && (
              <motion.div
                className="stats"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="stat occupied">
                  <span className="stat-num"><AnimatedNumber value={occupiedSlots.length} /></span>
                  <span className="stat-label">Occupied</span>
                </div>
                <div className="stat available">
                  <span className="stat-num"><AnimatedNumber value={availableCount} /></span>
                  <span className="stat-label">Available</span>
                </div>
                <div className="stat total">
                  <span className="stat-num"><AnimatedNumber value={totalSlots} /></span>
                  <span className="stat-label">Total</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {isLoggedIn ? (
            <>
              <span className="manage-chip"><ShieldCheck size={14} /> {username}</span>
              <button className="logout-btn" onClick={logout}><LogOut size={15} /> Logout</button>
            </>
          ) : (
            <Link to="/admin" className="admin-link">
              <ShieldCheck size={16} /> Admin Login
            </Link>
          )}
        </div>
      </motion.header>

      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            className={`toast ${toast.type}`}
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          >
            {toast.type === 'success' ? '✓' : '✕'} {toast.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="content">
        <motion.div
          className="left-panel"
          initial="hidden"
          animate="show"
          transition={{ staggerChildren: 0.08, delayChildren: 0.15 }}
        >
          {isLoggedIn ? (
            <>
              <motion.div variants={fadeUp}>
                <InitializeLot
                  isInitialized={isInitialized}
                  onInitialize={handleInitialize}
                  onExpand={handleExpand}
                />
              </motion.div>
              <motion.div variants={fadeUp}>
                <ParkCar isInitialized={isInitialized} onPark={handlePark} />
              </motion.div>
              <motion.div variants={fadeUp}>
                <ClearSlot isInitialized={isInitialized} onClear={handleClear} />
              </motion.div>
            </>
          ) : (
            <motion.div variants={fadeUp}>
              <div className="card locked-card">
                <div className="locked-icon"><Lock size={22} /></div>
                <h2 style={{ marginBottom: '0.5rem' }}>Admin Access Required</h2>
                <p className="restricted-note">
                  Viewing the parking lot is open to everyone, but you must log in as an
                  admin to initialize the lot, park cars, or free slots.
                </p>
                <Link to="/admin" className="locked-cta">
                  <ShieldCheck size={16} /> Go to Admin Login
                </Link>
              </div>
            </motion.div>
          )}
          <motion.div variants={fadeUp}>
            <SearchPanel isInitialized={isInitialized} />
          </motion.div>
        </motion.div>

        <motion.div
          className="right-panel"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 18, delay: 0.2 }}
        >
          <ParkingGrid
            totalSlots={totalSlots}
            occupiedSlots={occupiedSlots}
            isInitialized={isInitialized}
          />
        </motion.div>
      </div>
    </div>
  );
}
