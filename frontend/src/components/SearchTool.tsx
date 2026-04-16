import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Loader2, Store, X, ShoppingCart, ChevronRight, Flame, Beef, Wheat, Droplet, Leaf, ArrowRight } from 'lucide-react';
import { API_URL } from '../config';

interface PriceResult {
    product_name: string;
    cheapest_option: string;
    cheapest_price: number;
    prices: Record<string, number>;
    // dietary flags
    vegan?: boolean;
    vegetarian?: boolean;
    gluten_free?: boolean;
    dairy_free?: boolean;
    organic?: boolean;
    kosher?: boolean;
    // nutrition
    calories?: number;
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
    sugar_g?: number;
    fiber_g?: number;
    sodium_mg?: number;
    // metadata
    brand?: string;
    size?: string;
    category?: string;
    image_url?: string;
}

const DEBOUNCE_MS = 400;

// ── Emoji picker ─────────────────────────────────────────────────────────────────

const EMOJI_MAP: Array<{ keywords: string[]; emoji: string; bg: string }> = [
    // Produce & fruit
    { keywords: ['apple','apples'],            emoji: '🍎', bg: '#fee2e2' },
    { keywords: ['banana','bananas'],          emoji: '🍌', bg: '#fef9c3' },
    { keywords: ['orange','citrus'],           emoji: '🍊', bg: '#fed7aa' },
    { keywords: ['strawberry','strawberries'], emoji: '🍓', bg: '#fce7f3' },
    { keywords: ['blueberry','blueberries'],   emoji: '🫐', bg: '#ede9fe' },
    { keywords: ['grape','grapes','raisin'],   emoji: '🍇', bg: '#f3e8ff' },
    { keywords: ['watermelon'],                emoji: '🍉', bg: '#dcfce7' },
    { keywords: ['peach','nectarine'],         emoji: '🍑', bg: '#fed7aa' },
    { keywords: ['mango'],                     emoji: '🥭', bg: '#fef9c3' },
    { keywords: ['pineapple'],                 emoji: '🍍', bg: '#fef9c3' },
    { keywords: ['coconut'],                   emoji: '🥥', bg: '#f0fdf4' },
    { keywords: ['lemon','lime'],              emoji: '🍋', bg: '#fef9c3' },
    { keywords: ['cherry','cherries'],         emoji: '🍒', bg: '#fce7f3' },
    { keywords: ['pear'],                      emoji: '🍐', bg: '#d9f99d' },
    { keywords: ['avocado'],                   emoji: '🥑', bg: '#d1fae5' },
    { keywords: ['tomato','tomatoes'],         emoji: '🍅', bg: '#fee2e2' },
    { keywords: ['carrot','carrots'],          emoji: '🥕', bg: '#fed7aa' },
    { keywords: ['broccoli'],                  emoji: '🥦', bg: '#dcfce7' },
    { keywords: ['corn'],                      emoji: '🌽', bg: '#fef9c3' },
    { keywords: ['pepper','peppers','chili','jalapeño'], emoji: '🌶️', bg: '#fee2e2' },
    { keywords: ['cucumber'],                  emoji: '🥒', bg: '#d1fae5' },
    { keywords: ['eggplant','aubergine'],      emoji: '🍆', bg: '#ede9fe' },
    { keywords: ['potato','potatoes'],         emoji: '🥔', bg: '#fef3c7' },
    { keywords: ['onion','onions'],            emoji: '🧅', bg: '#fef9c3' },
    { keywords: ['garlic'],                    emoji: '🧄', bg: '#f5f5f4' },
    { keywords: ['mushroom','mushrooms'],      emoji: '🍄', bg: '#fef3c7' },
    { keywords: ['spinach','kale','lettuce','arugula','greens'], emoji: '🥬', bg: '#dcfce7' },
    { keywords: ['celery'],                    emoji: '🌿', bg: '#d1fae5' },
    // Dairy
    { keywords: ['milk','oat milk','almond milk','soy milk'], emoji: '🥛', bg: '#f0f9ff' },
    { keywords: ['cheese','cheddar','mozzarella','parmesan','brie'], emoji: '🧀', bg: '#fef9c3' },
    { keywords: ['butter'],                    emoji: '🧈', bg: '#fef9c3' },
    { keywords: ['yogurt','yoghurt'],          emoji: '🍦', bg: '#f0f9ff' },
    { keywords: ['cream','creamer'],           emoji: '🫙', bg: '#f0f9ff' },
    { keywords: ['egg','eggs'],                emoji: '🥚', bg: '#fef9c3' },
    { keywords: ['ice cream','gelato','frozen dessert'], emoji: '🍨', bg: '#f0f9ff' },
    // Meat & protein
    { keywords: ['chicken'],                   emoji: '🍗', bg: '#fef3c7' },
    { keywords: ['beef','steak','ribeye','sirloin','brisket'], emoji: '🥩', bg: '#fee2e2' },
    { keywords: ['pork','bacon','ham','sausage'], emoji: '🥓', bg: '#fce7f3' },
    { keywords: ['turkey'],                    emoji: '🦃', bg: '#fed7aa' },
    { keywords: ['lamb'],                      emoji: '🐑', bg: '#f1f5f9' },
    { keywords: ['salmon','shrimp','tuna','fish','seafood','lobster','scallop'], emoji: '🐟', bg: '#e0f2fe' },
    { keywords: ['hot dog'],                   emoji: '🌭', bg: '#fed7aa' },
    // Bread & bakery
    { keywords: ['bread','loaf','baguette','sourdough'], emoji: '🍞', bg: '#fef3c7' },
    { keywords: ['bagel'],                     emoji: '🥯', bg: '#fef3c7' },
    { keywords: ['tortilla','wrap'],           emoji: '🫓', bg: '#fef9c3' },
    { keywords: ['croissant','pastry'],        emoji: '🥐', bg: '#fef3c7' },
    { keywords: ['muffin','cupcake'],          emoji: '🧁', bg: '#fce7f3' },
    { keywords: ['cake','pie'],                emoji: '🎂', bg: '#fce7f3' },
    { keywords: ['cookie','biscuit','brownie'],emoji: '🍪', bg: '#fef3c7' },
    { keywords: ['donut','doughnut'],          emoji: '🍩', bg: '#fce7f3' },
    { keywords: ['waffle'],                    emoji: '🧇', bg: '#fef3c7' },
    { keywords: ['pancake'],                   emoji: '🥞', bg: '#fef3c7' },
    // Pantry staples
    { keywords: ['pasta','spaghetti','penne','linguine','noodle'], emoji: '🍝', bg: '#fef9c3' },
    { keywords: ['rice'],                      emoji: '🍚', bg: '#f1f5f9' },
    { keywords: ['oats','oatmeal','granola','cereal'], emoji: '🥣', bg: '#fef9c3' },
    { keywords: ['beans','lentils','chickpeas','legume'], emoji: '🫘', bg: '#fef3c7' },
    { keywords: ['peanut butter','almond butter','nut butter'], emoji: '🥜', bg: '#fef3c7' },
    { keywords: ['honey'],                     emoji: '🍯', bg: '#fef9c3' },
    { keywords: ['olive oil','avocado oil','vegetable oil','oil'], emoji: '🫒', bg: '#d1fae5' },
    { keywords: ['vinegar','sauce','ketchup','mustard','mayo','salsa','hot sauce'], emoji: '🫙', bg: '#fef3c7' },
    { keywords: ['salt','pepper','spice','seasoning','herbs'], emoji: '🧂', bg: '#f1f5f9' },
    { keywords: ['sugar','syrup','maple'],     emoji: '🍬', bg: '#fce7f3' },
    { keywords: ['flour'],                     emoji: '🌾', bg: '#fef9c3' },
    { keywords: ['chocolate','cocoa'],         emoji: '🍫', bg: '#fef3c7' },
    { keywords: ['candy','gummy','sweet'],     emoji: '🍭', bg: '#fce7f3' },
    { keywords: ['chips','crisps','popcorn','pretzels','crackers'], emoji: '🍿', bg: '#fef9c3' },
    { keywords: ['nuts','almonds','cashews','walnuts','pistachios','pecans'], emoji: '🥜', bg: '#fef3c7' },
    { keywords: ['seeds','chia','flax','hemp'], emoji: '🌰', bg: '#fef3c7' },
    { keywords: ['soup','broth','stock'],      emoji: '🍲', bg: '#fee2e2' },
    { keywords: ['pizza'],                     emoji: '🍕', bg: '#fee2e2' },
    { keywords: ['frozen'],                    emoji: '🧊', bg: '#e0f2fe' },
    // Beverages
    { keywords: ['coffee','espresso','latte'], emoji: '☕', bg: '#fef3c7' },
    { keywords: ['tea','matcha'],              emoji: '🍵', bg: '#d1fae5' },
    { keywords: ['juice','lemonade'],          emoji: '🧃', bg: '#fef9c3' },
    { keywords: ['water','sparkling'],         emoji: '💧', bg: '#e0f2fe' },
    { keywords: ['soda','cola','energy drink','sports drink'], emoji: '🥤', bg: '#e0f2fe' },
    { keywords: ['wine','beer','alcohol'],     emoji: '🍷', bg: '#fce7f3' },
    { keywords: ['smoothie','shake','protein shake'], emoji: '🥤', bg: '#d1fae5' },
    // Health / personal care
    { keywords: ['vitamin','supplement','probiotic'], emoji: '💊', bg: '#f0fdf4' },
    { keywords: ['protein powder'],            emoji: '💪', bg: '#dbeafe' },
];

const CATEGORY_EMOJI_MAP: Record<string, { emoji: string; bg: string }> = {
    'Produce': { emoji: '🥦', bg: '#dcfce7' },
    'Dairy': { emoji: '🥛', bg: '#f0f9ff' },
    'Meat': { emoji: '🥩', bg: '#fee2e2' },
    'Seafood': { emoji: '🐟', bg: '#e0f2fe' },
    'Bakery': { emoji: '🍞', bg: '#fef3c7' },
    'Snacks': { emoji: '🍿', bg: '#fef9c3' },
    'Beverages': { emoji: '🥤', bg: '#e0f2fe' },
    'Frozen': { emoji: '🧊', bg: '#e0f2fe' },
    'Breakfast': { emoji: '🥞', bg: '#fef3c7' },
    'Pasta & Rice': { emoji: '🍝', bg: '#fef9c3' },
    'Canned Goods': { emoji: '🥫', bg: '#fef3c7' },
    'Condiments': { emoji: '🫙', bg: '#fef3c7' },
    'Spreads': { emoji: '🥜', bg: '#fef3c7' },
    'Oils': { emoji: '🫒', bg: '#d1fae5' },
    'Soups': { emoji: '🍲', bg: '#fee2e2' },
    'Nuts': { emoji: '🥜', bg: '#fef3c7' },
};

function getProductEmoji(name: string, category?: string): { emoji: string; bg: string } {
    const nameLower = name.toLowerCase();
    // Try name keywords first (most specific)
    for (const entry of EMOJI_MAP) {
        if (entry.keywords.some(kw => nameLower.includes(kw))) {
            return { emoji: entry.emoji, bg: entry.bg };
        }
    }
    // Fall back to category
    if (category) {
        for (const [cat, val] of Object.entries(CATEGORY_EMOJI_MAP)) {
            if (category.toLowerCase().includes(cat.toLowerCase())) return val;
        }
    }
    // Default
    return { emoji: '🛒', bg: '#f1f5f9' };
}

const DIET_BADGES: { key: keyof PriceResult; label: string; emoji: string; bg: string; color: string }[] = [
    { key: 'vegan',       label: 'Vegan',       emoji: '🌱', bg: '#d4f4dd', color: '#1a6b35' },
    { key: 'vegetarian',  label: 'Vegetarian',  emoji: '🥗', bg: '#e8f8e8', color: '#2e7d32' },
    { key: 'gluten_free', label: 'Gluten-Free', emoji: '🌾', bg: '#fff3e0', color: '#e65100' },
    { key: 'dairy_free',  label: 'Dairy-Free',  emoji: '🥛', bg: '#e3f2fd', color: '#1565c0' },
    { key: 'organic',     label: 'Organic',     emoji: '🌿', bg: '#f1f8e9', color: '#33691e' },
    { key: 'kosher',      label: 'Kosher',      emoji: '✡️',  bg: '#ede7f6', color: '#4527a0' },
];

function DietBadges({ result, activeDiet }: { result: PriceResult; activeDiet: string }) {
    const trueBadges = DIET_BADGES.filter(b => result[b.key] === true);
    if (trueBadges.length === 0) return null;

    const activeDietKey: Record<string, keyof PriceResult> = {
        'Vegan': 'vegan', 'Vegetarian': 'vegetarian',
        'Gluten-Free': 'gluten_free', 'Dairy-Free': 'dairy_free',
        'Organic': 'organic', 'Kosher': 'kosher',
    };
    const highlightKey = activeDietKey[activeDiet];

    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.25rem' }}>
            {trueBadges.map(b => {
                const isActive = b.key === highlightKey;
                return (
                    <span key={b.key} title={b.label} style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                        padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem',
                        fontWeight: isActive ? 700 : 500, background: b.bg, color: b.color,
                        border: isActive ? `2px solid ${b.color}` : '1px solid transparent',
                        boxShadow: isActive ? `0 0 0 2px ${b.bg}` : 'none',
                    }}>
                        {b.emoji} {b.label}
                    </span>
                );
            })}
        </div>
    );
}

// ── Macro ring chart ──────────────────────────────────────────────────────────────

function MacroRing({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
    const total = protein + carbs + fat || 1;
    const proteinPct = (protein / total) * 100;
    const carbsPct = (carbs / total) * 100;
    const fatPct = (fat / total) * 100;

    const r = 40;
    const circ = 2 * Math.PI * r;
    const proteinDash = (proteinPct / 100) * circ;
    const carbsDash   = (carbsPct / 100) * circ;
    const fatDash     = (fatPct / 100) * circ;
    const proteinOffset = 0;
    const carbsOffset   = circ - proteinDash;
    const fatOffset     = circ - proteinDash - carbsDash;

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <svg width={100} height={100} viewBox="0 0 100 100" style={{ flexShrink: 0 }}>
                {/* Background */}
                <circle cx={50} cy={50} r={r} fill="none" stroke="var(--border-light)" strokeWidth={14} />
                {/* Protein (blue) */}
                <circle cx={50} cy={50} r={r} fill="none" stroke="#4f8ef7" strokeWidth={14}
                    strokeDasharray={`${proteinDash} ${circ - proteinDash}`}
                    strokeDashoffset={-proteinOffset} strokeLinecap="butt"
                    transform="rotate(-90 50 50)" />
                {/* Carbs (amber) */}
                <circle cx={50} cy={50} r={r} fill="none" stroke="#f59e0b" strokeWidth={14}
                    strokeDasharray={`${carbsDash} ${circ - carbsDash}`}
                    strokeDashoffset={carbsOffset} strokeLinecap="butt"
                    transform="rotate(-90 50 50)" />
                {/* Fat (rose) */}
                <circle cx={50} cy={50} r={r} fill="none" stroke="#f43f5e" strokeWidth={14}
                    strokeDasharray={`${fatDash} ${circ - fatDash}`}
                    strokeDashoffset={fatOffset} strokeLinecap="butt"
                    transform="rotate(-90 50 50)" />
                <text x={50} y={53} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--text-primary)">Macros</text>
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#4f8ef7', display: 'inline-block' }} />
                    <span>Protein <strong>{protein}g</strong> ({Math.round(proteinPct)}%)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                    <span>Carbs <strong>{carbs}g</strong> ({Math.round(carbsPct)}%)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f43f5e', display: 'inline-block' }} />
                    <span>Fat <strong>{fat}g</strong> ({Math.round(fatPct)}%)</span>
                </div>
            </div>
        </div>
    );
}

// ── Nutrient bar ──────────────────────────────────────────────────────────────────

function NutrientBar({ label, value, unit, max, color, icon }: {
    label: string; value: number; unit: string; max: number; color: string; icon: React.ReactNode;
}) {
    const pct = Math.min((value / max) * 100, 100);
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)' }}>
                    {icon}
                    <span>{label}</span>
                </div>
                <strong style={{ color: 'var(--text-primary)' }}>{value}{unit}</strong>
            </div>
            <div style={{ height: 6, background: 'var(--border-light)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{
                    height: '100%', width: `${pct}%`, background: color,
                    borderRadius: 999, transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
                }} />
            </div>
        </div>
    );
}

// ── Health score ──────────────────────────────────────────────────────────────────

function healthScore(r: PriceResult): { score: number; label: string; color: string } {
    let score = 50;
    const calories = r.calories ?? 0;
    const protein  = r.protein_g ?? 0;
    const fiber    = r.fiber_g ?? 0;
    const sugar    = r.sugar_g ?? 0;
    const sodium   = r.sodium_mg ?? 0;
    const fat      = r.fat_g ?? 0;

    // Reward protein & fiber, penalise sugar, sodium, fat (rough heuristic)
    score += Math.min(protein * 1.5, 20);
    score += Math.min(fiber * 3, 15);
    score -= Math.min(sugar * 0.8, 20);
    score -= Math.min(sodium / 50, 20);
    score -= Math.min(Math.max(0, fat - 5) * 0.5, 10);
    if (calories < 60) score += 5;
    if (r.organic) score += 8;
    if (r.vegan || r.vegetarian) score += 5;

    const clamped = Math.max(0, Math.min(100, Math.round(score)));
    if (clamped >= 75) return { score: clamped, label: 'Excellent', color: '#22c55e' };
    if (clamped >= 55) return { score: clamped, label: 'Good',      color: '#84cc16' };
    if (clamped >= 35) return { score: clamped, label: 'Fair',      color: '#f59e0b' };
    return { score: clamped, label: 'Indulge',  color: '#f43f5e' };
}

// ── Detail Panel ──────────────────────────────────────────────────────────────────

function ProductDetailPanel({ product, diet, onClose, onAddToList }: {
    product: PriceResult;
    diet: string;
    onClose: () => void;
    onAddToList?: (name: string) => void;
}) {
    const hs = healthScore(product);
    const hasNutrition = (product.calories ?? 0) > 0 || (product.protein_g ?? 0) > 0;

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    return (
        <>
            {/* Backdrop */}
            <div onClick={onClose} style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
                zIndex: 100, backdropFilter: 'blur(3px)',
                animation: 'fadeIn 0.2s ease',
            }} />

            {/* Drawer */}
            <div style={{
                position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(480px, 100vw)',
                background: 'var(--background)', zIndex: 101, overflowY: 'auto',
                boxShadow: '-8px 0 40px rgba(0,0,0,0.25)',
                animation: 'slideInRight 0.3s cubic-bezier(0.4,0,0.2,1)',
                display: 'flex', flexDirection: 'column',
            }}>
                {/* Hero area */}
                <div style={{
                    background: 'linear-gradient(135deg, var(--primary-color) 0%, #16a34a 100%)',
                    padding: '1.5rem', position: 'relative', minHeight: 160,
                    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                }}>
                    <button onClick={onClose} style={{
                        position: 'absolute', top: '1rem', right: '1rem',
                        background: 'rgba(255,255,255,0.2)', border: 'none',
                        borderRadius: '50%', width: 36, height: 36, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', backdropFilter: 'blur(6px)',
                    }}>
                        <X size={18} />
                    </button>

                    {/* Emoji avatar in hero */}
                    {(() => { const { emoji } = getProductEmoji(product.product_name, product.category); return (
                        <div style={{
                            position: 'absolute', top: '1rem', left: '1rem',
                            width: 72, height: 72, borderRadius: 14,
                            background: 'rgba(255,255,255,0.18)',
                            backdropFilter: 'blur(8px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '2.4rem',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                        }}>{emoji}</div>
                    ); })()}

                    <div style={{ marginTop: '4.5rem' }}>
                        {product.category && (
                            <span style={{
                                fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em',
                                textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)',
                                marginBottom: '0.35rem', display: 'block',
                            }}>{product.category}</span>
                        )}
                        <h2 style={{ color: '#fff', fontSize: '1.25rem', margin: 0, lineHeight: 1.3 }}>
                            {product.product_name}
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.4rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)' }}>
                            {product.brand && product.brand !== 'Generic' && <span>{product.brand}</span>}
                            {product.size && <span>· {product.size}</span>}
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>

                    {/* Best price + Add CTA */}
                    <div style={{
                        background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
                        padding: '1rem 1.25rem', display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between', border: '1px solid var(--border-light)',
                    }}>
                        <div>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>Best price at</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary-color)', fontWeight: 800, fontSize: '1.3rem' }}>
                                <Store size={16} />
                                {product.cheapest_option}
                            </div>
                            <p style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0.1rem 0 0', color: 'var(--text-primary)' }}>
                                ${product.cheapest_price.toFixed(2)}
                            </p>
                        </div>
                        {onAddToList && (
                            <button
                                id={`add-to-list-${product.product_name.replace(/\s+/g, '-').toLowerCase()}`}
                                onClick={() => onAddToList(product.product_name)}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.1rem', fontSize: '0.88rem' }}>
                                <ShoppingCart size={16} /> Add to List
                            </button>
                        )}
                    </div>

                    {/* Health score */}
                    <div style={{
                        background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
                        padding: '1rem 1.25rem', border: '1px solid var(--border-light)',
                        display: 'flex', alignItems: 'center', gap: '1rem',
                    }}>
                        <div style={{
                            width: 56, height: 56, borderRadius: '50%',
                            background: `conic-gradient(${hs.color} ${hs.score * 3.6}deg, var(--border-light) 0deg)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <div style={{
                                width: 44, height: 44, borderRadius: '50%',
                                background: 'var(--surface)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 800, fontSize: '0.9rem', color: hs.color,
                            }}>{hs.score}</div>
                        </div>
                        <div>
                            <p style={{ margin: 0, fontWeight: 700, color: hs.color, fontSize: '1rem' }}>
                                Health Score: {hs.label}
                            </p>
                            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                Based on protein, fiber, sugar & sodium content
                            </p>
                        </div>
                    </div>

                    {/* Diet badges */}
                    <div>
                        <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', margin: '0 0 0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Dietary</p>
                        <DietBadges result={product} activeDiet={diet} />
                        {DIET_BADGES.filter(b => product[b.key]).length === 0 && (
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>No dietary certifications noted.</p>
                        )}
                    </div>

                    {/* Nutrition facts */}
                    {hasNutrition && (
                        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
                            <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>Nutrition Facts</p>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>per 100g / serving</span>
                            </div>
                            <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {/* Calorie highlight */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.65rem 0.9rem', background: 'rgba(var(--primary-rgb,34,197,94),0.07)', borderRadius: 'var(--radius-md)' }}>
                                    <Flame size={18} color="#f59e0b" />
                                    <span style={{ fontSize: '0.92rem', fontWeight: 600 }}>{product.calories ?? 0} kcal</span>
                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>Calories</span>
                                </div>

                                {/* Macro ring */}
                                <MacroRing
                                    protein={product.protein_g ?? 0}
                                    carbs={product.carbs_g ?? 0}
                                    fat={product.fat_g ?? 0}
                                />

                                {/* Individual bars */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <NutrientBar label="Fiber" value={product.fiber_g ?? 0} unit="g" max={15} color="#22c55e" icon={<Leaf size={13} />} />
                                    <NutrientBar label="Sugar" value={product.sugar_g ?? 0} unit="g" max={50} color="#f59e0b" icon={<Wheat size={13} />} />
                                    <NutrientBar label="Sodium" value={product.sodium_mg ?? 0} unit="mg" max={2300} color="#f43f5e" icon={<Droplet size={13} />} />
                                    <NutrientBar label="Protein" value={product.protein_g ?? 0} unit="g" max={50} color="#4f8ef7" icon={<Beef size={13} />} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Store price breakdown */}
                    <div>
                        <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', margin: '0 0 0.65rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Prices across stores
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                            {Object.entries(product.prices)
                                .sort((a, b) => a[1] - b[1])
                                .map(([storeName, price]) => {
                                    const isCheapest = storeName === product.cheapest_option;
                                    const maxPrice = Math.max(...Object.values(product.prices));
                                    const pct = (price / maxPrice) * 100;
                                    return (
                                        <div key={storeName} style={{
                                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                                            padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)',
                                            background: isCheapest ? 'rgba(34,197,94,0.08)' : 'transparent',
                                            border: isCheapest ? '1px solid rgba(34,197,94,0.25)' : '1px solid transparent',
                                        }}>
                                            <span style={{ width: 110, fontSize: '0.85rem', fontWeight: isCheapest ? 700 : 400 }}>
                                                {isCheapest ? '🏆 ' : ''}{storeName}
                                            </span>
                                            <div style={{ flex: 1, height: 6, background: 'var(--border-light)', borderRadius: 999, overflow: 'hidden' }}>
                                                <div style={{
                                                    height: '100%', width: `${pct}%`,
                                                    background: isCheapest ? 'var(--primary-color)' : 'var(--text-muted)',
                                                    borderRadius: 999, opacity: isCheapest ? 1 : 0.45,
                                                }} />
                                            </div>
                                            <span style={{ fontSize: '0.88rem', fontWeight: isCheapest ? 700 : 400, color: isCheapest ? 'var(--primary-color)' : 'var(--text-primary)', minWidth: 48, textAlign: 'right' }}>
                                                ${price.toFixed(2)}
                                            </span>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </>
    );
}

// ── Main component ────────────────────────────────────────────────────────────────

export default function SearchTool({ diet, onAddToList }: { diet: string; onAddToList?: (name: string) => void }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<PriceResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selected, setSelected] = useState<PriceResult | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const executeSearch = useCallback(async (searchQuery: string, searchDiet: string) => {
        if (!searchQuery.trim()) return;
        setLoading(true);
        setError('');
        try {
            const response = await fetch(
                `${API_URL}/api/products/search?q=${encodeURIComponent(searchQuery)}&diet=${encodeURIComponent(searchDiet)}`
            );
            if (!response.ok) throw new Error('Failed to fetch data');
            const data = await response.json();
            setResults(data);
            if (data.length === 0) setError('No items found matching your search.');
        } catch (err) {
            setError('Error connecting to the database. Make sure the backend is running!');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (query.trim()) executeSearch(query, diet);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [diet]);

    const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (val.trim().length >= 2) {
            setLoading(true);
            debounceRef.current = setTimeout(() => executeSearch(val, diet), DEBOUNCE_MS);
        } else {
            setLoading(false);
            setResults([]);
            setError('');
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (debounceRef.current) clearTimeout(debounceRef.current);
        executeSearch(query, diet);
    };

    const isHero = !query && results.length === 0 && !loading;
    const activeDietLabel = diet !== 'None' ? diet : null;

    return (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: isHero ? '0' : '2rem',
            minHeight: isHero ? '70vh' : 'auto',
            justifyContent: isHero ? 'center' : 'flex-start',
            transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
            {/* Hero Section */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                padding: isHero ? '2rem 0' : '0',
                marginBottom: isHero ? '2rem' : '1.5rem',
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isHero ? 'scale(1)' : 'scale(0.9)',
                transformOrigin: 'top center',
                opacity: isHero ? 1 : 1, // Keep it visible but small
            }}>
                <img 
                    src="/logo.png" 
                    alt="BalanceBasket Logo" 
                    style={{ 
                        width: isHero ? '180px' : '64px',
                        height: isHero ? '180px' : '64px',
                        marginBottom: isHero ? '1.5rem' : '0.5rem',
                        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                        filter: 'drop-shadow(0 10px 20px rgba(46, 125, 50, 0.15))'
                    }} 
                />
                <h1 style={{ 
                    fontSize: isHero ? '2.5rem' : '1.25rem', 
                    color: 'var(--primary-color)',
                    margin: 0,
                    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    fontWeight: 800,
                    letterSpacing: '-0.02em'
                }}>
                    BalanceBasket
                </h1>
                <p style={{ 
                    fontSize: isHero ? '1.1rem' : '0.85rem', 
                    color: 'var(--text-muted)',
                    margin: isHero ? '0.5rem 0 2rem' : '0 0 1rem',
                    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    maxWidth: '500px',
                    opacity: isHero ? 0.8 : 0
                }}>
                    The smartest way to compare grocery prices and eat healthy on a budget.
                </p>
            </div>

            <form onSubmit={handleSearch} style={{ 
                position: 'relative',
                maxWidth: isHero ? '700px' : '100%',
                width: '100%',
                margin: isHero ? '0 auto' : '0',
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isHero ? '0 20px 50px rgba(0,0,0,0.08)' : 'none',
                borderRadius: 'var(--radius-lg)'
            }}>
                <input
                    id="product-search-input"
                    type="text"
                    placeholder="Search for grocery items (e.g., 'milk', 'cheese')"
                    value={query}
                    onChange={handleQueryChange}
                    style={{ 
                        paddingLeft: '3.5rem', 
                        fontSize: isHero ? '1.25rem' : '1rem', 
                        height: isHero ? '4.5rem' : '3.5rem',
                        borderRadius: 'var(--radius-lg)',
                        border: '2px solid transparent',
                        background: 'white',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
                    }}
                    onFocus={(e) => {
                        e.target.style.borderColor = 'var(--primary-color)';
                        e.target.style.boxShadow = '0 0 0 4px rgba(46, 125, 50, 0.15)';
                    }}
                    onBlur={(e) => {
                        e.target.style.borderColor = 'transparent';
                        e.target.style.boxShadow = isHero ? '0 20px 50px rgba(0,0,0,0.08)' : '0 4px 15px rgba(0,0,0,0.03)';
                    }}
                />
                <Search style={{ 
                    position: 'absolute', 
                    left: '1.25rem', 
                    top: isHero ? '1.45rem' : '1rem', 
                    color: 'var(--primary-color)',
                    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                }} size={isHero ? 28 : 24} />
                
                <button type="submit" disabled={loading} style={{ 
                    position: 'absolute', 
                    right: '0.75rem', 
                    top: '0.75rem', 
                    bottom: '0.75rem',
                    padding: '0 1.5rem',
                    fontSize: '1rem',
                    fontWeight: 700,
                    borderRadius: 'var(--radius-md)'
                }}>
                    {loading ? <Loader2 className="animate-spin" size={20} /> : 'Compare Deals'}
                </button>
            </form>

            <div style={{ 
                opacity: isHero ? 0 : 1,
                transform: isHero ? 'translateY(40px)' : 'translateY(0)',
                transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                pointerEvents: isHero ? 'none' : 'auto',
                marginTop: isHero ? '0' : '2rem'
            }}>
                {activeDietLabel && results.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                        <span>Filtered by:</span>
                        <span style={{ padding: '0.2rem 0.75rem', background: 'var(--primary-color)', color: '#fff', borderRadius: '999px', fontWeight: 600, fontSize: '0.8rem' }}>
                            {activeDietLabel}
                        </span>
                        <span>· {results.length} result{results.length !== 1 ? 's' : ''}</span>
                    </div>
                )}

                {error && <p style={{ color: 'var(--danger)', fontWeight: 500 }}>{error}</p>}

                <div style={{ display: 'grid', gap: '1rem' }}>
                    {results.map((result, idx) => (
                        <div
                            key={idx}
                            id={`search-result-${idx}`}
                            className="card"
                            onClick={() => setSelected(result)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '1.25rem',
                                cursor: 'pointer', transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                                padding: '1rem 1.25rem',
                            }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)';
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLDivElement).style.transform = '';
                                (e.currentTarget as HTMLDivElement).style.boxShadow = '';
                            }}
                        >
                            {/* Emoji avatar */}
                            {(() => { const { emoji, bg } = getProductEmoji(result.product_name, result.category); return (
                                <div style={{
                                    width: 56, height: 56, borderRadius: 12, flexShrink: 0,
                                    background: bg,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.75rem',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                                }}>{emoji}</div>
                            ); })()}

                            {/* Name + badges */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <h3 style={{ fontSize: '1rem', color: 'var(--primary-color)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {result.product_name}
                                </h3>
                                {result.brand && result.brand !== 'Generic' && (
                                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.1rem 0 0' }}>{result.brand}{result.size ? ` · ${result.size}` : ''}</p>
                                )}
                                <DietBadges result={result} activeDiet={diet} />
                            </div>

                            {/* Calories pill */}
                            {(result.calories ?? 0) > 0 && (
                                <div style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                                    background: 'var(--surface)', borderRadius: 'var(--radius-md)',
                                    padding: '0.35rem 0.7rem', flexShrink: 0, border: '1px solid var(--border-light)',
                                }}>
                                    <Flame size={13} color="#f59e0b" />
                                    <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>{result.calories}</span>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>kcal</span>
                                </div>
                            )}

                            {/* Best price */}
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{result.cheapest_option}</span>
                                <span style={{ color: 'var(--primary-color)', fontWeight: 800, fontSize: '1.1rem' }}>${result.cheapest_price.toFixed(2)}</span>
                            </div>

                            <ChevronRight size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Detail panel */}
            {selected && (
                <ProductDetailPanel
                    product={selected}
                    diet={diet}
                    onClose={() => setSelected(null)}
                    onAddToList={onAddToList}
                />
            )}
        </div>
    );
}
