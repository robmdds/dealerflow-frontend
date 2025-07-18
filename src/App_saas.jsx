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

  const API_BASE_URL = import.meta.env.PROD ? 'https://e5h6i7cnnmn9.manus.space' : 'http://localhost:5000'

  // Authentication functions
  const checkAuthToken = async () => {
    const token = localStorage.getItem('dealerflow_token')
    if (!token) {
      setIsAuthenticated(false)
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setSubscription(data.subscription)
        setIsAuthenticated(true)
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
        setSubscription(data.subscription)
        setIsAuthenticated(true)
        setAuthError('')
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
        setSubscription(data.subscription)
        setIsAuthenticated(true)
        setAuthError('')
      } else {
        setAuthError(data.error || 'Signup failed')
      }
    } catch (error) {
      setAuthError('Network error. Please try again.')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('dealerflow_token')
    setIsAuthenticated(false)
    setUser(null)
    setSubscription(null)
    setActiveTab('dashboard')
  }

  // Subscription functions
  const upgradeSubscription = async (planId, paymentMethod) => {
    try {
      const token = localStorage.getItem('dealerflow_token')
      const response = await fetch(`${API_BASE_URL}/api/subscriptions/upgrade`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          plan: planId,
          payment_method: paymentMethod
        })
      })

      const data = await response.json()
      if (data.success) {
        setSubscription(data.subscription)
        return { success: true, message: data.message }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      return { success: false, error: 'Network error' }
    }
  }

  // Check if user has access to a feature
  const hasFeatureAccess = (feature) => {
    if (!subscription) return false
    
    const planFeatures = {
      trial: {
        platforms: ['facebook', 'instagram'],
        website_scraping: false,
        bulk_generation: false,
        dms_integration: false
      },
      starter: {
        platforms: ['facebook', 'instagram', 'tiktok'],
        website_scraping: true,
        bulk_generation: true,
        dms_integration: false
      },
      professional: {
        platforms: ['facebook', 'instagram', 'tiktok', 'reddit', 'x'],
        website_scraping: true,
        bulk_generation: true,
        dms_integration: true
      },
      enterprise: {
        platforms: ['facebook', 'instagram', 'tiktok', 'reddit', 'x', 'youtube'],
        website_scraping: true,
        bulk_generation: true,
        dms_integration: true
      }
    }

    const features = planFeatures[subscription.plan]
    return features ? features[feature] : false
  }

  // Content generation function
  const generateBulkContent = async () => {
    if (!hasFeatureAccess('bulk_generation')) {
      alert('Bulk content generation requires Starter plan or higher. Please upgrade your subscription.')
      setActiveTab('account')
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
      } else if (data.upgrade_required) {
        alert(data.error)
        setActiveTab('account')
      } else {
        alert('Content generation failed: ' + data.error)
      }
    } catch (error) {
      alert('Network error during content generation')
    } finally {
      setIsGenerating(false)
    }
  }

  // Website scraping function
  const setupScraping = async () => {
    if (!hasFeatureAccess('website_scraping')) {
      alert('Website scraping requires Starter plan or higher. Please upgrade your subscription.')
      setActiveTab('account')
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
          url: data.website_url,
          status: 'configured',
          platform: data.platform_detected
        })
      } else if (data.upgrade_required) {
        alert(data.error)
        setActiveTab('account')
      } else {
        alert('Scraping setup failed: ' + data.error)
      }
    } catch (error) {
      alert('Network error during scraping setup')
    }
  }

  // Platform icon function
  const getPlatformIcon = (platform) => {
    const icons = {
      facebook: '📘',
      instagram: '📷',
      tiktok: '🎵',
      reddit: '🤖',
      x: '🐦',
      youtube: '📺'
    }
    return icons[platform] || '📱'
  }

  // Check authentication on app load
  useEffect(() => {
    checkAuthToken()
  }, [])

  // Authentication components
  const LoginForm = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const onSubmit = (e) => {
      e.preventDefault()
      handleLogin(email, password)
    }

    return (
      <div style={{ maxWidth: '400px', margin: '0 auto', padding: '2rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Login to DealerFlow Pro</h2>
        
        {authError && (
          <div style={{ 
            background: '#fee', 
            color: '#c33', 
            padding: '1rem', 
            borderRadius: '8px', 
            marginBottom: '1rem',
            border: '1px solid #fcc'
          }}>
            {authError}
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={authLoading}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: authLoading ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: authLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {authLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1rem' }}>
          Don't have an account?{' '}
          <button
            onClick={() => setAuthMode('signup')}
            style={{
              background: 'none',
              border: 'none',
              color: '#007bff',
              textDecoration: 'underline',
              cursor: 'pointer'
            }}
          >
            Sign up here
          </button>
        </p>
      </div>
    )
  }

  const SignupForm = () => {
    const [formData, setFormData] = useState({
      email: '',
      password: '',
      dealership_name: '',
      contact_name: '',
      phone: ''
    })

    const onSubmit = (e) => {
      e.preventDefault()
      handleSignup(formData)
    }

    const updateField = (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }))
    }

    return (
      <div style={{ maxWidth: '400px', margin: '0 auto', padding: '2rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Create Your DealerFlow Pro Account</h2>
        
        {authError && (
          <div style={{ 
            background: '#fee', 
            color: '#c33', 
            padding: '1rem', 
            borderRadius: '8px', 
            marginBottom: '1rem',
            border: '1px solid #fcc'
          }}>
            {authError}
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Dealership Name *
            </label>
            <input
              type="text"
              value={formData.dealership_name}
              onChange={(e) => updateField('dealership_name', e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Contact Name *
            </label>
            <input
              type="text"
              value={formData.contact_name}
              onChange={(e) => updateField('contact_name', e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Email Address *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Password *
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => updateField('password', e.target.value)}
              required
              minLength="6"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            />
            <small style={{ color: '#666' }}>Minimum 6 characters</small>
          </div>

          <button
            type="submit"
            disabled={authLoading}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: authLoading ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: authLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {authLoading ? 'Creating Account...' : 'Start Free Trial'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1rem' }}>
          Already have an account?{' '}
          <button
            onClick={() => setAuthMode('login')}
            style={{
              background: 'none',
              border: 'none',
              color: '#007bff',
              textDecoration: 'underline',
              cursor: 'pointer'
            }}
          >
            Login here
          </button>
        </p>

        <div style={{ 
          background: '#f8f9fa', 
          padding: '1rem', 
          borderRadius: '8px', 
          marginTop: '1rem',
          fontSize: '0.9rem',
          color: '#666'
        }}>
          <strong>🎉 Free 14-Day Trial Includes:</strong>
          <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
            <li>Facebook & Instagram posting</li>
            <li>50 posts per month</li>
            <li>Basic analytics</li>
            <li>No credit card required</li>
          </ul>
        </div>
      </div>
    )
  }

  // Show authentication forms if not authenticated
  if (!isAuthenticated) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          width: '100%',
          maxWidth: '500px',
          margin: '1rem'
        }}>
          {authMode === 'login' ? <LoginForm /> : <SignupForm />}
        </div>
      </div>
    )
  }

  // Main dashboard (authenticated users)
  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Header */}
      <header style={{ 
        background: 'white', 
        borderBottom: '1px solid #e0e0e0',
        padding: '1rem 2rem'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h1 style={{ margin: 0, color: '#333' }}>DealerFlow Pro</h1>
            <span style={{ 
              background: '#007bff', 
              color: 'white', 
              padding: '0.25rem 0.75rem', 
              borderRadius: '12px', 
              fontSize: '0.8rem',
              fontWeight: 'bold'
            }}>
              Enhanced
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 'bold', color: '#333' }}>
                {user?.dealership_name}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>
                {subscription?.plan?.toUpperCase()} Plan
                {subscription?.plan === 'trial' && ' (Trial)'}
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                background: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav style={{ 
        background: 'white', 
        borderBottom: '1px solid #e0e0e0',
        padding: '0 2rem'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          display: 'flex',
          gap: '2rem'
        }}>
          {['dashboard', 'content', 'images', 'automation', 'analytics', 'account'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'none',
                border: 'none',
                padding: '1rem 0',
                borderBottom: activeTab === tab ? '3px solid #007bff' : '3px solid transparent',
                color: activeTab === tab ? '#007bff' : '#666',
                fontWeight: activeTab === tab ? 'bold' : 'normal',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '2rem'
      }}>
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            <h2 style={{ marginBottom: '2rem' }}>Dashboard Overview</h2>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: '2rem',
              marginBottom: '2rem'
            }}>
              {/* Subscription Status */}
              <div style={{ 
                background: 'white', 
                padding: '2rem', 
                borderRadius: '12px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ marginTop: 0 }}>Subscription Status</h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#007bff' }}>
                  {subscription?.plan?.toUpperCase()}
                </div>
                <div style={{ color: '#666', marginTop: '0.5rem' }}>
                  {subscription?.plan === 'trial' ? 'Free Trial' : `$${
                    subscription?.plan === 'starter' ? '197' :
                    subscription?.plan === 'professional' ? '397' :
                    subscription?.plan === 'enterprise' ? '597' : '0'
                  }/month`}
                </div>
                {subscription?.expires && (
                  <div style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                    Expires: {new Date(subscription.expires).toLocaleDateString()}
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div style={{ 
                background: 'white', 
                padding: '2rem', 
                borderRadius: '12px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ marginTop: 0 }}>Quick Stats</h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745' }}>
                  {generatedContent.length}
                </div>
                <div style={{ color: '#666' }}>Posts Generated</div>
                <div style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                  Platforms: {hasFeatureAccess('platforms')?.length || 2}
                </div>
              </div>
            </div>

            {/* Feature Access */}
            <div style={{ 
              background: 'white', 
              padding: '2rem', 
              borderRadius: '12px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ marginTop: 0 }}>Available Features</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>{hasFeatureAccess('website_scraping') ? '✅' : '❌'}</span>
                  Website Scraping
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>{hasFeatureAccess('bulk_generation') ? '✅' : '❌'}</span>
                  Bulk Generation
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>{hasFeatureAccess('dms_integration') ? '✅' : '❌'}</span>
                  DMS Integration
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>📱</span>
                  {hasFeatureAccess('platforms')?.length || 2} Platforms
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content Tab */}
        {activeTab === 'content' && (
          <div>
            <h2 style={{ marginBottom: '2rem' }}>Content Generation</h2>
            
            <div style={{ 
              background: 'white', 
              padding: '2rem', 
              borderRadius: '12px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              marginBottom: '2rem'
            }}>
              <h3 style={{ marginTop: 0 }}>Generate Bulk Content</h3>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Content Type
                </label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="vehicle_showcase">Vehicle Showcase</option>
                  <option value="dealership_promotion">Dealership Promotion</option>
                  <option value="service_highlight">Service Highlight</option>
                  <option value="customer_testimonial">Customer Testimonial</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Keywords (Optional)
                </label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="luxury, certified pre-owned, financing available"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
                <small style={{ color: '#666' }}>
                  Add keywords to customize your content. Separate multiple keywords with commas.
                </small>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Select Platforms
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem' }}>
                  {['facebook', 'instagram', 'tiktok', 'reddit', 'x', 'youtube'].map((platform) => {
                    const isAvailable = hasFeatureAccess('platforms')?.includes(platform)
                    return (
                      <label key={platform} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        opacity: isAvailable ? 1 : 0.5,
                        cursor: isAvailable ? 'pointer' : 'not-allowed'
                      }}>
                        <input
                          type="checkbox"
                          checked={selectedPlatforms.includes(platform)}
                          onChange={(e) => {
                            if (!isAvailable) return
                            if (e.target.checked) {
                              setSelectedPlatforms([...selectedPlatforms, platform])
                            } else {
                              setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform))
                            }
                          }}
                          disabled={!isAvailable}
                        />
                        <span>{getPlatformIcon(platform)}</span>
                        <span style={{ textTransform: 'capitalize' }}>{platform}</span>
                        {!isAvailable && <span style={{ fontSize: '0.8rem', color: '#999' }}>🔒</span>}
                      </label>
                    )
                  })}
                </div>
              </div>

              <button
                onClick={generateBulkContent}
                disabled={isGenerating || selectedPlatforms.length === 0}
                style={{
                  background: isGenerating ? '#ccc' : '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 2rem',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  cursor: isGenerating ? 'not-allowed' : 'pointer'
                }}
              >
                {isGenerating ? 'Generating...' : 'Generate Content'}
              </button>
            </div>

            {/* Generated Content */}
            {generatedContent.length > 0 && (
              <div style={{ 
                background: 'white', 
                padding: '2rem', 
                borderRadius: '12px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ marginTop: 0 }}>Generated Content ({generatedContent.length} posts)</h3>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {generatedContent.map((content, index) => (
                    <div key={index} style={{ 
                      border: '1px solid #e0e0e0', 
                      borderRadius: '8px', 
                      padding: '1rem'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem', 
                        marginBottom: '0.5rem',
                        fontWeight: 'bold'
                      }}>
                        <span>{getPlatformIcon(content.platform)}</span>
                        <span style={{ textTransform: 'capitalize' }}>{content.platform}</span>
                      </div>
                      <div style={{ color: '#333' }}>{content.content}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Images Tab */}
        {activeTab === 'images' && (
          <div>
            <h2 style={{ marginBottom: '2rem' }}>Image Management</h2>
            
            {/* Manual Upload */}
            <div style={{ 
              background: 'white', 
              padding: '2rem', 
              borderRadius: '12px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              marginBottom: '2rem'
            }}>
              <h3 style={{ marginTop: 0 }}>Manual Upload</h3>
              <div style={{
                border: '2px dashed #ddd',
                borderRadius: '8px',
                padding: '3rem',
                textAlign: 'center',
                cursor: 'pointer'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📷</div>
                <div style={{ color: '#666' }}>Click to upload vehicle images</div>
              </div>
            </div>

            {/* Website Scraping */}
            <div style={{ 
              background: 'white', 
              padding: '2rem', 
              borderRadius: '12px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              marginBottom: '2rem'
            }}>
              <h3 style={{ marginTop: 0 }}>Website Scraping</h3>
              
              {!hasFeatureAccess('website_scraping') && (
                <div style={{ 
                  background: '#fff3cd', 
                  color: '#856404', 
                  padding: '1rem', 
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  border: '1px solid #ffeaa7'
                }}>
                  🔒 Website scraping requires Starter plan or higher. 
                  <button
                    onClick={() => setActiveTab('account')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#007bff',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      marginLeft: '0.5rem'
                    }}
                  >
                    Upgrade now
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <input
                  type="url"
                  value={scrapingConfig.url}
                  onChange={(e) => setScrapingConfig({...scrapingConfig, url: e.target.value})}
                  placeholder="https://yourdealership.com"
                  disabled={!hasFeatureAccess('website_scraping')}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    opacity: hasFeatureAccess('website_scraping') ? 1 : 0.5
                  }}
                />
                <button
                  onClick={setupScraping}
                  disabled={!hasFeatureAccess('website_scraping') || !scrapingConfig.url}
                  style={{
                    background: hasFeatureAccess('website_scraping') ? '#28a745' : '#ccc',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    cursor: hasFeatureAccess('website_scraping') ? 'pointer' : 'not-allowed'
                  }}
                >
                  Setup Scraping
                </button>
              </div>

              {scrapingConfig.status === 'configured' && (
                <div style={{ 
                  color: '#28a745', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem' 
                }}>
                  ✓ Scraping configured for {scrapingConfig.url}
                </div>
              )}
            </div>

            {/* Image Library */}
            <div style={{ 
              background: 'white', 
              padding: '2rem', 
              borderRadius: '12px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ marginTop: 0 }}>Image Library (2 images)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                <div style={{ 
                  background: '#000', 
                  height: '150px', 
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}>
                  Sample Image 1
                </div>
                <div style={{ 
                  background: '#000', 
                  height: '150px', 
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}>
                  Sample Image 2
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Account Tab */}
        {activeTab === 'account' && (
          <div>
            <h2 style={{ marginBottom: '2rem' }}>Account & Subscription</h2>
            
            {/* Current Subscription */}
            <div style={{ 
              background: 'white', 
              padding: '2rem', 
              borderRadius: '12px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              marginBottom: '2rem'
            }}>
              <h3 style={{ marginTop: 0 }}>Current Subscription</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#007bff' }}>
                    {subscription?.plan?.toUpperCase()} Plan
                  </div>
                  <div style={{ color: '#666', marginTop: '0.5rem' }}>
                    {subscription?.plan === 'trial' ? 'Free Trial' : `$${
                      subscription?.plan === 'starter' ? '197' :
                      subscription?.plan === 'professional' ? '397' :
                      subscription?.plan === 'enterprise' ? '597' : '0'
                    }/month`}
                  </div>
                  {subscription?.expires && (
                    <div style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                      {subscription.plan === 'trial' ? 'Trial expires' : 'Renews'}: {new Date(subscription.expires).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Plan Features:</div>
                  <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#666' }}>
                    {subscription?.plan === 'trial' && (
                      <>
                        <li>Facebook & Instagram</li>
                        <li>50 posts/month</li>
                        <li>Basic analytics</li>
                      </>
                    )}
                    {subscription?.plan === 'starter' && (
                      <>
                        <li>3 platforms (FB, IG, TikTok)</li>
                        <li>200 posts/month</li>
                        <li>Website scraping</li>
                        <li>Bulk generation</li>
                      </>
                    )}
                    {subscription?.plan === 'professional' && (
                      <>
                        <li>5 platforms (+ Reddit, X)</li>
                        <li>1,000 posts/month</li>
                        <li>DMS integration</li>
                        <li>Advanced analytics</li>
                      </>
                    )}
                    {subscription?.plan === 'enterprise' && (
                      <>
                        <li>6 platforms (+ YouTube)</li>
                        <li>Unlimited posts</li>
                        <li>Premium support</li>
                        <li>Custom features</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Upgrade Options */}
            {subscription?.plan !== 'enterprise' && (
              <div style={{ 
                background: 'white', 
                padding: '2rem', 
                borderRadius: '12px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                marginBottom: '2rem'
              }}>
                <h3 style={{ marginTop: 0 }}>Upgrade Your Plan</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                  {subscription?.plan !== 'starter' && (
                    <div style={{ 
                      border: '2px solid #007bff', 
                      borderRadius: '12px', 
                      padding: '1.5rem',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Starter</div>
                      <div style={{ fontSize: '2rem', color: '#007bff', margin: '0.5rem 0' }}>$197/mo</div>
                      <ul style={{ textAlign: 'left', margin: '1rem 0', paddingLeft: '1.5rem' }}>
                        <li>3 platforms</li>
                        <li>200 posts/month</li>
                        <li>Website scraping</li>
                        <li>Bulk generation</li>
                      </ul>
                      <button
                        onClick={() => upgradeSubscription('starter', { type: 'demo' })}
                        style={{
                          background: '#007bff',
                          color: 'white',
                          border: 'none',
                          padding: '0.75rem 1.5rem',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          width: '100%'
                        }}
                      >
                        Upgrade to Starter
                      </button>
                    </div>
                  )}

                  {!['starter', 'professional'].includes(subscription?.plan) && (
                    <div style={{ 
                      border: '2px solid #28a745', 
                      borderRadius: '12px', 
                      padding: '1.5rem',
                      textAlign: 'center',
                      position: 'relative'
                    }}>
                      <div style={{ 
                        position: 'absolute',
                        top: '-10px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#28a745',
                        color: 'white',
                        padding: '0.25rem 1rem',
                        borderRadius: '12px',
                        fontSize: '0.8rem'
                      }}>
                        RECOMMENDED
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Professional</div>
                      <div style={{ fontSize: '2rem', color: '#28a745', margin: '0.5rem 0' }}>$397/mo</div>
                      <ul style={{ textAlign: 'left', margin: '1rem 0', paddingLeft: '1.5rem' }}>
                        <li>5 platforms</li>
                        <li>1,000 posts/month</li>
                        <li>DMS integration</li>
                        <li>Advanced analytics</li>
                      </ul>
                      <button
                        onClick={() => upgradeSubscription('professional', { type: 'demo' })}
                        style={{
                          background: '#28a745',
                          color: 'white',
                          border: 'none',
                          padding: '0.75rem 1.5rem',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          width: '100%'
                        }}
                      >
                        Upgrade to Professional
                      </button>
                    </div>
                  )}

                  {subscription?.plan !== 'enterprise' && (
                    <div style={{ 
                      border: '2px solid #6f42c1', 
                      borderRadius: '12px', 
                      padding: '1.5rem',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Enterprise</div>
                      <div style={{ fontSize: '2rem', color: '#6f42c1', margin: '0.5rem 0' }}>$597/mo</div>
                      <ul style={{ textAlign: 'left', margin: '1rem 0', paddingLeft: '1.5rem' }}>
                        <li>6 platforms (+ YouTube)</li>
                        <li>Unlimited posts</li>
                        <li>Premium support</li>
                        <li>Custom features</li>
                      </ul>
                      <button
                        onClick={() => upgradeSubscription('enterprise', { type: 'demo' })}
                        style={{
                          background: '#6f42c1',
                          color: 'white',
                          border: 'none',
                          padding: '0.75rem 1.5rem',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          width: '100%'
                        }}
                      >
                        Upgrade to Enterprise
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Account Information */}
            <div style={{ 
              background: 'white', 
              padding: '2rem', 
              borderRadius: '12px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ marginTop: 0 }}>Account Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div>
                  <div style={{ marginBottom: '1rem' }}>
                    <strong>Dealership:</strong> {user?.dealership_name}
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <strong>Contact:</strong> {user?.contact_name}
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <strong>Email:</strong> {user?.email}
                  </div>
                  {user?.phone && (
                    <div style={{ marginBottom: '1rem' }}>
                      <strong>Phone:</strong> {user.phone}
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ marginBottom: '1rem' }}>
                    <strong>Account ID:</strong> {user?.id}
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <strong>Status:</strong> <span style={{ color: '#28a745' }}>Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other tabs (automation, analytics) can be added here */}
        {activeTab === 'automation' && (
          <div>
            <h2>Automation Settings</h2>
            <div style={{ 
              background: 'white', 
              padding: '2rem', 
              borderRadius: '12px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
              <p>Automation features coming soon...</p>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div>
            <h2>Analytics Dashboard</h2>
            <div style={{ 
              background: 'white', 
              padding: '2rem', 
              borderRadius: '12px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
              <p>Analytics features coming soon...</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App

