import { useState } from 'react'
import { Search, ShoppingCart, Leaf, Users, Bot, LogOut } from 'lucide-react'
import logoImage from './assets/Logo.png'
import './App.css'
import SearchTool from './components/SearchTool'
import ListOptimizer from './components/ListOptimizer'
import SeasonalDashboard from './components/SeasonalDashboard'
import CommunityMeals from './components/CommunityMeals'
import AIAssistant from './components/AIAssistant'
import AuthScreen from './components/AuthScreen'

function App() {
  const [activeTab, setActiveTab] = useState('search')
  const [cartItems, setCartItems] = useState<string[]>([])
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))

  const handleLogin = (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };



  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <h1>
          <img src={logoImage} alt="BalanceBasket Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
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

        <div className="nav-item" style={{ marginTop: 'auto' }} onClick={handleLogout}>
          <LogOut size={20} />
          Sign Out
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
            <SearchTool />
          )}

          {activeTab === 'cart' && (
            <ListOptimizer items={cartItems} setItems={setCartItems} />
          )}

          {activeTab === 'seasonal' && (
            <SeasonalDashboard />
          )}

          {activeTab === 'community' && (
            <CommunityMeals />
          )}

          {activeTab === 'assistant' && (
            <AIAssistant currentCartItems={cartItems} />
          )}
        </section>
      </main>
    </div>
  )
}

export default App
