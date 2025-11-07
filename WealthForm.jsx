import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './WealthForm.css';

function WealthForm() {
  const [cash, setCash] = useState('');
  const [savings, setSavings] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchWealthData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('wealth')
          .select('cash, savings')
          .eq('user_id', user.id)
          .single();

        if (data) {
          setCash(data.cash || '');
          setSavings(data.savings || '');
        }
      }
    };
    fetchWealthData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!cash && !savings) {
      alert('Please fill out at least one field.');
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    let success = false;
    let errorMsg = null;

    const { error } = await supabase
        .from('wealth')
        .upsert({
            user_id: user.id,
            cash: cash ? parseFloat(cash) : 0,
            savings: savings ? parseFloat(savings) : 0,
        }, { onConflict: 'user_id' });
    
    if (error) {
        errorMsg = error.message;
    } else {
        success = true;
    }

    setLoading(false);

    let alertMessage = '';
    if (success) {
      alertMessage += 'Wealth saved successfully!\n';
    }
    if (errorMsg) {
      alertMessage += `Error saving wealth: ${errorMsg}\n`;
    }

    if (alertMessage) {
        alert(alertMessage);
        if (success) {
            // Do not clear fields, so user can see current values
        }
    }
  };

  return (
    <div className="wealth-form-container">
      <h3>Update Your Wealth</h3>
      <form onSubmit={handleSubmit} className="wealth-form">
        <div className="form-group">
          <label htmlFor="available-cash">Available Cash</label>
          <input
            id="available-cash"
            type="number"
            value={cash}
            onChange={(e) => setCash(e.target.value)}
            placeholder="Available Cash"
          />
        </div>
        <div className="form-group">
          <label htmlFor="total-savings">Total Savings</label>
          <input
            id="total-savings"
            type="number"
            value={savings}
            onChange={(e) => setSavings(e.target.value)}
            placeholder="Total Savings"
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Wealth'}
        </button>
      </form>
    </div>
  );
}

export default WealthForm;