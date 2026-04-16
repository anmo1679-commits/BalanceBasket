import { useState } from 'react'
import { Search, ShoppingCart, Leaf, Users, Bot, UtensilsCrossed, PackageOpen } from 'lucide-react'
import './App.css'
import SearchTool from './components/SearchTool'
import ListOptimizer from './components/ListOptimizer'
import SeasonalDashboard from './components/SeasonalDashboard'
import CommunityMeals from './components/CommunityMeals'
import AIAssistant from './components/AIAssistant'
import PantryManager, { type PantryItem } from './components/PantryManager'
import { useEffect } from 'react'

function App() {
  const [activeTab, setActiveTab] = useState('search')
  const [cartItems, setCartItems] = useState<string[]>([])
  const [diet, setDiet] = useState<string>('None')
  
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([])
  const [loadingPantry, setLoadingPantry] = useState(true)

  const fetchPantry = async () => {
      setLoadingPantry(true);
      try {
          const res = await fetch('http://localhost:8000/api/pantry');
          if (res.ok) {
              const data = await res.json();
              setPantryItems(data);
          }
      } finally {
          setLoadingPantry(false);
      }
  };

  useEffect(() => {
      fetchPantry();
  }, []);

  const handleAddPantryItem = async (name: string, quantity: string) => {
      await fetch('http://localhost:8000/api/pantry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, quantity })
      });
      fetchPantry();
  };

  const handleRemovePantryItem = async (id: number) => {
      await fetch(`http://localhost:8000/api/pantry/${id}`, { method: 'DELETE' });
      fetchPantry();
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar glass-panel" style={{ borderLeft: 'none', borderTop: 'none', borderBottom: 'none' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.5rem', marginBottom: '1.5rem' }}>
          <Leaf color="var(--primary-color)" fill="var(--primary-color)" size={28} />
          BalanceBasket
        </h1>

        {/* Dietary Profile Section - Moved Up & Enhanced */}
        <div style={{ 
          marginBottom: '2rem', 
          padding: '1.25rem', 
          background: 'rgba(var(--primary-rgb), 0.05)', 
          borderRadius: 'var(--radius-lg)', 
          border: '1px solid rgba(var(--primary-rgb), 0.1)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.6rem', 
            marginBottom: '0.85rem', 
            fontSize: '0.8rem', 
            color: 'var(--primary-color)', 
            fontWeight: 800, 
            textTransform: 'uppercase', 
            letterSpacing: '0.08em' 
          }}>
             <UtensilsCrossed size={16} />
             <span>My Preferences</span>
          </div>
          <select 
             value={diet} 
             onChange={(e) => setDiet(e.target.value)}
             style={{ 
               width: '100%', 
               padding: '0.75rem', 
               borderRadius: 'var(--radius-md)', 
               border: '1px solid var(--border-light)', 
               background: 'white', 
               fontWeight: 600,
               fontSize: '0.95rem',
               color: 'var(--text-main)',
               cursor: 'pointer',
               boxShadow: 'var(--shadow-sm)'
             }}
          >
             <option value="None">Standard Diet</option>
             <option value="Vegan">Vegan</option>
             <option value="Vegetarian">Vegetarian</option>
             <option value="Pescatarian">Pescatarian</option>
             <option value="Gluten-Free">Gluten-Free</option>
             <option value="Dairy-Free">Dairy-Free</option>
             <option value="Nut-Free">Nut-Free</option>
             <option value="Shellfish-Free">Shellfish-Free</option>
             <option value="Keto">Keto</option>
             <option value="Paleo">Paleo</option>
          </select>
          {diet !== 'None' && (
            <p style={{ fontSize: '0.75rem', color: 'var(--primary-color)', marginTop: '0.75rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
               <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
               Filtering results for {diet}
            </p>
          )}
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          <div
            className={`nav-item ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            <Search size={20} />
            Search & Price
          </div>

          <div
            className={`nav-item ${activeTab === 'cart' ? 'active' : ''}`}
            onClick={() => setActiveTab('cart')}
          >
            <ShoppingCart size={20} />
            List Optimizer
          </div>

          <div
            className={`nav-item ${activeTab === 'seasonal' ? 'active' : ''}`}
            onClick={() => setActiveTab('seasonal')}
          >
            <Leaf size={20} />
            Seasonal Guide
          </div>

          <div
            className={`nav-item ${activeTab === 'pantry' ? 'active' : ''}`}
            onClick={() => setActiveTab('pantry')}
          >
            <PackageOpen size={20} />
            My Pantry
          </div>

          <div
            className={`nav-item ${activeTab === 'community' ? 'active' : ''}`}
            onClick={() => setActiveTab('community')}
          >
            <Users size={20} />
            Community Meals
          </div>

          <div
            className={`nav-item ${activeTab === 'assistant' ? 'active' : ''}`}
            onClick={() => setActiveTab('assistant')}
            style={{ 
              marginTop: '0.5rem', 
              border: '1px solid var(--primary-color)', 
              color: activeTab === 'assistant' ? 'white' : 'var(--primary-color)', 
              background: activeTab === 'assistant' ? 'var(--primary-color)' : 'rgba(var(--primary-rgb), 0.05)',
              boxShadow: activeTab === 'assistant' ? '0 4px 15px rgba(var(--primary-rgb), 0.3)' : 'none'
            }}
          >
            <Bot size={20} />
            Smart Assistant
          </div>
        </nav>


      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="header-section">
          {activeTab !== 'search' && (
            <h2>
              {activeTab === 'cart' && "Optimize Your Grocery List"}
              {activeTab === 'seasonal' && "Fresh Seasonal Produce"}
              {activeTab === 'pantry' && "My Pantry Inventory"}
              {activeTab === 'community' && "Community Meals & Ratings"}
              {activeTab === 'assistant' && "BalanceBasket AI Assistant"}
            </h2>
          )}
          {activeTab !== 'search' && (
            <p>
              {activeTab === 'cart' && "Add items to your list and we'll calculate the exact cheapest store for your entire haul."}
              {activeTab === 'seasonal' && "Shop smarter by buying what's naturally at peak freshness and flavor right now."}
              {activeTab === 'pantry' && "Track what you already have at home to avoid buying duplicates and prevent food waste."}
              {activeTab === 'community' && "Explore budget-friendly meals submitted by the community, or share your own!"}
              {activeTab === 'assistant' && "Ask for personalized recipes, budget tips, and healthy dietary advice based directly on the items in your Smart Cart!"}
            </p>
          )}
        </header>

        {/* Tab Content Areas */}
        <section className="tab-content">
          {activeTab === 'search' && (
            <SearchTool
              diet={diet}
              onAddToList={(item) => {
                if (!cartItems.includes(item)) {
                  setCartItems([...cartItems, item]);
                }
              }}
            />
          )}

          {activeTab === 'cart' && (
            <ListOptimizer 
               items={cartItems} 
               setItems={setCartItems} 
               diet={diet} 
               onSyncPantry={async (itemsToSync) => {
                   await fetch('http://localhost:8000/api/pantry/bulk', {
                       method: 'POST',
                       headers: { 'Content-Type': 'application/json' },
                       body: JSON.stringify({ items: itemsToSync })
                   });
                   fetchPantry();
               }}
            />
          )}

          {activeTab === 'seasonal' && (
            <SeasonalDashboard
              diet={diet}
              cartItems={cartItems}
              onAddToList={(item) => {
                if (!cartItems.includes(item)) {
                  setCartItems([...cartItems, item]);
                }
              }}
            />
          )}

          {activeTab === 'community' && (
            <CommunityMeals diet={diet} />
          )}

          {activeTab === 'pantry' && (
            <PantryManager 
               items={pantryItems} 
               loading={loadingPantry} 
               onAdd={handleAddPantryItem} 
               onRemove={handleRemovePantryItem} 
            />
          )}

          {activeTab === 'assistant' && (
            <AIAssistant currentCartItems={cartItems} diet={diet} pantryItems={pantryItems.map(i => i.name)} />
          )}
        </section>
      </main>
    </div>
  )
}

export default App
