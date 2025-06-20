'use client'

import { useState, useEffect } from 'react'
import { 
  LightBulbIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline'
import { FeedbackProcessor } from '@/lib/feedbackProcessor'

interface AnalyticsData {
  totalDeclines: number
  actionableFeedback: number
  systemUpdates: number
  categoryBreakdown: Record<string, number>
  recentUpdates: Array<{
    type: string
    description: string
    priority: string
    timestamp: string
  }>
  suggestedImprovements: string[]
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalDeclines: 0,
    actionableFeedback: 0,
    systemUpdates: 0,
    categoryBreakdown: {},
    recentUpdates: [],
    suggestedImprovements: []
  })

  const feedbackProcessor = FeedbackProcessor.getInstance()

  useEffect(() => {
    // In a real app, this would fetch from the database
    // For now, we'll simulate some analytics data
    const mockAnalytics: AnalyticsData = {
      totalDeclines: 12,
      actionableFeedback: 8,
      systemUpdates: 6,
      categoryBreakdown: {
        'availability': 4,
        'pricing': 3,
        'service': 2,
        'provider': 2,
        'other': 1
      },
      recentUpdates: [
        {
          type: 'service_duration',
          description: 'Updated Balayage duration from 120 to 150 minutes',
          priority: 'high',
          timestamp: '2 hours ago'
        },
        {
          type: 'service_pricing',
          description: 'Updated Color pricing from $135 to $150',
          priority: 'high',
          timestamp: '1 day ago'
        },
        {
          type: 'provider_mapping',
          description: 'Removed provider-service mapping for discontinued service',
          priority: 'medium',
          timestamp: '2 days ago'
        },
        {
          type: 'consultation_requirement',
          description: 'Marked Highlights as requiring consultation',
          priority: 'medium',
          timestamp: '3 days ago'
        }
      ],
      suggestedImprovements: [
        'Consider reviewing all service duration estimates',
        'Multiple pricing updates detected - review pricing strategy',
        'Add more availability for popular time slots'
      ]
    }

    setAnalytics(mockAnalytics)
  }, [])

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'availability':
        return <ClockIcon className="h-5 w-5" />
      case 'pricing':
        return <CurrencyDollarIcon className="h-5 w-5" />
      case 'service':
        return <WrenchScrewdriverIcon className="h-5 w-5" />
      case 'provider':
        return <UserIcon className="h-5 w-5" />
      default:
        return <ExclamationTriangleIcon className="h-5 w-5" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100'
      case 'medium':
        return 'text-yellow-600 bg-yellow-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">System Analytics</h1>
            <p className="mt-2 text-sm text-gray-700">
              Track how decline feedback is improving your booking system
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-accent-600 text-white rounded-md hover:bg-accent-700 transition">
              <ChartBarIcon className="h-4 w-4" />
              Export Report
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Declines</dt>
                    <dd className="text-lg font-medium text-gray-900">{analytics.totalDeclines}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <LightBulbIcon className="h-6 w-6 text-accent-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Actionable Feedback</dt>
                    <dd className="text-lg font-medium text-gray-900">{analytics.actionableFeedback}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">System Updates</dt>
                    <dd className="text-lg font-medium text-gray-900">{analytics.systemUpdates}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Improvement Rate</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {analytics.totalDeclines > 0 
                        ? Math.round((analytics.actionableFeedback / analytics.totalDeclines) * 100)
                        : 0}%
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Category Breakdown */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Decline Reasons by Category
              </h3>
              <div className="space-y-4">
                {Object.entries(analytics.categoryBreakdown).map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-gray-600">
                        {getCategoryIcon(category)}
                      </div>
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {category} Issues
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-accent-600 h-2 rounded-full" 
                          style={{ 
                            width: `${(count / analytics.totalDeclines) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-700 w-8">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent System Updates */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Recent System Updates
              </h3>
              <div className="space-y-4">
                {analytics.recentUpdates.map((update, index) => (
                  <div key={index} className="border-l-4 border-accent-400 pl-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {update.type.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(update.priority)}`}>
                        {update.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{update.description}</p>
                    <p className="text-xs text-gray-500">{update.timestamp}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Suggested Improvements */}
        {analytics.suggestedImprovements.length > 0 && (
          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Suggested Improvements
              </h3>
              <div className="space-y-3">
                {analytics.suggestedImprovements.map((improvement, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-accent-50 rounded-lg">
                    <LightBulbIcon className="h-5 w-5 text-accent-600 mt-0.5" />
                    <p className="text-sm text-gray-900">{improvement}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* System State Debug (for development) */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Current System State
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="text-xs text-gray-700 overflow-auto">
                {JSON.stringify(feedbackProcessor.getSystemState(), null, 2)}
              </pre>
            </div>
            
            {/* Test Section */}
            <div className="mt-6 p-4 bg-accent-50 rounded-lg">
              <h4 className="text-md font-medium text-accent-900 mb-3">Test Automated Updates</h4>
              <p className="text-sm text-accent-700 mb-4">
                Click the buttons below to simulate different decline scenarios and see how the system automatically updates.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    const testFeedback = {
                      requestId: 999,
                      reason: 'insufficient_time',
                      actionable: true,
                      requestData: {
                        serviceId: 3, // Balayage
                        service: 'Balayage',
                        duration: 150, // Longer than current 120
                        price: 185,
                        date: 'Today',
                        time: '2:00 PM'
                      }
                    }
                    const updates = feedbackProcessor.processDeclineFeedback(testFeedback)
                    alert(`Generated ${updates.length} system update(s)!\nCheck the console for details.`)
                  }}
                  className="px-3 py-2 bg-accent-600 text-white text-sm rounded hover:bg-accent-700"
                >
                  Test Duration Update
                </button>
                <button
                  onClick={() => {
                    const testFeedback = {
                      requestId: 998,
                      reason: 'price_mismatch',
                      actionable: true,
                      requestData: {
                        serviceId: 2, // Color
                        service: 'Color',
                        duration: 90,
                        price: 150, // Different from current 135
                        date: 'Today',
                        time: '3:00 PM'
                      }
                    }
                    const updates = feedbackProcessor.processDeclineFeedback(testFeedback)
                    alert(`Generated ${updates.length} system update(s)!\nCheck the console for details.`)
                  }}
                  className="px-3 py-2 bg-accent-600 text-white text-sm rounded hover:bg-accent-700"
                >
                  Test Pricing Update
                </button>
                <button
                  onClick={() => {
                    const testFeedback = {
                      requestId: 997,
                      reason: 'provider_not_qualified',
                      actionable: true,
                      requestData: {
                        providerId: 1,
                        serviceId: 3, // Balayage
                        service: 'Balayage',
                        duration: 120,
                        price: 185,
                        date: 'Today',
                        time: '4:00 PM'
                      }
                    }
                    const updates = feedbackProcessor.processDeclineFeedback(testFeedback)
                    alert(`Generated ${updates.length} system update(s)!\nCheck the console for details.`)
                  }}
                  className="px-3 py-2 bg-accent-600 text-white text-sm rounded hover:bg-accent-700"
                >
                  Test Provider Mapping
                </button>
                <button
                  onClick={() => {
                    const testFeedback = {
                      requestId: 996,
                      reason: 'consultation_required',
                      actionable: true,
                      requestData: {
                        serviceId: 1, // Haircut
                        service: 'Haircut',
                        duration: 45,
                        price: 65,
                        date: 'Today',
                        time: '5:00 PM'
                      }
                    }
                    const updates = feedbackProcessor.processDeclineFeedback(testFeedback)
                    alert(`Generated ${updates.length} system update(s)!\nCheck the console for details.`)
                  }}
                  className="px-3 py-2 bg-accent-600 text-white text-sm rounded hover:bg-accent-700"
                >
                  Test Consultation Requirement
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Test Automated Updates */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Test Automated Updates
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <LightBulbIcon className="h-5 w-5 text-gray-600 mt-0.5" />
                <p className="text-sm text-gray-900">Test automated update functionality</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 