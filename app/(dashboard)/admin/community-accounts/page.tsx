'use client';

import { useState, useEffect } from 'react';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import Select, { SelectOption } from '@/app/components/ui/Select';
import Modal, { ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/app/components/ui/Modal';

import { useAuth } from '@/app/lib/auth-context';

interface CommunityAccount {
  id?: string;
  type: string;
  name: string;
  url: string;
  imageUrl?: string | null;
}

const CommunityAccountsPage = () => {
  const { firebaseUser: currentUser } = useAuth();
  const [accounts, setAccounts] = useState<CommunityAccount[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<CommunityAccount | null>(null);
  const [formState, setFormState] = useState<CommunityAccount>({
    type: '',
    name: '',
    url: '',
    imageUrl: '',
  });

  const communityAccountTypes: SelectOption[] = [
    { value: 'Instagram', label: 'Instagram' },
    { value: 'Telegram', label: 'Telegram' },
    { value: 'Twitter', label: 'Twitter' },
    { value: 'Facebook', label: 'Facebook' },
    { value: 'YouTube', label: 'YouTube' },
    { value: 'Website', label: 'Website' },
  ];

  useEffect(() => {
    const fetchAccounts = async () => {
      if (!currentUser) return;
      try {
        const idToken = await currentUser.getIdToken();
        const res = await fetch('/api/admin/community-accounts', {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setAccounts(data);
        } else {
          console.error('Failed to fetch accounts');
        }
      } catch (error) {
        console.error('Error fetching accounts:', error);
      }
    };
    fetchAccounts();
  }, [currentUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('handleSubmit called!');
    e.preventDefault();
    
    console.log('Current form state:', formState);
    console.log('Current user:', currentUser);
    
    if (!currentUser) {
      console.error('No current user!');
      return;
    }

    // Validate required fields
    if (!formState.type || !formState.name || !formState.url) {
      console.error('Missing required fields:', {
        type: formState.type,
        name: formState.name,
        url: formState.url
      });
      alert('Please fill in all required fields (Type, Name, URL)');
      return;
    }

    try {
      const method = currentAccount ? 'PUT' : 'POST';
      const url = '/api/admin/community-accounts';
      const body = currentAccount ? { ...formState, id: currentAccount.id } : formState;

      console.log('Submitting form with data:', body);
      const idToken = await currentUser.getIdToken();
      
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(body),
      });

      console.log('API Response status:', res.status);
      console.log('API Response ok:', res.ok);

      if (res.ok) {
        console.log('Success! Fetching accounts and closing modal...');
        fetchAccounts();
        setIsModalOpen(false);
        setCurrentAccount(null);
        setFormState({ type: '', name: '', url: '', imageUrl: '' });
      } else {
        const errorData = await res.json();
        console.error('Failed to save account:', res.status, errorData);
        alert(`Failed to save account: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving account:', error);
      alert(`Error saving account: ${error}`);
    }
  };

  const handleEdit = (account: CommunityAccount) => {
    setCurrentAccount(account);
    setFormState(account);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!currentUser || !confirm('Are you sure you want to delete this account?')) return;

    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch('/api/admin/community-accounts', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        fetchAccounts();
      } else {
        console.error('Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  const openAddModal = () => {
    setCurrentAccount(null);
    setFormState({ type: '', name: '', url: '', imageUrl: '' });
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Community Accounts
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Manage social media accounts and community links
              </p>
            </div>
            <Button 
              onClick={openAddModal} 
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Account
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Accounts</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{accounts.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{accounts.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Most Popular</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {accounts.length > 0 ? accounts.reduce((prev, current) => 
                    (prev.type === 'Instagram' || prev.type === 'Telegram') ? prev : current
                  ).type : 'N/A'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">With Images</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {accounts.filter(acc => acc.imageUrl).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {accounts.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No community accounts yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Get started by adding your first social media account or community link.
            </p>
            <Button 
              onClick={openAddModal}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Your First Account
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {accounts.map((account) => (
              <div key={account.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {account.imageUrl ? (
                        <img 
                          src={account.imageUrl} 
                          alt={account.name} 
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {account.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                          {account.name}
                        </h3>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {account.type}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">URL:</p>
                    <a 
                      href={account.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm break-all hover:underline"
                    >
                      {account.url}
                    </a>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleEdit(account)} 
                      variant="outline"
                      className="flex-1 text-sm py-2 px-3 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </Button>
                    <Button 
                      onClick={() => handleDelete(account.id!)} 
                      variant="danger"
                      className="flex-1 text-sm py-2 px-3 bg-red-600 hover:bg-red-700 text-white transition-colors duration-200"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalHeader>
          <ModalTitle className="text-xl font-semibold text-gray-900 dark:text-white">
            {currentAccount ? 'Edit Account' : 'Add New Account'}
          </ModalTitle>
        </ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody className="space-y-6">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Account Type <span className="text-red-500">*</span>
              </label>
              <Select
                id="type"
                name="type"
                value={formState.type}
                onChange={(e) => setFormState((prev) => ({ ...prev, type: e.target.value }))}
                options={communityAccountTypes}
                placeholder="Select account type"
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Account Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="name"
                name="name"
                value={formState.name}
                onChange={handleInputChange}
                placeholder="Enter account name"
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                URL <span className="text-red-500">*</span>
              </label>
              <Input
                id="url"
                name="url"
                value={formState.url}
                onChange={handleInputChange}
                placeholder="https://example.com"
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Image URL <span className="text-gray-400">(Optional)</span>
              </label>
              <Input
                id="imageUrl"
                name="imageUrl"
                value={formState.imageUrl || ''}
                onChange={handleInputChange}
                placeholder="https://example.com/image.jpg"
                className="w-full"
              />
              {formState.imageUrl && (
                <div className="mt-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Preview:</p>
                  <img 
                    src={formState.imageUrl} 
                    alt="Preview" 
                    className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter className="flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {currentAccount ? 'Update Account' : 'Add Account'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
};

export default CommunityAccountsPage;
