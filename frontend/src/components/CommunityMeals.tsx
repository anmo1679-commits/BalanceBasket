import { useState, useEffect } from 'react';
import { Users, Star, Plus, Loader2 } from 'lucide-react';

interface Meal {
    id: number;
    name: string;
    description: string;
    rating: number;
}

export default function CommunityMeals({ diet }: { diet: string }) {
    const [meals, setMeals] = useState<Meal[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [showForm, setShowForm] = useState(false);
    const [newMeal, setNewMeal] = useState({ name: '', description: '', rating: 5 });

    const fetchMeals = async () => {
        try {
            const response = await fetch(`http://localhost:8000/api/meals?diet=${encodeURIComponent(diet)}`);
            if (!response.ok) throw new Error('Failed to fetch community meals');
            const data = await response.json();
            setMeals(data.reverse()); // Show newest first
        } catch (err) {
            setError('Error loading community meals. Ensure the backend is running.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMeals();
    }, [diet]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMeal.name || !newMeal.description) return;

        setSubmitting(true);
        try {
            const response = await fetch('http://localhost:8000/api/meals', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newMeal)
            });
            if (!response.ok) throw new Error('Failed to post meal');

            await fetchMeals();
            setShowForm(false);
            setNewMeal({ name: '', description: '', rating: 5 });
        } catch (err) {
            alert('Error submitting meal.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Loader2 className="animate-spin" size={32} color="var(--primary-color)" /></div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--secondary-color)', padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                <div>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                        <Users size={24} />
                        Community Meals
                    </h3>
                    <p style={{ color: 'var(--text-muted)' }}>See what everyone else is mixing together for dinner.</p>
                </div>

                <button onClick={() => setShowForm(!showForm)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={18} />
                    Share a Meal
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '4px solid var(--primary-color)' }}>
                    <h4 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Share what you made</h4>

                    <input
                        type="text"
                        placeholder="Meal Name (e.g. Budget Spaghetti)"
                        value={newMeal.name}
                        onChange={e => setNewMeal({ ...newMeal, name: e.target.value })}
                        required
                    />

                    <textarea
                        placeholder="Description or Recipe notes..."
                        value={newMeal.description}
                        onChange={e => setNewMeal({ ...newMeal, description: e.target.value })}
                        required
                        style={{ fontFamily: 'Outfit, sans-serif', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', outline: 'none', resize: 'vertical', minHeight: '100px' }}
                    />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <label style={{ fontWeight: 500, color: 'var(--text-muted)' }}>Rating:</label>
                        <input
                            type="number"
                            min="1" max="5"
                            value={newMeal.rating}
                            onChange={e => setNewMeal({ ...newMeal, rating: parseInt(e.target.value) })}
                            style={{ width: '80px' }}
                        />
                        <span style={{ color: 'var(--text-muted)' }}>stars out of 5</span>
                    </div>

                    <button type="submit" disabled={submitting} style={{ alignSelf: 'flex-start', marginTop: '1rem' }}>
                        {submitting ? <Loader2 className="animate-spin" size={18} /> : 'Post Meal'}
                    </button>
                </form>
            )}

            {error && <p style={{ color: 'var(--danger)', fontWeight: 500 }}>{error}</p>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {meals.map(meal => (
                    <div key={meal.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <h4 style={{ fontSize: '1.25rem' }}>{meal.name}</h4>
                            <div style={{ display: 'flex', gap: '2px', color: '#fbbf24' }}>
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star key={i} size={16} fill={i < meal.rating ? 'currentColor' : 'transparent'} />
                                ))}
                            </div>
                        </div>
                        <p style={{ color: 'var(--text-muted)' }}>{meal.description}</p>
                    </div>
                ))}
                {meals.length === 0 && !error && (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', margin: '2rem 0' }}>It's quiet in here. Be the first to share a meal!</p>
                )}
            </div>
        </div>
    );
}
