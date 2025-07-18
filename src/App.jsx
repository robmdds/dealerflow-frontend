import React, { useState, useEffect } from 'react'

function App() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [authMode, setAuthMode] = useState('login') // 'login' or 'signup'
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')

  // Existing app state
  const [activeTab, setActiveTab] = useState('dashboard')
  const [generatedContent, setGeneratedContent] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedPlatforms, setSelectedPlatforms] = useState(['facebook', 'instagram'])
  const [contentType, setContentType] = useState('vehicle_showcase')
  const [keywords, setKeywords] = useState('')
  const [uploadedImages, setUploadedImages] = useState([])
  const [scrapingConfig, setScrapingConfig] = useState({
    url: '',
    status: 'not_configured'
  })

  // Payment and subscription state
  const [subscriptionPlans, setSubscriptionPlans] = useState({})
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeLoading, setUpgradeLoading] = useState(false)

  const API_BASE_URL = 'https://g8h3ilcv3885.manussite.space'

  // Check authentication on app load
  useEffect(() => {
    checkAuthToken()
    loadSubscriptionPlans()
  }, [])

  // Authentication functions
  const checkAuthToken = async () => {
    const token = localStorage.getItem('dealerflow_token')
    if (!token) {
      setIsAuthenticated(false)
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setIsAuthenticated(true)
        
        // Get subscription info
        await loadUserSubscription(token)
      } else {
        localStorage.removeItem('dealerflow_token')
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      localStorage.removeItem('dealerflow_token')
      setIsAuthenticated(false)
    }
  }

  const loadUserSubscription = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/subscription`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSubscription(data.subscription)
      }
    } catch (error) {
      console.error('Failed to load subscription:', error)
    }
  }

  const loadSubscriptionPlans = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/plans`)
      if (response.ok) {
        const data = await response.json()
        setSubscriptionPlans(data.plans)
      }
    } catch (error) {
      console.error('Failed to load plans:', error)
    }
  }

  const handleLogin = async (email, password) => {
    setAuthLoading(true)
    setAuthError('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (data.success) {
        localStorage.setItem('dealerflow_token', data.token)
        setUser(data.user)
        setIsAuthenticated(true)
        setAuthError('')
        await loadUserSubscription(data.token)
      } else {
        setAuthError(data.error || 'Login failed')
      }
    } catch (error) {
      setAuthError('Network error. Please try again.')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleSignup = async (formData) => {
    setAuthLoading(true)
    setAuthError('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        localStorage.setItem('dealerflow_token', data.token)
        setUser(data.user)
        setIsAuthenticated(true)
        setAuthError('')
        await loadUserSubscription(data.token)
      } else {
        setAuthError(data.error || 'Signup failed')
      }
    } catch (error) {
      setAuthError('Network error. Please try again.')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('dealerflow_token')
      if (token) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('dealerflow_token')
      setIsAuthenticated(false)
      setUser(null)
      setSubscription(null)
    }
  }

  const handleUpgradeSubscription = async (planId) => {
    setUpgradeLoading(true)
    
    try {
      const token = localStorage.getItem('dealerflow_token')
      const response = await fetch(`${API_BASE_URL}/api/payments/subscription/upgrade`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          plan: planId,
          billing_cycle: 'monthly'
        })
      })

      const data = await response.json()

      if (data.success) {
        // In a real implementation, you would integrate with Helcim's payment form here
        // For demo purposes, we'll simulate successful payment
        alert(`Payment setup successful! Plan: ${planId.toUpperCase()}\nAmount: $${data.payment_intent.amount}\nPayment ID: ${data.payment_id}`)
        
        // Reload subscription info
        await loadUserSubscription(token)
        setShowUpgradeModal(false)
      } else {
        alert('Upgrade failed: ' + data.error)
      }
    } catch (error) {
      alert('Network error during upgrade')
    } finally {
      setUpgradeLoading(false)
    }
  }

  // Content generation with authentication
  const generateBulkContent = async () => {
    if (!isAuthenticated) {
      alert('Please log in to generate content')
      return
    }

    setIsGenerating(true)
    
    try {
      const token = localStorage.getItem('dealerflow_token')
      const response = await fetch(`${API_BASE_URL}/api/content/generate-bulk`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content_type: contentType,
          keywords: keywords,
          platforms: selectedPlatforms
        })
      })

      const data = await response.json()

      if (data.success) {
        setGeneratedContent(data.content)
      } else {
        if (data.upgrade_required) {
          alert('This feature requires a paid subscription. Please upgrade your plan.')
          setShowUpgradeModal(true)
        } else {
          alert('Content generation failed: ' + data.error)
        }
      }
    } catch (error) {
      alert('Network error during content generation')
    } finally {
      setIsGenerating(false)
    }
  }

  // Website scraping with authentication
  const setupScraping = async () => {
    if (!isAuthenticated) {
      alert('Please log in to setup scraping')
      return
    }

    if (!scrapingConfig.url) {
      alert('Please enter a website URL')
      return
    }

    try {
      const token = localStorage.getItem('dealerflow_token')
      const response = await fetch(`${API_BASE_URL}/api/scraping/setup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          website_url: scrapingConfig.url
        })
      })

      const data = await response.json()

      if (data.success) {
        setScrapingConfig({
          ...scrapingConfig,
          status: 'configured'
        })
        alert(data.message)
      } else {
        if (data.upgrade_required) {
          alert('Website scraping requires a paid subscription. Please upgrade your plan.')
          setShowUpgradeModal(true)
        } else {
          alert('Scraping setup failed: ' + data.error)
        }
      }
    } catch (error) {
      alert('Network error during scraping setup')
    }
  }

  // Get available platforms based on subscription
  const getAvailablePlatforms = () => {
    if (!subscription || !subscription.features) {
      return ['facebook', 'instagram'] // Trial default
    }
    return subscription.features.platforms || ['facebook', 'instagram']
  }

  // Check if user can access a feature
  const canAccessFeature = (feature) => {
    if (!subscription) return false
    
    const features = subscription.features || {}
    
    switch (feature) {
      case 'youtube':
        return features.platforms?.includes('youtube') || false
      case 'automation':
        return features.automation || false
      case 'analytics':
        return features.analytics || false
      case 'unlimited':
        return features.max_posts_per_month === -1
      default:
        return true
    }
  }

  // Authentication UI
  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          display: 'flex',
          maxWidth: '1200px',
          width: '100%',
          gap: '40px',
          alignItems: 'center'
        }}>
          {/* Video Section - Show on both login and signup */}
          <div style={{
            flex: '1',
            maxWidth: '600px'
          }}>
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '15px',
              padding: '20px',
              backdropFilter: 'blur(10px)'
            }}>
              <h2 style={{
                color: 'white',
                textAlign: 'center',
                marginBottom: '20px',
                fontSize: '24px'
              }}>
                See DealerFlow Pro in Action
              </h2>
              <video
                autoPlay
                loop
                muted
                playsInline
                style={{
                  width: '100%',
                  borderRadius: '10px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                }}
              >
                <source src="/dealerflow_pro_advertisement.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <div style={{
                color: 'white',
                textAlign: 'center',
                marginTop: '15px',
                fontSize: '16px',
                lineHeight: '1.5'
              }}>
                <p style={{ margin: '5px 0' }}>✅ Save Hours of Manual Work</p>
                <p style={{ margin: '5px 0' }}>✅ Professional Content Generation</p>
                <p style={{ margin: '5px 0' }}>✅ Multi-Platform Posting</p>
                <p style={{ margin: '5px 0' }}>✅ Increased Sales & Engagement</p>
                <p style={{ margin: '5px 0' }}>✅ Easy Setup & Management</p>
              </div>
            </div>
          </div>

          {/* Authentication Form */}
          <div style={{
            background: 'white',
            padding: '40px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            width: '100%',
            maxWidth: '400px',
            margin: '0'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ color: '#333', margin: '0 0 10px 0', fontSize: '28px' }}>DealerFlow Pro</h1>
            <p style={{ color: '#666', margin: 0 }}>Automotive Social Media Automation</p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={() => setAuthMode('login')}
              style={{
                padding: '10px 20px',
                marginRight: '10px',
                border: 'none',
                borderRadius: '5px',
                background: authMode === 'login' ? '#667eea' : '#f0f0f0',
                color: authMode === 'login' ? 'white' : '#333',
                cursor: 'pointer'
              }}
            >
              Login
            </button>
            <button
              onClick={() => setAuthMode('signup')}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '5px',
                background: authMode === 'signup' ? '#667eea' : '#f0f0f0',
                color: authMode === 'signup' ? 'white' : '#333',
                cursor: 'pointer'
              }}
            >
              Sign Up
            </button>
          </div>

          {authError && (
            <div style={{
              background: '#fee',
              color: '#c33',
              padding: '10px',
              borderRadius: '5px',
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              {authError}
            </div>
          )}

          {authMode === 'login' ? (
            <LoginForm onLogin={handleLogin} loading={authLoading} />
          ) : (
            <SignupForm onSignup={handleSignup} loading={authLoading} />
          )}
        </div>
        </div>
      </div>
    )
  }

  // Main application UI
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Header */}
      <header style={{
        background: 'white',
        padding: '15px 20px',
        borderBottom: '1px solid #ddd',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, color: '#333' }}>DealerFlow Pro</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ fontSize: '14px', color: '#666' }}>
            {user?.dealership_name} | {subscription?.plan?.toUpperCase() || 'TRIAL'}
            {subscription?.is_active === false && (
              <span style={{ color: '#e74c3c', marginLeft: '10px' }}>EXPIRED</span>
            )}
          </div>
          <button
            onClick={() => setShowUpgradeModal(true)}
            style={{
              padding: '8px 16px',
              background: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Upgrade
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              background: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav style={{
        background: 'white',
        padding: '0 20px',
        borderBottom: '1px solid #ddd'
      }}>
        <div style={{ display: 'flex', gap: '0' }}>
          {['dashboard', 'content', 'images', 'automation', 'analytics'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '15px 20px',
                border: 'none',
                background: activeTab === tab ? '#667eea' : 'transparent',
                color: activeTab === tab ? 'white' : '#333',
                cursor: 'pointer',
                borderRadius: '0',
                textTransform: 'capitalize'
              }}
            >
              {tab}
              {tab === 'analytics' && !canAccessFeature('analytics') && ' 🔒'}
              {tab === 'automation' && !canAccessFeature('automation') && ' 🔒'}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ padding: '20px' }}>
        {activeTab === 'dashboard' && <DashboardTab user={user} subscription={subscription} />}
        {activeTab === 'content' && (
          <ContentTab
            selectedPlatforms={selectedPlatforms}
            setSelectedPlatforms={setSelectedPlatforms}
            contentType={contentType}
            setContentType={setContentType}
            keywords={keywords}
            setKeywords={setKeywords}
            generatedContent={generatedContent}
            isGenerating={isGenerating}
            onGenerate={generateBulkContent}
            availablePlatforms={getAvailablePlatforms()}
            canAccessYoutube={canAccessFeature('youtube')}
          />
        )}
        {activeTab === 'images' && (
          <ImagesTab
            uploadedImages={uploadedImages}
            setUploadedImages={setUploadedImages}
            scrapingConfig={scrapingConfig}
            setScrapingConfig={setScrapingConfig}
            onSetupScraping={setupScraping}
          />
        )}
        {activeTab === 'automation' && (
          <AutomationTab canAccess={canAccessFeature('automation')} />
        )}
        {activeTab === 'analytics' && (
          <AnalyticsTab 
            canAccess={canAccessFeature('analytics')} 
            availablePlatforms={getAvailablePlatforms()}
          />
        )}
      </main>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradeModal
          plans={subscriptionPlans}
          currentPlan={subscription?.plan}
          onUpgrade={handleUpgradeSubscription}
          onClose={() => setShowUpgradeModal(false)}
          loading={upgradeLoading}
        />
      )}
    </div>
  )
}

// Login Form Component
function LoginForm({ onLogin, loading }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onLogin(email, password)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: '15px' }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '5px',
            fontSize: '16px'
          }}
        />
      </div>
      <div style={{ marginBottom: '20px' }}>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '5px',
            fontSize: '16px'
          }}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%',
          padding: '12px',
          background: '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          fontSize: '16px',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1
        }}
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  )
}

// Signup Form Component
function SignupForm({ onSignup, loading }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    dealership_name: '',
    contact_name: '',
    phone: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSignup(formData)
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: '15px' }}>
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          required
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '5px',
            fontSize: '16px'
          }}
        />
      </div>
      <div style={{ marginBottom: '15px' }}>
        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => handleChange('password', e.target.value)}
          required
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '5px',
            fontSize: '16px'
          }}
        />
      </div>
      <div style={{ marginBottom: '15px' }}>
        <input
          type="text"
          placeholder="Dealership Name"
          value={formData.dealership_name}
          onChange={(e) => handleChange('dealership_name', e.target.value)}
          required
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '5px',
            fontSize: '16px'
          }}
        />
      </div>
      <div style={{ marginBottom: '15px' }}>
        <input
          type="text"
          placeholder="Contact Name"
          value={formData.contact_name}
          onChange={(e) => handleChange('contact_name', e.target.value)}
          required
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '5px',
            fontSize: '16px'
          }}
        />
      </div>
      <div style={{ marginBottom: '20px' }}>
        <input
          type="tel"
          placeholder="Phone (optional)"
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '5px',
            fontSize: '16px'
          }}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%',
          padding: '12px',
          background: '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          fontSize: '16px',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1
        }}
      >
        {loading ? 'Creating Account...' : 'Start Free Trial'}
      </button>
    </form>
  )
}

// Dashboard Tab Component
function DashboardTab({ user, subscription }) {
  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>Dashboard</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {/* Account Info */}
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginTop: 0 }}>Account Information</h3>
          <p><strong>Dealership:</strong> {user?.dealership_name}</p>
          <p><strong>Contact:</strong> {user?.contact_name}</p>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Plan:</strong> {subscription?.plan?.toUpperCase() || 'TRIAL'}</p>
        </div>

        {/* Subscription Status */}
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginTop: 0 }}>Subscription Status</h3>
          <p><strong>Status:</strong> {subscription?.status?.toUpperCase() || 'TRIAL'}</p>
          <p><strong>Platforms:</strong> {subscription?.features?.platforms?.length || 2}</p>
          <p><strong>Posts/Month:</strong> {subscription?.features?.max_posts_per_month === -1 ? 'Unlimited' : subscription?.features?.max_posts_per_month || 50}</p>
          <p><strong>Days Until Renewal:</strong> {subscription?.days_until_renewal || 'N/A'}</p>
        </div>

        {/* Quick Stats */}
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginTop: 0 }}>Quick Stats</h3>
          <p><strong>Posts Generated:</strong> 0</p>
          <p><strong>Images Uploaded:</strong> 0</p>
          <p><strong>Automation Runs:</strong> 0</p>
          <p><strong>Last Activity:</strong> Just now</p>
        </div>
      </div>
    </div>
  )
}

// Content Tab Component
function ContentTab({ 
  selectedPlatforms, 
  setSelectedPlatforms, 
  contentType, 
  setContentType, 
  keywords, 
  setKeywords, 
  generatedContent, 
  isGenerating, 
  onGenerate,
  availablePlatforms,
  canAccessYoutube
}) {
  const allPlatforms = [
    { id: 'facebook', name: 'Facebook', icon: '📘' },
    { id: 'instagram', name: 'Instagram', icon: '📷' },
    { id: 'tiktok', name: 'TikTok', icon: '🎵' },
    { id: 'reddit', name: 'Reddit', icon: '🤖' },
    { id: 'x', name: 'X (Twitter)', icon: '🐦' },
    { id: 'youtube', name: 'YouTube', icon: '📺' }
  ]

  const handlePlatformToggle = (platformId) => {
    if (!availablePlatforms.includes(platformId)) {
      alert('This platform requires a higher subscription plan')
      return
    }

    if (selectedPlatforms.includes(platformId)) {
      setSelectedPlatforms(selectedPlatforms.filter(p => p !== platformId))
    } else {
      setSelectedPlatforms([...selectedPlatforms, platformId])
    }
  }

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>Content Generation</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
        {/* Controls */}
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginTop: 0 }}>Generation Settings</h3>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Content Type:
            </label>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            >
              <option value="vehicle_showcase">Vehicle Showcase</option>
              <option value="dealership_promotion">Dealership Promotion</option>
              <option value="service_highlight">Service Highlight</option>
              <option value="customer_testimonial">Customer Testimonial</option>
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Keywords (optional):
            </label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="e.g., SUV, luxury, financing"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
              Select Platforms:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {allPlatforms.map(platform => {
                const isAvailable = availablePlatforms.includes(platform.id)
                const isSelected = selectedPlatforms.includes(platform.id)
                
                return (
                  <button
                    key={platform.id}
                    onClick={() => handlePlatformToggle(platform.id)}
                    style={{
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      background: isSelected ? '#667eea' : isAvailable ? 'white' : '#f5f5f5',
                      color: isSelected ? 'white' : isAvailable ? '#333' : '#999',
                      cursor: isAvailable ? 'pointer' : 'not-allowed',
                      fontSize: '12px',
                      opacity: isAvailable ? 1 : 0.6
                    }}
                  >
                    {platform.icon} {platform.name}
                    {!isAvailable && ' 🔒'}
                  </button>
                )
              })}
            </div>
          </div>

          <button
            onClick={onGenerate}
            disabled={isGenerating || selectedPlatforms.length === 0}
            style={{
              width: '100%',
              padding: '12px',
              background: isGenerating ? '#ccc' : '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              fontSize: '16px'
            }}
          >
            {isGenerating ? 'Generating...' : 'Generate Content'}
          </button>
        </div>

        {/* Generated Content */}
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginTop: 0 }}>Generated Content</h3>
          
          {generatedContent.length === 0 ? (
            <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>
              No content generated yet. Select platforms and click "Generate Content" to get started.
            </p>
          ) : (
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {generatedContent.map((content, index) => (
                <div key={index} style={{
                  border: '1px solid #eee',
                  borderRadius: '4px',
                  padding: '15px',
                  marginBottom: '15px'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '10px'
                  }}>
                    <strong style={{ color: '#667eea' }}>
                      {allPlatforms.find(p => p.id === content.platform)?.icon} {content.platform.toUpperCase()}
                    </strong>
                    <span style={{ fontSize: '12px', color: '#666' }}>
                      {content.character_count} chars
                    </span>
                  </div>
                  <p style={{ margin: '0 0 10px 0', lineHeight: '1.5' }}>
                    {content.content}
                  </p>
                  {content.hashtags && (
                    <p style={{ margin: 0, color: '#667eea', fontSize: '14px' }}>
                      {content.hashtags}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Images Tab Component
function ImagesTab({ uploadedImages, setUploadedImages, scrapingConfig, setScrapingConfig, onSetupScraping }) {
  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files)
    const newImages = files.map((file, index) => ({
      id: uploadedImages.length + index + 1,
      name: file.name,
      url: URL.createObjectURL(file),
      source: 'manual_upload'
    }))
    setUploadedImages([...uploadedImages, ...newImages])
  }

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>Image Management</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Manual Upload */}
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginTop: 0 }}>Manual Upload</h3>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            style={{
              width: '100%',
              padding: '10px',
              border: '2px dashed #ddd',
              borderRadius: '4px',
              textAlign: 'center'
            }}
          />
          <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
            Upload vehicle photos, dealership images, or promotional graphics
          </p>
        </div>

        {/* Website Scraping */}
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginTop: 0 }}>Website Scraping</h3>
          <div style={{ marginBottom: '15px' }}>
            <input
              type="url"
              placeholder="Enter your dealership website URL"
              value={scrapingConfig.url}
              onChange={(e) => setScrapingConfig({...scrapingConfig, url: e.target.value})}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                marginBottom: '10px'
              }}
            />
            <button
              onClick={onSetupScraping}
              style={{
                width: '100%',
                padding: '10px',
                background: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Setup Scraping
            </button>
          </div>
          <p style={{ fontSize: '14px', color: '#666' }}>
            Status: <strong>{scrapingConfig.status.replace('_', ' ').toUpperCase()}</strong>
          </p>
        </div>
      </div>

      {/* Image Library */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginTop: '20px'
      }}>
        <h3 style={{ marginTop: 0 }}>Image Library ({uploadedImages.length + 2} images)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
          {/* Demo images */}
          <div style={{
            border: '1px solid #ddd',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '100%',
              height: '100px',
              background: '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666'
            }}>
              🚗 Vehicle 1
            </div>
            <div style={{ padding: '8px', fontSize: '12px' }}>
              <div>vehicle_1.jpg</div>
              <div style={{ color: '#666' }}>Website Scraping</div>
            </div>
          </div>
          
          <div style={{
            border: '1px solid #ddd',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '100%',
              height: '100px',
              background: '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666'
            }}>
              🚙 Vehicle 2
            </div>
            <div style={{ padding: '8px', fontSize: '12px' }}>
              <div>vehicle_2.jpg</div>
              <div style={{ color: '#666' }}>Website Scraping</div>
            </div>
          </div>

          {/* Uploaded images */}
          {uploadedImages.map(image => (
            <div key={image.id} style={{
              border: '1px solid #ddd',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <img
                src={image.url}
                alt={image.name}
                style={{
                  width: '100%',
                  height: '100px',
                  objectFit: 'cover'
                }}
              />
              <div style={{ padding: '8px', fontSize: '12px' }}>
                <div>{image.name}</div>
                <div style={{ color: '#666' }}>Manual Upload</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Automation Tab Component
function AutomationTab({ canAccess }) {
  if (!canAccess) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <h2>🔒 Automation Features</h2>
        <p style={{ color: '#666', fontSize: '18px', marginBottom: '20px' }}>
          Automation features require a paid subscription plan.
        </p>
        <p style={{ color: '#666' }}>
          Upgrade to Starter, Professional, or Enterprise to access:
        </p>
        <ul style={{ textAlign: 'left', display: 'inline-block', color: '#666' }}>
          <li>Scheduled posting</li>
          <li>Auto-content generation</li>
          <li>Queue management</li>
          <li>Performance optimization</li>
        </ul>
      </div>
    )
  }

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>Automation</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Automation Status */}
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginTop: 0 }}>Automation Status</h3>
          <p><strong>Status:</strong> <span style={{ color: '#e74c3c' }}>Disabled</span></p>
          <p><strong>Last Run:</strong> Never</p>
          <p><strong>Next Run:</strong> Not scheduled</p>
          <p><strong>Posts in Queue:</strong> 0</p>
          
          <button style={{
            padding: '10px 20px',
            background: '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '15px'
          }}>
            Enable Automation
          </button>
        </div>

        {/* Schedule Settings */}
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginTop: 0 }}>Schedule Settings</h3>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Posting Frequency:</label>
            <select style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}>
              <option>Daily</option>
              <option>Every 2 days</option>
              <option>Weekly</option>
              <option>Custom</option>
            </select>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Posting Time:</label>
            <input 
              type="time" 
              defaultValue="09:00"
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Content Types:</label>
            <div>
              <label style={{ display: 'block', fontSize: '14px' }}>
                <input type="checkbox" defaultChecked /> Vehicle Showcase
              </label>
              <label style={{ display: 'block', fontSize: '14px' }}>
                <input type="checkbox" /> Dealership Promotion
              </label>
              <label style={{ display: 'block', fontSize: '14px' }}>
                <input type="checkbox" /> Service Highlight
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Analytics Tab Component
function AnalyticsTab({ canAccess, availablePlatforms }) {
  if (!canAccess) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <h2>📊 Analytics Dashboard</h2>
        <p style={{ color: '#666', fontSize: '18px', marginBottom: '20px' }}>
          Analytics features require a paid subscription plan.
        </p>
        <p style={{ color: '#666' }}>
          Upgrade to access detailed analytics including:
        </p>
        <ul style={{ textAlign: 'left', display: 'inline-block', color: '#666' }}>
          <li>Post performance metrics</li>
          <li>Engagement analytics</li>
          <li>Platform comparisons</li>
          <li>ROI tracking</li>
        </ul>
      </div>
    )
  }

  const platformIcons = {
    facebook: '📘',
    instagram: '📷',
    tiktok: '🎵',
    reddit: '🤖',
    x: '🐦',
    youtube: '📺'
  }

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>Analytics Dashboard</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        {/* Overview Stats */}
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#667eea' }}>Total Posts</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#333' }}>156</div>
          <div style={{ fontSize: '14px', color: '#27ae60' }}>+12 this week</div>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#667eea' }}>Total Engagement</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#333' }}>2,847</div>
          <div style={{ fontSize: '14px', color: '#27ae60' }}>+18% this month</div>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#667eea' }}>Avg. Reach</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#333' }}>1,250</div>
          <div style={{ fontSize: '14px', color: '#27ae60' }}>+5% this week</div>
        </div>
      </div>

      {/* Platform Performance */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ marginTop: 0 }}>Platform Performance</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          {availablePlatforms.map(platform => (
            <div key={platform} style={{
              border: '1px solid #eee',
              borderRadius: '4px',
              padding: '15px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', marginBottom: '5px' }}>
                {platformIcons[platform]} {platform.charAt(0).toUpperCase() + platform.slice(1)}
              </div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#333' }}>26</div>
              <div style={{ fontSize: '12px', color: '#666' }}>posts</div>
              <div style={{ fontSize: '16px', color: '#27ae60', marginTop: '5px' }}>485</div>
              <div style={{ fontSize: '12px', color: '#666' }}>engagement</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Upgrade Modal Component
function UpgradeModal({ plans, currentPlan, onUpgrade, onClose, loading }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        padding: '30px',
        borderRadius: '10px',
        maxWidth: '800px',
        width: '90%',
        maxHeight: '80vh',
        overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Upgrade Your Plan</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          {Object.entries(plans).map(([planId, plan]) => (
            <div key={planId} style={{
              border: plan.recommended ? '2px solid #667eea' : '1px solid #ddd',
              borderRadius: '8px',
              padding: '20px',
              position: 'relative'
            }}>
              {plan.recommended && (
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#667eea',
                  color: 'white',
                  padding: '5px 15px',
                  borderRadius: '15px',
                  fontSize: '12px'
                }}>
                  RECOMMENDED
                </div>
              )}
              
              <h3 style={{ marginTop: 0, textAlign: 'center' }}>{plan.name}</h3>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#333' }}>
                  ${plan.features.price_monthly}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>per month</div>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, marginBottom: '20px' }}>
                <li style={{ marginBottom: '8px' }}>
                  ✅ {plan.features.platforms.length} platforms
                </li>
                <li style={{ marginBottom: '8px' }}>
                  ✅ {plan.features.max_posts_per_month === -1 ? 'Unlimited' : plan.features.max_posts_per_month} posts/month
                </li>
                <li style={{ marginBottom: '8px' }}>
                  ✅ {plan.features.max_images === -1 ? 'Unlimited' : plan.features.max_images} images
                </li>
                <li style={{ marginBottom: '8px' }}>
                  {plan.features.automation ? '✅' : '❌'} Automation
                </li>
                <li style={{ marginBottom: '8px' }}>
                  {plan.features.analytics ? '✅' : '❌'} Analytics
                </li>
                <li style={{ marginBottom: '8px' }}>
                  ✅ {plan.features.support} support
                </li>
              </ul>

              <button
                onClick={() => onUpgrade(planId)}
                disabled={loading || currentPlan === planId}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: currentPlan === planId ? '#ccc' : '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: currentPlan === planId ? 'not-allowed' : 'pointer',
                  fontSize: '16px'
                }}
              >
                {loading ? 'Processing...' : currentPlan === planId ? 'Current Plan' : 'Upgrade'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default App

