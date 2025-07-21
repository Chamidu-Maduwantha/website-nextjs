import { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  TrashIcon, 
  UserIcon,
  SparklesIcon,
  ClockIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { useToast } from './ToastProvider';
import ConfirmModal from './ConfirmModal';

interface PremiumUser {
  id: string;
  userId: string;
  username: string;
  addedBy: string;
  addedByUsername: string;
  addedAt: Date;
  tier: string;
  benefits: string[];
  subscriptionType?: string;
  expiresAt?: Date;
  status?: string;
}

export default function PremiumUserManagement() {
  const [premiumUsers, setPremiumUsers] = useState<PremiumUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({ userId: '' });
  const [subscriptionType, setSubscriptionType] = useState('permanent');
  const [submitting, setSubmitting] = useState(false);
  const { showSuccess, showError } = useToast();
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; userId: string; username: string }>({
    isOpen: false,
    userId: '',
    username: ''
  });

  const fetchPremiumUsers = async () => {
    try {
      const response = await fetch('/api/admin/premium/list');
      const data = await response.json();
      
      if (data.success) {
        setPremiumUsers(data.data);
      }
    } catch (error) {
      console.error('Error fetching premium users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPremiumUsers();
  }, []);

  const handleAddPremiumUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.userId) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/admin/premium/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newUser,
          subscriptionType
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        const subscriptionText = subscriptionType === 'monthly' ? 'monthly subscription' : 'permanent access';
        showSuccess('Premium Access Granted!', `Premium ${subscriptionText} granted! The user will receive a welcome message from the bot.`);
        setNewUser({ userId: '' });
        setSubscriptionType('permanent');
        setShowAddForm(false);
        fetchPremiumUsers();
      } else {
        showError('Failed to Grant Premium', data.error);
      }
    } catch (error) {
      showError('Network Error', 'Failed to add premium user. Please try again.');
      console.error('Error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemovePremiumUser = async (userId: string, username: string) => {
    setDeleteModal({ isOpen: true, userId, username });
  };

  const confirmRemovePremium = async () => {
    try {
      const response = await fetch('/api/admin/premium/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: deleteModal.userId }),
      });

      const data = await response.json();
      
      if (data.success) {
        showSuccess('Premium Removed', `Premium access removed from ${deleteModal.username}`);
        fetchPremiumUsers();
      } else {
        showError('Failed to Remove Premium', data.error);
      }
    } catch (error) {
      showError('Network Error', 'Failed to remove premium user. Please try again.');
      console.error('Error:', error);
    }
  };

  const handleRenewSubscription = async (userId: string, username: string) => {
    if (!confirm(`Renew monthly subscription for ${username}? This will extend their premium access by 30 days.`)) return;

    try {
      const response = await fetch('/api/admin/premium/renew', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`✅ Subscription renewed for ${username}! New expiration: ${new Date(data.newExpirationDate).toLocaleDateString()}`);
        fetchPremiumUsers();
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      alert('❌ Error renewing subscription');
      console.error('Error:', error);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/10">
        <div className="animate-pulse">
          <div className="h-6 bg-white/20 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-white/20 rounded"></div>
            <div className="h-4 bg-white/20 rounded w-5/6"></div>
            <div className="h-4 bg-white/20 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <SparklesIcon className="h-6 w-6 text-yellow-400" />
          <h2 className="text-xl font-bold text-white">Premium Users</h2>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center space-x-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Add Premium User</span>
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white/5 rounded-lg p-4 mb-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Add New Premium User</h3>
          <form onSubmit={handleAddPremiumUser} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Discord User ID
              </label>
              <input
                type="text"
                value={newUser.userId}
                onChange={(e) => setNewUser({ ...newUser, userId: e.target.value })}
                placeholder="123456789012345678"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                required
              />
              <p className="text-xs text-white/50 mt-1">
                Right-click on a Discord user and select "Copy User ID" (Developer Mode must be enabled)
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Subscription Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`relative flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-all ${
                  subscriptionType === 'permanent' 
                    ? 'border-yellow-500 bg-yellow-500/20 text-white' 
                    : 'border-white/20 bg-white/5 text-white/70 hover:border-white/40'
                }`}>
                  <input
                    type="radio"
                    name="subscriptionType"
                    value="permanent"
                    checked={subscriptionType === 'permanent'}
                    onChange={(e) => setSubscriptionType(e.target.value)}
                    className="sr-only"
                  />
                  <div className="text-center">
                    <ShieldCheckIcon className="h-5 w-5 mx-auto mb-1" />
                    <div className="font-medium">Permanent</div>
                    <div className="text-xs opacity-75">Never expires</div>
                  </div>
                </label>
                
                <label className={`relative flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-all ${
                  subscriptionType === 'monthly' 
                    ? 'border-yellow-500 bg-yellow-500/20 text-white' 
                    : 'border-white/20 bg-white/5 text-white/70 hover:border-white/40'
                }`}>
                  <input
                    type="radio"
                    name="subscriptionType"
                    value="monthly"
                    checked={subscriptionType === 'monthly'}
                    onChange={(e) => setSubscriptionType(e.target.value)}
                    className="sr-only"
                  />
                  <div className="text-center">
                    <ClockIcon className="h-5 w-5 mx-auto mb-1" />
                    <div className="font-medium">Monthly</div>
                    <div className="text-xs opacity-75">30 days duration</div>
                  </div>
                </label>
              </div>
              <p className="text-xs text-white/50 mt-2">
                Monthly subscriptions will automatically expire after 30 days and users will receive renewal reminders.
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={submitting}
                className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-800 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {submitting ? 'Adding...' : 'Add Premium User'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {premiumUsers.length === 0 ? (
        <div className="text-center py-8">
          <SparklesIcon className="h-12 w-12 text-white/30 mx-auto mb-4" />
          <p className="text-white/60">No premium users yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {premiumUsers.map((user) => (
            <div
              key={user.id}
              className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-yellow-400/50 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-yellow-500/20 p-2 rounded-lg">
                    <UserIcon className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-white">{user.username}</h3>
                      <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black text-xs px-2 py-1 rounded-full font-bold">
                        PREMIUM
                      </span>
                    </div>
                    <p className="text-sm text-white/60">ID: {user.userId}</p>
                    <div className="flex items-center space-x-4 mt-1 text-xs text-white/50">
                      <div className="flex items-center space-x-1">
                        <ClockIcon className="h-3 w-3" />
                        <span>Added {formatDate(user.addedAt)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <ShieldCheckIcon className="h-3 w-3" />
                        <span>By {user.addedByUsername}</span>
                      </div>
                      {user.subscriptionType && (
                        <div className="flex items-center space-x-1">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            user.subscriptionType === 'permanent' 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {user.subscriptionType === 'permanent' ? 'PERMANENT' : 'MONTHLY'}
                          </span>
                        </div>
                      )}
                      {user.expiresAt && (
                        <div className="flex items-center space-x-1">
                          <span className={`text-xs ${
                            new Date(user.expiresAt) < new Date() 
                              ? 'text-red-400' 
                              : new Date(user.expiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                                ? 'text-yellow-400'
                                : 'text-white/50'
                          }`}>
                            {new Date(user.expiresAt) < new Date() 
                              ? `Expired ${formatDate(user.expiresAt)}`
                              : `Expires ${formatDate(user.expiresAt)}`
                            }
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {user.subscriptionType === 'monthly' && (
                    <button
                      onClick={() => handleRenewSubscription(user.userId, user.username)}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs transition-colors flex items-center space-x-1"
                      title="Renew Subscription (+30 days)"
                    >
                      <ClockIcon className="h-3 w-3" />
                      <span>Renew</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleRemovePremiumUser(user.userId, user.username)}
                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
                    title="Remove Premium Access"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-white/10">
                <h4 className="text-sm font-medium text-white/80 mb-2">Premium Benefits:</h4>
                <div className="flex flex-wrap gap-2">
                  {user.benefits.map((benefit, index) => (
                    <span
                      key={index}
                      className="bg-yellow-500/20 text-yellow-300 text-xs px-2 py-1 rounded"
                    >
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, userId: '', username: '' })}
        onConfirm={confirmRemovePremium}
        title="Remove Premium Access"
        message={`Are you sure you want to remove premium access from ${deleteModal.username}? This action cannot be undone.`}
        confirmText="Remove Access"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}
