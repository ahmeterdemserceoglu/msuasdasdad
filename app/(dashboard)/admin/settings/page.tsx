'use client';

import { useState } from 'react';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { useAuth } from '@/app/lib/auth-context';
import { toast } from 'react-hot-toast';

export default function AdminSettingsPage() {
    const { } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [newSetting, setNewSetting] = useState('');

    const updateSetting = async () => {
        setIsLoading(true);
        try {
            // Example setting update logic
            if (!newSetting) {
                throw new Error('Geçerli bir ayar giriniz.');
            }
            toast.success('Ayar güncellendi!');
        } catch (error: Error) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Ayarlar</h1>
                <p className="text-gray-600">Platform ayarlarını yönetin</p>
            </div>

            <Card className="p-6">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Yeni Ayar</label>
                    <input
                        type="text"
                        value={newSetting}
                        onChange={(e) => setNewSetting(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <Button
                    onClick={updateSetting}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm"
                    disabled={isLoading}
                >
                    {isLoading ? 'Güncelleniyor...' : 'Ayarı Güncelle'}
                </Button>
            </Card>
        </div>
    );
}
