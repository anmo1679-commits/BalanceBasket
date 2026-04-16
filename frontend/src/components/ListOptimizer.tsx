import { useState, useEffect, useRef } from 'react';
import {
    ShoppingCart, Plus, Trash2, Loader2, Sparkles, Store, PackageOpen,
    Pin, PinOff, Clock, ChevronDown, ChevronUp, X, RotateCcw, Check,
    Pencil, Save, BarChart2
} from 'lucide-react';
import { API_URL } from '../config';

// ── Types ─────────────────────────────────────────────────────────────────────

interface OptimizationResult {
    cheapest_store: string | null;
    cheapest_total: number;
    total_items_found: number;
    store_totals: Record<string, number>;
    store_item_counts: Record<string, number>;
    itemized_breakdown: Record<string, { cheapest_store: string; cheapest_price: number; prices: Record<string, number> }>;
}

interface SavedList {
    id: number;
    name: string;
    items: string[];
    is_template: boolean;
    updated_at: string | null;
}

interface PurchaseTrip {
    id: number;
    list_name: string;
    items: string[];
    store: string | null;
    total: number | null;
    purchased_at: string | null;
}

interface ListOptimizerProps {
    items: string[];
    setItems: (items: string[]) => void;
    diet: string;
    onSyncPantry: (items: string[]) => Promise<void>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const QUICK_ADDS = [
    { label: 'Milk', emoji: '🥛' }, { label: 'Eggs', emoji: '🥚' },
    { label: 'Bread', emoji: '🍞' }, { label: 'Cheese', emoji: '🧀' },
    { label: 'Chicken', emoji: '🍗' }, { label: 'Apples', emoji: '🍎' },
    { label: 'Butter', emoji: '🧈' }, { label: 'Pasta', emoji: '🍝' },
    { label: 'Rice', emoji: '🍚' }, { label: 'Coffee', emoji: '☕' },
    { label: 'Spinach', emoji: '🥬' }, { label: 'Salmon', emoji: '🐟' },
];

const CATEGORY_MAP: [RegExp, string][] = [
    [/milk|cheese|yogurt|butter|cream|egg/i, '🥛'],
    [/chicken|beef|pork|turkey|meat|salmon|fish|shrimp/i, '🥩'],
    [/apple|banana|berry|orange|grape|peach|pear|mango|fruit/i, '🍎'],
    [/spinach|kale|broccoli|carrot|onion|pepper|tomato|veggie|vegetable|lettuce/i, '🥦'],
    [/bread|bagel|tortilla|roll|bun|muffin/i, '🍞'],
    [/pasta|rice|oat|cereal|grain|flour/i, '🍚'],
    [/coffee|tea|juice|water|soda|drink/i, '☕'],
    [/chip|cookie|cracker|snack/i, '🍿'],
    [/sauce|oil|vinegar|spice|salt|pepper|condiment|ketchup/i, '🧴'],
    [/soap|shampoo|detergent|paper|tissue|clean/i, '🧹'],
];

function getCategoryEmoji(name: string): string {
    for (const [re, emoji] of CATEGORY_MAP) {
        if (re.test(name)) return emoji;
    }
    return '🛒';
}

function timeAgo(iso: string | null): string {
    if (!iso) return '';
    const ms = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

const API = API_URL;

// ── Sub-components ────────────────────────────────────────────────────────────

function UndoToast({ message, onUndo, onDismiss }: { message: string; onUndo: () => void; onDismiss: () => void }) {
    useEffect(() => {
        const t = setTimeout(onDismiss, 3500);
        return () => clearTimeout(t);
    }, [onDismiss]);
    return (
        <div style={{
            position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
            background: '#1a1a2e', color: '#fff', padding: '0.75rem 1.25rem',
            borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '1rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)', zIndex: 9999, fontSize: '0.9rem',
        }}>
            {message}
            <button onClick={onUndo} style={{
                background: 'var(--primary-color)', color: '#fff', border: 'none',
                borderRadius: '999px', padding: '0.25rem 0.75rem', cursor: 'pointer', fontWeight: 700,
            }}>Undo</button>
            <X size={16} style={{ cursor: 'pointer', opacity: 0.6 }} onClick={onDismiss} />
        </div>
    );
}

function StoreBarChart({ result }: { result: OptimizationResult }) {
    const entries = Object.entries(result.store_totals).sort((a, b) => a[1] - b[1]);
    const max = entries[0] ? entries[entries.length - 1][1] : 1;
    const min = entries[0]?.[1] ?? 0;
    const savings = max - min;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {/* Savings callout */}
            {savings > 0.01 && (
                <div style={{
                    background: 'linear-gradient(135deg, #e8f5e9, #f1f8e9)',
                    border: '2px solid #4caf50',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem 1.25rem',
                    marginBottom: '0.5rem',
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                }}>
                    <span style={{ fontSize: '1.75rem' }}>💰</span>
                    <div>
                        <div style={{ fontWeight: 700, color: '#2e7d32', fontSize: '1.1rem' }}>
                            You save ${savings.toFixed(2)} by choosing {entries[0]?.[0]}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            vs. the most expensive option ({entries[entries.length - 1]?.[0]})
                        </div>
                    </div>
                </div>
            )}

            {/* 🥇 Podium top 3 */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem', alignItems: 'flex-end', justifyContent: 'center' }}>
                {[
                    { idx: 1, medal: '🥈', height: '70px'  },
                    { idx: 0, medal: '🥇', height: '90px'  },
                    { idx: 2, medal: '🥉', height: '55px'  },
                ].map(({ idx, medal, height }) => {
                    const entry = entries[idx];
                    if (!entry) return null;
                    return (
                        <div key={entry[0]} style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-muted)' }}>
                                {entry[0]}
                            </div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary-color)', marginBottom: '0.25rem' }}>
                                ${entry[1].toFixed(2)}
                            </div>
                            <div style={{
                                height, background: idx === 0
                                    ? 'linear-gradient(180deg, #ffd700, #ffb300)'
                                    : idx === 1
                                        ? 'linear-gradient(180deg, #c0c0c0, #9e9e9e)'
                                        : 'linear-gradient(180deg, #cd7f32, #a0522d)',
                                borderRadius: '6px 6px 0 0',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.5rem',
                            }}>
                                {medal}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Horizontal bar chart for all stores */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.5rem' }}>
                {entries.map(([store, total], i) => {
                    const pct = max > 0 ? (total / max) * 100 : 0;
                    const isBest = store === result.cheapest_store;
                    return (
                        <div key={store}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.2rem' }}>
                                <span style={{ fontWeight: isBest ? 700 : 400, color: isBest ? 'var(--primary-color)' : 'var(--text-main)' }}>
                                    {isBest ? '⭐ ' : ''}{store}
                                </span>
                                <span style={{ fontWeight: 600 }}>${total.toFixed(2)}</span>
                            </div>
                            <div style={{ height: '8px', background: 'var(--border-light)', borderRadius: '999px', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%', width: `${pct}%`,
                                    background: i === 0 ? 'var(--primary-color)' : i === 1 ? '#66bb6a' : '#bdbdbd',
                                    borderRadius: '999px',
                                    transition: 'width 0.8s ease',
                                }} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function ItemizedBreakdown({ result }: { result: OptimizationResult }) {
    const [open, setOpen] = useState(false);
    const breakdown = result.itemized_breakdown ?? {};
    if (Object.keys(breakdown).length === 0) return null;

    return (
        <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <button
                onClick={() => setOpen(o => !o)}
                style={{
                    width: '100%', background: 'var(--surface)', border: 'none',
                    padding: '0.75rem 1rem', cursor: 'pointer', display: 'flex',
                    justifyContent: 'space-between', alignItems: 'center', fontWeight: 600,
                    color: 'var(--text-main)', fontSize: '0.9rem',
                }}
            >
                <span><BarChart2 size={16} style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} />Per-item breakdown</span>
                {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {open && (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                        <tr style={{ background: 'var(--background)' }}>
                            <th style={{ padding: '0.5rem 1rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500 }}>Item</th>
                            <th style={{ padding: '0.5rem 1rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500 }}>Best Store</th>
                            <th style={{ padding: '0.5rem 1rem', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 500 }}>Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(breakdown).map(([item, info], i) => (
                            <tr key={item} style={{ borderTop: '1px solid var(--border-light)', background: i % 2 === 0 ? 'transparent' : 'var(--surface)' }}>
                                <td style={{ padding: '0.5rem 1rem' }}>{getCategoryEmoji(item)} {item}</td>
                                <td style={{ padding: '0.5rem 1rem', color: 'var(--primary-color)', fontWeight: 600 }}>{info.cheapest_store}</td>
                                <td style={{ padding: '0.5rem 1rem', textAlign: 'right', fontWeight: 700 }}>${info.cheapest_price?.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ListOptimizer({ items, setItems, diet, onSyncPantry }: ListOptimizerProps) {
    const [newItem, setNewItem] = useState('');
    const [result, setResult] = useState<OptimizationResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState('');

    // Multi-list state
    const [savedLists, setSavedLists] = useState<SavedList[]>([]);
    const [history, setHistory] = useState<PurchaseTrip[]>([]);
    const [activeListId, setActiveListId] = useState<number | null>(null);
    const [listName, setListName] = useState('My List');
    const [editingName, setEditingName] = useState(false);
    const nameRef = useRef<HTMLInputElement>(null);

    // UX state
    const [toast, setToast] = useState<{ message: string; undoItems: string[] } | null>(null);
    const [animatedItems, setAnimatedItems] = useState<Set<string>>(new Set());
    const [showHistory, setShowHistory] = useState(false);

    // Load saved lists + history on mount
    useEffect(() => {
        fetchSavedLists();
        fetchHistory();
    }, []);

    const fetchSavedLists = async () => {
        try {
            const res = await fetch(`${API}/api/saved-lists`);
            if (res.ok) setSavedLists(await res.json());
        } catch { /* silent */ }
    };

    const fetchHistory = async () => {
        try {
            const res = await fetch(`${API}/api/purchase-history`);
            if (res.ok) setHistory(await res.json());
        } catch { /* silent */ }
    };

    // ── List management ────────────────────────────────────────────────────────

    const createNewList = async () => {
        const name = `List ${savedLists.length + 1}`;
        const res = await fetch(`${API}/api/saved-lists`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, items: [] }),
        });
        if (res.ok) {
            const created: SavedList = await res.json();
            setSavedLists(prev => [created, ...prev]);
            loadList(created);
        }
    };

    const loadList = (sl: SavedList) => {
        setActiveListId(sl.id);
        setListName(sl.name);
        setItems(sl.items);
        setResult(null);
        setError('');
    };

    const saveActiveList = async (updatedItems?: string[], updatedName?: string) => {
        if (!activeListId) return;
        await fetch(`${API}/api/saved-lists/${activeListId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: updatedItems ?? items, name: updatedName ?? listName }),
        });
        fetchSavedLists();
    };

    const deleteList = async (id: number) => {
        await fetch(`${API}/api/saved-lists/${id}`, { method: 'DELETE' });
        if (activeListId === id) {
            setActiveListId(null);
            setListName('My List');
            setItems([]);
            setResult(null);
        }
        setSavedLists(prev => prev.filter(l => l.id !== id));
    };

    const toggleTemplate = async (sl: SavedList) => {
        const res = await fetch(`${API}/api/saved-lists/${sl.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_template: !sl.is_template }),
        });
        if (res.ok) fetchSavedLists();
    };

    const saveAsNewList = async () => {
        const res = await fetch(`${API}/api/saved-lists`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: listName, items }),
        });
        if (res.ok) {
            const created: SavedList = await res.json();
            setSavedLists(prev => [created, ...prev]);
            setActiveListId(created.id);
        }
    };

    // ── Item management ────────────────────────────────────────────────────────

    const addItem = (name: string) => {
        const trimmed = name.trim();
        if (!trimmed || items.includes(trimmed)) return;
        const next = [...items, trimmed];
        setItems(next);
        setResult(null);
        setAnimatedItems(prev => new Set(prev).add(trimmed));
        setTimeout(() => setAnimatedItems(prev => { const s = new Set(prev); s.delete(trimmed); return s; }), 600);
        if (activeListId) saveActiveList(next);
    };

    const removeItem = (item: string) => {
        const next = items.filter(i => i !== item);
        setItems(next);
        setResult(null);
        if (activeListId) saveActiveList(next);
    };

    const clearAll = () => {
        const prev = [...items];
        setItems([]);
        setResult(null);
        if (activeListId) saveActiveList([]);
        setToast({ message: `Cleared ${prev.length} items`, undoItems: prev });
    };

    const handleUndo = () => {
        if (toast) {
            setItems(toast.undoItems);
            if (activeListId) saveActiveList(toast.undoItems);
            setToast(null);
        }
    };

    // ── Optimization ──────────────────────────────────────────────────────────

    const optimizeList = async () => {
        if (items.length === 0) return;
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${API}/api/lists/optimize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items, diet }),
            });
            if (!res.ok) throw new Error('Failed');
            setResult(await res.json());
        } catch {
            setError('Error connecting to optimizer. Ensure backend is running.');
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async () => {
        setSyncing(true);
        try {
            // Save to purchase history
            await fetch(`${API}/api/purchase-history`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    list_name: listName,
                    items,
                    store: result?.cheapest_store ?? null,
                    total: result?.cheapest_total ?? null,
                }),
            });
            // Sync to pantry
            await onSyncPantry(items);
            // Clear current list
            setItems([]);
            setResult(null);
            if (activeListId) saveActiveList([]);
            fetchHistory();
        } catch {
            setError('Error recording purchase.');
        } finally {
            setSyncing(false);
        }
    };

    const reloadLastTrip = () => {
        const last = history[0];
        if (!last) return;
        setItems(last.items);
        setListName(`${last.list_name} (repeat)`);
        setResult(null);
    };

    // ── Render ────────────────────────────────────────────────────────────────

    const templates = savedLists.filter(l => l.is_template);
    const regularLists = savedLists.filter(l => !l.is_template);
    const lastTrip = history[0] ?? null;

    return (
        <>
            {toast && (
                <UndoToast
                    message={toast.message}
                    onUndo={handleUndo}
                    onDismiss={() => setToast(null)}
                />
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 380px) 1fr', gap: '2rem' }}>

                {/* ── Left: List Builder ─────────────────────────────────────── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {/* Saved list tabs */}
                    <div className="card" style={{ padding: '1rem', gap: '0.75rem', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Saved Lists
                            </span>
                            <button onClick={createNewList} style={{
                                display: 'flex', alignItems: 'center', gap: '0.25rem',
                                background: 'none', border: '1px dashed var(--border-light)',
                                borderRadius: 'var(--radius-md)', padding: '0.25rem 0.6rem',
                                fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-muted)',
                            }}>
                                <Plus size={12} /> New
                            </button>
                        </div>

                        {/* Templates */}
                        {templates.length > 0 && (
                            <div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>📌 Templates</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    {templates.map(sl => (
                                        <ListTab key={sl.id} sl={sl} active={activeListId === sl.id}
                                            onLoad={() => loadList(sl)} onDelete={() => deleteList(sl.id)}
                                            onToggleTemplate={() => toggleTemplate(sl)} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Regular lists */}
                        {regularLists.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                {regularLists.map(sl => (
                                    <ListTab key={sl.id} sl={sl} active={activeListId === sl.id}
                                        onLoad={() => loadList(sl)} onDelete={() => deleteList(sl.id)}
                                        onToggleTemplate={() => toggleTemplate(sl)} />
                                ))}
                            </div>
                        )}

                        {savedLists.length === 0 && (
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem 0' }}>
                                Click <strong>+ New</strong> to create a saved list
                            </p>
                        )}
                    </div>

                    {/* Active list card */}
                    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                        {/* List name (editable) */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ShoppingCart size={18} color="var(--primary-color)" />
                            {editingName ? (
                                <input
                                    ref={nameRef}
                                    value={listName}
                                    onChange={e => setListName(e.target.value)}
                                    onBlur={() => { setEditingName(false); saveActiveList(undefined, listName); }}
                                    onKeyDown={e => { if (e.key === 'Enter') { setEditingName(false); saveActiveList(undefined, listName); } }}
                                    style={{ flex: 1, padding: '0.25rem 0.5rem', fontSize: '1rem', fontWeight: 600 }}
                                    autoFocus
                                />
                            ) : (
                                <h3
                                    style={{ flex: 1, fontSize: '1rem', fontWeight: 600, color: 'var(--primary-color)', cursor: 'text' }}
                                    onClick={() => setEditingName(true)}
                                    title="Click to rename"
                                >
                                    {listName}
                                </h3>
                            )}
                            {editingName
                                ? <Save size={15} style={{ cursor: 'pointer', color: 'var(--primary-color)' }} onClick={() => { setEditingName(false); saveActiveList(undefined, listName); }} />
                                : <Pencil size={13} style={{ cursor: 'pointer', color: 'var(--text-muted)', opacity: 0.6 }} onClick={() => setEditingName(true)} />
                            }
                        </div>

                        {/* Quick-add chips */}
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Quick add</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                {QUICK_ADDS.map(({ label, emoji }) => (
                                    <button
                                        key={label}
                                        onClick={() => addItem(label)}
                                        disabled={items.includes(label)}
                                        style={{
                                            background: items.includes(label) ? 'var(--secondary-color)' : 'var(--background)',
                                            border: '1px solid var(--border-light)',
                                            borderRadius: '999px',
                                            padding: '0.2rem 0.6rem',
                                            fontSize: '0.78rem',
                                            cursor: items.includes(label) ? 'default' : 'pointer',
                                            opacity: items.includes(label) ? 0.5 : 1,
                                            display: 'flex', alignItems: 'center', gap: '0.25rem',
                                        }}
                                    >
                                        {emoji} {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Text input */}
                        <form onSubmit={e => { e.preventDefault(); addItem(newItem); setNewItem(''); }} style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="text"
                                placeholder="Add any item…"
                                value={newItem}
                                onChange={e => setNewItem(e.target.value)}
                                style={{ flex: 1 }}
                            />
                            <button type="submit" style={{ padding: '0.75rem', flexShrink: 0 }}>
                                <Plus size={20} />
                            </button>
                        </form>

                        {/* Item count + clear */}
                        {items.length > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{
                                    background: 'var(--primary-color)', color: '#fff',
                                    borderRadius: '999px', padding: '0.15rem 0.65rem',
                                    fontSize: '0.78rem', fontWeight: 700,
                                }}>
                                    {items.length} item{items.length !== 1 ? 's' : ''}
                                </span>
                                <button onClick={clearAll} style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: 'var(--danger)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.25rem',
                                }}>
                                    <Trash2 size={12} /> Clear all
                                </button>
                            </div>
                        )}

                        {/* Items list */}
                        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '280px', overflowY: 'auto' }}>
                            {items.map(item => (
                                <li
                                    key={item}
                                    style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '0.6rem 0.8rem',
                                        background: animatedItems.has(item) ? 'var(--secondary-color)' : 'var(--background)',
                                        borderRadius: 'var(--radius-md)',
                                        transition: 'background 0.4s ease',
                                        animation: animatedItems.has(item) ? 'slideIn 0.3s ease' : 'none',
                                    }}
                                >
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                        <span>{getCategoryEmoji(item)}</span>
                                        {item}
                                    </span>
                                    <Trash2 size={15} color="var(--danger)" style={{ cursor: 'pointer', opacity: 0.6, flexShrink: 0 }} onClick={() => removeItem(item)} />
                                </li>
                            ))}
                            {items.length === 0 && (
                                <li style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    Your list is empty. Add items above or use quick-add chips ☝️
                                </li>
                            )}
                        </ul>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {items.length > 0 && (
                                <>
                                    <button onClick={optimizeList} disabled={loading} style={{ width: '100%', background: 'var(--text-main)' }}>
                                        {loading ? <Loader2 className="animate-spin" size={18} /> : <><Sparkles size={18} /> Optimize Cart</>}
                                    </button>
                                    <button onClick={saveAsNewList} style={{ width: '100%', background: 'none', border: '1px solid var(--border-light)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        <Save size={14} /> Save as list
                                    </button>
                                </>
                            )}
                            {lastTrip && (
                                <button onClick={reloadLastTrip} style={{ width: '100%', background: 'none', border: '1px solid var(--border-light)', color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                                    <RotateCcw size={14} /> Reload last trip ({timeAgo(lastTrip.purchased_at)})
                                </button>
                            )}
                        </div>

                        {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{error}</p>}
                    </div>
                </div>

                {/* ── Right: Results ─────────────────────────────────────────── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {result && result.cheapest_store ? (
                        <div className="card" style={{ borderTop: '4px solid var(--primary-color)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                            {/* Winner store banner */}
                            <div style={{ background: 'var(--secondary-color)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                                <p style={{ color: 'var(--text-muted)', fontWeight: 500, marginBottom: '0.4rem', fontSize: '0.9rem' }}>Best single store for your full haul:</p>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary-color)', fontSize: '1.75rem', fontWeight: 700 }}>
                                        <Store size={28} />
                                        {result.cheapest_store}
                                    </div>
                                    <div style={{ fontSize: '2.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                        ${result.cheapest_total.toFixed(2)}
                                    </div>
                                </div>
                                <p style={{ marginTop: '0.4rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                    {result.total_items_found} of {items.length} items found
                                </p>
                            </div>

                            <StoreBarChart result={result} />
                            <ItemizedBreakdown result={result} />

                            {/* Purchase button */}
                            <div style={{ padding: '1.25rem', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary-color)' }}>
                                <h4 style={{ marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <PackageOpen size={18} color="var(--primary-color)" /> Ready to checkout?
                                </h4>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                                    Marks your trip as complete, clears the list, and sends everything to your Pantry. The AI will remember you have these items.
                                </p>
                                <button
                                    onClick={handlePurchase}
                                    disabled={syncing}
                                    style={{ width: '100%', background: 'var(--primary-color)', color: 'white', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
                                >
                                    {syncing ? <Loader2 className="animate-spin" size={18} /> : <><Check size={18} /> Mark as Purchased & Send to Pantry</>}
                                </button>
                            </div>
                        </div>

                    ) : (
                        /* Empty / no-result state */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {/* Last trip card */}
                            {lastTrip && (
                                <div className="card" style={{ borderLeft: '4px solid var(--primary-color)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary-color)', fontWeight: 700, marginBottom: '0.2rem' }}>
                                                <Clock size={16} /> Last trip — {timeAgo(lastTrip.purchased_at)}
                                            </div>
                                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                                {lastTrip.list_name}
                                                {lastTrip.store && ` · ${lastTrip.store}`}
                                                {lastTrip.total && ` · $${lastTrip.total.toFixed(2)}`}
                                            </div>
                                        </div>
                                        <button onClick={reloadLastTrip} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.82rem', background: 'var(--secondary-color)', border: 'none', borderRadius: 'var(--radius-md)', padding: '0.4rem 0.75rem', cursor: 'pointer', color: 'var(--text-main)', fontWeight: 600 }}>
                                            <RotateCcw size={14} /> Reload
                                        </button>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                        {lastTrip.items.slice(0, 8).map(i => (
                                            <span key={i} style={{ background: 'var(--background)', border: '1px solid var(--border-light)', borderRadius: '999px', padding: '0.15rem 0.55rem', fontSize: '0.78rem' }}>
                                                {getCategoryEmoji(i)} {i}
                                            </span>
                                        ))}
                                        {lastTrip.items.length > 8 && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>+{lastTrip.items.length - 8} more</span>}
                                    </div>
                                </div>
                            )}

                            {/* Templates */}
                            {templates.length > 0 && (
                                <div>
                                    <h4 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        <Pin size={14} /> Pinned Templates
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                                        {templates.map(sl => (
                                            <div key={sl.id} className="card" style={{ padding: '0.85rem', cursor: 'pointer' }} onClick={() => loadList(sl)}>
                                                <div style={{ fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.9rem' }}>📌 {sl.name}</div>
                                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{sl.items.length} items</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* History */}
                            {history.length > 1 && (
                                <div>
                                    <button onClick={() => setShowHistory(h => !h)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, padding: '0' }}>
                                        <Clock size={14} /> Past trips ({history.length - 1} more)
                                        {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    </button>
                                    {showHistory && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
                                            {history.slice(1).map(trip => (
                                                <div key={trip.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                                                    <div>
                                                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{trip.list_name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                            {timeAgo(trip.purchased_at)} · {trip.items.length} items
                                                            {trip.total && ` · $${trip.total.toFixed(2)}`}
                                                        </div>
                                                    </div>
                                                    <button onClick={() => { setItems(trip.items); setListName(`${trip.list_name} (repeat)`); setResult(null); }} style={{ background: 'none', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '0.3rem 0.65rem', cursor: 'pointer', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                        <RotateCcw size={12} /> Reload
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Empty placeholder */}
                            {!lastTrip && templates.length === 0 && (
                                <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '280px', borderStyle: 'dashed', background: 'transparent', flexDirection: 'column', gap: '0.75rem' }}>
                                    <span style={{ fontSize: '3rem' }}>🛒</span>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem', textAlign: 'center' }}>
                                        Add items to your list and click <strong>Optimize Cart</strong> to find the cheapest store.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes slideIn {
                    from { opacity: 0; transform: translateX(-12px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
            `}</style>
        </>
    );
}

// ── ListTab sub-component ─────────────────────────────────────────────────────

function ListTab({ sl, active, onLoad, onDelete, onToggleTemplate }: {
    sl: SavedList; active: boolean;
    onLoad: () => void; onDelete: () => void; onToggleTemplate: () => void;
}) {
    return (
        <div
            onClick={onLoad}
            style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.45rem 0.65rem',
                borderRadius: 'var(--radius-md)',
                background: active ? 'var(--secondary-color)' : 'transparent',
                border: active ? '1px solid var(--primary-color)' : '1px solid transparent',
                cursor: 'pointer', fontSize: '0.85rem', fontWeight: active ? 600 : 400,
            }}
        >
            <ShoppingCart size={13} color={active ? 'var(--primary-color)' : 'var(--text-muted)'} />
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sl.name}</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', flexShrink: 0 }}>{sl.items.length}</span>
            <button onClick={e => { e.stopPropagation(); onToggleTemplate(); }} title={sl.is_template ? 'Unpin template' : 'Pin as template'} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', color: sl.is_template ? 'var(--primary-color)' : 'var(--text-muted)', opacity: 0.7 }}>
                {sl.is_template ? <Pin size={12} /> : <PinOff size={12} />}
            </button>
            <button onClick={e => { e.stopPropagation(); onDelete(); }} title="Delete list" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', color: 'var(--danger)', opacity: 0.7 }}>
                <X size={12} />
            </button>
        </div>
    );
}
