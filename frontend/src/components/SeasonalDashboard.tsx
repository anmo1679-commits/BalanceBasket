import { useState, useEffect } from 'react';
import { Leaf, Store, Loader2, Plus, Check, ShoppingCart } from 'lucide-react';
import { API_URL } from '../config';

interface SeasonalItem {
    product_name: string;
    season: string;
    category: string;
    size: string;
    fun_fact: string;
    vegan: boolean;
    vegetarian: boolean;
    gluten_free: boolean;
    dairy_free: boolean;
    organic: boolean;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
    prices: Record<string, number>;
    cheapest_store: string;
    cheapest_price: number;
}

// Season → accent color
const SEASON_COLORS: Record<string, { border: string; bg: string; text: string; badge: string }> = {
    Spring: { border: '#4caf50', bg: '#f1f8e9', text: '#2e7d32', badge: '🌸' },
    Summer: { border: '#ff9800', bg: '#fff8e1', text: '#e65100', badge: '☀️' },
    Autumn: { border: '#ff5722', bg: '#fbe9e7', text: '#bf360c', badge: '🍂' },
    Winter: { border: '#1565c0', bg: '#e3f2fd', text: '#0d47a1', badge: '❄️' },
};

interface SeasonalDashboardProps {
    diet: string;
    cartItems: string[];
    onAddToList: (item: string) => void;
}

export default function SeasonalDashboard({ diet, cartItems, onAddToList }: SeasonalDashboardProps) {
    const [items, setItems] = useState<SeasonalItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    // Track which items were just added for the ✓ animation
    const [justAdded, setJustAdded] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchSeasonal = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await fetch(
                    `${API_URL}/api/seasonal?diet=${encodeURIComponent(diet)}`
                );
                if (!response.ok) throw new Error('Failed to fetch seasonal produce');
                const data = await response.json();
                setItems(data);
            } catch (err) {
                setError('Error loading seasonal data. Ensure the backend is running.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchSeasonal();
    }, [diet]);

    const handleAdd = (name: string) => {
        onAddToList(name);
        setJustAdded(prev => new Set(prev).add(name));
        // Reset the ✓ icon after 2 seconds
        setTimeout(() => {
            setJustAdded(prev => {
                const next = new Set(prev);
                next.delete(name);
                return next;
            });
        }, 2000);
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <Loader2 className="animate-spin" size={32} color="var(--primary-color)" />
        </div>
    );
    if (error) return <p style={{ color: 'var(--danger)', fontWeight: 500 }}>{error}</p>;
    if (items.length === 0) return (
        <p style={{ color: 'var(--text-muted)' }}>No seasonal items match your current dietary filter.</p>
    );

    const season = items[0]?.season ?? 'Unknown';
    const colors = SEASON_COLORS[season] ?? SEASON_COLORS.Spring;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Season header */}
            <div style={{
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                padding: '1.5rem',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
            }}>
                <div>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: colors.text, fontSize: '1.5rem', marginBottom: '0.25rem' }}>
                        <Leaf size={24} /> {colors.badge} In-Season Now — {season}
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                        {items.length} fresh picks at their absolute best this season. Hit <strong>+ Add</strong> to drop any into your grocery list.
                    </p>
                </div>
                {cartItems.length > 0 && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        background: 'var(--primary-color)', color: '#fff',
                        padding: '0.5rem 1rem', borderRadius: '999px', fontSize: '0.875rem', fontWeight: 600,
                    }}>
                        <ShoppingCart size={16} /> {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in list
                    </div>
                )}
            </div>

            {/* Grid of produce cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {items.map((item) => {
                    const alreadyInCart = cartItems.includes(item.product_name);
                    const wasJustAdded = justAdded.has(item.product_name);

                    return (
                        <div
                            key={item.product_name}
                            className="card"
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.75rem',
                                borderTop: `4px solid ${colors.border}`,
                                position: 'relative',
                            }}
                        >
                            {/* Name + category */}
                            <div>
                                <h4 style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>{item.product_name}</h4>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    {item.category} · {item.size}
                                </span>
                            </div>

                            {/* Fun fact */}
                            <p style={{
                                fontSize: '0.85rem',
                                color: 'var(--text-muted)',
                                fontStyle: 'italic',
                                lineHeight: 1.4,
                                flex: 1,
                            }}>
                                💡 {item.fun_fact}
                            </p>

                            {/* Macro pills */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                {[
                                    { label: `${item.calories} cal`, color: '#e3f2fd', text: '#1565c0' },
                                    { label: `${item.protein_g}g protein`, color: '#e8f5e9', text: '#2e7d32' },
                                    { label: `${item.fiber_g}g fiber`, color: '#fff8e1', text: '#e65100' },
                                ].map(m => (
                                    <span key={m.label} style={{
                                        padding: '0.15rem 0.5rem',
                                        borderRadius: '999px',
                                        background: m.color,
                                        color: m.text,
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                    }}>
                                        {m.label}
                                    </span>
                                ))}
                            </div>

                            {/* Cheapest store + Add to list */}
                            <div style={{
                                marginTop: 'auto',
                                paddingTop: '0.75rem',
                                borderTop: '1px solid var(--border-light)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '0.5rem',
                            }}>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Best deal</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.95rem' }}>
                                        <Store size={14} color={colors.border} />
                                        <span>{item.cheapest_store}</span>
                                        <span style={{ color: colors.text }}>${item.cheapest_price.toFixed(2)}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleAdd(item.product_name)}
                                    disabled={alreadyInCart}
                                    title={alreadyInCart ? 'Already in your list' : 'Add to grocery list'}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.3rem',
                                        padding: '0.45rem 0.9rem',
                                        borderRadius: '999px',
                                        fontSize: '0.82rem',
                                        fontWeight: 600,
                                        cursor: alreadyInCart ? 'default' : 'pointer',
                                        background: alreadyInCart ? '#e8f5e9' : colors.border,
                                        color: alreadyInCart ? '#2e7d32' : '#fff',
                                        border: 'none',
                                        transition: 'all 0.2s ease',
                                        flexShrink: 0,
                                    }}
                                >
                                    {alreadyInCart
                                        ? <><Check size={14} /> In list</>
                                        : wasJustAdded
                                            ? <><Check size={14} /> Added!</>
                                            : <><Plus size={14} /> Add</>
                                    }
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
