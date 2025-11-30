import React, { useState } from 'react';
import { Send, Mic, Sparkles } from 'lucide-react';

interface CommandCenterProps {
  onCommand: (cmd: string) => void;
  isProcessing: boolean;
}

const CommandCenter: React.FC<CommandCenterProps> = ({ onCommand, isProcessing }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onCommand(input);
      setInput('');
    }
  };

  return (
    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-6 mb-8 text-white">
      <h2 className="text-xl font-bold mb-2 flex items-center">
        <Sparkles className="mr-2" size={20} /> 
        AI Automation Center
      </h2>
      <p className="text-indigo-100 text-sm mb-4">
        Type updates like "Anshu fee is clear", "Aman pending", or "Send reminders to everyone".
      </p>
      
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g., Send reminders to all pending students..."
          className="w-full pl-4 pr-12 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-4 focus:ring-indigo-300 shadow-inner"
          disabled={isProcessing}
        />
        <button
          type="submit"
          disabled={isProcessing}
          className="absolute right-2 top-2 bg-indigo-500 hover:bg-indigo-700 text-white p-1.5 rounded-md transition-colors disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </form>
      {isProcessing && (
        <div className="mt-2 text-xs text-indigo-200 animate-pulse">
          Processing with Gemini AI...
        </div>
      )}
    </div>
  );
};

export default CommandCenter;