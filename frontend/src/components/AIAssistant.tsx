import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface AIAssistantProps {
    currentCartItems: string[];
    diet: string;
}

export default function AIAssistant({ currentCartItems, diet }: AIAssistantProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([{
        role: 'assistant',
        content: "Hi! I'm your BalanceBasket Expert. I can see your grocery list and help you find healthy recipes, answer nutrition questions, and save money. What's on your mind?"
    }]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput('');
        const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
        setMessages(newMessages);
        setLoading(true);

        try {
            // The backend expects specific schemas
            const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));

            const response = await fetch('http://localhost:8000/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: apiMessages,
                    cart_items: currentCartItems,
                    diet: diet
                })
            });

            if (!response.ok) throw new Error('API communication failed');
            if (!response.body) throw new Error('No response body');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            // Add initial empty message
            setMessages([...newMessages, { role: 'assistant', content: '' }]);

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const text = decoder.decode(value, { stream: true });
                setMessages(prev => {
                    const updated = [...prev];
                    const lastIdx = updated.length - 1;
                    updated[lastIdx] = {
                        ...updated[lastIdx],
                        content: updated[lastIdx].content + text
                    };
                    return updated;
                });
            }
        } catch (err) {
            setMessages([...newMessages, { role: 'assistant', content: 'Sorry, I am having trouble connecting to the server. Is the backend running?' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '600px', padding: 0, overflow: 'hidden' }}>

            {/* Header */}
            <div style={{ background: 'var(--primary-color)', color: 'white', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Bot size={28} />
                <div>
                    <h3 style={{ color: 'white', margin: 0 }}>Smart Assistant</h3>
                    <p style={{ fontSize: '0.85rem', opacity: 0.9 }}>Hyper-personalized recipe & grocery expert</p>
                </div>
                <div style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={14} />
                    {currentCartItems.length} items in cart context
                </div>
            </div>

            {/* Chat History */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--background)' }}>
                {messages.map((msg, idx) => (
                    <div key={idx} style={{
                        display: 'flex',
                        gap: '1rem',
                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '85%'
                    }}>
                        {msg.role === 'assistant' && (
                            <div style={{ background: 'var(--secondary-color)', color: 'var(--primary-color)', padding: '0.5rem', borderRadius: '50%', height: 'fit-content' }}>
                                <Bot size={20} />
                            </div>
                        )}

                        <div style={{
                            background: msg.role === 'user' ? 'var(--primary-color)' : 'var(--surface)',
                            color: msg.role === 'user' ? 'white' : 'var(--text-main)',
                            padding: '1rem 1.25rem',
                            borderRadius: 'var(--radius-lg)',
                            borderBottomRightRadius: msg.role === 'user' ? '4px' : 'var(--radius-lg)',
                            borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : 'var(--radius-lg)',
                            boxShadow: 'var(--shadow-sm)',
                            border: msg.role === 'assistant' ? '1px solid var(--border-light)' : 'none',
                            whiteSpace: msg.role === 'user' ? 'pre-wrap' : 'normal',
                            lineHeight: 1.5
                        }}>
                            {msg.role === 'assistant' ? (
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                            ) : (
                                msg.content
                            )}
                        </div>

                        {msg.role === 'user' && (
                            <div style={{ background: 'var(--border-light)', color: 'var(--text-muted)', padding: '0.5rem', borderRadius: '50%', height: 'fit-content' }}>
                                <User size={20} />
                            </div>
                        )}
                    </div>
                ))}
                {loading && (
                    <div style={{ display: 'flex', gap: '1rem', alignSelf: 'flex-start' }}>
                        <div style={{ background: 'var(--secondary-color)', color: 'var(--primary-color)', padding: '0.5rem', borderRadius: '50%', height: 'fit-content' }}>
                            <Bot size={20} />
                        </div>
                        <div style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                            <Loader2 className="animate-spin" size={16} /> Thinking about your groceries...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} style={{ padding: '1.25rem', borderTop: '1px solid var(--border-light)', background: 'var(--surface)', display: 'flex', gap: '0.75rem' }}>
                <input
                    type="text"
                    placeholder="Ask for a recipe or grocery advice..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={loading}
                    style={{ flex: 1, padding: '1rem', borderRadius: 'var(--radius-lg)' }}
                />
                <button type="submit" disabled={loading || !input.trim()} style={{ borderRadius: 'var(--radius-lg)', padding: '1rem', width: '3.5rem' }}>
                    <Send size={20} />
                </button>
            </form>

        </div>
    );
}
