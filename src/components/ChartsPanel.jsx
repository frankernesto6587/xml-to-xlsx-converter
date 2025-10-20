import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Pie, Line, Bar } from 'react-chartjs-2';
import { getTransactionsByDate, calculateBalanceOverTime } from '../utils/advancedAnalysis';

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

export default function ChartsPanel({ data, summary }) {
  // Pie chart: Credits vs Debits
  const pieData = {
    labels: ['Créditos', 'Débitos'],
    datasets: [{
      data: [
        parseFloat(summary.totalCredits),
        parseFloat(summary.totalDebits)
      ],
      backgroundColor: ['#10b981', '#ef4444'],
      borderColor: ['#059669', '#dc2626'],
      borderWidth: 2
    }]
  };

  // Line chart: Balance over time
  const balanceHistory = calculateBalanceOverTime(
    data.transactions,
    parseFloat(data.saldoInicial?.importe || 0)
  );

  const lineData = {
    labels: balanceHistory.map(item => item.fecha),
    datasets: [{
      label: 'Saldo',
      data: balanceHistory.map(item => item.balance),
      borderColor: '#06b6d4',
      backgroundColor: 'rgba(6, 182, 212, 0.1)',
      tension: 0.4,
      fill: true
    }]
  };

  // Bar chart: Transactions by date
  const byDate = getTransactionsByDate(data.transactions);
  const dates = Object.keys(byDate).sort((a, b) => {
    const parseDate = (dateStr) => {
      if (!dateStr || dateStr === 'Sin fecha') return new Date(0);
      const [day, month, year] = dateStr.split('/');
      return new Date(year, month - 1, day);
    };
    return parseDate(a) - parseDate(b);
  });

  const barData = {
    labels: dates,
    datasets: [
      {
        label: 'Créditos',
        data: dates.map(date => byDate[date].credits),
        backgroundColor: '#10b981'
      },
      {
        label: 'Débitos',
        data: dates.map(date => byDate[date].debits),
        backgroundColor: '#ef4444'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#e5e7eb'
        }
      }
    },
    scales: {
      x: {
        ticks: { color: '#e5e7eb' },
        grid: { color: '#374151' }
      },
      y: {
        ticks: { color: '#e5e7eb' },
        grid: { color: '#374151' }
      }
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
      <h3 className="text-xl font-semibold text-white mb-6">📊 Análisis Gráfico</h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-gray-900 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-300 mb-4 text-center">
            Distribución: Créditos vs Débitos
          </h4>
          <div className="h-64">
            <Pie data={pieData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#e5e7eb' } } } }} />
          </div>
        </div>

        {/* Line Chart */}
        <div className="bg-gray-900 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-300 mb-4 text-center">
            Evolución del Saldo
          </h4>
          <div className="h-64">
            <Line data={lineData} options={chartOptions} />
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-gray-900 p-4 rounded-lg lg:col-span-2">
          <h4 className="text-sm font-medium text-gray-300 mb-4 text-center">
            Transacciones por Fecha
          </h4>
          <div className="h-64">
            <Bar data={barData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
