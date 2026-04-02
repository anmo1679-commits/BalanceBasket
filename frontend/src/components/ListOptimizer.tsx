import { useState } from 'react';
import { ShoppingCart, Plus, Trash2, Loader2, Sparkles, Store } from 'lucide-react';

interface OptimizationResult {
    cheapest_store: string | null;
    cheapest_total: number;
    total_items_found: number;
    store_totals: Record<string, number>;
    store_item_counts: Record<string, number>;
    itemized_breakdown: Record<string, any>;
}

interface ListOptimizerProps {
    items: string[];
    setItems: (items: string[]) => void;
}

export default function ListOptimizer({ items, setItems }: ListOptimizerProps) {
    const [newItem, setNewItem] = useState('');
    const [result, setResult] = useState<OptimizationResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (newItem.trim() && !items.includes(newItem.trim())) {
            setItems([...items, newItem.trim()]);
            setNewItem('');
            setResult(null); // Reset results when list changes
        }
    };

    const handleRemoveItem = (itemToRemove: string) => {
        setItems(items.filter(item => item !== itemToRemove));
        setResult(null);
    };

    const optimizeList = async () => {
        if (items.length === 0) return;

        setLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:8000/api/lists/optimize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items })
            });

            if (!response.ok) throw new Error('Failed to optimize list');

            const data = await response.json();
            setResult(data);
        } catch (err) {
            setError('Error connecting to the optimizer. Ensure backend is running.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '2rem' }}>

            {/* List Builder Column */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: 'fit-content' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)' }}>
                    <ShoppingCart size={20} />
                    Your Grocery List
                </h3>

                <form onSubmit={handleAddItem} style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                        type="text"
                        placeholder="Add item (e.g. 'Milk')"
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                    />
                    <button type="submit" style={{ padding: '0.75rem' }}>
                        <Plus size={20} />
                    </button>
                </form>

                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {items.map(item => (
                        <li key={item} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
                            {item}
                            <Trash2
                                size={18}
                                color="var(--danger)"
                                style={{ cursor: 'pointer', opacity: 0.7 }}
                                onClick={() => handleRemoveItem(item)}
                            />
                        </li>
                    ))}
                    {items.length === 0 && (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', margin: '2rem 0' }}>Your list is empty.</p>
                    )}
                </ul>

                {items.length > 0 && (
                    <button
                        onClick={optimizeList}
                        disabled={loading}
                        style={{ width: '100%', marginTop: '1rem', background: 'var(--text-main)' }}
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <><Sparkles size={20} /> Optimize Cart</>}
                    </button>
                )}

                {error && <p style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>{error}</p>}
            </div>

            {/* Results Column */}
            <div>
                {result && result.cheapest_store ? (
                    <div className="card" style={{ borderTop: '4px solid var(--primary-color)' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Optimization Results</h2>

                        <div style={{ background: 'var(--secondary-color)', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
                            <p style={{ color: 'var(--text-muted)', fontWeight: 500, marginBottom: '0.5rem' }}>The absolute cheapest store for your haul is:</p>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary-color)', fontSize: '2rem', fontWeight: 700 }}>
                                    <Store size={32} />
                                    {result.cheapest_store}
                                </div>
                                <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                    ${result.cheapest_total.toFixed(2)}
                                </div>
                            </div>
                            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                {result.total_items_found} out of {items.length} items found locally.
                            </p>
                        </div>

                        <h4 style={{ marginBottom: '1rem' }}>Cost at Alternative Stores</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {Object.entries(result.store_totals)
                                .sort((a, b) => a[1] - b[1])
                                .map(([store, total]) => {
                                    const itemsFound = result.store_item_counts ? result.store_item_counts[store] : '?';
                                    return (
                                        <div key={store} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
                                            <span style={{ fontWeight: 500 }}>{store}</span>
                                            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{itemsFound} items</span>
                                                <span style={{ fontWeight: 600 }}>${total.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    );
                                })
                            }
                        </div>
                    </div>
                ) : result && !result.cheapest_store ? (
                    <div className="card">
                        <p>We couldn't find any of those exact items in the system.</p>
                    </div>
                ) : (
                    <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '300px', borderStyle: 'dashed', background: 'transparent' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Add items to your list and optimize to see the cheapest store.</p>
                    </div>
                )}
            </div>

        </div>
    );
}
