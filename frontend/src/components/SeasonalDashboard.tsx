import { useState, useEffect } from 'react';
import { Leaf, Store, Loader2 } from 'lucide-react';

interface SeasonalItem {
    product_name: string;
    season: string;
    category_match: string;
    cheapest_store?: string;
    cheapest_price?: number;
}

export default function SeasonalDashboard({ diet }: { diet: string }) {
    const [items, setItems] = useState<SeasonalItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSeasonal = async () => {
            try {
                const response = await fetch(`http://localhost:8000/api/seasonal?diet=${encodeURIComponent(diet)}`);
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
    }, []);

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Loader2 className="animate-spin" size={32} color="var(--primary-color)" /></div>;
    if (error) return <p style={{ color: 'var(--danger)', fontWeight: 500 }}>{error}</p>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ background: 'var(--secondary-color)', padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                    <Leaf size={24} />
                    In-Season Now ({items[0]?.season || 'Unknown'})
                </h3>
                <p style={{ color: 'var(--text-muted)' }}>We analyzed the dataset to find the freshest produce for you this month.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {items.map((item, idx) => (
                    <div key={idx} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '4px solid var(--primary-color)' }}>
                        <h4 style={{ fontSize: '1.25rem' }}>{item.product_name}</h4>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'capitalize' }}>
                            <span style={{ background: 'var(--background)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>{item.category_match}</span>
                        </div>

                        {item.cheapest_store && (
                            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Best deal right now:</span>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', fontWeight: 600 }}>
                                        <Store size={16} color="var(--primary-color)" />
                                        {item.cheapest_store}
                                    </div>
                                    <span style={{ fontWeight: 700, color: 'var(--primary-color)' }}>${item.cheapest_price?.toFixed(2)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
