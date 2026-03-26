import { useState } from 'react'
import { Search, ShoppingCart, Leaf, Users, LogOut } from 'lucide-react'
import './App.css'
import SearchTool from './components/SearchTool'
import ListOptimizer from './components/ListOptimizer'
import SeasonalDashboard from './components/SeasonalDashboard'
import CommunityMeals from './components/CommunityMeals'

function App() {
  const [activeTab, setActiveTab] = useState('search')

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
        </nav>

        <div className="nav-item" style={{ marginTop: 'auto' }}>
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
          </h2>
          <p>
            {activeTab === 'search' && "Search for products and instantly compare prices across 7 different stores."}
            {activeTab === 'cart' && "Add items to your list and we'll calculate the exact cheapest store for your entire haul."}
            {activeTab === 'seasonal' && "Discover what's fresh and in-season this month based on your local dataset."}
            {activeTab === 'community' && "Explore budget-friendly meals submitted by the community, or share your own!"}
          </p>
        </header>

        {/* Tab Content Areas */}
        <section className="tab-content">
          {activeTab === 'search' && (
            <SearchTool />
          )}

          {activeTab === 'cart' && (
            <ListOptimizer />
          )}

          {activeTab === 'seasonal' && (
            <SeasonalDashboard />
          )}

          {activeTab === 'community' && (
            <CommunityMeals />
          )}
        </section>
      </main>
    </div>
  )
}

export default App
