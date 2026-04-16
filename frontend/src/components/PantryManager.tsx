import { useState, useMemo, useEffect } from 'react';
import { Plus, Loader2, Search, X, Sparkles } from 'lucide-react';

export interface PantryItem {
    id: number;
    name: string;
    quantity: string | null;
}

interface PantryManagerProps {
    items: PantryItem[];
    loading: boolean;
    onAdd: (name: string, quantity: string) => Promise<void>;
    onRemove: (id: number) => Promise<void>;
}

// ── Category system ───────────────────────────────────────────────────────────

const CATEGORIES = [
    { label: 'Produce',     emoji: '🥦', bg: '#dcfce7', color: '#15803d', shelf: '#b7d7a8', keywords: ['apple','banana','orange','spinach','kale','lettuce','broccoli','carrot','tomato','potato','onion','garlic','pepper','avocado','cucumber','celery','berry','berries','strawberry','blueberry','grape','mango','peach','lemon','lime','melon','corn','mushroom','zucchini','beet','cabbage','cauliflower','asparagus','leek','herb','arugula','radish'] },
    { label: 'Dairy',       emoji: '🧀', bg: '#fef9c3', color: '#a16207', shelf: '#e9d87f', keywords: ['milk','cheese','yogurt','yoghurt','butter','cream','egg','eggs','cheddar','mozzarella','parmesan','brie','gouda','ricotta','cottage','whey','kefir','ghee','oat milk','almond milk','soy milk'] },
    { label: 'Meat',        emoji: '🥩', bg: '#fee2e2', color: '#b91c1c', shelf: '#f4b8b8', keywords: ['chicken','beef','steak','pork','turkey','lamb','bacon','ham','sausage','salmon','shrimp','tuna','fish','seafood','ground','brisket','ribs','wings','pepperoni'] },
    { label: 'Bakery',      emoji: '🍞', bg: '#fef3c7', color: '#b45309', shelf: '#f0cf86', keywords: ['bread','bagel','tortilla','wrap','croissant','muffin','bun','roll','pita','naan','sourdough','baguette','loaf','pretzel','waffle','pancake','pastry'] },
    { label: 'Pantry',      emoji: '🥫', bg: '#e0f2fe', color: '#0369a1', shelf: '#93c5fd', keywords: ['pasta','spaghetti','rice','oats','cereal','granola','beans','lentils','chickpeas','flour','sugar','salt','oil','vinegar','sauce','salsa','ketchup','mustard','mayo','honey','syrup','peanut','almond','cashew','walnut','pistachio','seeds','chia','flax','soup','broth','stock','spice','seasoning','cocoa','chocolate','chips','crackers','popcorn','nuts','canned'] },
    { label: 'Frozen',      emoji: '🧊', bg: '#dbeafe', color: '#1d4ed8', shelf: '#93c5fd', keywords: ['frozen','ice cream','gelato','pizza','fries','nuggets'] },
    { label: 'Beverages',   emoji: '🥤', bg: '#ede9fe', color: '#7c3aed', shelf: '#c4b5fd', keywords: ['coffee','tea','juice','water','soda','cola','energy drink','protein shake','smoothie','wine','beer','kombucha','sparkling'] },
    { label: 'Supplements', emoji: '💊', bg: '#fce7f3', color: '#be185d', shelf: '#f9a8d4', keywords: ['vitamin','supplement','protein powder','probiotic','omega','collagen','electrolyte'] },
];
const OTHER_CAT = { label: 'Other', emoji: '📦', bg: '#f1f5f9', color: '#475569', shelf: '#cbd5e1' };

function getCategory(name: string) {
    const lower = name.toLowerCase();
    for (const cat of CATEGORIES) {
        if (cat.keywords.some(kw => lower.includes(kw))) return cat;
    }
    return OTHER_CAT;
}

const QUICK_ADDS = ['Eggs','Milk','Bread','Rice','Pasta','Chicken','Olive Oil','Garlic','Onions','Tomatoes','Spinach','Greek Yogurt','Oats','Bananas','Avocado','Black Beans'];

// ── Add-Item drawer ───────────────────────────────────────────────────────────

function AddDrawer({ onAdd, onClose, submitting, setSubmitting }: {
    onAdd: (n: string, q: string) => Promise<void>;
    onClose: () => void;
    submitting: boolean;
    setSubmitting: (v: boolean) => void;
}) {
    const [name, setName] = useState('');
    const [qty, setQty] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setSubmitting(true);
        try { await onAdd(name.trim(), qty.trim() || '1'); setName(''); setQty(''); onClose(); }
        finally { setSubmitting(false); }
    };

    const quickItems = QUICK_ADDS.slice(0, 12);

    return (
        <>
            <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 200, backdropFilter: 'blur(2px)' }} />
            <div style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 201,
                background: 'var(--surface)', borderRadius: '20px 20px 0 0',
                padding: '1.5rem', boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
                animation: 'slideUp 0.3s cubic-bezier(0.4,0,0.2,1)',
                maxWidth: 600, margin: '0 auto',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>🛒 Add to Pantry</h3>
                    <button onClick={onClose} style={{ background: 'var(--border-light)', color: 'var(--text-main)', padding: '0.35rem', borderRadius: '50%', width: 32, height: 32, boxShadow: 'none' }}><X size={16} /></button>
                </div>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.3rem' }}>Item Name</label>
                        <input id="add-pantry-name" type="text" placeholder="e.g. Black Beans, Olive Oil…" value={name} onChange={e => setName(e.target.value)} autoFocus style={{ width: '100%' }} />
                        {name.trim() && (() => {
                            const cat = getCategory(name);
                            return <div style={{ marginTop: '0.35rem', fontSize: '0.78rem' }}><span style={{ background: cat.bg, color: cat.color, padding: '0.15rem 0.5rem', borderRadius: 6, fontWeight: 600 }}>{cat.emoji} {cat.label}</span></div>;
                        })()}
                    </div>
                    <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.3rem' }}>Quantity <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
                        <input id="add-pantry-qty" type="text" placeholder="e.g. 2 cans, half a bag…" value={qty} onChange={e => setQty(e.target.value)} style={{ width: '100%' }} />
                    </div>
                    <button type="submit" disabled={submitting || !name.trim()} style={{ width: '100%' }}>
                        {submitting ? <Loader2 size={18} className="animate-spin" /> : <><Plus size={18} /> Add to Pantry</>}
                    </button>
                </form>

                <div style={{ marginTop: '1.25rem' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <Sparkles size={12} style={{ display: 'inline', marginRight: 4 }} />Quick-Add
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {quickItems.map(n => {
                            const cat = getCategory(n);
                            return (
                                <button key={n} type="button" disabled={submitting}
                                    onClick={async () => { setSubmitting(true); try { await onAdd(n, '1'); } finally { setSubmitting(false); } }}
                                    style={{ background: cat.bg, color: cat.color, padding: '0.3rem 0.75rem', fontSize: '0.78rem', fontWeight: 600, borderRadius: 999, boxShadow: 'none' }}
                                >{cat.emoji} {n}</button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    );
}

// ── Shelf item tile ───────────────────────────────────────────────────────────

function ShelfItem({ item, onRemove }: { item: PantryItem; onRemove: () => void }) {
    const cat = getCategory(item.name);
    const [removing, setRemoving] = useState(false);
    const [hovering, setHovering] = useState(false);

    const handleRemove = async () => {
        setRemoving(true);
        await onRemove();
    };

    return (
        <div
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                width: 80, cursor: 'default', position: 'relative',
                opacity: removing ? 0.3 : 1,
                transition: 'opacity 0.3s, transform 0.2s',
                transform: hovering ? 'translateY(-6px)' : 'translateY(0)',
                animation: 'popIn 0.35s cubic-bezier(0.34,1.56,0.64,1)',
            }}
        >
            {/* Product "can/box" shape */}
            <div style={{
                width: 60, height: 68,
                background: `linear-gradient(160deg, ${cat.bg} 0%, ${cat.bg}cc 100%)`,
                borderRadius: '8px 8px 4px 4px',
                border: `2px solid ${cat.color}30`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '0.25rem', position: 'relative',
                boxShadow: hovering ? `0 8px 20px ${cat.color}40, 0 2px 4px rgba(0,0,0,0.15)` : '0 2px 6px rgba(0,0,0,0.12)',
                transition: 'box-shadow 0.2s',
            }}>
                {/* Label stripe at top of can */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 8,
                    background: cat.color, borderRadius: '6px 6px 0 0', opacity: 0.7,
                }} />
                <span style={{ fontSize: '1.6rem', marginTop: '0.5rem' }}>{cat.emoji}</span>
                {/* Label stripe at bottom */}
                <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: 6,
                    background: cat.color, borderRadius: '0 0 2px 2px', opacity: 0.4,
                }} />
            </div>
            {/* Product name below the "can" */}
            <div style={{
                marginTop: '0.35rem', fontSize: '0.65rem', fontWeight: 600, textAlign: 'center',
                color: '#3d2b1f', lineHeight: 1.2, maxWidth: 72,
                wordBreak: 'break-word',
                textShadow: '0 1px 0 rgba(255,255,255,0.8)',
            }}>
                {item.name}
            </div>
            {item.quantity && item.quantity !== '1' && (
                <div style={{ fontSize: '0.6rem', color: cat.color, fontWeight: 700, marginTop: '0.15rem' }}>×{item.quantity}</div>
            )}

            {/* Remove button, slides in on hover */}
            {hovering && !removing && (
                <button
                    onClick={handleRemove}
                    title="Used it up"
                    style={{
                        position: 'absolute', top: -8, right: -8,
                        width: 22, height: 22, borderRadius: '50%',
                        background: '#ef4444', color: '#fff',
                        padding: 0, boxShadow: '0 2px 6px rgba(239,68,68,0.5)',
                        fontSize: '0.65rem', fontWeight: 800,
                        animation: 'fadeIn 0.15s ease',
                        zIndex: 10,
                    }}
                >
                    <X size={11} />
                </button>
            )}
            {removing && <Loader2 size={14} className="animate-spin" style={{ position: 'absolute', top: -6, right: -6, color: '#ef4444' }} />}
        </div>
    );
}

// ── Wooden shelf plank ────────────────────────────────────────────────────────

function ShelfRow({ category, items, onRemove }: {
    category: typeof CATEGORIES[0];
    items: PantryItem[];
    onRemove: (id: number) => Promise<void>;
}) {
    return (
        <div style={{ marginBottom: '0.25rem' }}>
            {/* Category label */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.35rem 1rem 0.25rem',
                fontSize: '0.7rem', fontWeight: 700,
                color: category.color, letterSpacing: '0.07em', textTransform: 'uppercase',
            }}>
                <span style={{ background: category.bg, padding: '0.1rem 0.45rem', borderRadius: 6, border: `1px solid ${category.color}30` }}>
                    {category.emoji} {category.label}
                </span>
                <span style={{ color: '#a0856a', fontWeight: 500 }}>({items.length})</span>
            </div>

            {/* Items sitting on the shelf */}
            <div style={{
                padding: '0.5rem 1.25rem 0',
                display: 'flex', flexWrap: 'wrap', gap: '0.75rem', minHeight: 90,
                alignItems: 'flex-end',
            }}>
                {items.length === 0 ? (
                    <div style={{ color: '#c4a882', fontSize: '0.75rem', fontStyle: 'italic', padding: '1rem 0' }}>— empty —</div>
                ) : (
                    items.map(item => (
                        <ShelfItem key={item.id} item={item} onRemove={() => onRemove(item.id)} />
                    ))
                )}
            </div>

            {/* Wooden shelf plank */}
            <div style={{
                height: 16,
                background: `linear-gradient(180deg, #d4a35a 0%, #c08d40 40%, #a87835 70%, #c08d40 100%)`,
                margin: '0.5rem 0 0',
                boxShadow: '0 5px 10px rgba(80,40,10,0.35), inset 0 2px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.2)',
                position: 'relative',
                overflow: 'hidden',
            }}>
                {/* Grain lines */}
                {[15, 35, 55, 75, 90].map(pos => (
                    <div key={pos} style={{
                        position: 'absolute', top: 0, bottom: 0, left: `${pos}%`,
                        width: 1, background: 'rgba(0,0,0,0.07)',
                    }} />
                ))}
            </div>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PantryManager({ items, loading, onAdd, onRemove }: PantryManagerProps) {
    const [doorOpen, setDoorOpen] = useState(false);
    const [showAddDrawer, setShowAddDrawer] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Auto-open door on mount
    useEffect(() => {
        const t = setTimeout(() => setDoorOpen(true), 350);
        return () => clearTimeout(t);
    }, []);

    // Group items by category
    const shelves = useMemo(() => {
        const filtered = searchQuery
            ? items.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
            : items;

        const map = new Map<string, PantryItem[]>();
        // Pre-seed with defined categories so they appear in order
        CATEGORIES.forEach(c => map.set(c.label, []));
        map.set('Other', []);

        filtered.forEach(item => {
            const cat = getCategory(item.name).label;
            map.get(cat)!.push(item);
        });

        return map;
    }, [items, searchQuery]);

    const cabinetBg = '#fdf6ee'; // warm interior

    return (
        <>
            <style>{`
                @keyframes swingOpen {
                    0%   { transform: perspective(1400px) rotateY(0deg); }
                    100% { transform: perspective(1400px) rotateY(-130deg); }
                }
                @keyframes swingClosed {
                    0%   { transform: perspective(1400px) rotateY(-130deg); }
                    100% { transform: perspective(1400px) rotateY(0deg); }
                }
                @keyframes popIn {
                    0%   { opacity: 0; transform: scale(0.5) translateY(10px); }
                    100% { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to   { transform: translateY(0); }
                }
                .shelf-item-enter { animation: popIn 0.35s cubic-bezier(0.34,1.56,0.64,1); }
            `}</style>

            {/* Cabinet wrapper */}
            <div style={{
                position: 'relative',
                borderRadius: 18,
                overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(80,40,10,0.35), 0 4px 12px rgba(0,0,0,0.2)',
                // Cabinet frame (dark walnut)
                border: '14px solid #3d2310',
                outline: '2px solid #6b3a1f',
            }}>
                {/* Cabinet top bar / header */}
                <div style={{
                    background: 'linear-gradient(135deg, #4a2c0f 0%, #6b3a1f 50%, #4a2c0f 100%)',
                    padding: '0.85rem 1.25rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    borderBottom: '3px solid #2d1a08',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>🏠</span>
                        <div>
                            <h2 style={{ margin: 0, color: '#fde8c8', fontSize: '1.1rem', fontWeight: 800, letterSpacing: '0.02em' }}>My Pantry</h2>
                            <p style={{ margin: 0, fontSize: '0.7rem', color: '#c4956a', fontWeight: 500 }}>{items.length} item{items.length !== 1 ? 's' : ''} stocked</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        {/* Search */}
                        {items.length > 0 && (
                            <div style={{ position: 'relative' }}>
                                <Search style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#c4956a' }} size={14} />
                                <input
                                    id="pantry-search"
                                    type="text"
                                    placeholder="Search…"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    style={{
                                        paddingLeft: '2rem', paddingRight: '0.75rem',
                                        height: 32, fontSize: '0.8rem', width: 140,
                                        background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
                                        color: '#fde8c8', borderRadius: 8,
                                    }}
                                />
                            </div>
                        )}
                        {/* Toggle door */}
                        <button
                            onClick={() => setDoorOpen(v => !v)}
                            style={{
                                background: doorOpen
                                    ? 'rgba(255,255,255,0.15)'
                                    : 'linear-gradient(135deg, #c08d40, #e6b86a)',
                                color: '#fde8c8',
                                padding: '0.65rem 1.4rem',
                                fontSize: '1rem',
                                fontWeight: 700,
                                borderRadius: 12,
                                border: doorOpen ? '1px solid rgba(255,255,255,0.25)' : '1px solid #f5d78e80',
                                boxShadow: doorOpen
                                    ? 'none'
                                    : '0 0 18px rgba(230,184,106,0.45), 0 4px 10px rgba(0,0,0,0.3)',
                                letterSpacing: '0.02em',
                                transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
                        >
                            {doorOpen ? '🔒 Close door' : '🚪 Open door'}
                        </button>
                        {/* Add item */}
                        <button
                            id="pantry-add-btn"
                            onClick={() => setShowAddDrawer(true)}
                            style={{
                                background: '#22c55e', color: '#fff',
                                padding: '0.4rem 0.85rem', fontSize: '0.78rem', fontWeight: 700,
                                borderRadius: 8, boxShadow: '0 2px 8px rgba(34,197,94,0.4)',
                                display: 'flex', alignItems: 'center', gap: '0.3rem',
                            }}
                        >
                            <Plus size={15} /> Add Item
                        </button>
                    </div>
                </div>

                {/* Cabinet interior */}
                <div style={{
                    background: cabinetBg,
                    minHeight: 440,
                    // Subtle vertical wood panelling on the sides
                    backgroundImage: `
                        linear-gradient(90deg, rgba(180,120,60,0.08) 0px, transparent 2px),
                        linear-gradient(90deg, rgba(180,120,60,0.08) 0px, transparent 2px)
                    `,
                    backgroundSize: '60px 100%, 60px 100%',
                    backgroundPosition: '0 0, 30px 0',
                    position: 'relative', overflow: 'hidden',
                }}>
                    {/* Interior left wall shadow */}
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 24, background: 'linear-gradient(90deg,rgba(100,50,10,0.18),transparent)', pointerEvents: 'none' }} />
                    {/* Interior right wall shadow */}
                    <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 24, background: 'linear-gradient(270deg,rgba(100,50,10,0.18),transparent)', pointerEvents: 'none' }} />
                    {/* Ceiling shadow */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 16, background: 'linear-gradient(180deg,rgba(0,0,0,0.12),transparent)', pointerEvents: 'none' }} />

                    {loading ? (
                        <div style={{ padding: '5rem', textAlign: 'center', color: '#a0856a' }}>
                            <Loader2 className="animate-spin" size={36} style={{ margin: '0 auto 1rem', color: '#c08d40' }} />
                            <p style={{ fontWeight: 500 }}>Stocking your pantry…</p>
                        </div>
                    ) : items.length === 0 ? (
                        <div style={{ padding: '5rem 2rem', textAlign: 'center' }}>
                            {/* Empty shelves */}
                            {[0,1,2].map(i => (
                                <div key={i} style={{ marginBottom: 32 }}>
                                    <div style={{ height: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', color: '#d4b896', fontSize: '0.8rem', fontStyle: 'italic', gap: '2rem' }}>
                                        {i === 1 && <><span>🍃</span><span>Your shelves are bare…</span><span>🍃</span></>}
                                    </div>
                                    <div style={{ height: 14, background: 'linear-gradient(180deg,#d4a35a,#a87835)', boxShadow: '0 4px 10px rgba(80,40,10,0.3)', position: 'relative', overflow: 'hidden' }}>
                                        {[20,45,70].map(p => <div key={p} style={{ position: 'absolute', top: 0, bottom: 0, left: `${p}%`, width: 1, background: 'rgba(0,0,0,0.07)' }} />)}
                                    </div>
                                </div>
                            ))}
                            <button onClick={() => setShowAddDrawer(true)} style={{ marginTop: '0.5rem', background: '#c08d40', boxShadow: '0 2px 10px rgba(192,141,64,0.4)' }}>
                                <Plus size={18} /> Add your first item
                            </button>
                        </div>
                    ) : (
                        <div style={{ padding: '1rem 0.5rem' }}>
                            {CATEGORIES.map(cat => {
                                const catItems = shelves.get(cat.label) ?? [];
                                if (catItems.length === 0) return null;
                                return <ShelfRow key={cat.label} category={cat} items={catItems} onRemove={onRemove} />;
                            })}
                            {/* Other */}
                            {(shelves.get('Other') ?? []).length > 0 && (
                                <ShelfRow key="Other" category={OTHER_CAT as typeof CATEGORIES[0]} items={shelves.get('Other')!} onRemove={onRemove} />
                            )}
                        </div>
                    )}

                    {/* ── The pantry door ── */}
                    <div style={{
                        position: 'absolute', top: 0, right: 0, bottom: 0,
                        width: '100%',
                        transformOrigin: 'left center',
                        animation: doorOpen ? 'swingOpen 1.2s cubic-bezier(0.4,0,0.2,1) forwards' : 'swingClosed 0.9s cubic-bezier(0.4,0,0.2,1) forwards',
                        zIndex: 50,
                        // The door itself is only visible when not fully open
                        pointerEvents: doorOpen ? 'none' : 'auto',
                    }}>
                        {/* Door panel */}
                        <div
                            onClick={() => !doorOpen && setDoorOpen(true)}
                            style={{
                                position: 'absolute', inset: 0,
                                background: `
                                    repeating-linear-gradient(
                                        90deg,
                                        transparent,
                                        transparent 58px,
                                        rgba(0,0,0,0.04) 58px,
                                        rgba(0,0,0,0.04) 60px
                                    ),
                                    linear-gradient(175deg,
                                        #8b5e3c 0%,
                                        #a0784a 18%,
                                        #7a5030 35%,
                                        #c4956a 50%,
                                        #8b5e3c 65%,
                                        #a0784a 80%,
                                        #7a5030 100%
                                    )
                                `,
                                cursor: doorOpen ? 'default' : 'pointer',
                                boxShadow: 'inset -6px 0 20px rgba(0,0,0,0.25), inset 4px 0 10px rgba(255,255,255,0.08)',
                            }}
                        >
                            {/* Door panel inset (decorative raised rectangle) */}
                            <div style={{
                                position: 'absolute', top: '12%', left: '8%', right: '8%', bottom: '12%',
                                border: '4px solid rgba(0,0,0,0.18)',
                                borderRadius: 8,
                                boxShadow: 'inset 0 2px 6px rgba(255,255,255,0.12), 0 2px 8px rgba(0,0,0,0.2)',
                            }}>
                                <div style={{
                                    position: 'absolute', top: '50%', left: '50%',
                                    transform: 'translate(-50%,-50%)',
                                    textAlign: 'center', color: 'rgba(255,220,170,0.7)',
                                }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🍽️</div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Pantry</div>
                                    {!doorOpen && <div style={{ fontSize: '0.7rem', marginTop: '0.5rem', opacity: 0.7 }}>Click to open</div>}
                                </div>
                            </div>

                            {/* Left hinge (top) */}
                            <div style={{ position: 'absolute', left: -4, top: '15%', width: 18, height: 40, background: '#1a1008', borderRadius: 4, boxShadow: '2px 0 4px rgba(0,0,0,0.4)' }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#c4956a', margin: '8px auto', boxShadow: '0 0 3px rgba(0,0,0,0.4)' }} />
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#c4956a', margin: '8px auto', boxShadow: '0 0 3px rgba(0,0,0,0.4)' }} />
                            </div>
                            {/* Left hinge (bottom) */}
                            <div style={{ position: 'absolute', left: -4, top: '75%', width: 18, height: 40, background: '#1a1008', borderRadius: 4, boxShadow: '2px 0 4px rgba(0,0,0,0.4)' }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#c4956a', margin: '8px auto', boxShadow: '0 0 3px rgba(0,0,0,0.4)' }} />
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#c4956a', margin: '8px auto', boxShadow: '0 0 3px rgba(0,0,0,0.4)' }} />
                            </div>

                            {/* Door knob */}
                            <div style={{
                                position: 'absolute', right: 28, top: '50%', transform: 'translateY(-50%)',
                            }}>
                                <div style={{
                                    width: 20, height: 20, borderRadius: '50%',
                                    background: 'radial-gradient(circle at 35% 35%, #f5d78e, #b8880a)',
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.4)',
                                }} />
                                {/* Backplate */}
                                <div style={{
                                    position: 'absolute', top: '50%', left: '50%',
                                    transform: 'translate(-50%,-50%)',
                                    width: 28, height: 28, borderRadius: 4,
                                    background: 'linear-gradient(135deg, #c4956a, #8b5e3c)',
                                    zIndex: -1,
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                                }} />
                            </div>

                            {/* Shadow on right edge (door depth illusion) */}
                            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 12, background: 'linear-gradient(90deg,transparent,rgba(0,0,0,0.3))' }} />
                        </div>
                    </div>
                </div>

                {/* Cabinet bottom trim */}
                <div style={{
                    background: 'linear-gradient(135deg, #4a2c0f 0%, #6b3a1f 50%, #4a2c0f 100%)',
                    height: 10, borderTop: '3px solid #2d1a08',
                }} />
            </div>

            {/* Add item drawer */}
            {showAddDrawer && (
                <AddDrawer
                    onAdd={onAdd}
                    onClose={() => setShowAddDrawer(false)}
                    submitting={submitting}
                    setSubmitting={setSubmitting}
                />
            )}
        </>
    );
}
