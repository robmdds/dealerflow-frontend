import React, { useState, useEffect } from 'react'
import './App.css'

function App() {
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
      features: ['Backup Camera', 'Bluetooth', 'Cruise Control']
    },
    keywords: ''
  })
  const [generatedContent, setGeneratedContent] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [recentPosts, setRecentPosts] = useState([])
  const [automationStatus, setAutomationStatus] = useState('idle')
  const [postsInQueue, setPostsInQueue] = useState(0)
  const [images, setImages] = useState([])
  const [selectedImage, setSelectedImage] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [dmsStatus, setDmsStatus] = useState('not_configured')
  const [scrapingStatus, setScrapingStatus] = useState('not_configured')
  const [scrapingConfig, setScrapingConfig] = useState({
    url: '',
    isConfigured: false,
    lastSync: null
  })

  const API_BASE_URL = import.meta.env.PROD ? 'https://60h5imcyyx9g.manus.space' : 'http://localhost:5000'

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
  }

  const fetchRecentPosts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dealership/1/posts`)
      if (response.ok) {
        const data = await response.json()
        setRecentPosts(data.posts || [])
      }
    } catch (error) {
      console.error('Error fetching recent posts:', error)
    }
  }

  const fetchAutomationStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/automation/status/1`)
      if (response.ok) {
        const data = await response.json()
        setAutomationStatus(data.status || 'idle')
        setPostsInQueue(data.posts_in_queue || 0)
      }
    } catch (error) {
      console.error('Error fetching automation status:', error)
    }
  }

  const fetchImages = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/images/dealership/1`)
      if (response.ok) {
        const data = await response.json()
        setImages(data.images || [])
      }
    } catch (error) {
      console.error('Error fetching images:', error)
    }
  }

  const fetchDMSStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dms/sync-status/1`)
      if (response.ok) {
        const data = await response.json()
        setDmsStatus(data.status || 'not_configured')
      }
    } catch (error) {
      console.error('Error fetching DMS status:', error)
    }
  }

  const fetchScrapingStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/scraping/scraping-status/1`)
      if (response.ok) {
        const data = await response.json()
        setScrapingStatus(data.status || 'not_configured')
        setScrapingConfig({
          url: data.url || '',
          isConfigured: data.status === 'configured',
          lastSync: data.last_sync
        })
      }
    } catch (error) {
      console.error('Error fetching scraping status:', error)
    }
  }

  useEffect(() => {
    fetchRecentPosts()
    fetchAutomationStatus()
    fetchImages()
    fetchDMSStatus()
    fetchScrapingStatus()
  }, [])

  const handleContentGeneration = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/content/generate-bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dealership_id: 1,
          content_type: contentGeneration.contentType,
          vehicle_data: contentGeneration.vehicleData,
          keywords: contentGeneration.keywords,
          platforms: ['facebook', 'instagram', 'tiktok', 'reddit', 'x', 'youtube']
        })
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratedContent(data.content || [])
      }
    } catch (error) {
      console.error('Error generating content:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleImageUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setIsUploading(true)
    setUploadProgress(0)

    const formData = new FormData()
    formData.append('image', file)
    formData.append('dealership_id', '1')

    try {
      const response = await fetch(`${API_BASE_URL}/api/images/upload`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setImages(prev => [...prev, data.image])
        setUploadProgress(100)
      }
    } catch (error) {
      console.error('Error uploading image:', error)
    } finally {
      setIsUploading(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }

  const handleScrapingSetup = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/scraping/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dealership_id: 1,
          website_url: scrapingConfig.url
        })
      })

      if (response.ok) {
        const data = await response.json()
        setScrapingConfig(prev => ({
          ...prev,
          isConfigured: true
        }))
        setScrapingStatus('configured')
        fetchImages() // Refresh images after setup
      }
    } catch (error) {
      console.error('Error setting up scraping:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900">DealerFlow Pro</h1>
              <span className="ml-2 px-2 py-1 text-xs font-semibold text-blue-600 bg-blue-100 rounded-full">Enhanced</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Dealership Dashboard</span>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">D</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {['dashboard', 'content', 'images', 'automation', 'analytics'].map((tab) => (
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Automation Status */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`w-3 h-3 rounded-full ${automationStatus === 'running' ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Automation Status</dt>
                        <dd className="text-lg font-medium text-gray-900 capitalize">{automationStatus}</dd>
                      </dl>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-gray-500">Posts in queue: {postsInQueue}</p>
                  </div>
                </div>
              </div>

              {/* Image Library */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">🖼️</span>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Image Library</dt>
                        <dd className="text-lg font-medium text-gray-900">{images.length} Images</dd>
                      </dl>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center text-sm">
                      <span className="mr-2">DMS:</span>
                      <span className={dmsStatus === 'configured' ? 'text-green-600' : 'text-red-600'}>
                        {dmsStatus === 'configured' ? '✓' : '✗'} {dmsStatus === 'configured' ? 'Connected' : 'Not configured'}
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="mr-2">Scraping:</span>
                      <span className={scrapingStatus === 'configured' ? 'text-green-600' : 'text-red-600'}>
                        {scrapingStatus === 'configured' ? '✓' : '✗'} {scrapingStatus === 'configured' ? 'Connected' : 'Not configured'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setActiveTab('content')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
                >
                  Auto-Generate Posts
                </button>
                <button
                  onClick={() => setActiveTab('images')}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
                >
                  Manage Images
                </button>
              </div>
            </div>

            {/* Recent Posts */}
            <div className="mt-8">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Posts</h3>
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="px-4 py-5 sm:p-6">
                  {recentPosts.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No recent posts. Generate some content to get started!</p>
                  ) : (
                    <div className="space-y-4">
                      {recentPosts.slice(0, 5).map((post, index) => (
                        <div key={index} className="flex items-start space-x-3">
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
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="px-4 py-6 sm:px-0">
            {/* Bulk Content Generation */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Bulk Content Generation</h3>
              <p className="text-sm text-gray-600 mb-6">Generate optimized content for all social media platforms at once.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
                  <select
                    value={contentGeneration.platform}
                    onChange={(e) => setContentGeneration(prev => ({ ...prev, platform: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="vehicle_showcase">Vehicle Showcase</option>
                    <option value="dealership_promotion">Dealership Promotion</option>
                    <option value="service_highlight">Service Highlight</option>
                    <option value="customer_testimonial">Customer Testimonial</option>
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Keywords (Optional)</label>
                <input
                  type="text"
                  value={contentGeneration.keywords}
                  onChange={(e) => setContentGeneration(prev => ({ ...prev, keywords: e.target.value }))}
                  placeholder="luxury, certified pre-owned, financing available"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Add keywords to customize your content. Separate multiple keywords with commas.</p>
              </div>

              <div className="mt-6">
                <button
                  onClick={handleContentGeneration}
                  disabled={isGenerating}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-2 px-4 rounded transition duration-200"
                >
                  {isGenerating ? 'Generating...' : 'Generate Content for All Platforms'}
                </button>
              </div>
            </div>

            {/* Generated Content Display */}
            {generatedContent.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Generated Content</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {generatedContent.map((content, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <span className="text-xl mr-2">{getPlatformIcon(content.platform)}</span>
                        <span className="font-medium capitalize">{content.platform}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-3">{content.content}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Ready to post</span>
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          Schedule
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'images' && (
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Image Management</h3>
              
              {/* Image Upload */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-2">Manual Upload</h4>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <div className="text-gray-400 mb-2">
                      <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600">Click to upload vehicle images</p>
                  </label>
                  {isUploading && (
                    <div className="mt-2">
                      <div className="bg-blue-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Website Scraping */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-2">Website Scraping</h4>
                <div className="flex space-x-2">
                  <input
                    type="url"
                    value={scrapingConfig.url}
                    onChange={(e) => setScrapingConfig(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://yourdealership.com"
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleScrapingSetup}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition duration-200"
                  >
                    Setup Scraping
                  </button>
                </div>
                {scrapingConfig.isConfigured && (
                  <p className="text-sm text-green-600 mt-2">✓ Scraping configured for {scrapingConfig.url}</p>
                )}
              </div>

              {/* Image Gallery */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Image Library ({images.length} images)</h4>
                {images.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No images uploaded yet</p>
                    <p className="text-sm text-gray-400 mt-1">Upload images manually or configure website scraping</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image.url}
                          alt={image.filename}
                          className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-75 transition duration-200"
                          onClick={() => setSelectedImage(image)}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition duration-200"></div>
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
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Automation Settings</h3>
              <p className="text-gray-600 mb-6">Configure automated posting schedules and content generation.</p>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-2">Posting Schedule</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                      <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                        <option>Daily</option>
                        <option>Every 2 days</option>
                        <option>Weekly</option>
                        <option>Custom</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Best Time</label>
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
                  <h4 className="text-md font-medium text-gray-900 mb-2">Platform Selection</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {['Facebook', 'Instagram', 'TikTok', 'Reddit', 'X', 'YouTube'].map((platform) => (
                      <label key={platform} className="flex items-center">
                        <input type="checkbox" defaultChecked className="mr-2" />
                        <span className="text-sm">{getPlatformIcon(platform)} {platform}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-200">
                    Save Automation Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Dashboard</h3>
              <p className="text-gray-600 mb-6">Track performance across all platforms and image sources.</p>
              
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
        )}
      </main>
    </div>
  )
}

export default App

