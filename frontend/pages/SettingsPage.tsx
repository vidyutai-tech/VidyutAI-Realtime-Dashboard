import React, { useContext, useState } from 'react';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import { AppContext } from '../contexts/AppContext';
import { Key, Trash2, PlusCircle, Copy, Check } from 'lucide-react';
import { APIKey } from '../types';

const mockApiKeys: APIKey[] = [
    {
        id: '1',
        name: 'Grafana Integration',
        key: 'sk-ems-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-grafana',
        displayKey: 'sk-ems...fana',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
        status: 'active',
    },
    {
        id: '2',
        name: 'External Reporting Tool',
        key: 'sk-ems-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-report',
        displayKey: 'sk-ems...port',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
        status: 'active',
    },
];

const SettingsPage: React.FC = () => {
  const { theme, setTheme, currency, setCurrency } = useContext(AppContext)!;
  const [apiKeys, setApiKeys] = useState<APIKey[]>(mockApiKeys);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<APIKey | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerateKey = () => {
    if (!newKeyName.trim()) return;
    const key = `sk-ems-${[...Array(32)].map(() => Math.random().toString(36)[2]).join('')}-${newKeyName.slice(0,4).toLowerCase()}`;
    const newKey: APIKey = {
        id: (apiKeys.length + 1).toString(),
        name: newKeyName,
        key: key,
        displayKey: `${key.slice(0, 7)}...${key.slice(-4)}`,
        createdAt: new Date().toISOString(),
        status: 'active',
    };
    setGeneratedKey(newKey);
    setApiKeys(prev => [...prev, newKey]);
  };
  
  const openModal = () => {
    setNewKeyName('');
    setGeneratedKey(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setGeneratedKey(null);
  };
  
  const copyToClipboard = () => {
    if (generatedKey) {
        navigator.clipboard.writeText(generatedKey.key);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDeleteKey = (keyId: string) => {
      if (window.confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
        setApiKeys(prev => prev.filter(key => key.id !== keyId));
      }
  }


  return (
    <div className="space-y-6">
      <Card title="Appearance">
        <div className="flex items-center justify-between">
          <p className="text-gray-500 dark:text-gray-400">Choose your preferred theme.</p>
          <div className="flex items-center p-1 rounded-full bg-gray-200 dark:bg-gray-700">
            <button
              onClick={() => setTheme('light')}
              aria-pressed={theme === 'light'}
              className={`px-4 py-1 text-sm font-medium rounded-full transition-colors ${
                theme === 'light'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:bg-gray-300 dark:text-gray-400 dark:hover:bg-gray-600'
              }`}
            >
              Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              aria-pressed={theme === 'dark'}
              className={`px-4 py-1 text-sm font-medium rounded-full transition-colors ${
                theme === 'dark'
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-300 dark:text-gray-400 dark:hover:bg-gray-600'
              }`}
            >
              Dark
            </button>
          </div>
        </div>
      </Card>
      
      <Card title="Localization">
        <div className="flex items-center justify-between">
          <p className="text-gray-500 dark:text-gray-400">Choose your display currency.</p>
          <div className="flex items-center p-1 rounded-full bg-gray-200 dark:bg-gray-700">
            {(['USD', 'EUR', 'INR'] as const).map((c) => (
               <button
                key={c}
                onClick={() => setCurrency(c)}
                aria-pressed={currency === c}
                className={`px-4 py-1 text-sm font-medium rounded-full transition-colors ${
                  currency === c
                    ? 'bg-white dark:bg-gray-900 text-blue-600 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </Card>

       <Card title="API Keys">
          <div className="flex items-center justify-between mb-4">
              <p className="text-gray-500 dark:text-gray-400">Manage API keys for external integrations.</p>
              <button onClick={openModal} className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Generate New Key
              </button>
          </div>
          <div className="space-y-3">
              {apiKeys.map(key => (
                  <div key={key.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center">
                          <Key className="w-5 h-5 text-gray-400 mr-4"/>
                          <div>
                              <p className="font-semibold">{key.name}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{key.displayKey}</p>
                          </div>
                      </div>
                      <div className="flex items-center space-x-4">
                          <span className="text-xs text-gray-400">Created on {new Date(key.createdAt).toLocaleDateString()}</span>
                          <button onClick={() => handleDeleteKey(key.id)} className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400" aria-label="Delete key">
                              <Trash2 className="w-4 h-4" />
                          </button>
                      </div>
                  </div>
              ))}
          </div>
      </Card>
      
      <Card title="Device Management">
        <p className="text-gray-500 dark:text-gray-400">Device management settings and configurations will be available here in a future update.</p>
      </Card>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={generatedKey ? "API Key Generated" : "Generate New API Key"}>
        {!generatedKey ? (
            <div>
                <label htmlFor="key-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Key Name</label>
                <input
                    type="text"
                    id="key-name"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g. My Custom Integration"
                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <button onClick={handleGenerateKey} disabled={!newKeyName.trim()} className="mt-4 w-full flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold disabled:bg-blue-800">
                    Generate Key
                </button>
            </div>
        ) : (
            <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Please copy this key and store it securely. You will not be able to see it again.</p>
                <div className="flex items-center p-2 bg-gray-100 dark:bg-gray-900 rounded-md border border-gray-300 dark:border-gray-600">
                    <span className="flex-1 font-mono text-sm overflow-x-auto">{generatedKey.key}</span>
                    <button onClick={copyToClipboard} className="ml-2 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
                        {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                    </button>
                </div>
                <button onClick={closeModal} className="mt-4 w-full flex items-center justify-center px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md font-semibold">
                    Done
                </button>
            </div>
        )}
      </Modal>

    </div>
  );
};

export default SettingsPage;