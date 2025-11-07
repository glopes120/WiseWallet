import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './ExpenseChart.css';

function ExpenseChart({ expenses, incomeCategoryId }) {
  const [categoryExpenses, setCategoryExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const processChartData = async () => {
      setLoading(true);

      if (incomeCategoryId === null) {
        // Still waiting for incomeCategoryId, show loading or empty state
        setCategoryExpenses([]);
        setLoading(false);
        return;
      }

      const expensesOnly = expenses.filter(expense => expense.category_id !== incomeCategoryId);

      if (!expensesOnly || expensesOnly.length === 0) {
        setCategoryExpenses([]);
        setLoading(false);
        return;
      }

      try {
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('id, name');
        
        if (categoriesError) throw categoriesError;

        const categoryMap = new Map(categoriesData.map(cat => [cat.id, cat.name]));

        const expensesByCategory = expensesOnly.reduce((acc, expense) => {
          const categoryName = categoryMap.get(expense.category_id) || 'Uncategorized';
          acc[categoryName] = (acc[categoryName] || 0) + expense.amount;
          return acc;
        }, {});

        const sortedCategories = Object.entries(expensesByCategory)
            .sort(([, a], [, b]) => b - a)
            .map(([name, amount]) => ({ name, amount }));

        setCategoryExpenses(sortedCategories);

      } catch (error) {
        console.error("Error processing chart data:", error);
        setCategoryExpenses([]);
      } finally {
        setLoading(false);
      }
    };

    processChartData();
  }, [expenses, incomeCategoryId]);

  return (
    <div className="expense-chart-container">
      <h3>Spending by Category</h3>
      {loading ? (
        <p>Loading chart data...</p>
      ) : categoryExpenses.length > 0 ? (
        <div className="chart-visualizer">
          <div className="stacked-bar-chart">
            {categoryExpenses.map((category, index) => {
              const totalExpenses = categoryExpenses.reduce((sum, cat) => sum + cat.amount, 0);
              const percentage = totalExpenses > 0 ? (category.amount / totalExpenses) * 100 : 0;
              const color = `hsl(${index * 137}, 70%, 60%)`; // Generate distinct colors

              return (
                <div
                  key={category.name}
                  className="bar-segment"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: color,
                  }}
                  title={`${category.name}: €${category.amount.toFixed(2)} (${percentage.toFixed(1)}%)`}
                ></div>
              );
            })}
          </div>
          <div className="chart-legend">
            {categoryExpenses.map((category, index) => {
              const totalExpenses = categoryExpenses.reduce((sum, cat) => sum + cat.amount, 0);
              const percentage = totalExpenses > 0 ? (category.amount / totalExpenses) * 100 : 0;
              const color = `hsl(${index * 137}, 70%, 60%)`;

              return (
                <div key={category.name} className="legend-item">
                  <span className="legend-color-box" style={{ backgroundColor: color }}></span>
                  <span className="legend-name">{category.name}</span>
                  <span className="legend-percentage">{percentage.toFixed(1)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p>No expenses to show yet.</p>
      )}
    </div>
  );
}

export default ExpenseChart;