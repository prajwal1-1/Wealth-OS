let taxChart = null;

function renderTaxCharts(comp) {
  const canvas = document.getElementById("taxRegimeChart");
  const slider = document.getElementById("what-if-slider");
  const sliderValueLabel = document.getElementById("what-if-value");
  
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  // Destroy previous instance if it exists
  if (taxChart) {
    taxChart.destroy();
  }

  const oldR = comp.oldRegime;
  const newR = comp.newRegime;

  // The base data
  const baseOldDeductions = oldR.totalDeductions;
  const grossIncome = comp.grossIncome;

  const data = {
    labels: ["Taxable Income", "Total Tax Payable", "Take-Home Pay"],
    datasets: [
      {
        label: "New Regime",
        data: [newR.taxableIncome, newR.totalTax, grossIncome - newR.totalTax],
        backgroundColor: "rgba(58, 163, 125, 0.7)", // green-ish
        borderColor: "rgba(58, 163, 125, 1)",
        borderWidth: 1,
        borderRadius: 4
      },
      {
        label: "Old Regime",
        data: [oldR.taxableIncome, oldR.totalTax, grossIncome - oldR.totalTax],
        backgroundColor: "rgba(235, 179, 86, 0.7)", // yellow-ish
        borderColor: "rgba(235, 179, 86, 1)",
        borderWidth: 1,
        borderRadius: 4
      }
    ]
  };

  taxChart = new Chart(ctx, {
    type: "bar",
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(255, 255, 255, 0.05)"
          },
          ticks: {
            color: "rgba(255, 255, 255, 0.6)",
            callback: function(value) {
              return "₹" + (value / 100000).toFixed(1) + "L";
            }
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: "rgba(255, 255, 255, 0.8)"
          }
        }
      },
      plugins: {
        legend: {
          labels: {
            color: "rgba(255, 255, 255, 0.9)"
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) label += ': ';
              if (context.parsed.y !== null) {
                label += new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(context.parsed.y);
              }
              return label;
            }
          }
        }
      }
    }
  });

  if (slider) {
    slider.addEventListener("input", (e) => {
      const extra = parseInt(e.target.value) || 0;
      sliderValueLabel.textContent = "+ " + new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(extra);

      // Recalculate Old Regime
      const simOldR = calculateOldRegimeTax(grossIncome, baseOldDeductions + extra);
      
      // Update Chart
      taxChart.data.datasets[1].data = [simOldR.taxableIncome, simOldR.totalTax, grossIncome - simOldR.totalTax];
      taxChart.update();

      // Update UI Metrics
      document.getElementById("old-r-deductions").textContent = "-" + money(simOldR.totalDeductions);
      document.getElementById("old-r-taxable").textContent = money(simOldR.taxableIncome);
      document.getElementById("old-r-base").textContent = money(simOldR.incomeTax);
      document.getElementById("old-r-cess").textContent = money(simOldR.cess);
      document.getElementById("old-r-total").textContent = money(simOldR.totalTax);

      // Update Recommendation
      const isOldBetter = simOldR.totalTax <= newR.totalTax;
      const recRegime = isOldBetter ? "Old Regime" : "New Regime";
      const savings = Math.abs(simOldR.totalTax - newR.totalTax);
      
      document.getElementById("hero-recommended").textContent = "Recommended: " + recRegime;
      document.getElementById("hero-regime-name").textContent = recRegime;
      document.getElementById("hero-savings").textContent = money(savings);
      document.getElementById("hero-savings-pill").textContent = "Save " + money(savings);
      
      // Toggle card highlights
      const cards = document.querySelectorAll(".regime-card");
      if (cards.length === 2) {
        if (isOldBetter) {
          cards[0].classList.add("recommended-regime");
          cards[1].classList.remove("recommended-regime");
        } else {
          cards[0].classList.remove("recommended-regime");
          cards[1].classList.add("recommended-regime");
        }
      }
    });
  }
}
