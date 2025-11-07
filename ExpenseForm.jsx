import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './ExpenseForm.css';

function ExpenseForm() {
  const [transactionType, setTransactionType] = useState('expense'); // 'expense' or 'income'
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  const [incomeCategoryId, setIncomeCategoryId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const setupCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name');
        
        if (error) throw error;

        if (data) {
          const incomeCategory = data.find(cat => cat.name.trim().toLowerCase() === 'income');
          if (incomeCategory) {
            setIncomeCategoryId(incomeCategory.id);
          } else {
            // Create "Income" category if it doesn't exist
            const { data: newCategoryData, error: newCategoryError } = await supabase
              .from('categories')
              .insert([{ name: 'Income' }])
              .select();
            if (newCategoryError) throw newCategoryError;
            setIncomeCategoryId(newCategoryData[0].id);
          }
          // Filter out the Income category from the user-selectable list
          setCategories(data.filter(cat => cat.name.trim().toLowerCase() !== 'income'));
        }
      } catch (error) {
        console.error('Error setting up categories:', error);
      }
    };

    setupCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!description || !amount) {
      alert('Please fill out all fields.');
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    let transactionSuccess = false;
    let transactionErrorMsg = null;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        alert('Please enter a valid, positive amount.');
        setLoading(false);
        return;
    }

    const isExpense = transactionType === 'expense';
    if (isExpense && (!categoryId || isNaN(parseInt(categoryId, 10)))) {
        alert('Please select a valid category for the expense.');
        setLoading(false);
        return;
    }

    if (!isExpense && !incomeCategoryId) {
        alert('The "Income" category is not set up correctly. Please wait a moment and try again.');
        setLoading(false);
        return;
    }

    const finalAmount = parsedAmount;
    const finalCategoryId = isExpense ? parseInt(categoryId, 10) : incomeCategoryId;

    const { error } = await supabase
        .from('expenses')
        .insert([{
            description,
            amount: finalAmount,
            category_id: finalCategoryId,
            user_id: user.id,
            expense_date: new Date().toISOString(),
        }]);

    if (error) {
        transactionErrorMsg = error.message;
    } else {
        transactionSuccess = true;
    }

    setLoading(false);

    let alertMessage = '';
    if (transactionSuccess) {
      alertMessage += `${transactionType === 'expense' ? 'Expense' : 'Income'} added successfully!\n`;
    }
    if (transactionErrorMsg) {
      alertMessage += `Error adding transaction: ${transactionErrorMsg}\n`;
    }

    if (alertMessage) {
        alert(alertMessage);
        if (transactionSuccess) {
            setDescription('');
            setAmount('');
            setCategoryId('');
        }
    }
  };

  return (
    <div className="expense-form-container">
      <h3>Register</h3>
      <div className="transaction-type-selector">
        <button
          className={transactionType === 'expense' ? 'active' : ''}
          onClick={() => setTransactionType('expense')}
        >
          Expense
        </button>
        <button
          className={transactionType === 'income' ? 'active' : ''}
          onClick={() => setTransactionType('income')}
        >
          Income
        </button>
      </div>
      <form onSubmit={handleSubmit} className="expense-form">
        <div className="form-group">
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
          />
        </div>
        <div className="form-group">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
          />
        </div>
        {transactionType === 'expense' && (
          <div className="form-group">
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="" disabled>Select a category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save'}
        </button>
      </form>
    </div>
  );
}

export default ExpenseForm;