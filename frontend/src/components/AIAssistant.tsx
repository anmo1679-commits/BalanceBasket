import { useState, useRef, useEffect } from 'react';
import { Loader2, MessageSquare, Bot, User, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { API_URL } from '../config';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface AIAssistantProps {
    currentCartItems: string[];
    diet: string;
    pantryItems: string[];
}

const SUGGESTIONS = [
    { label: "What can I cook with my cart?", prompt: "Look at the items currently in my cart and suggest 3 healthy, budget-friendly recipes I can make with them." },
    { label: "Check my diet compatibility", prompt: "Based on my dietary restriction, is everything in my cart safe to eat? Warn me about any specific items." },
    { label: "How to save $10?", prompt: "Look at my cart and suggest 3 swaps or removals that would save me at least $10 without compromising nutrition." },
    { label: "Pantry meal ideas", prompt: "Suggest a meal that uses items from both my cart and my 'My Pantry' list to avoid food waste." }
];

export default function AIAssistant({ currentCartItems, diet, pantryItems }: AIAssistantProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([{
        role: 'assistant',
        content: "Hi! I'm your Smart Assistant. I've synced with your live cart and diet profile. How can I help you eat better and save money today?"
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

    // Pre-warm the AI model when the component mounts
    useEffect(() => {
        fetch(`${API_URL}/api/chat/warmup`, { method: 'POST' }).catch(() => {});
    }, []);

    const performChat = async (userMessage: string) => {
        if (!userMessage.trim() || loading) return;

        const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
        setMessages(newMessages);
        setLoading(true);

        try {
            const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));

            const response = await fetch(`${API_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: apiMessages,
                    cart_items: currentCartItems,
                    diet: diet,
                    pantry_items: pantryItems
                })
            });

            if (!response.ok) throw new Error('API communication failed');
            if (!response.body) throw new Error('No response body');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            // Set up Assistant message placeholder
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
            setMessages([...newMessages, { role: 'assistant', content: "I'm having a bit of trouble connecting to my brain! Please make sure your backend server is running." }]);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        const msg = input;
        setInput('');
        performChat(msg);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '600px', padding: 0, overflow: 'hidden', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>

            {/* --- Header --- */}
            <div style={{ background: 'var(--primary-color)', color: 'white', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Bot size={28} color="white" />
                <div>
                    <h3 style={{ color: 'white', margin: 0, fontSize: '1.1rem' }}>Smart Assistant</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: 0.9 }}>
                            <span style={{ width: 6, height: 6, background: '#4ade80', borderRadius: '50%' }} />
                            <p style={{ margin: 0, fontSize: '0.75rem' }}>Live Context</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Chat Content --- */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--background)' }}>
                {messages.map((msg, idx) => (
                    <div key={idx} style={{
                        display: 'flex',
                        gap: '0.75rem',
                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '85%'
                    }}>
                        {msg.role === 'assistant' && (
                            <div style={{ background: 'var(--primary-color)', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '4px' }}>
                                <Bot size={18} />
                            </div>
                        )}

                        <div style={{
                            background: msg.role === 'user' ? 'linear-gradient(135deg, var(--primary-color) 0%, #16a34a 100%)' : 'var(--glass-bg)',
                            backdropFilter: msg.role === 'assistant' ? 'var(--glass-blur)' : 'none',
                            color: msg.role === 'user' ? 'white' : 'var(--text-main)',
                            padding: '0.85rem 1.15rem',
                            borderRadius: 'var(--radius-lg)',
                            borderBottomRightRadius: msg.role === 'user' ? '4px' : 'var(--radius-lg)',
                            borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : 'var(--radius-lg)',
                            boxShadow: msg.role === 'user' ? '0 4px 15px rgba(var(--primary-rgb), 0.2)' : 'var(--shadow-sm)',
                            border: msg.role === 'assistant' ? '1px solid var(--glass-border)' : 'none',
                            lineHeight: 1.6,
                            fontSize: '0.95rem'
                        }}>
                            {msg.role === 'assistant' ? (
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                            ) : (
                                msg.content
                            )}
                        </div>

                        {msg.role === 'user' && (
                            <div style={{ background: 'var(--border-light)', color: 'var(--text-muted)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '4px' }}>
                                <User size={18} />
                            </div>
                        )}
                    </div>
                ))}
                
                {loading && messages[messages.length-1].content === '' && (
                    <div style={{ display: 'flex', gap: '0.75rem', alignSelf: 'flex-start' }}>
                        <div style={{ background: 'var(--primary-color)', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Bot size={18} />
                        </div>
                        <div style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            <Loader2 className="animate-spin" size={16} /> Thinking...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* --- Input Area --- */}
            <div style={{ borderTop: '1px solid var(--border-light)', padding: '1rem 1.5rem', background: 'var(--surface)' }}>
                
                {/* Suggestions Chips Row */}
                {!input && messages.length <= 1 && (
                    <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.75rem' }}>
                        {SUGGESTIONS.map((s, i) => (
                            <button 
                                key={i} 
                                style={{ 
                                    padding: '0.5rem 0.75rem', 
                                    background: 'var(--secondary-color)', 
                                    border: '1px solid var(--border-light)', 
                                    borderRadius: '20px', 
                                    fontSize: '0.8rem', 
                                    color: 'var(--primary-color)', 
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.3rem'
                                }}
                                onClick={() => performChat(s.prompt)}
                            >
                                <MessageSquare size={14} />
                                {s.label}
                            </button>
                        ))}
                    </div>
                )}

                <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                        type="text"
                        placeholder="Ask for advice..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={loading}
                        style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)' }}
                    />
                    <button type="submit" disabled={loading || !input.trim()} style={{ borderRadius: 'var(--radius-md)', padding: '0.75rem', width: '3rem' }}>
                        <Send size={18} />
                    </button>
                </form>
            </div>

        </div>
    );
}
