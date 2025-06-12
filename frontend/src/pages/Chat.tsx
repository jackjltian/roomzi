import React from 'react';
import { ChatWindow } from '../components/chat/ChatWindow';

export default function Chat() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>
      <ChatWindow />
    </div>
  );
} 