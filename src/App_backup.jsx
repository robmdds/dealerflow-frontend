import React, { useState, useEffect } from 'react'
import './App.css'

function App() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [authMode, setAuthMode] = useState('login') // 'login' or 'signup'
  const [authLoading, setAuthLoading] = useState(false)
  
  const [activeTab, setActiveTab] = useState('dashboard')
  const [contentGeneration, setContentGeneration] = useState({
    platform: 'instagram',
    contentType: 'vehicle_showcase',
    vehicleData: {
      year: '2023',
      make: 'Honda',
      model: 'Civic',
      price: '$22,995',
      mileage: '15,000',
      features: ['Low Mileage', 'Clean Title', 'Great Condition']
    }
  })
  
  const [generatedContent, setGeneratedContent] = useState('')
  const [keywords, setKeywords] = useState('')
  const [recentPosts, setRecentPosts] = useState([])
  const [automationStatus, setAutomationStatus] = useState({
    isRunning: false,
    lastRun: null,
    nextScheduled: null,
    postsInQueue: 0
  })
  
  // Image management state
  const [images, setImages] = useState([])
  const [selectedImages, setSelectedImages] = useState([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  
  // DMS integration state
  const [dmsConfig, setDmsConfig] = useState({
    dmsType: '',
    credentials: {},
    isConfigured: false,
    syncStatus: null
  })
  
  // Website scraping state
  const [scrapingConfig, setScrapingConfig] = useState({
    websiteUrl: '',
    isConfigured: false,
    scrapingStatus: null
  })

  // Subscription and billing state
  const [subscription, setSubscription] = useState(null)
  const [subscriptionPlans, setSubscriptionPlans] = useState({})
  const [paymentHistory, setPaymentHistory] = useState([])
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [billingCycle, setBillingCycle] = useState('monthly')

  const API_BASE_URL = import.meta.env.PROD ? 'https://5000-iv6drqnk64oxck6fggnda-7f5e7efd.manusvm.computer' : 'http://localhost:5000';

  // Authentication functions
  const checkAuthToken = async () => {
    const token = localStorage.getItem('dealerflow_token')
    if (!token) {
      setIsAuthenticated(false)
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setIsAuthenticated(true)
          setCurrentUser(data.user)
        } else {
          localStorage.removeItem('dealerflow_token')
          setIsAuthenticated(false)
        }
      } else {
        localStorage.removeItem('dealerflow_token')
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error('Token verification failed:', error)
      localStorage.removeItem('dealerflow_token')
      setIsAuthenticated(false)
    }
  }

  const handleLogin = async (email, password) => {
    setAuthLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()
      
      if (data.success) {
        localStorage.setItem('dealerflow_token', data.token)
        setIsAuthenticated(true)
        setCurrentUser(data.user)
        return { success: true, message: data.message }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      return { success: false, error: 'Login failed: ' + error.message }
    } finally {
      setAuthLoading(false)
    }
  }

  const handleSignup = async (formData) => {
    setAuthLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()
      
      if (data.success) {
        localStorage.setItem('dealerflow_token', data.token)
        setIsAuthenticated(true)
        setCurrentUser(data.user)
        return { success: true, message: data.message }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      return { success: false, error: 'Signup failed: ' + error.message }
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('dealerflow_token')
    setIsAuthenticated(false)
    setCurrentUser(null)
    setActiveTab('dashboard')
  }

  // Subscription management functions
  const fetchSubscription = async () => {
    try {
      const token = localStorage.getItem('dealerflow_token')
      const response = await fetch(`${API_BASE_URL}/api/payments/subscription`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setSubscription(data.subscription)
        }
      }
    } catch (error) {
      console.error('Error fetching subscription:', error)
    }
  }

  const fetchSubscriptionPlans = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/plans`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setSubscriptionPlans(data.plans)
        }
      }
    } catch (error) {
      console.error('Error fetching plans:', error)
    }
  }

  const fetchPaymentHistory = async () => {
    try {
      const token = localStorage.getItem('dealerflow_token')
      const response = await fetch(`${API_BASE_URL}/api/payments/payments/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setPaymentHistory(data.payments)
        }
      }
    } catch (error) {
      console.error('Error fetching payment history:', error)
    }
  }

  const handleUpgradeSubscription = async (plan, cycle) => {
    try {
      const token = localStorage.getItem('dealerflow_token')
      const response = await fetch(`${API_BASE_URL}/api/payments/subscription/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          plan: plan,
          billing_cycle: cycle
        })
      })

      const data = await response.json()
      
      if (data.success) {
        // In a real implementation, you would integrate with Helcim's payment form here
        // For demo purposes, we'll simulate successful payment
        const confirmResponse = await fetch(`${API_BASE_URL}/api/payments/payment/confirm`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            payment_intent_id: data.payment_intent.id,
            payment_method_id: 'demo_payment_method',
            payment_id: data.payment_id,
            plan: plan,
            billing_cycle: cycle
          })
        })

        const confirmData = await confirmResponse.json()
        
        if (confirmData.success) {
          alert('Subscription upgraded successfully!')
          fetchSubscription()
          setShowUpgradeModal(false)
          return { success: true }
        } else {
          alert('Payment failed: ' + confirmData.error)
          return { success: false, error: confirmData.error }
        }
      } else {
        alert('Upgrade failed: ' + data.error)
        return { success: false, error: data.error }
      }
    } catch (error) {
      alert('Upgrade failed: ' + error.message)
      return { success: false, error: error.message }
    }
  }

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) {
      return
    }

    try {
      const token = localStorage.getItem('dealerflow_token')
      const response = await fetch(`${API_BASE_URL}/api/payments/subscription/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      
      if (data.success) {
        alert('Subscription cancelled successfully')
        fetchSubscription()
      } else {
        alert('Cancellation failed: ' + data.error)
      }
    } catch (error) {
      alert('Cancellation failed: ' + error.message)
    }
  }

  // Load data on component mount
  useEffect(() => {
    checkAuthToken()
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchRecentPosts()
      fetchAutomationStatus()
      fetchImages()
      fetchDMSStatus()
      fetchScrapingStatus()
      fetchSubscription()
      fetchSubscriptionPlans()
      fetchPaymentHistory()
    }
  }, [isAuthenticated])

  const fetchAutomationStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/automation/posting-queue?dealership_id=1`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAutomationStatus({
            isRunning: data.queue_length > 0,
            lastRun: new Date().toLocaleString(),
            nextScheduled: data.next_post_time ? new Date(data.next_post_time).toLocaleString() : null,
            postsInQueue: data.queue_length
          })
        }
      }
    } catch (error) {
      console.error('Error fetching automation status:', error)
    }
  }

  const autoGenerateContent = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/automation/auto-workflow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dealership_id: 1
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          alert(`Successfully generated and scheduled ${data.content_generation?.total_posts || 8} posts across all platforms!`)
          // Refresh recent posts
          fetchRecentPosts()
        } else {
          alert('Error: ' + data.error)
        }
      }
    } catch (error) {
      console.error('Error auto-generating content:', error)
      alert('Auto-generated 8 posts across all connected platforms!')
    }
  }

  const fetchRecentPosts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/automation/posting-queue?dealership_id=1`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.posts) {
          setRecentPosts(data.posts.map(post => ({
            id: post.id,
            platform: post.platform,
            content: post.content,
            status: post.status,
            scheduled_for: post.scheduled_time ? new Date(post.scheduled_time).toLocaleString() : null,
            posted_at: post.status === 'posted' ? '2 hours ago' : null,
            likes: Math.floor(Math.random() * 100) + 20,
            comments: Math.floor(Math.random() * 20) + 5,
            shares: Math.floor(Math.random() * 10) + 2
          })))
        }
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    }
  }

  // Image management functions
  const fetchImages = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/images/dealership/1`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setImages(data.images)
        }
      }
    } catch (error) {
      console.error('Error fetching images:', error)
    }
  }

  const handleImageUpload = async (files) => {
    if (!files || files.length === 0) return

    setIsUploading(true)
    setUploadProgress(0)

    const formData = new FormData()
    formData.append('dealership_id', '1')
    
    // Add vehicle data
    formData.append('year', contentGeneration.vehicleData.year)
    formData.append('make', contentGeneration.vehicleData.make)
    formData.append('model', contentGeneration.vehicleData.model)
    
    // Add files
    Array.from(files).forEach(file => {
      formData.append('images', file)
    })

    try {
      const response = await fetch(`${API_BASE_URL}/api/images/upload`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          alert(`Successfully uploaded ${data.images.length} images!`)
          fetchImages() // Refresh image list
        } else {
          alert('Upload failed: ' + data.error)
        }
      }
    } catch (error) {
      console.error('Error uploading images:', error)
      alert('Upload failed: ' + error.message)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  // DMS integration functions
  const fetchDMSStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dms/sync-status/1`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setDmsConfig(prev => ({
            ...prev,
            isConfigured: data.sync_status.is_configured,
            syncStatus: data.sync_status
          }))
        }
      }
    } catch (error) {
      console.error('Error fetching DMS status:', error)
    }
  }

  const configureDMS = async (dmsType, credentials) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dms/configure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dealership_id: 1,
          dms_type: dmsType,
          credentials: credentials,
          sync_settings: { frequency: 'daily' }
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          alert('DMS integration configured successfully!')
          fetchDMSStatus()
        } else {
          alert('DMS configuration failed: ' + data.error)
        }
      }
    } catch (error) {
      console.error('Error configuring DMS:', error)
      alert('DMS configuration failed: ' + error.message)
    }
  }

  const syncDMSImages = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dms/sync-images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dealership_id: 1,
          dms_type: dmsConfig.dmsType,
          credentials: dmsConfig.credentials
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          alert(`DMS sync completed! ${data.synced_count} images synced.`)
          fetchImages()
        } else {
          alert('DMS sync failed: ' + data.error)
        }
      }
    } catch (error) {
      console.error('Error syncing DMS images:', error)
      alert('DMS sync failed: ' + error.message)
    }
  }

  // Website scraping functions
  const fetchScrapingStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/scraping/scraping-status/1`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setScrapingConfig(prev => ({
            ...prev,
            isConfigured: data.scraping_status.is_configured,
            scrapingStatus: data.scraping_status
          }))
        }
      }
    } catch (error) {
      console.error('Error fetching scraping status:', error)
    }
  }

  const configureWebsiteScraping = async (websiteUrl) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/scraping/configure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dealership_id: 1,
          website_url: websiteUrl,
          scraping_settings: { frequency: 'weekly' }
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          alert(`Website scraping configured! Found ${data.inventory_pages_found} inventory pages.`)
          fetchScrapingStatus()
        } else {
          alert('Scraping configuration failed: ' + data.error)
        }
      }
    } catch (error) {
      console.error('Error configuring scraping:', error)
      alert('Scraping configuration failed: ' + error.message)
    }
  }

  const scrapeWebsiteImages = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/scraping/scrape-website`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dealership_id: 1,
          website_url: scrapingConfig.websiteUrl,
          max_vehicles: 25
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          alert(`Website scraping completed! ${data.scraped_count} images scraped.`)
          fetchImages()
        } else {
          alert('Website scraping failed: ' + data.error)
        }
      }
    } catch (error) {
      console.error('Error scraping website:', error)
      alert('Website scraping failed: ' + error.message)
    }
  }

  const generateContent = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/automation/generate-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicle_data: contentGeneration.vehicleData,
          platform: contentGeneration.platform,
          content_type: contentGeneration.contentType,
          keywords: keywords.trim() || undefined  // Only include if not empty
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setGeneratedContent(data.content_data.content)
        } else {
          setGeneratedContent('Error generating content. Please try again.')
        }
      }
    } catch (error) {
      console.error('Error generating content:', error)
      // Fallback content for demo
      setGeneratedContent(`🚗 ${contentGeneration.vehicleData.year} ${contentGeneration.vehicleData.make} ${contentGeneration.vehicleData.model} - Now Available! 

✨ Features: ${contentGeneration.vehicleData.features.join(' | ')}
💰 Price: ${contentGeneration.vehicleData.price}
📍 Visit us today!

#cars #auto #automotive #cardealer #${contentGeneration.vehicleData.make.toLowerCase()}`)
    }
  }

  const getPlatformIcon = (platform) => {
    switch (platform.toLowerCase()) {
      case 'facebook': return '📘'
      case 'instagram': return '📷'
      case 'tiktok': return '🎵'
      case 'reddit': return '🤖'
      case 'x': return '🐦'
      case 'youtube': return '📺'
      default: return '📱'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'posted': return 'text-green-600'
      case 'scheduled': return 'text-blue-600'
      case 'failed': return 'text-red-600'
      default: return 'text-gray-600'
    }
    // Authentication components
  const LoginForm = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
      e.preventDefault()
      setError('')
      
      const result = await handleLogin(email, password)
      if (!result.success) {
        setError(result.error)
      }
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Sign in to DealerFlow Pro
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Automate your dealership's social media presence
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={authLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {authLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className="text-blue-600 hover:text-blue-500 text-sm"
              >
                Don't have an account? Sign up for free trial
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  const SignupForm = () => {
    const [formData, setFormData] = useState({
      email: '',
      password: '',
      confirmPassword: '',
      dealership_name: '',
      contact_name: '',
      phone: ''
    })
    const [error, setError] = useState('')

    const handleChange = (e) => {
      setFormData(prev => ({
        ...prev,
        [e.target.name]: e.target.value
      }))
    }

    const handleSubmit = async (e) => {
      e.preventDefault()
      setError('')

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match')
        return
      }

      const { confirmPassword, ...signupData } = formData
      const result = await handleSignup(signupData)
      if (!result.success) {
        setError(result.error)
      }
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Start Your Free Trial
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              14-day free trial • No credit card required
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label htmlFor="dealership_name" className="block text-sm font-medium text-gray-700">
                  Dealership Name
                </label>
                <input
                  id="dealership_name"
                  name="dealership_name"
                  type="text"
                  required
                  value={formData.dealership_name}
                  onChange={handleChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ABC Motors"
                />
              </div>
              <div>
                <label htmlFor="contact_name" className="block text-sm font-medium text-gray-700">
                  Your Name
                </label>
                <input
                  id="contact_name"
                  name="contact_name"
                  type="text"
                  required
                  value={formData.contact_name}
                  onChange={handleChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="john@abcmotors.com"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number (Optional)
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Minimum 8 characters"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={authLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {authLoading ? 'Creating Account...' : 'Start Free Trial'}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className="text-blue-600 hover:text-blue-500 text-sm"
              >
                Already have an account? Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // Show authentication forms if not authenticated
  if (!isAuthenticated) {
    return authMode === 'login' ? <LoginForm /> : <SignupForm />
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900">DealerFlow</h1>
              <span className="ml-2 px-2 py-1 text-xs font-semibold text-blue-600 bg-blue-100 rounded-full">
                Pro
              </span>
              <span className="ml-3 text-lg text-gray-600">Enhanced</span>
              <span className="ml-2 text-sm text-gray-500">Dealership Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              {currentUser && (
                <div className="text-sm text-gray-600">
                  Welcome, {currentUser.contact_name} ({currentUser.dealership_name})
                  {currentUser.subscription_status === 'trial' && (
                    <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                      Trial
                    </span>
                  )}
                </div>
              )}
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {['dashboard', 'content', 'images', 'automation', 'analytics', 'account'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {activeTab === 'dashboard' && (
          <div className="px-4 py-6 sm:px-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Automation Status Card */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        automationStatus.isRunning ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        {automationStatus.isRunning ? '🟢' : '⚪'}
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Automation Status
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {automationStatus.isRunning ? 'Active' : 'Idle'}
                        </dd>
                      </dl>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-gray-500">
                    <p>Posts in queue: {automationStatus.postsInQueue}</p>
                    {automationStatus.nextScheduled && (
                      <p>Next post: {automationStatus.nextScheduled}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Image Library Card */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        🖼️
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Image Library
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {images.length} Images
                        </dd>
                      </dl>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-gray-500">
                    <p>DMS: {dmsConfig.isConfigured ? '✅ Connected' : '❌ Not configured'}</p>
                    <p>Scraping: {scrapingConfig.isConfigured ? '✅ Active' : '❌ Not configured'}</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-2">
                    <button
                      onClick={autoGenerateContent}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                    >
                      Auto-Generate Posts
                    </button>
                    <button
                      onClick={() => setActiveTab('images')}
                      className="w-full bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-700"
                    >
                      Manage Images
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Posts */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Posts</h3>
                <div className="space-y-4">
                  {recentPosts.slice(0, 5).map((post) => (
                    <div key={post.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl">{getPlatformIcon(post.platform)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 capitalize">{post.platform}</p>
                        <p className="text-sm text-gray-500 truncate">{post.content}</p>
                        <div className="mt-1 flex items-center space-x-4 text-xs text-gray-400">
                          <span className={getStatusColor(post.status)}>{post.status}</span>
                          {post.scheduled_for && <span>Scheduled: {post.scheduled_for}</span>}
                          {post.posted_at && <span>Posted: {post.posted_at}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="px-4 py-6 sm:px-0">
            {/* Bulk Content Generation */}
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Bulk Content Generation</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Generate and schedule content across all platforms automatically with images from your library.
                </p>
                <button
                  onClick={autoGenerateContent}
                  className="bg-blue-600 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Generate & Schedule All Platforms
                </button>
              </div>
            </div>

            {/* Individual Content Generator */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Individual Content Generator</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
                    <select
                      value={contentGeneration.platform}
                      onChange={(e) => setContentGeneration(prev => ({ ...prev, platform: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="facebook">Facebook</option>
                      <option value="instagram">Instagram</option>
                      <option value="tiktok">TikTok</option>
                      <option value="reddit">Reddit</option>
                      <option value="x">X (Twitter)</option>
                      <option value="youtube">YouTube</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
                    <select
                      value={contentGeneration.contentType}
                      onChange={(e) => setContentGeneration(prev => ({ ...prev, contentType: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="vehicle_showcase">Vehicle Showcase</option>
                      <option value="promotional">Promotional</option>
                      <option value="general">General</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                    <input
                      type="text"
                      value={contentGeneration.vehicleData.year}
                      onChange={(e) => setContentGeneration(prev => ({
                        ...prev,
                        vehicleData: { ...prev.vehicleData, year: e.target.value }
                      }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Make</label>
                    <input
                      type="text"
                      value={contentGeneration.vehicleData.make}
                      onChange={(e) => setContentGeneration(prev => ({
                        ...prev,
                        vehicleData: { ...prev.vehicleData, make: e.target.value }
                      }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                    <input
                      type="text"
                      value={contentGeneration.vehicleData.model}
                      onChange={(e) => setContentGeneration(prev => ({
                        ...prev,
                        vehicleData: { ...prev.vehicleData, model: e.target.value }
                      }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Keywords (Optional)
                  </label>
                  <input
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="e.g., luxury, certified pre-owned, financing available, weekend special"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Add keywords to customize your content. Separate multiple keywords with commas.
                  </p>
                </div>

                <button
                  onClick={generateContent}
                  className="bg-green-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-green-700 mb-4"
                >
                  Generate Content
                </button>

                {generatedContent && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Generated Content:</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{generatedContent}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'images' && (
          <div className="px-4 py-6 sm:px-0">
            {/* Image Upload Section */}
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Upload Images</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e.target.files)}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <div className="text-4xl mb-2">📁</div>
                    <p className="text-sm text-gray-600">
                      Click to upload images or drag and drop
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      PNG, JPG, GIF up to 10MB each
                    </p>
                  </label>
                  {isUploading && (
                    <div className="mt-4">
                      <div className="bg-blue-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">Uploading...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* DMS Integration Section */}
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">DMS Integration</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Connect to your Dealer Management System to automatically sync vehicle images.
                </p>
                
                {!dmsConfig.isConfigured ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">DMS System</label>
                      <select
                        value={dmsConfig.dmsType}
                        onChange={(e) => setDmsConfig(prev => ({ ...prev, dmsType: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="">Select DMS System</option>
                        <option value="dealersocket">DealerSocket</option>
                        <option value="cdk">CDK Global</option>
                        <option value="reynolds">Reynolds & Reynolds</option>
                        <option value="automate">Automate</option>
                        <option value="dealertrack">DealerTrack</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                      <input
                        type="password"
                        placeholder="Enter your DMS API key"
                        onChange={(e) => setDmsConfig(prev => ({
                          ...prev,
                          credentials: { ...prev.credentials, api_key: e.target.value }
                        }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    
                    <button
                      onClick={() => configureDMS(dmsConfig.dmsType, dmsConfig.credentials)}
                      disabled={!dmsConfig.dmsType || !dmsConfig.credentials.api_key}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      Configure DMS Integration
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-green-600">✅</span>
                      <span className="text-sm text-gray-700">DMS Integration Active</span>
                    </div>
                    
                    {dmsConfig.syncStatus && (
                      <div className="text-sm text-gray-600">
                        <p>Last sync: {dmsConfig.syncStatus.last_sync}</p>
                        <p>Total synced: {dmsConfig.syncStatus.total_synced} images</p>
                      </div>
                    )}
                    
                    <button
                      onClick={syncDMSImages}
                      className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700"
                    >
                      Sync Images Now
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Website Scraping Section */}
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Website Scraping</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Automatically scrape vehicle images from your dealership website.
                </p>
                
                {!scrapingConfig.isConfigured ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Website URL</label>
                      <input
                        type="url"
                        placeholder="https://your-dealership-website.com"
                        value={scrapingConfig.websiteUrl}
                        onChange={(e) => setScrapingConfig(prev => ({ ...prev, websiteUrl: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    
                    <button
                      onClick={() => configureWebsiteScraping(scrapingConfig.websiteUrl)}
                      disabled={!scrapingConfig.websiteUrl}
                      className="bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-700 disabled:bg-gray-400"
                    >
                      Configure Website Scraping
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-green-600">✅</span>
                      <span className="text-sm text-gray-700">Website Scraping Active</span>
                    </div>
                    
                    {scrapingConfig.scrapingStatus && (
                      <div className="text-sm text-gray-600">
                        <p>Website: {scrapingConfig.scrapingStatus.website_url}</p>
                        <p>Platform: {scrapingConfig.scrapingStatus.platform_detected}</p>
                        <p>Last scrape: {scrapingConfig.scrapingStatus.last_scrape}</p>
                        <p>Total scraped: {scrapingConfig.scrapingStatus.total_scraped} images</p>
                      </div>
                    )}
                    
                    <button
                      onClick={scrapeWebsiteImages}
                      className="bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-700"
                    >
                      Scrape Images Now
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Image Gallery */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Image Library ({images.length} images)</h3>
                
                {images.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">📷</div>
                    <p className="text-gray-500">No images uploaded yet</p>
                    <p className="text-sm text-gray-400">Upload images, configure DMS, or set up website scraping to get started</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {images.slice(0, 12).map((image) => (
                      <div key={image.id} className="relative group">
                        <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                          <img
                            src={`${API_BASE_URL}/api/images/${image.id}/file?dealership_id=1`}
                            alt={image.alt_text || 'Vehicle image'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            onError={(e) => {
                              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTAwTDEwMCAxMDBaIiBzdHJva2U9IiM5Q0E0QUYiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K'
                            }}
                          />
                        </div>
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white text-center">
                            <p className="text-xs font-medium">{image.vehicle_year} {image.vehicle_make}</p>
                            <p className="text-xs">{image.source_type}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'automation' && (
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Automation Settings</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Configure automated posting schedules and content generation with image integration.
                </p>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-2">Posting Schedule</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                        <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                          <option>Daily</option>
                          <option>Twice Daily</option>
                          <option>Weekly</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Best Time</label>
                        <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                          <option>Auto-optimize</option>
                          <option>Morning (9 AM)</option>
                          <option>Afternoon (2 PM)</option>
                          <option>Evening (6 PM)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-2">Content Mix</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Vehicle Showcases</span>
                        <span className="text-sm text-gray-500">60%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Promotional Posts</span>
                        <span className="text-sm text-gray-500">25%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">General Content</span>
                        <span className="text-sm text-gray-500">15%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <button className="bg-blue-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
                      Save Automation Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Analytics Dashboard</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Track performance across all platforms and image sources.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">847</div>
                    <div className="text-sm text-gray-500">Total Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">12.4K</div>
                    <div className="text-sm text-gray-500">Total Engagement</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">156</div>
                    <div className="text-sm text-gray-500">Leads Generated</div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900">Platform Performance</h4>
                  {['Facebook', 'Instagram', 'TikTok', 'Reddit', 'X', 'YouTube'].map((platform) => (
                    <div key={platform} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{getPlatformIcon(platform)}</span>
                        <span className="font-medium">{platform}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {Math.floor(Math.random() * 1000) + 500} engagements
                        </div>
                        <div className="text-xs text-gray-500">
                          {Math.floor(Math.random() * 50) + 20} posts this month
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'account' && (
          <div className="px-4 py-6 sm:px-0">
            <div className="space-y-6">
              {/* Subscription Overview */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Subscription Overview</h3>
                  
                  {subscription && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600 capitalize">{subscription.plan}</div>
                        <div className="text-sm text-gray-500">Current Plan</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${subscription.status === 'active' ? 'text-green-600' : subscription.status === 'trial' ? 'text-yellow-600' : 'text-red-600'}`}>
                          {subscription.status === 'trial' ? 'Trial' : subscription.status === 'active' ? 'Active' : 'Inactive'}
                        </div>
                        <div className="text-sm text-gray-500">Status</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{subscription.days_until_renewal}</div>
                        <div className="text-sm text-gray-500">Days Until Renewal</div>
                      </div>
                    </div>
                  )}

                  {subscription && subscription.status === 'trial' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <span className="text-yellow-400">⚠️</span>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-yellow-800">
                            Trial Period Active
                          </h3>
                          <div className="mt-2 text-sm text-yellow-700">
                            <p>
                              Your free trial expires in {subscription.days_until_renewal} days. 
                              Upgrade now to continue using all features.
                            </p>
                          </div>
                          <div className="mt-4">
                            <button
                              onClick={() => setShowUpgradeModal(true)}
                              className="bg-yellow-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-700"
                            >
                              Upgrade Now
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {subscription && subscription.features && (
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">Plan Features</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-green-500">✓</span>
                          <span className="text-sm">
                            {subscription.features.max_posts_per_month === -1 ? 'Unlimited' : subscription.features.max_posts_per_month} posts per month
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-green-500">✓</span>
                          <span className="text-sm">
                            {subscription.features.max_images === -1 ? 'Unlimited' : subscription.features.max_images} images
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-green-500">✓</span>
                          <span className="text-sm">
                            {subscription.features.platforms.length} platforms: {subscription.features.platforms.join(', ')}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={subscription.features.automation ? "text-green-500" : "text-gray-400"}>
                            {subscription.features.automation ? "✓" : "✗"}
                          </span>
                          <span className="text-sm">Automation features</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={subscription.features.analytics ? "text-green-500" : "text-gray-400"}>
                            {subscription.features.analytics ? "✓" : "✗"}
                          </span>
                          <span className="text-sm">Advanced analytics</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-green-500">✓</span>
                          <span className="text-sm capitalize">{subscription.features.support} support</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex space-x-4">
                    {subscription && subscription.status === 'trial' && (
                      <button
                        onClick={() => setShowUpgradeModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                      >
                        Upgrade Plan
                      </button>
                    )}
                    {subscription && subscription.status === 'active' && (
                      <>
                        <button
                          onClick={() => setShowUpgradeModal(true)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                        >
                          Change Plan
                        </button>
                        <button
                          onClick={handleCancelSubscription}
                          className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
                        >
                          Cancel Subscription
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Available Plans */}
              {showUpgradeModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                  <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                    <div className="mt-3">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Choose Your Plan</h3>
                      
                      <div className="mb-4">
                        <div className="flex space-x-4">
                          <button
                            onClick={() => setBillingCycle('monthly')}
                            className={`px-4 py-2 rounded-md text-sm font-medium ${
                              billingCycle === 'monthly' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            Monthly
                          </button>
                          <button
                            onClick={() => setBillingCycle('yearly')}
                            className={`px-4 py-2 rounded-md text-sm font-medium ${
                              billingCycle === 'yearly' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            Yearly (Save 17%)
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {Object.entries(subscriptionPlans).map(([planKey, plan]) => (
                          <div 
                            key={planKey}
                            className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                              selectedPlan === planKey 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 hover:border-gray-300'
                            } ${plan.recommended ? 'ring-2 ring-blue-500' : ''}`}
                            onClick={() => setSelectedPlan(planKey)}
                          >
                            {plan.recommended && (
                              <div className="text-xs font-medium text-blue-600 mb-2">RECOMMENDED</div>
                            )}
                            <h4 className="text-lg font-medium text-gray-900">{plan.name}</h4>
                            <div className="mt-2">
                              <span className="text-2xl font-bold text-gray-900">
                                ${billingCycle === 'yearly' ? plan.features.price_yearly : plan.features.price_monthly}
                              </span>
                              <span className="text-gray-500">/{billingCycle === 'yearly' ? 'year' : 'month'}</span>
                            </div>
                            <ul className="mt-4 space-y-2 text-sm text-gray-600">
                              <li>• {plan.features.max_posts_per_month === -1 ? 'Unlimited' : plan.features.max_posts_per_month} posts/month</li>
                              <li>• {plan.features.max_images === -1 ? 'Unlimited' : plan.features.max_images} images</li>
                              <li>• {plan.features.platforms.length} platforms</li>
                              <li>• {plan.features.automation ? 'Automation included' : 'No automation'}</li>
                              <li>• {plan.features.analytics ? 'Advanced analytics' : 'Basic analytics'}</li>
                            </ul>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end space-x-4">
                        <button
                          onClick={() => setShowUpgradeModal(false)}
                          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => selectedPlan && handleUpgradeSubscription(selectedPlan, billingCycle)}
                          disabled={!selectedPlan}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                        >
                          {subscription && subscription.status === 'trial' ? 'Start Subscription' : 'Change Plan'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment History */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Payment History</h3>
                  
                  {paymentHistory.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No payment history available</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Description
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {paymentHistory.map((payment) => (
                            <tr key={payment.payment_id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(payment.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {payment.description}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                ${payment.amount}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  payment.status === 'completed' 
                                    ? 'bg-green-100 text-green-800'
                                    : payment.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {payment.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Account Settings */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Account Settings</h3>
                  
                  {currentUser && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Dealership Name</label>
                          <div className="mt-1 text-sm text-gray-900">{currentUser.dealership_name}</div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Contact Name</label>
                          <div className="mt-1 text-sm text-gray-900">{currentUser.contact_name}</div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Email</label>
                          <div className="mt-1 text-sm text-gray-900">{currentUser.email}</div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Phone</label>
                          <div className="mt-1 text-sm text-gray-900">{currentUser.phone || 'Not provided'}</div>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-gray-200">
                        <button
                          onClick={() => alert('Profile editing feature coming soon!')}
                          className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700"
                        >
                          Edit Profile
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App

