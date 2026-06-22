import { useState } from 'react';
import { Layers, Plus, Minus, Trash2, Pencil, Check, X } from 'lucide-react';

export interface FloorView {
  id: string;
  name: string;
  total: number;
  occupied: number;
  slots: Array<{
    slot_no: number;
    occupied: boolean;
    registration_no?: string;
    color?: string;
  }>;
}

interface Props {
  isInitialized: boolean;
  floors: FloorView[];
  onAddFloor: (name: string, noOfSlot: number, position: 'top' | 'bottom') => void;
  onRemoveFloor: (floorId: string, name: string) => void;
  onRenameFloor: (floorId: string, name: string) => void;
  onAddSlot: (floor: FloorView) => void;
  onRemoveSlot: (floor: FloorView) => void;
}

export default function FloorManager({
  isInitialized,
  floors,
  onAddFloor,
  onRemoveFloor,
  onRenameFloor,
  onAddSlot,
  onRemoveSlot,
}: Props) {
  const [name, setName] = useState('');
  const [slots, setSlots] = useState('');
  // 'top'  → upper floor: sits at the top of the stack and fills first.
  // 'bottom' → basement: sits at the bottom of the stack and fills last.
  const [position, setPosition] = useState<'top' | 'bottom'>('top');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');

  const startEdit = (f: FloorView) => {
    setEditingId(f.id);
    setDraftName(f.name);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setDraftName('');
  };
  const saveEdit = (f: FloorView) => {
    const next = draftName.trim();
    if (next && next !== f.name) onRenameFloor(f.id, next);
    cancelEdit();
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slots) return;
    onAddFloor(name.trim(), Number(slots), position);
    setName('');
    setSlots('');
  };

  if (!isInitialized) return null;

  return (
    <div className="card">
      <h2><Layers size={15} /> Floors</h2>

      <form onSubmit={handleAdd}>
        <label>Floor Name</label>
        <input
          type="text"
          placeholder="e.g. Basement 1 / Floor 2"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <label>Number of Slots</label>
        <input
          type="number"
          min="1"
          placeholder="e.g. 4"
          value={slots}
          onChange={(e) => setSlots(e.target.value)}
        />

        <label>Floor Type</label>
        <div className="toggle">
          <button
            type="button"
            className={position === 'top' ? 'active' : ''}
            onClick={() => setPosition('top')}
          >
            Upper Floor
          </button>
          <button
            type="button"
            className={position === 'bottom' ? 'active' : ''}
            onClick={() => setPosition('bottom')}
          >
            Basement
          </button>
        </div>
        <p className="field-hint">Cars fill the top floor first, working down to the basement.</p>

        <button type="submit" className="btn-secondary"><Plus size={15} /> Add Floor</button>
      </form>

      {floors.length > 0 && (
        <div className="floor-list">
          {floors.map((f) => {
            const hasFreeSlot = f.occupied < f.total;
            return (
              <div className="floor-row" key={f.id}>
                <div className="floor-row-info">
                  {editingId === f.id ? (
                    <div className="floor-name-edit">
                      <input
                        type="text"
                        value={draftName}
                        autoFocus
                        maxLength={40}
                        onChange={(e) => setDraftName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit(f);
                          if (e.key === 'Escape') cancelEdit();
                        }}
                      />
                      <button type="button" className="icon-ok" title="Save" onClick={() => saveEdit(f)}>
                        <Check size={14} />
                      </button>
                      <button type="button" className="icon-cancel" title="Cancel" onClick={cancelEdit}>
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <span className="floor-row-name">
                      {f.name}
                      <button
                        type="button"
                        className="floor-edit-btn"
                        title="Rename floor"
                        onClick={() => startEdit(f)}
                      >
                        <Pencil size={12} />
                      </button>
                    </span>
                  )}
                  <span className="floor-row-meta">{f.occupied}/{f.total} used</span>
                </div>
                <div className="floor-row-actions">
                  {/* per-floor capacity stepper */}
                  <div className="slot-stepper">
                    <button
                      type="button"
                      onClick={() => onRemoveSlot(f)}
                      title={
                        !hasFreeSlot
                          ? 'No empty slot to remove on this floor'
                          : 'Remove one empty slot from this floor'
                      }
                      disabled={!hasFreeSlot}
                    >
                      <Minus size={14} />
                    </button>
                    <span className="slot-stepper-count">{f.total}</span>
                    <button
                      type="button"
                      onClick={() => onAddSlot(f)}
                      title="Add one slot to this floor"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button
                    className="remove-btn"
                    onClick={() => onRemoveFloor(f.id, f.name)}
                    title={
                      f.occupied > 0
                        ? 'Free all cars on this floor before deleting'
                        : `Delete ${f.name}`
                    }
                    disabled={f.occupied > 0}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
