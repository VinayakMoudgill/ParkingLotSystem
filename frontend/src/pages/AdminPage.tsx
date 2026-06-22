import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  ArrowLeft,
  LogOut,
  UserPlus,
  Users,
  KeyRound,
  Trash2,
  Crown,
  Lock,
} from 'lucide-react';
import { authApi, AdminRow } from '../api/auth';
import { SESSION_EXPIRED_KEY } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import DotField from '../components/DotField';

export default function AdminPage() {
  const { username, isSuperAdmin, isLoggedIn, login, setRole, logout } = useAuth();
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [newUser, setNewUser] = useState('');
  const [newPass, setNewPass] = useState('');
  const [admins, setAdmins] = useState<AdminRow[]>([]);

  // True only when the API client flagged a genuine 401 expiry. Read once on
  // mount, then cleared so a plain refresh never re-shows the notice.
  const [sessionExpired] = useState(
    () => sessionStorage.getItem(SESSION_EXPIRED_KEY) === '1',
  );
  useEffect(() => {
    if (sessionExpired) sessionStorage.removeItem(SESSION_EXPIRED_KEY);
  }, [sessionExpired]);

  const errOf = (err: unknown, fallback: string) => {
    const m = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data
      ?.message;
    return m ? (Array.isArray(m) ? m[0] : m) : fallback;
  };

  // Check whether a first admin exists
  useEffect(() => {
    authApi
      .status()
      .then((res) => setHasAdmin(res.data.hasAdmin))
      .catch(() => setHasAdmin(false));
  }, []);

  const loadAdmins = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const res = await authApi.admins();
      setAdmins(res.data);
    } catch {
      /* token may have expired */
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) loadAdmins();
  }, [isLoggedIn, loadAdmins]);

  // Reconcile the role from the authoritative source right after login so the
  // super-admin tools appear immediately — no need to log out and back in.
  useEffect(() => {
    if (!isLoggedIn) return;
    authApi
      .me()
      .then((res) => setRole(res.data.isSuperAdmin))
      .catch(() => {
        /* token invalid/expired — leave current state as-is */
      });
  }, [isLoggedIn, setRole]);

  // ─── Bootstrap first admin OR login ────────────────────────────────────────

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!user.trim() || !pass) return;
    try {
      const res = hasAdmin
        ? await authApi.login(user.trim(), pass)
        : await authApi.register(user.trim(), pass);
      login(res.data.access_token, res.data.username, res.data.isSuperAdmin);
      setUser('');
      setPass('');
    } catch (err) {
      setError(errOf(err, 'Something went wrong'));
    }
  };

  // ─── Add another admin (super admin only) ──────────────────────────────────

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    if (!newUser.trim() || !newPass) return;
    try {
      await authApi.register(newUser.trim(), newPass);
      setNotice(`Admin "${newUser.trim()}" created successfully`);
      setNewUser('');
      setNewPass('');
      loadAdmins();
    } catch (err) {
      setError(errOf(err, 'Could not create admin'));
    }
  };

  // ─── Remove an admin (super admin only) ────────────────────────────────────

  const handleRemove = async (target: string) => {
    if (!window.confirm(`Remove admin "${target}"? This cannot be undone.`)) return;
    setError('');
    setNotice('');
    try {
      await authApi.removeAdmin(target);
      setNotice(`Admin "${target}" removed`);
      loadAdmins();
    } catch (err) {
      setError(errOf(err, 'Could not remove admin'));
    }
  };

  // ─── Loading state ─────────────────────────────────────────────────────────

  if (hasAdmin === null) {
    return (
      <div className="admin-shell">
        <DotField />
        <div className="bg-orb orb-1" />
        <div className="bg-orb orb-2" />
        <div className="admin-center">
          <div className="auth-card">Loading…</div>
        </div>
      </div>
    );
  }

  // ─── Logged-in dashboard ───────────────────────────────────────────────────

  if (isLoggedIn) {
    return (
      <div className="admin-shell">
        <DotField />
        <div className="bg-orb orb-1" />
        <div className="bg-orb orb-2" />
        <div className="bg-orb orb-3" />

        <header className="app-header">
          <div className="header-title">
            <div className="header-icon"><ShieldCheck size={24} strokeWidth={2.5} /></div>
            <div>
              <h1>Admin Portal</h1>
              <span className="header-sub">
                Signed in as {username}
                {isSuperAdmin && <span className="role-pill super"><Crown size={11} /> Super Admin</span>}
                {!isSuperAdmin && <span className="role-pill">Admin</span>}
              </span>
            </div>
          </div>
          <div className="header-right">
            <Link to="/" className="admin-link"><ArrowLeft size={16} /> Parking Dashboard</Link>
            <button className="logout-btn" onClick={logout}><LogOut size={15} /> Logout</button>
          </div>
        </header>

        <div className="admin-dashboard">
          {/* Only the super admin can create/remove admins */}
          {isSuperAdmin ? (
            <motion.div
              className="card"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2><UserPlus size={15} /> Add New Admin</h2>
              <form onSubmit={handleAddAdmin}>
                <label>Username</label>
                <input
                  type="text"
                  placeholder="e.g. john_admin"
                  value={newUser}
                  onChange={(e) => setNewUser(e.target.value)}
                />
                <label>Password</label>
                <input
                  type="password"
                  placeholder="min. 6 characters"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                />
                <button type="submit"><UserPlus size={15} /> Create Admin</button>
              </form>
              <AnimatePresence>
                {notice && (
                  <motion.div className="inline-notice success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {notice}
                  </motion.div>
                )}
                {error && (
                  <motion.div className="inline-notice error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              className="card"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2><Lock size={15} /> Restricted</h2>
              <p className="restricted-note">
                Only the <strong>Super Admin</strong> (the first registered account) can
                create or remove admin accounts. You have standard admin access.
              </p>
            </motion.div>
          )}

          <motion.div
            className="card"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
          >
            <h2><Users size={15} /> Registered Admins ({admins.length})</h2>
            <table className="result-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Created</th>
                  {isSuperAdmin && <th></th>}
                </tr>
              </thead>
              <tbody>
                {admins.map((a) => (
                  <tr key={a.username}>
                    <td>
                      {a.username}
                      {a.username === username && <span className="you-tag">you</span>}
                    </td>
                    <td>
                      {a.isSuperAdmin ? (
                        <span className="role-pill super"><Crown size={11} /> Super</span>
                      ) : (
                        <span className="role-pill">Admin</span>
                      )}
                    </td>
                    <td>{new Date(a.createdAt).toLocaleDateString()}</td>
                    {isSuperAdmin && (
                      <td style={{ textAlign: 'right' }}>
                        {!a.isSuperAdmin && (
                          <button className="remove-btn" onClick={() => handleRemove(a.username)} title="Remove admin">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {!isSuperAdmin && (
              <AnimatePresence>
                {(notice || error) && (
                  <motion.div className={`inline-notice ${error ? 'error' : 'success'}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {error || notice}
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  // ─── Login / first-admin bootstrap ─────────────────────────────────────────

  return (
    <div className="admin-shell">
      <DotField />
      <div className="bg-orb orb-1" />
      <div className="bg-orb orb-2" />
      <div className="bg-orb orb-3" />

      <div className="admin-center">
        <motion.div
          className="auth-card"
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        >
          <div className="auth-icon"><ShieldCheck size={30} strokeWidth={2.5} /></div>
          <h2 className="auth-title">{hasAdmin ? 'Admin Login' : 'Create First Admin'}</h2>
          <p className="auth-sub">
            {hasAdmin
              ? 'Sign in to manage the parking system.'
              : 'No admin exists yet. Set up the first administrator — they become the Super Admin.'}
          </p>

          {sessionExpired && (
            <div className="inline-notice error" style={{ marginBottom: '1rem' }}>
              Your session expired. Please sign in again.
            </div>
          )}

          <form onSubmit={handleAuthSubmit}>
            <label>Username</label>
            <input
              type="text"
              placeholder="Enter username"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              autoFocus
            />
            <label>Password</label>
            <input
              type="password"
              placeholder={hasAdmin ? 'Enter password' : 'min. 6 characters'}
              value={pass}
              onChange={(e) => setPass(e.target.value)}
            />
            <button type="submit">
              {hasAdmin ? <><KeyRound size={15} /> Sign In</> : <><UserPlus size={15} /> Create Admin</>}
            </button>
          </form>

          <AnimatePresence>
            {error && (
              <motion.div className="inline-notice error" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <Link to="/" className="auth-back"><ArrowLeft size={14} /> Back to Parking Dashboard</Link>
        </motion.div>
      </div>
    </div>
  );
}
