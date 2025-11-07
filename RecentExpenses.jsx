
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './RecentExpenses.css';

function RecentExpenses({ refreshTrigger }) {
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentExpenses = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data: expensesData, error: expensesError } = await supabase
          .from('expenses')
          .select('id, description, amount, category_id, expense_date')
          .eq('user_id', user.id)
          .order('expense_date', { ascending: false })
          .limit(5); // Fetch only the 5 most recent expenses

        if (expensesError) throw expensesError;

        // Fetch categories to display category names
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('id, name');
        
        if (categoriesError) throw categoriesError;

        const categoryMap = new Map(categoriesData.map(cat => [cat.id, cat.name]));

        const expensesWithCategories = expensesData.map(expense => ({
          ...expense,
          category_name: categoryMap.get(expense.category_id) || 'Uncategorized',
        }));

        setRecentExpenses(expensesWithCategories);
      } catch (error) {
        console.error('Error fetching recent expenses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentExpenses();
  }, [refreshTrigger]);

  if (loading) {
    return <div className="recent-expenses-container"><h3>Recent Expenses</h3><p>Loading...</p></div>;
  }

  return (
    <div className="recent-expenses-container">
      <h3>Recent Expenses</h3>
      {recentExpenses.length === 0 ? (
        <p>No recent expenses to display.</p>
      ) : (
        <ul className="recent-expenses-list">
          {recentExpenses.map(expense => (
            <li key={expense.id} className="recent-expense-item">
              <div className="recent-expense-details">
                <span className="recent-expense-description">{expense.description}</span>
                <span className="recent-expense-category">{expense.category_name}</span>
              </div>
              <span className="recent-expense-amount">€{expense.amount.toFixed(2)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default RecentExpenses;
