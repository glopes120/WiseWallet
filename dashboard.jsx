
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './Dashboard.css';
import Summary from './Summary.jsx';
import ExpenseChart from './ExpenseChart.jsx';
import MonthlyExpenseChart from './MonthlyExpenseChart.jsx';
import './MonthlyExpenseChart.css';
import RecentExpenses from './RecentExpenses.jsx';
import './RecentExpenses.css';
import BudgetOverview from './BudgetOverview.jsx';
import './BudgetOverview.css';
import SavingsGoals from './SavingsGoals.jsx';
import './SavingsGoals.css';
import ExpenseForm from './ExpenseForm.jsx';
import History from './History.jsx';
import BudgetForm from './BudgetForm.jsx';
import Categories from './Categories.jsx';
import Profile from './Profile.jsx';
import ResetData from './ResetData.jsx';
import WealthForm from './WealthForm.jsx';
import BudgetList from './BudgetList.jsx';
import SavingsGoalForm from './SavingsGoalForm.jsx';
import './SavingsGoalForm.css';
import AIAssistant from './AIAssistant.jsx';

// Import icons (placeholder for now)
// import { Home, History, PlusCircle, Settings, User } from 'lucide-react'; // Example icon import

function Dashboard({ view, setView }) {
  const [expenses, setExpenses] = useState([]);
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [incomeCategoryId, setIncomeCategoryId] = useState(null);
  const [editingBudget, setEditingBudget] = useState(null);
  const [refreshSavingsGoals, setRefreshSavingsGoals] = useState(false);
  const [refreshRecentExpenses, setRefreshRecentExpenses] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch categories to identify the income category
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name');
      if (categoriesError) throw categoriesError;

      const incomeCategory = categoriesData.find(cat => cat.name.trim().toLowerCase() === 'income');
      const incomeCatId = incomeCategory ? incomeCategory.id : null;
      setIncomeCategoryId(incomeCatId);

      // --- Simplified Budget Calculation --- 

      // 1. Get dates for current and previous months
      const year = selectedMonth.getFullYear();
      const month = selectedMonth.getMonth();
      const currentStartDate = new Date(year, month, 1);
      const currentEndDate = new Date(year, month + 1, 0);

      const previousMonthDate = new Date(selectedMonth);
      previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);
      const previousYear = previousMonthDate.getFullYear();
      const previousMonth = previousMonthDate.getMonth();
      const previousStartDate = new Date(previousYear, previousMonth, 1);
      const previousEndDate = new Date(previousYear, previousMonth + 1, 0);

      // 2. Fetch data for current month
      const { data: currentExpensesData, error: currentExpensesError } = await supabase
        .from('expenses')
        .select('id, description, amount, category_id, emotion, expense_date, user_id')
        .gte('expense_date', currentStartDate.toISOString())
        .lte('expense_date', currentEndDate.toISOString())
        .order('expense_date', { ascending: false });
      if (currentExpensesError) throw currentExpensesError;

      const { data: currentBudgetData, error: currentBudgetError } = await supabase
        .from('budgets')
        .select('amount')
        .gte('end_date', currentStartDate.toISOString())
        .lte('start_date', currentEndDate.toISOString());
      if (currentBudgetError) throw currentBudgetError;

      // 3. Fetch data for previous month
      const { data: previousExpensesData, error: previousExpensesError } = await supabase
        .from('expenses')
        .select('amount, category_id, user_id')
        .gte('expense_date', previousStartDate.toISOString())
        .lte('expense_date', previousEndDate.toISOString());
      if (previousExpensesError) throw previousExpensesError;

      const { data: previousBudgetData, error: previousBudgetError } = await supabase
        .from('budgets')
        .select('amount')
        .gte('end_date', previousStartDate.toISOString())
        .lte('start_date', previousEndDate.toISOString());
      if (previousBudgetError) throw previousBudgetError;

      // 4. Calculate totals and cumulative budget
      const currentBudgetTotal = currentBudgetData.reduce((sum, budget) => sum + budget.amount, 0);
      const previousBudgetTotal = previousBudgetData.reduce((sum, budget) => sum + budget.amount, 0);

      const previousNetExpenses = previousExpensesData.reduce((sum, expense) => {
          return expense.category_id === incomeCatId ? sum - expense.amount : sum + expense.amount;
      }, 0);

      const previousMonthRemaining = previousBudgetTotal - previousNetExpenses;
      const carryOver = previousMonthRemaining > 0 ? previousMonthRemaining : 0;
      const cumulativeBudget = currentBudgetTotal + carryOver;

      // 5. Set state
      setExpenses(currentExpensesData || []);
      setMonthlyBudget(cumulativeBudget);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionAdd = async (transaction) => {
    try {
      console.log("Attempting to add transaction:", transaction);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("User not logged in.");
        return;
      }

      let categoryId = null;
      if (transaction.type === 'income') {
        console.log("Transaction type is income. Using incomeCategoryId:", incomeCategoryId);
        categoryId = incomeCategoryId;
      } else {
        console.log("Transaction type is expense. Finding default expense category.");
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('id, name');
        if (categoriesError) throw categoriesError;

        const expenseCategory = categoriesData.find(cat => cat.name.trim().toLowerCase() !== 'income');
        if (expenseCategory) {
          categoryId = expenseCategory.id;
          console.log("Found expense category:", categoryId);
        } else {
          console.log("No default expense category found.");
        }
      }

      if (!categoryId) {
        console.error("Could not determine a category for the transaction.");
        return;
      }

      const { error } = await supabase.from('expenses').insert([
        {
          description: transaction.description,
          amount: transaction.amount,
          category_id: categoryId,
          expense_date: new Date().toISOString(),
          user_id: user.id, // Add user_id here
        },
      ]);

      if (error) {
        throw error;
      }

      console.log("Transaction added successfully! Refreshing data...");
      fetchData(); // Refresh data after adding transaction
      setRefreshRecentExpenses(prev => !prev); // Toggle to trigger RecentExpenses re-fetch

    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

  useEffect(() => {
    fetchData();

    const subscriptionBudgets = supabase
      .channel('public:budgets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'budgets' }, payload => {
        console.log('Budget change received!', payload);
        fetchData(); // Re-fetch data on any change
      })
      .subscribe();

    const subscriptionExpenses = supabase
      .channel('public:expenses')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, payload => {
        console.log('Expense change received!', payload);
        fetchData(); // Re-fetch data on any change
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscriptionBudgets);
      supabase.removeChannel(subscriptionExpenses);
    };
  }, [selectedMonth]);

  const handlePreviousMonth = () => {
    setSelectedMonth(new Date(selectedMonth.setMonth(selectedMonth.getMonth() - 1)));
  };

  const handleNextMonth = () => {
    setSelectedMonth(new Date(selectedMonth.setMonth(selectedMonth.getMonth() + 1)));
  };

  const renderMainContent = () => {
    switch (view) {
      case 'new_expense':
        return (
          <>
            <ExpenseForm />
            <WealthForm />
          </>
        );
      case 'history':
        return <History expenses={expenses} loading={loading} incomeCategoryId={incomeCategoryId} />;
      case 'planning':
        return (
          <>
            <BudgetForm editingBudget={editingBudget} setEditingBudget={setEditingBudget} />
            <BudgetList
              selectedMonth={selectedMonth}
              onEditBudget={setEditingBudget}
              onBudgetDeleted={() => setEditingBudget(null)} // Clear editing state on delete
            />
            <SavingsGoalForm onGoalAdded={() => setRefreshSavingsGoals(prev => !prev)} />
          </>
        );
      case 'categories':
        return <Categories />;
      case 'profile':
        return <Profile />;
      case 'settings':
        return <ResetData />;
      case 'dashboard':
      default:
        return (
          <>
            {/* Add a header for the dashboard */}
            <div className="dashboard-header">
                <img src="/Logotipo (1).png" alt="WiseWallet Logo" className="dashboard-logo" />
                <h2>Dashboard</h2>
                <div className="month-selector">
                  <button onClick={handlePreviousMonth}>&lt;</button>
                  <span>{selectedMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                  <button onClick={handleNextMonth}>&gt;</button>
                </div>
            </div>
            <AIAssistant onTransactionAdd={handleTransactionAdd} />
            <Summary expenses={expenses} budget={monthlyBudget} incomeCategoryId={incomeCategoryId} />
            <div className="dashboard-content-grid">
              <div className="main-charts-area">
                <ExpenseChart expenses={expenses} incomeCategoryId={incomeCategoryId} />
                <MonthlyExpenseChart />
              </div>
              <div className="side-content-area">
                <RecentExpenses refreshTrigger={refreshRecentExpenses} />
                <BudgetOverview />
                <SavingsGoals refreshTrigger={refreshSavingsGoals} />
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <div className="dashboard-container">
      <div className="main-content">
        {renderMainContent()}
      </div>
      <nav className="bottom-nav">
        <button onClick={() => setView('dashboard')} className={view === 'dashboard' ? 'active' : ''}>
          {/* <Home size={20} /> */} {/* Placeholder for icon */}
          <span>Dashboard</span>
        </button>
        <button onClick={() => setView('history')} className={view === 'history' ? 'active' : ''}>
          {/* <History size={20} /> */} {/* Placeholder for icon */}
          <span>History</span>
        </button>
        <button onClick={() => setView('new_expense')} className={view === 'new_expense' ? 'active new-expense-button-inline' : 'new-expense-button-inline'}>
            {/* <PlusCircle size={24} /> */} {/* Placeholder for icon */}
            <span>Register</span>
        </button>
        <button onClick={() => setView('planning')} className={view === 'planning' ? 'active' : ''}>
          {/* <Settings size={20} /> */} {/* Placeholder for icon */}
          <span>Planning</span>
        </button>
        <button onClick={() => setView('settings')} className={view === 'settings' ? 'active' : ''}>
          {/* <Settings size={20} /> */} {/* Placeholder for icon */}
          <span>Settings</span>
        </button>

      </nav>
    </div>
  );
}

export default Dashboard;
