import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { supabase } from '../supabaseClient';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const MonthlyExpenseChart = () => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Monthly Expenses',
        data: [],
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Monthly Income',
        data: [],
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
    ],
  });

  useEffect(() => {
    const fetchMonthlyData = async () => {
      const { data: allExpenses, error: expensesError } = await supabase
        .from('expenses')
        .select('amount, expense_date, category_id');

      if (expensesError) {
        console.error('Error fetching expenses:', expensesError);
        return;
      }

      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name');
      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
        return;
      }

      const incomeCategory = categoriesData.find(cat => cat.name.trim().toLowerCase() === 'income');
      const incomeCategoryId = incomeCategory ? incomeCategory.id : null;

      const monthlyExpenses = {};
      const monthlyIncomes = {};
      const allMonths = new Set();

      allExpenses.forEach(item => {
        const date = new Date(item.expense_date);
        const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        allMonths.add(monthYear);

        if (item.category_id === incomeCategoryId) {
          monthlyIncomes[monthYear] = (monthlyIncomes[monthYear] || 0) + item.amount;
        } else {
          monthlyExpenses[monthYear] = (monthlyExpenses[monthYear] || 0) + item.amount;
        }
      });

      const sortedMonths = Array.from(allMonths).sort((a, b) => {
        const [monthA, yearA] = a.split(' ');
        const [monthB, yearB] = b.split(' ');
        const dateA = new Date(`${monthA} 1, ${yearA}`);
        const dateB = new Date(`${monthB} 1, ${yearB}`);
        return dateA - dateB;
      });

      const expensesData = sortedMonths.map(month => monthlyExpenses[month] || 0);
      const incomesData = sortedMonths.map(month => monthlyIncomes[month] || 0);

      setChartData({
        labels: sortedMonths,
        datasets: [
          {
            label: 'Monthly Expenses',
            data: expensesData,
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
          },
          {
            label: 'Monthly Income',
            data: incomesData,
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
          },
        ],
      });
    };

    fetchMonthlyData();
  }, []);

  return (
    <div className="monthly-expense-chart">
      <h3>Monthly Overview</h3>
      <Line
        data={chartData}
        options={{
          responsive: true,
          maintainAspectRatio: false, // Allow chart to resize freely within its container
          layout: {
            padding: 0, // Remove all internal padding to fill more space
          },
          plugins: {
            legend: {
              position: 'top',
            },
            title: {
              display: true,
              text: 'Monthly Expenses vs Income',
            },
          },
          scales: {
            x: {
              offset: false, // Make the line chart extend to the edges
              ticks: {
                autoSkip: true,
                autoSkipPadding: 10,
              },
            },
            y: {
              beginAtZero: true, // Line charts often look better starting at zero
            },
          },
        }}
      />
    </div>
  );
};

export default MonthlyExpenseChart;
