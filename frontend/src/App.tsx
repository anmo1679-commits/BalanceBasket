import { useState } from 'react'
import { Search, ShoppingCart, Leaf, Users, Bot, UtensilsCrossed } from 'lucide-react'
import './App.css'
import SearchTool from './components/SearchTool'
import ListOptimizer from './components/ListOptimizer'
import SeasonalDashboard from './components/SeasonalDashboard'
import CommunityMeals from './components/CommunityMeals'
import AIAssistant from './components/AIAssistant'

function App() {
  const [activeTab, setActiveTab] = useState('search')
  const [cartItems, setCartItems] = useState<string[]>([])
  const [diet, setDiet] = useState<string>('None')

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <h1>
          <Leaf color="var(--primary-color)" />
          BalanceBasket
        </h1>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, marginTop: '2rem' }}>
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
            className={`nav-item ${activeTab === 'community' ? 'active' : ''}`}
            onClick={() => setActiveTab('community')}
          >
            <Users size={20} />
            Community Meals
          </div>

          <div
            className={`nav-item ${activeTab === 'assistant' ? 'active' : ''}`}
            onClick={() => setActiveTab('assistant')}
            style={{ marginTop: '0.5rem', border: '1px solid var(--primary-color)', color: activeTab === 'assistant' ? 'white' : 'var(--primary-color)', background: activeTab === 'assistant' ? 'var(--primary-color)' : 'transparent' }}
          >
            <Bot size={20} />
            Smart Assistant
          </div>
        </nav>

        <div style={{ marginTop: 'auto', padding: '1rem', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
             <UtensilsCrossed size={16} />
             <span>Dietary Profile</span>
          </div>
          <select 
             value={diet} 
             onChange={(e) => setDiet(e.target.value)}
             style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', background: 'var(--background)' }}
          >
             <option value="None">None</option>
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
        </div>

      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="header-section">
          <h2>
            {activeTab === 'search' && "Find the Best Deals"}
            {activeTab === 'cart' && "Optimize Your Grocery List"}
            {activeTab === 'seasonal' && "Fresh Seasonal Produce"}
            {activeTab === 'community' && "Community Meals & Ratings"}
            {activeTab === 'assistant' && "BalanceBasket AI Assistant"}
          </h2>
          <p>
            {activeTab === 'search' && "Search for products and instantly compare prices across 7 different stores."}
            {activeTab === 'cart' && "Add items to your list and we'll calculate the exact cheapest store for your entire haul."}
            {activeTab === 'seasonal' && "Discover what's fresh and in-season this month based on your local dataset."}
            {activeTab === 'community' && "Explore budget-friendly meals submitted by the community, or share your own!"}
            {activeTab === 'assistant' && "Ask for personalized recipes, budget tips, and healthy dietary advice based directly on the items in your Smart Cart!"}
          </p>
        </header>

        {/* Tab Content Areas */}
        <section className="tab-content">
          {activeTab === 'search' && (
            <SearchTool diet={diet} />
          )}

          {activeTab === 'cart' && (
            <ListOptimizer items={cartItems} setItems={setCartItems} diet={diet} />
          )}

          {activeTab === 'seasonal' && (
            <SeasonalDashboard diet={diet} />
          )}

          {activeTab === 'community' && (
            <CommunityMeals diet={diet} />
          )}

          {activeTab === 'assistant' && (
            <AIAssistant currentCartItems={cartItems} diet={diet} />
          )}
        </section>
      </main>
    </div>
  )
}

export default App
