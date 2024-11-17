import { useState, useEffect } from 'react'
import useStore from '../store/useStore'
import { supabase } from '../lib/supabase'
import { Dialog, Tab } from '@headlessui/react'
import { parseJobDescription } from '../api/parseJob'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Dashboard() {
  const { applications, setApplications, isLoading, setLoading } = useStore()
  const [filter, setFilter] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newApplication, setNewApplication] = useState({
    company: '',
    position: '',
    status: 'applied',
    referral_name: '',
    url: '',
    application_id: ''
  })
  const [editingApplication, setEditingApplication] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAIModalOpen, setIsAIModalOpen] = useState(false)
  const [jobDescription, setJobDescription] = useState('')
  const [isAIProcessing, setIsAIProcessing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('applications')

  useEffect(() => {
    fetchApplications()
  }, [])

  async function fetchApplications() {
    setLoading(true)
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching applications:', error)
    } else {
      setApplications(data)
    }
    setLoading(false)
  }

  const filteredApplications = applications.filter(app => {
    const matchesFilter = filter === 'all' || app.status === filter;
    const searchTerm = searchQuery.toLowerCase();
    const matchesSearch = 
      app.position.toLowerCase().includes(searchTerm) ||
      app.company.toLowerCase().includes(searchTerm) ||
      (app.application_id && app.application_id.toLowerCase().includes(searchTerm)) ||
      (app.referral_name && app.referral_name.toLowerCase().includes(searchTerm));
    
    return matchesFilter && matchesSearch;
  })

  const getCounts = () => {
    const counts = {
      all: applications.length,
      applied: 0,
      processing: 0,
      rejected: 0,
      accepted: 0
    }
    
    applications.forEach(app => {
      counts[app.status]++
    })
    
    return counts
  }

  const counts = getCounts()

  const getStatusColor = (status) => {
    switch (status) {
      case 'applied':
        return 'bg-blue-600 hover:bg-blue-700'
      case 'processing':
        return 'bg-yellow-600 hover:bg-yellow-700'
      case 'rejected':
        return 'bg-red-600 hover:bg-red-700'
      case 'accepted':
        return 'bg-green-600 hover:bg-green-700'
      default:
        return 'bg-gray-600 hover:bg-gray-700'
    }
  }

  const handleAIParse = async (e) => {
    e.preventDefault();
    setIsAIProcessing(true);

    try {
      const parsedData = await parseJobDescription(jobDescription);
      
      setNewApplication({
        company: parsedData.company,
        position: parsedData.position,
        status: 'applied',
        url: parsedData.url || '',
        application_id: parsedData.application_id || '',
        referral_name: ''
      });

      setIsAIModalOpen(false);
      setIsModalOpen(true);
      setJobDescription('');
    } catch (error) {
      console.error('Error parsing job description:', error);
      alert('Error parsing job description. Please try again.');
    }

    setIsAIProcessing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('applications')
        .insert([{ ...newApplication, user_id: user.id }]);

      if (error) throw error;
      
      setIsModalOpen(false);
      setNewApplication({
        company: '',
        position: '',
        status: 'applied',
        referral_name: '',
        url: '',
        application_id: ''
      });
      fetchApplications();
    } catch (error) {
      console.error('Error adding application:', error);
      alert('Error adding application');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: editingApplication.status })
        .eq('id', editingApplication.id);

      if (error) throw error;
      
      setIsEditModalOpen(false);
      setEditingApplication(null);
      fetchApplications();
    } catch (error) {
      console.error('Error updating application:', error);
      alert('Error updating application');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this application?')) {
      setLoading(true);
      
      try {
        const { error } = await supabase
          .from('applications')
          .delete()
          .eq('id', id);

        if (error) throw error;
        
        fetchApplications();
      } catch (error) {
        console.error('Error deleting application:', error);
        alert('Error deleting application');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <Tab.Group defaultIndex={0} onChange={(index) => setActiveTab(index === 0 ? 'applications' : 'jobs')}>
          <div className="border-b border-gray-800 mb-6">
            <Tab.List className="-mb-px flex space-x-8">
              <Tab
                className={({ selected }) =>
                  classNames(
                    'py-4 px-1 border-b-2 text-sm font-medium',
                    selected
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  )
                }
              >
                Applications
              </Tab>
              <Tab
                className={({ selected }) =>
                  classNames(
                    'py-4 px-1 border-b-2 text-sm font-medium',
                    selected
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  )
                }
              >
                Job Board
              </Tab>
            </Tab.List>
          </div>

          <Tab.Panels>
            {/* Applications Panel */}
            <Tab.Panel>
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between mb-6">
                <div className="flex-1 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
                  <h1 className="text-xl sm:text-2xl font-bold whitespace-nowrap">Your Applications</h1>
                  <div className="relative flex-1 max-w-md">
                    <input
                      type="text"
                      className="w-full bg-gray-800 text-white px-4 py-1.5 pl-9 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      placeholder="Search applications..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    className="flex-1 sm:flex-none bg-purple-600 px-3 py-1.5 rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2 text-sm"
                    onClick={() => setIsAIModalOpen(true)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" />
                    </svg>
                    AI
                  </button>
                  <button
                    className="flex-1 sm:flex-none bg-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-700 text-sm"
                    onClick={() => setIsModalOpen(true)}
                  >
                    Add Application
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto -mx-3 px-3 pb-2 mb-4">
                <div className="flex gap-2 sm:gap-3 min-w-max">
                  {['all', 'applied', 'processing', 'rejected', 'accepted'].map((status) => (
                    <button
                      key={status}
                      className={`px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm whitespace-nowrap ${
                        filter === status 
                          ? getStatusColor(status)
                          : 'bg-gray-800 hover:bg-gray-700'
                      }`}
                      onClick={() => setFilter(status)}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                      <span className="bg-gray-700/50 px-1.5 py-0.5 rounded-full text-xs">
                        {counts[status]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {filteredApplications.map((app) => (
                  <div 
                    key={app.id} 
                    className="bg-gray-800 p-3 sm:p-4 rounded-lg hover:bg-gray-700 transition"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="min-w-0 flex-1 pr-2">
                        <h3 className="text-lg font-semibold truncate">{app.company}</h3>
                        {app.application_id && (
                          <span className="text-xs text-gray-400 block truncate">
                            ID: {app.application_id}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => {
                            setEditingApplication(app)
                            setIsEditModalOpen(true)
                          }}
                          className="text-gray-400 hover:text-white p-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(app.id)}
                          className="text-gray-400 hover:text-red-500 p-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-300 mb-2 truncate">{app.position}</p>
                    <div className="flex items-center gap-2 mb-4">
                      <span className={`px-2 py-1 rounded text-sm ${
                        app.status === 'accepted' ? 'bg-green-600' :
                        app.status === 'rejected' ? 'bg-red-600' :
                        app.status === 'processing' ? 'bg-yellow-600' :
                        'bg-blue-600'
                      }`}>
                        {app.status}
                      </span>
                    </div>
                    {app.referral_name && (
                      <p className="text-sm text-gray-400 truncate">
                        Referral: {app.referral_name}
                      </p>
                    )}
                    {app.url && (
                      <a 
                        href={app.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-400 hover:text-indigo-300 mt-2 inline-block truncate"
                      >
                        View Application →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </Tab.Panel>

            {/* Job Board Panel */}
            <Tab.Panel>
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between mb-6">
                <div className="flex-1 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
                  <h1 className="text-xl sm:text-2xl font-bold">Job Board</h1>
                  <div className="relative flex-1 max-w-md">
                    <input
                      type="text"
                      className="w-full bg-gray-800 text-white px-4 py-1.5 pl-9 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      placeholder="Search jobs..."
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button className="flex-1 sm:flex-none bg-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-700 text-sm">
                    Filter Jobs
                  </button>
                </div>
              </div>

              {/* Placeholder for job listings */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-gray-800 p-3 sm:p-4 rounded-lg animate-pulse">
                  <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                </div>
                {/* Add more placeholder cards as needed */}
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>

      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-3 sm:p-4">
          <Dialog.Panel className="bg-gray-800 rounded-lg p-4 w-full max-w-sm mx-3">
            <Dialog.Title className="text-base font-medium mb-3">Add New Application</Dialog.Title>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-1">Company</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-gray-700 rounded-lg"
                    value={newApplication.company}
                    onChange={(e) => setNewApplication({...newApplication, company: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm mb-1">Position</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-gray-700 rounded-lg"
                    value={newApplication.position}
                    onChange={(e) => setNewApplication({...newApplication, position: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm mb-1">Status</label>
                  <select
                    className="w-full px-3 py-2 bg-gray-700 rounded-lg"
                    value={newApplication.status}
                    onChange={(e) => setNewApplication({...newApplication, status: e.target.value})}
                  >
                    <option value="applied">Applied</option>
                    <option value="processing">Processing</option>
                    <option value="rejected">Rejected</option>
                    <option value="accepted">Accepted</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm mb-1">Referral Name (Optional)</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-gray-700 rounded-lg"
                    value={newApplication.referral_name}
                    onChange={(e) => setNewApplication({...newApplication, referral_name: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm mb-1">Application URL</label>
                  <input
                    type="url"
                    className="w-full px-3 py-2 bg-gray-700 rounded-lg"
                    value={newApplication.url}
                    onChange={(e) => setNewApplication({...newApplication, url: e.target.value})}
                    placeholder="https://example.com/job-posting"
                  />
                </div>
                
                <div>
                  <label className="block text-sm mb-1">
                    Application ID 
                    <span className="text-gray-400 text-xs ml-1">(optional)</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-gray-700 rounded-lg"
                    value={newApplication.application_id}
                    onChange={(e) => setNewApplication({
                      ...newApplication, 
                      application_id: e.target.value
                    })}
                    placeholder="e.g., REQ12345"
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Adding...' : 'Add Application'}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>

      <Dialog open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-gray-800 rounded-lg p-6 max-w-sm w-full">
            <Dialog.Title className="text-lg font-medium mb-4">
              Update Application Status
            </Dialog.Title>
            
            <form onSubmit={handleStatusUpdate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-1">Status</label>
                  <select
                    className="w-full px-3 py-2 bg-gray-700 rounded-lg"
                    value={editingApplication?.status}
                    onChange={(e) => setEditingApplication({
                      ...editingApplication,
                      status: e.target.value
                    })}
                  >
                    <option value="applied">Applied</option>
                    <option value="processing">Processing</option>
                    <option value="rejected">Rejected</option>
                    <option value="accepted">Accepted</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>

      <Dialog open={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-gray-800 rounded-lg p-6 max-w-lg w-full">
            <Dialog.Title className="text-lg font-medium mb-4">
              AI Job Parser
            </Dialog.Title>
            
            <form onSubmit={handleAIParse}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-1">
                    Paste Job Description
                  </label>
                  <textarea
                    className="w-full px-3 py-2 bg-gray-700 rounded-lg h-64"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the job description here..."
                    required
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600"
                  onClick={() => setIsAIModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 flex items-center gap-2"
                  disabled={isAIProcessing}
                >
                  {isAIProcessing ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                      Parse with AI
                    </>
                  )}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  )
}