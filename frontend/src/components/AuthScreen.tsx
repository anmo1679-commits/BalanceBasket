import { useState } from 'react';
import { Leaf, LogIn, UserPlus, Loader2 } from 'lucide-react';

export default function AuthScreen({ onLogin }: { onLogin: (token: string) => void }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isLogin) {
                // OAuth2 expects form data encoding, not JSON
                const formData = new URLSearchParams();
                formData.append('username', email);
                formData.append('password', password);

                const response = await fetch('http://localhost:8000/api/token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: formData,
                });

                if (!response.ok) throw new Error('Invalid email or password');
                const data = await response.json();
                onLogin(data.access_token);
            } else {
                // Registration
                const response = await fetch('http://localhost:8000/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, name }),
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.detail || 'Registration failed');
                }

                // Auto-login after registration
                setIsLogin(true);
                setError('Registration successful! Please log in.');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)' }}>
            <div className="card" style={{ width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '2.5rem' }}>
                <div style={{ textAlign: 'center' }}>
                    <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--text-main)', fontSize: '2rem' }}>
                        <Leaf color="var(--primary-color)" size={32} /> BalanceBasket
                    </h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        {isLogin ? 'Welcome back! Log in to access your smart cart.' : 'Create your account to start saving.'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {!isLogin && (
                        <input
                            type="text"
                            placeholder="Full Name"
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}
                        />
                    )}
                    <input
                        type="email"
                        placeholder="Email Address"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}
                    />

                    {error && <p style={{ color: error.includes('successful') ? 'var(--primary-color)' : 'var(--danger)', fontSize: '0.9rem', textAlign: 'center', fontWeight: 500 }}>{error}</p>}

                    <button type="submit" disabled={loading} style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem', padding: '0.75rem' }}>
                        {loading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? <><LogIn size={20} /> Sign In</> : <><UserPlus size={20} /> Sign Up</>)}
                    </button>
                </form>

                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.95rem', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 500 }} onClick={() => { setIsLogin(!isLogin); setError(''); }}>
                        {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                    </p>
                </div>
            </div>
        </div>
    );
}
