let netWorthChartInstance = null;
let allocationChartInstance = null;

function renderCharts() {
  const netWorthCtx = document.getElementById('netWorthChart');
  const allocationCtx = document.getElementById('allocationChart');
  
  if (!netWorthCtx || !allocationCtx || typeof Chart === 'undefined') return;

  if (netWorthChartInstance) netWorthChartInstance.destroy();
  if (allocationChartInstance) allocationChartInstance.destroy();

  const categories = {};
  let hasAssets = false;
  
  if (state.cash.income || state.cash.expenses) {
      categories['Cash'] = (state.cash.income || 0) - (state.cash.expenses || 0);
      if (categories['Cash'] > 0) hasAssets = true;
  }
  
  state.assets.forEach(asset => {
    if (!categories[asset.category]) categories[asset.category] = 0;
    categories[asset.category] += asset.value;
    if (asset.value > 0) hasAssets = true;
  });

  const labels = Object.keys(categories);
  const data = Object.values(categories);
  
  const allocLabels = hasAssets ? labels : ['No Assets'];
  const allocData = hasAssets ? data : [1];
  const allocColors = hasAssets ? ['#ff5e62', '#9be26b', '#8fb2a7', '#d98b4a', '#ff9966', '#b8d7bd'] : ['#333'];

  allocationChartInstance = new Chart(allocationCtx, {
    type: 'doughnut',
    data: {
      labels: allocLabels,
      datasets: [{
        data: allocData,
        backgroundColor: allocColors,
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right', labels: { color: '#8f8d87', font: { family: 'DM Sans', size: 11 } } },
        tooltip: {
            callbacks: {
                label: function(context) {
                    if (!hasAssets) return 'Add assets to see allocation';
                    return ' INR ' + context.raw.toLocaleString('en-IN');
                }
            }
        }
      },
      cutout: '75%'
    }
  });

  const currentNetWorth = totals().netWorth;
  const trendLabels = ['6 Months Ago', '5 Months Ago', '4 Months Ago', '3 Months Ago', '2 Months Ago', 'Last Month', 'Now'];
  
  const trendData = [
    currentNetWorth * 0.7,
    currentNetWorth * 0.72,
    currentNetWorth * 0.78,
    currentNetWorth * 0.81,
    currentNetWorth * 0.89,
    currentNetWorth * 0.95,
    currentNetWorth
  ];

  netWorthChartInstance = new Chart(netWorthCtx, {
    type: 'line',
    data: {
      labels: trendLabels,
      datasets: [{
        label: 'Net Worth',
        data: trendData,
        borderColor: '#9be26b',
        backgroundColor: 'rgba(155, 226, 107, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#111',
        pointBorderColor: '#9be26b',
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
            callbacks: {
                label: function(context) {
                    return ' INR ' + context.raw.toLocaleString('en-IN');
                }
            }
        }
      },
      scales: {
        y: { display: false, beginAtZero: true },
        x: { grid: { display: false, color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8f8d87', font: { family: 'DM Sans', size: 10 } } }
      }
    }
  });
}
