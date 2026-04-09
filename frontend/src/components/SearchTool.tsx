import { useState } from 'react';
import { Search, Loader2, Store } from 'lucide-react';

interface PriceResult {
    product_name: string;
    cheapest_option: string;
    cheapest_price: number;
    prices: Record<string, number>;
}

export default function SearchTool({ diet }: { diet: string }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<PriceResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setError('');

        try {
            const response = await fetch(`http://localhost:8000/api/products/search?q=${encodeURIComponent(query)}&diet=${encodeURIComponent(diet)}`);
            if (!response.ok) throw new Error('Failed to fetch data');

            const data = await response.json();
            setResults(data);
            if (data.length === 0) {
                setError('No items found matching your search.');
            }
        } catch (err) {
            setError('Error connecting to the database. Make sure the backend is running!');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <form onSubmit={handleSearch} style={{ position: 'relative' }}>
                <input
                    type="text"
                    placeholder="Search for grocery items (e.g., 'milk', 'cheese')"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    style={{ paddingLeft: '3rem', fontSize: '1.1rem', height: '3.5rem' }}
                />
                <Search
                    style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--text-muted)' }}
                    size={24}
                />
                <button
                    type="submit"
                    disabled={loading}
                    style={{ position: 'absolute', right: '0.5rem', top: '0.5rem', height: '2.5rem' }}
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : 'Search'}
                </button>
            </form>

            {error && <p style={{ color: 'var(--danger)', fontWeight: 500 }}>{error}</p>}

            <div style={{ display: 'grid', gap: '1.5rem' }}>
                {results.map((result, idx) => (
                    <div key={idx} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '1.4rem', color: 'var(--primary-color)' }}>{result.product_name}</h3>
                            <div style={{ background: 'var(--secondary-color)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)' }}>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Cheapest Option</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)', fontWeight: 700, fontSize: '1.2rem' }}>
                                    <Store size={18} />
                                    {result.cheapest_option} - ${result.cheapest_price.toFixed(2)}
                                </div>
                            </div>
                        </div>

                        <div>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Prices at other stores:</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                                {Object.entries(result.prices)
                                    .sort((a, b) => a[1] - b[1])
                                    .map(([storeName, price]) => (
                                        <div
                                            key={storeName}
                                            style={{
                                                border: '1px solid var(--border-light)',
                                                padding: '0.4rem 0.8rem',
                                                borderRadius: 'var(--radius-md)',
                                                opacity: storeName === result.cheapest_option ? 1 : 0.7,
                                                fontWeight: storeName === result.cheapest_option ? 600 : 400
                                            }}
                                        >
                                            {storeName}: ${price.toFixed(2)}
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
