import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import ChatInterface from '@/Components/Chat/ChatInterface';

export default function Index() {
    return (
        <AdminLayout title="Pesan">
            <ChatInterface />
        </AdminLayout>
    );
}
