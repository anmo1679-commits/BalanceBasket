import { useState, useEffect } from 'react';
import { Plus, X, Loader2, ChefHat, Flame, Clock, TrendingUp } from 'lucide-react';
import { API_URL } from '../config';

interface Meal {
    id: number;
    name: string;
    description: string;
    rating: number;
}

// ── Utility helpers ────────────────────────────────────────────────────────────

// ── Emoji Mapping ─────────────────────────────────────────────────────────────

const FALLBACK_EMOJIS = ['🍛', '🍱', '🥘', '🍲', '🥣', '🥗', '🍝', '🥡', '🍽️', '👩‍🍳', '👨‍🍳'];

const MEAL_KEYWORD_MAP: [RegExp, string][] = [
    [/pasta|spaghetti|noodle|lasagna|penne|macaroni|fettuccine/i, '🍝'],
    [/salad|bowl|greens|caesar|caprese|spinach|kale/i, '🥗'],
    [/soup|stew|chili|broth|ramen|chowder|gazpacho/i, '🍲'],
    [/taco|burrito|quesadilla|enchilada|fajita|nacho/i, '🌮'],
    [/rice|stir fry|sushi|bento|fried rice|poke/i, '🍛'],
    [/egg|pancake|toast|cereal|waffle|omelet|shakshuka|breakfast/i, '🥞'],
    [/meat|steak|pork|lamb|ribs|roast/i, '🥩'],
    [/chicken|poultry|turkey|wings|drumstick/i, '🍗'],
    [/fish|salmon|shrimp|seafood|tuna|cod/i, '🐟'],
    [/broccoli|veggie|vegan|plant based|tofu|tempeh|cauliflower/i, '🥦'],
    [/pizza|slice|margherita|pepperoni/i, '🍕'],
    [/burger|sandwich|wrap|sub|hamburger|cheeseburger/i, '🍔'],
    [/curry|masala|tikka|dal|naan/i, '🥘'],
    [/bread|bagel|croissant|bun|roll/i, '🍞'],
    [/potato|fries|fry|tater|chips/i, '🍟'],
    [/fruit|apple|banana|berry|strawberry|melon/i, '🍎'],
    [/dessert|cake|cookie|sweet|chocolate|pie|brownie/i, '🍰'],
];

function getMealEmoji(name: string, description: string = ''): string {
    const combined = (name + ' ' + description).toLowerCase();

    // 1. Try keyword matching
    for (const [re, emoji] of MEAL_KEYWORD_MAP) {
        if (re.test(combined)) return emoji;
    }

    // 2. Fallback: Deterministic but varied
    const seed = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return FALLBACK_EMOJIS[seed % FALLBACK_EMOJIS.length];
}

// Unused MEAL_TAGS removed to fix build error

const TAG_STYLES: Record<string, { bg: string; color: string }> = {
    'Budget':       { bg: '#d1fae5', color: '#065f46' },
    'Vegan':        { bg: '#e0f2fe', color: '#0369a1' },
    'Vegetarian':   { bg: '#dcfce7', color: '#15803d' },
    'Gluten-Free':  { bg: '#fef9c3', color: '#854d0e' },
    'Quick':        { bg: '#fce7f3', color: '#9d174d' },
    'High Protein': { bg: '#ede9fe', color: '#5b21b6' },
    'Comfort Food': { bg: '#fee2e2', color: '#991b1b' },
    'Meal Prep':    { bg: '#e0f2fe', color: '#1d4ed8' },
    'One Pan':      { bg: '#f1f5f9', color: '#334155' },
    'Kid Friendly': { bg: '#fef3c7', color: '#92400e' },
};

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    const [hover, setHover] = useState(0);
    return (
        <div style={{ display: 'flex', gap: '0.3rem' }}>
            {[1,2,3,4,5].map(n => (
                <button
                    key={n}
                    type="button"
                    onMouseEnter={() => setHover(n)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => onChange(n)}
                    style={{
                        background: 'none', boxShadow: 'none', padding: '0.1rem',
                        fontSize: '1.8rem', lineHeight: 1,
                        filter: (hover || value) >= n ? 'none' : 'grayscale(1) opacity(0.35)',
                        transform: hover === n ? 'scale(1.25)' : 'scale(1)',
                        transition: 'transform 0.15s, filter 0.15s',
                    }}
                >
                    ⭐
                </button>
            ))}
        </div>
    );
}

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Amazing!'];

// ── Meal card ─────────────────────────────────────────────────────────────────

function MealCard({ meal, rank }: { meal: Meal; rank: number }) {
    const [expanded, setExpanded] = useState(false);
    const emoji = getMealEmoji(meal.name, meal.description);

    // Generate pseudo-tags based on description keywords
    const desc = meal.description.toLowerCase();
    const autoTags: string[] = [];
    if (desc.includes('vegan') || desc.includes('plant')) autoTags.push('Vegan');
    if (desc.includes('vegetarian') || desc.includes('veggie')) autoTags.push('Vegetarian');
    if (desc.includes('quick') || desc.includes('minutes') || desc.includes('fast') || desc.includes('easy')) autoTags.push('Quick');
    if (desc.includes('budget') || desc.includes('cheap') || desc.includes('affordable')) autoTags.push('Budget');
    if (desc.includes('protein') || desc.includes('chicken') || desc.includes('beef') || desc.includes('meat')) autoTags.push('High Protein');
    if (desc.includes('prep') || desc.includes('batch')) autoTags.push('Meal Prep');
    if (desc.includes('one pan') || desc.includes('one pot') || desc.includes('sheet pan')) autoTags.push('One Pan');
    if (desc.includes('comfort') || desc.includes('cozy') || desc.includes('hearty')) autoTags.push('Comfort Food');
    if (desc.includes('gluten')) autoTags.push('Gluten-Free');

    const isTop = rank <= 3;
    const rankEmoji = ['🥇','🥈','🥉'][rank - 1] ?? null;

    return (
        <div
            style={{
                background: 'var(--surface)',
                borderRadius: 20,
                overflow: 'hidden',
                boxShadow: isTop
                    ? '0 8px 32px rgba(34,197,94,0.12), 0 2px 8px rgba(0,0,0,0.08)'
                    : '0 2px 12px rgba(0,0,0,0.07)',
                border: isTop ? '1px solid rgba(34,197,94,0.25)' : '1px solid var(--border-light)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer',
                animation: 'fadeSlideIn 0.4s ease both',
            }}
            onClick={() => setExpanded(v => !v)}
            onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 16px 40px rgba(0,0,0,0.13)';
            }}
            onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = '';
                (e.currentTarget as HTMLDivElement).style.boxShadow = isTop
                    ? '0 8px 32px rgba(34,197,94,0.12), 0 2px 8px rgba(0,0,0,0.08)'
                    : '0 2px 12px rgba(0,0,0,0.07)';
            }}
        >
            {/* Card header */}
            <div style={{
                background: isTop
                    ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'
                    : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                padding: '1.25rem 1.25rem 0',
                display: 'flex', gap: '1rem', alignItems: 'flex-start',
            }}>
                {/* Emoji avatar */}
                <div style={{
                    width: 60, height: 60, borderRadius: 16, flexShrink: 0,
                    background: isTop ? 'rgba(34,197,94,0.12)' : 'rgba(100,116,139,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '2rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    position: 'relative',
                }}>
                    {emoji}
                    {rankEmoji && (
                        <span style={{ position: 'absolute', top: -8, right: -8, fontSize: '1rem' }}>{rankEmoji}</span>
                    )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.3 }}>
                        {meal.name}
                    </h3>

                    {/* Star display */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.3rem' }}>
                        <div style={{ display: 'flex', gap: '1px' }}>
                            {[1,2,3,4,5].map(i => (
                                <span key={i} style={{
                                    fontSize: '0.85rem',
                                    filter: i <= meal.rating ? 'none' : 'grayscale(1) opacity(0.3)',
                                }}>⭐</span>
                            ))}
                        </div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                            {RATING_LABELS[meal.rating]}
                        </span>
                    </div>

                    {/* Auto-detected tags */}
                    {autoTags.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.5rem' }}>
                            {autoTags.slice(0, 3).map(tag => {
                                const s = TAG_STYLES[tag] ?? { bg: '#f1f5f9', color: '#334155' };
                                return (
                                    <span key={tag} style={{
                                        padding: '0.15rem 0.55rem', borderRadius: 999,
                                        fontSize: '0.68rem', fontWeight: 700,
                                        background: s.bg, color: s.color,
                                    }}>{tag}</span>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Description */}
            <div style={{ padding: '0.85rem 1.25rem 1.25rem', background: isTop ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
                <p style={{
                    margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)',
                    lineHeight: 1.6,
                    display: expanded ? 'block' : '-webkit-box',
                    WebkitLineClamp: expanded ? undefined : 2,
                    WebkitBoxOrient: 'vertical' as const,
                    overflow: expanded ? 'visible' : 'hidden',
                }}>
                    {meal.description}
                </p>
                {meal.description.length > 120 && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary-color)', fontWeight: 600, marginTop: '0.3rem', display: 'block' }}>
                        {expanded ? '↑ Show less' : '↓ Read more'}
                    </span>
                )}
            </div>
        </div>
    );
}

// ── Share form modal ───────────────────────────────────────────────────────────

function ShareModal({ onClose, onSubmit, submitting }: {
    onClose: () => void;
    onSubmit: (meal: { name: string; description: string; rating: number }) => Promise<void>;
    submitting: boolean;
}) {
    const [form, setForm] = useState({ name: '', description: '', rating: 5 });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim() || !form.description.trim()) return;
        await onSubmit(form);
    };

    const emoji = form.name.trim() ? getMealEmoji(form.name, form.description) : '🍽️';

    return (
        <>
            <div onClick={onClose} style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                zIndex: 200, backdropFilter: 'blur(4px)',
                animation: 'fadeIn 0.2s ease',
            }} />
            <div style={{
                position: 'fixed', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 'min(520px, 92vw)',
                background: 'var(--surface)', borderRadius: 24,
                padding: '2rem', zIndex: 201,
                boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
                animation: 'scaleIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                maxHeight: '90vh', overflowY: 'auto',
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: 44, height: 44, borderRadius: 12,
                            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <ChefHat size={22} color="#fff" />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Share a Meal</h3>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Help the community eat better</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'var(--border-light)', color: 'var(--text-main)', padding: 0, width: 34, height: 34, borderRadius: '50%', boxShadow: 'none' }}>
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* Meal name with emoji preview */}
                    <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.4rem' }}>
                            Meal Name
                        </label>
                        <div style={{ position: 'relative' }}>
                            <span style={{
                                position: 'absolute', left: '0.9rem', top: '50%',
                                transform: 'translateY(-50%)', fontSize: '1.3rem',
                            }}>{emoji}</span>
                            <input
                                id="meal-name-input"
                                type="text"
                                placeholder="e.g. Budget Spaghetti Bolognese"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                required
                                style={{ paddingLeft: '2.75rem', width: '100%' }}
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.4rem' }}>
                            Recipe / Notes
                        </label>
                        <textarea
                            id="meal-description-input"
                            placeholder="Share ingredients, cooking tips, or why this meal is special…"
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            required
                            style={{
                                fontFamily: 'Outfit, sans-serif', padding: '0.85rem 1rem',
                                borderRadius: 12, border: '1px solid var(--border-light)',
                                outline: 'none', resize: 'vertical', minHeight: 110,
                                width: '100%', fontSize: '0.95rem', lineHeight: 1.6,
                                transition: 'border-color 0.2s, box-shadow 0.2s',
                            }}
                            onFocus={e => { e.target.style.borderColor = 'var(--primary-color)'; e.target.style.boxShadow = '0 0 0 3px rgba(34,197,94,0.12)'; }}
                            onBlur={e => { e.target.style.borderColor = 'var(--border-light)'; e.target.style.boxShadow = 'none'; }}
                        />
                    </div>

                    {/* Star rating */}
                    <div style={{ background: 'var(--secondary-color)', borderRadius: 14, padding: '1rem 1.15rem' }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.6rem' }}>
                            Your Rating
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <StarPicker value={form.rating} onChange={r => setForm({ ...form, rating: r })} />
                            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                                {RATING_LABELS[form.rating]}
                            </span>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting || !form.name.trim() || !form.description.trim()}
                        style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', fontWeight: 700 }}
                    >
                        {submitting
                            ? <Loader2 size={20} className="animate-spin" />
                            : <><ChefHat size={18} /> Post to Community</>}
                    </button>
                </form>
            </div>
        </>
    );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function CommunityMeals({ diet }: { diet: string }) {
    const [meals, setMeals] = useState<Meal[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [sortBy, setSortBy] = useState<'newest' | 'top'>('newest');

    const fetchMeals = async () => {
        try {
            const res = await fetch(`${API_URL}/api/meals?diet=${encodeURIComponent(diet)}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data: Meal[] = await res.json();
            setMeals(data);
        } catch {
            setError('Could not load community meals. Make sure the backend is running.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchMeals(); }, [diet]);

    const handleSubmit = async (form: { name: string; description: string; rating: number }) => {
        setSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/api/meals`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (!res.ok) throw new Error('Failed to post');
            await fetchMeals();
            setShowForm(false);
        } catch {
            alert('Error submitting meal. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const sorted = [...meals].sort((a, b) =>
        sortBy === 'top' ? b.rating - a.rating : b.id - a.id
    );

    const avgRating = meals.length
        ? (meals.reduce((s, m) => s + m.rating, 0) / meals.length).toFixed(1)
        : '—';

    return (
        <>
            <style>{`
                @keyframes fadeSlideIn {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; } to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from { opacity: 0; transform: translate(-50%,-50%) scale(0.85); }
                    to   { opacity: 1; transform: translate(-50%,-50%) scale(1); }
                }
            `}</style>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

                {/* ── Hero banner ── */}
                <div style={{
                    background: 'linear-gradient(135deg, #14532d 0%, #15803d 50%, #16a34a 100%)',
                    borderRadius: 20, padding: '1.75rem 2rem',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    boxShadow: '0 8px 32px rgba(21,128,61,0.3)',
                    gap: '1rem', flexWrap: 'wrap',
                }}>
                    <div>
                        <h2 style={{ color: '#fff', margin: 0, fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <ChefHat size={26} /> Community Kitchen
                        </h2>
                        <p style={{ color: 'rgba(255,255,255,0.75)', margin: '0.3rem 0 0', fontSize: '0.9rem' }}>
                            Real meals from real budgets — shared by your neighbours 🌍
                        </p>
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ margin: 0, fontWeight: 800, fontSize: '1.5rem', color: '#fff' }}>{meals.length}</p>
                            <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Meals shared</p>
                        </div>
                        <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,0.2)' }} />
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ margin: 0, fontWeight: 800, fontSize: '1.5rem', color: '#fbbf24' }}>{avgRating}</p>
                            <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Avg rating</p>
                        </div>
                        <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,0.2)' }} />
                        <button
                            id="share-meal-btn"
                            onClick={() => setShowForm(true)}
                            style={{
                                background: '#fff', color: '#15803d',
                                fontWeight: 800, fontSize: '0.95rem',
                                padding: '0.65rem 1.35rem', borderRadius: 14,
                                boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                            }}
                        >
                            <Plus size={18} /> Share a Meal
                        </button>
                    </div>
                </div>

                {/* ── Sort + count bar ── */}
                {meals.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                            <strong style={{ color: 'var(--text-main)' }}>{meals.length}</strong> meal{meals.length !== 1 ? 's' : ''} from the community
                            {diet !== 'None' && <> · filtered for <strong style={{ color: 'var(--primary-color)' }}>{diet}</strong></>}
                        </p>
                        <div style={{ display: 'flex', background: 'var(--surface)', borderRadius: 12, padding: '0.3rem', gap: '0.25rem', border: '1px solid var(--border-light)' }}>
                            {[{ key: 'newest', icon: <Clock size={14} />, label: 'Newest' }, { key: 'top', icon: <TrendingUp size={14} />, label: 'Top Rated' }].map(opt => (
                                <button
                                    key={opt.key}
                                    onClick={() => setSortBy(opt.key as typeof sortBy)}
                                    style={{
                                        background: sortBy === opt.key ? 'var(--primary-color)' : 'transparent',
                                        color: sortBy === opt.key ? '#fff' : 'var(--text-muted)',
                                        padding: '0.35rem 0.85rem', borderRadius: 9,
                                        fontSize: '0.8rem', fontWeight: 600,
                                        boxShadow: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {opt.icon} {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {error && (
                    <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 12, padding: '1rem 1.25rem', color: '#991b1b', fontWeight: 500 }}>
                        {error}
                    </div>
                )}

                {/* ── Meal cards grid ── */}
                {loading ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <Loader2 className="animate-spin" size={36} style={{ margin: '0 auto 1rem', color: 'var(--primary-color)' }} />
                        <p style={{ fontWeight: 500 }}>Loading community meals…</p>
                    </div>
                ) : meals.length === 0 ? (
                    <div style={{
                        textAlign: 'center', padding: '4rem 2rem',
                        background: 'var(--surface)', borderRadius: 20,
                        border: '2px dashed var(--border-light)',
                    }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🍽️</div>
                        <h3 style={{ color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.5rem' }}>No meals yet</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Be the first to share a recipe with the community!</p>
                        <button onClick={() => setShowForm(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Plus size={18} /> Share the First Meal
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.1rem' }}>
                        {sorted.map((meal) => {
                            // Rank by rating in top-rated sort, else show top-3 by rating
                            const ratingRank = [...meals].sort((a,b) => b.rating - a.rating).findIndex(m => m.id === meal.id) + 1;
                            return (
                                <MealCard key={meal.id} meal={meal} rank={ratingRank} />
                            );
                        })}
                    </div>
                )}

                {/* ── Bottom CTA strip ── */}
                {meals.length > 0 && (
                    <div style={{
                        background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                        borderRadius: 16, padding: '1.25rem 1.5rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        border: '1px solid rgba(34,197,94,0.2)', gap: '1rem', flexWrap: 'wrap',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Flame size={22} color="#f59e0b" />
                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#14532d', fontWeight: 600 }}>
                                Have a budget-friendly favourite? The community wants to know! 🌟
                            </p>
                        </div>
                        <button
                            onClick={() => setShowForm(true)}
                            style={{ background: 'var(--primary-color)', fontSize: '0.88rem', padding: '0.55rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                        >
                            <Plus size={16} /> Share Yours
                        </button>
                    </div>
                )}
            </div>

            {/* ── Share modal ── */}
            {showForm && (
                <ShareModal
                    onClose={() => setShowForm(false)}
                    onSubmit={handleSubmit}
                    submitting={submitting}
                />
            )}
        </>
    );
}
