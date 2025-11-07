
import React, { useState } from 'react';
import './AIAssistant.css';
import { supabase } from '../supabaseClient';

const AIAssistant = ({ onTransactionAdd }) => {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const callGeminiAPI = async (text) => {
    const response = await fetch('http://localhost:3000/gemini-parse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setIsLoading(true);
    setMessage('');

    try {
      const transaction = await callGeminiAPI(inputValue);

      if (transaction && transaction.amount !== undefined && transaction.description) {
        await onTransactionAdd(transaction);
        setMessage(`Success! Your ${transaction.type} has been added.`);
        setInputValue('');
      } else {
        setMessage("Sorry, I couldn't understand that. Please try again with more details.");
      }
    } catch (error) {
      console.error('Error processing transaction:', error);
      setMessage('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ai-assistant-container">
      <h3>AI Assistant (Beta)</h3>
      <p>Tell me about your latest transaction (e.g., "Gastei 25 euros em jantar")</p>
      <form onSubmit={handleSubmit} className="ai-assistant-form">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Tell me about your latest transaction..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Processing...' : 'Add'}
        </button>
      </form>
      {message && <p className="ai-assistant-message">{message}</p>}
    </div>
  );
};

export default AIAssistant;
