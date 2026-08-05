import React from 'react';
import UserLayout from '@/Layouts/UserLayout';
import ChatInterface from '@/Components/Chat/ChatInterface';

export default function Index() {
    return (
        <UserLayout title="Pesan">
            <ChatInterface guard="user" />
        </UserLayout>
    );
}
