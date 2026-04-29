/* ============================================================
   ITradingM — script.js
   Datos simulados + lógica de UI
   Preparado para conectar backend Python (FastAPI/Flask)
   ============================================================ */

'use strict';

/* ============================================================
   1. DATOS SIMULADOS
   → Reemplaza estos valores con fetch() a tu API Python
   ============================================================ */

const DATA = {
  // --- Resumen portafolio ---
  capitalDisponible:  12_450_000,
  valorPortafolio:    48_760_000,
  rentabilidadNeta:   12.5,
  dividendos:          1_840_000,
  comisiones:            124_500,

  // --- Activos en portafolio ---
  assets: [
    { ticker:'ECO',  name:'Ecopetrol',        type:'variable', price:2540,  qty:500,  costBase:2100, currency:'COP' },
    { ticker:'BCOL', name:'Bancolombia Pref.', type:'variable', price:38200, qty:80,   costBase:34000,currency:'COP' },
    { ticker:'PFBCOL',name:'Bancolombia Ord.', type:'variable', price:37800, qty:50,   costBase:35000,currency:'COP' },
    { ticker:'AAPL', name:'Apple Inc.',        type:'variable', price:189.5, qty:20,   costBase:145,  currency:'USD' },
    { ticker:'GOOGL',name:'Alphabet Inc.',     type:'variable', price:175.8, qty:10,   costBase:130,  currency:'USD' },
    { ticker:'MSFT', name:'Microsoft Corp.',   type:'variable', price:420.3, qty:15,   costBase:380,  currency:'USD' },
    { ticker:'CDT1', name:'CDT Bancolombia 180d', type:'fixed', price:10_350_000, qty:1, costBase:10_000_000, currency:'COP' },
    { ticker:'CDT2', name:'CDT Davivienda 360d', type:'fixed',  price:5_280_000,  qty:1, costBase:5_000_000,  currency:'COP' },
    { ticker:'TES28',name:'TES Julio 2028',    type:'fixed',    price:95.8,  qty:100,  costBase:90,   currency:'COP' },
    { ticker:'TES30',name:'TES Sep 2030',      type:'fixed',    price:88.4,  qty:80,   costBase:85,   currency:'COP' },
  ],

  // --- Renta fija ---
  fixedIncome: [
    { name:'CDT Bancolombia 180d', entity:'Bancolombia', capital:10_000_000, rate:11.5, maturityDays:45,  return_:575_000 },
    { name:'CDT Davivienda 360d',  entity:'Davivienda',  capital:5_000_000,  rate:12.8, maturityDays:180, return_:640_000 },
    { name:'TES Julio 2028',       entity:'República CO', capital:9_000_000,  rate:13.2, maturityDays:820, return_:1_188_000 },
    { name:'TES Sep 2030',         entity:'República CO', capital:6_800_000,  rate:12.5, maturityDays:1600,return_:850_000 },
  ],

  // --- Historial de transacciones ---
  history: [
    { date:'2024-03-15', asset:'ECO',  op:'COMPRA',    qty:100, price:2480,    commission:7440  },
    { date:'2024-03-18', asset:'AAPL', op:'COMPRA',    qty:5,   price:182.3,   commission:9115  },
    { date:'2024-03-22', asset:'BCOL', op:'VENTA',     qty:20,  price:38800,   commission:23280 },
    { date:'2024-03-28', asset:'MSFT', op:'COMPRA',    qty:3,   price:415.0,   commission:12450 },
    { date:'2024-04-02', asset:'ECO',  op:'DIVIDENDO', qty:500, price:45,      commission:0     },
    { date:'2024-04-10', asset:'CDT1', op:'RENOVACIÓN',qty:1,   price:10350000,commission:0     },
    { date:'2024-04-14', asset:'GOOGL',op:'COMPRA',    qty:2,   price:172.5,   commission:8625  },
    { date:'2024-04-18', asset:'PFBCOL',op:'VENTA',    qty:10,  price:38200,   commission:22920 },
  ],

  // --- Órdenes recientes ---
  orders: [
    { asset:'AAPL',  op:'buy',  qty:5,   price:189.5, date:'Hoy 09:32' },
    { asset:'ECO',   op:'sell', qty:100, price:2540,  date:'Hoy 08:15' },
    { asset:'MSFT',  op:'buy',  qty:3,   price:420.3, date:'Ayer 15:47' },
    { asset:'BCOL',  op:'sell', qty:20,  price:38800, date:'Ayer 11:22' },
    { asset:'TES28', op:'buy',  qty:10,  price:95.8,  date:'22 Abr' },
  ],

  // --- Datos para gráficas ---
  portfolioHistory: {
    labels: ['Oct','Nov','Dic','Ene','Feb','Mar','Abr'],
    values: [38000000, 39500000, 41200000, 40800000, 44100000, 46300000, 48760000],
  },

  distribution: {
    labels: ['Acciones CO','Acciones USA','CDTs','TES','Liquidez'],
    values: [28, 22, 22, 16, 12],
  },

  monthlyReturns: {
    labels: ['Oct','Nov','Dic','Ene','Feb','Mar','Abr'],
    values: [1.2, 3.9, 4.5, -0.9, 8.1, 5.0, 3.2],
  },

  dividendHistory: {
    labels: ['Oct','Nov','Dic','Ene','Feb','Mar','Abr'],
    values: [180000, 0, 340000, 0, 220000, 680000, 420000],
  },
};


function cargarHistorial() {
  fetch("/historial")
    .then(res => res.json())
    .then(data => {
      DATA.history = data;
      renderHistory();
    });
}

function cargarResumen() {
  fetch("/resumen")
    .then(res => res.json())
    .then(data => {
      DATA.capitalDisponible = data.capitalDisponible;
      DATA.valorPortafolio = data.valorPortafolio;
      DATA.rentabilidadNeta = data.rentabilidadNeta;
      renderSummaryCards();
    });
}

function cargarActivos() {
  fetch("/activos")
    .then(res => res.json())
    .then(data => {
      DATA.assets = data;
      renderAssetTable();
      renderEquityTable();
    });
}

/* ============================================================
   2. UTILIDADES
   ============================================================ */

function fmt(n, decimals = 0, prefix = '$') {
  return prefix + new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

function fmtPct(n) {
  return (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
}

function showToast(msg, color = 'var(--cyan)') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.borderColor = color;
  t.style.color = color;
  t.style.boxShadow = `0 0 20px ${color}60`;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}

/* ============================================================
   3. NAVEGACIÓN
   ============================================================ */

const navItems   = document.querySelectorAll('.nav-item');
const pages      = document.querySelectorAll('.page');
let activeCharts = {};

function initHistoryFilters() {
  const opMap = {
    'Compras': 'COMPRA',
    'Ventas': 'VENTA',
    'Dividendos': 'DIVIDENDO'
  };

  const btns = document.querySelectorAll('#page-history .chart-btn');
  
  btns.forEach(btn => {
    btn.addEventListener('click', function () {
      btns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');

      const filtro = this.textContent.trim();
      const opKey = opMap[filtro];
      const filtered = filtro === 'Todas'
        ? DATA.history
        : DATA.history.filter(h => h.op === opKey);

      renderHistory(filtered);
    });
  });
}

function navigateTo(section) {
  navItems.forEach(n => n.classList.remove('active'));
  pages.forEach(p => p.classList.remove('active'));

  const target = document.querySelector(`[data-section="${section}"]`);
  if (target) target.classList.add('active');

  const page = document.getElementById(`page-${section}`);
  if (page) {
    page.classList.add('active');
    triggerReveal(page);
    if (section === 'reports') initReportCharts();
    if (section === 'equities') initEquityChart();
    if (section === 'history' && !activeCharts.historyInit) {
      initHistoryFilters();
      activeCharts.historyInit = true;
    }
  }

  if (window.innerWidth <= 840) {
    document.getElementById('sidebar').classList.remove('open');
  }
}

navItems.forEach(n => {
  n.addEventListener('click', e => {
    e.preventDefault();
    navigateTo(n.dataset.section);
  });
});

document.getElementById('menuToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

/* ============================================================
   4. REVEAL ANIMATIONS (Intersection Observer)
   ============================================================ */

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.08 });

function triggerReveal(parent) {
  parent.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
}

/* ============================================================
   5. FECHA SIMULADA
   ============================================================ */

function updateSimDate() {
  const now = new Date();
  const opts = { weekday:'long', year:'numeric', month:'long', day:'numeric' };
  document.getElementById('simDate').textContent =
    'Fecha simulada: ' + now.toLocaleDateString('es-CO', opts);
}

/* ============================================================
   6. CARDS RESUMEN
   ============================================================ */

function renderSummaryCards() {
  document.getElementById('capitalDisponible').textContent = fmt(DATA.capitalDisponible);
  document.getElementById('valorPortafolio').textContent   = fmt(DATA.valorPortafolio);
  document.getElementById('rentabilidadNeta').textContent  = fmtPct(DATA.rentabilidadNeta);
  document.getElementById('dividendos').textContent        = fmt(DATA.dividendos);
  document.getElementById('comisiones').textContent        = fmt(DATA.comisiones);
}

/* ============================================================
   7. TABLA DE ACTIVOS (Dashboard)
   ============================================================ */

function renderAssetTable() {
  const tbody = document.getElementById('assetTableBody');
  tbody.innerHTML = DATA.assets.map(a => {
    const total    = a.price * a.qty;
    const costTotal= a.costBase * a.qty;
    const plPct    = ((a.price - a.costBase) / a.costBase * 100);
    const plClass  = plPct >= 0 ? 'value-positive' : 'value-negative';
    const typeTag  = a.type === 'variable' ? '<span class="tag tag-equity">Variable</span>' : '<span class="tag tag-fixed">Fija</span>';
    return `
      <tr>
        <td><span class="asset-ticker">${a.ticker}</span><br><small style="color:var(--text-muted)">${a.name}</small></td>
        <td>${typeTag}</td>
        <td class="asset-name">${a.currency === 'USD' ? '$' + a.price.toFixed(2) + ' USD' : fmt(a.price)}</td>
        <td style="font-family:'JetBrains Mono',monospace">${a.qty.toLocaleString()}</td>
        <td style="font-family:'JetBrains Mono',monospace">${a.currency === 'USD' ? '$' + (total).toFixed(0) + ' USD' : fmt(total)}</td>
        <td class="${plClass}">${fmtPct(plPct)}</td>
        <td><span class="tag tag-active">ACTIVO</span></td>
      </tr>`;
  }).join('');
}

/* ============================================================
   8. GRÁFICAS DASHBOARD
   ============================================================ */

function initDashboardCharts() {
  // Portfolio evolution
  const ctxP = document.getElementById('portfolioChart').getContext('2d');
  const grad = ctxP.createLinearGradient(0, 0, 0, 300);
  grad.addColorStop(0, 'rgba(0,245,255,0.25)');
  grad.addColorStop(1, 'rgba(0,245,255,0)');

  activeCharts.portfolio = new Chart(ctxP, {
    type: 'line',
    data: {
      labels: DATA.portfolioHistory.labels,
      datasets: [{
        label: 'Valor Portafolio',
        data: DATA.portfolioHistory.values,
        borderColor: '#00f5ff',
        borderWidth: 2.5,
        backgroundColor: grad,
        pointBackgroundColor: '#00f5ff',
        pointBorderColor: '#050810',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 8,
        fill: true,
        tension: 0.4,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(8,13,24,0.95)',
          borderColor: '#00f5ff',
          borderWidth: 1,
          titleColor: '#00f5ff',
          bodyColor: '#e8f0ff',
          callbacks: {
            label: ctx => ' ' + fmt(ctx.parsed.y),
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(0,245,255,0.06)' },
          ticks: { color: '#5a7090', font: { family: 'JetBrains Mono', size: 11 } }
        },
        y: {
          grid: { color: 'rgba(0,245,255,0.06)' },
          ticks: {
            color: '#5a7090',
            font: { family: 'JetBrains Mono', size: 11 },
            callback: v => '$' + (v / 1e6).toFixed(1) + 'M'
          }
        }
      }
    }
  });

  // Distribution donut
  const ctxD = document.getElementById('distributionChart').getContext('2d');
  activeCharts.distribution = new Chart(ctxD, {
    type: 'doughnut',
    data: {
      labels: DATA.distribution.labels,
      datasets: [{
        data: DATA.distribution.values,
        backgroundColor: [
          'rgba(0,245,255,0.8)',
          'rgba(123,47,247,0.8)',
          'rgba(0,255,136,0.8)',
          'rgba(255,215,0,0.7)',
          'rgba(255,51,102,0.7)',
        ],
        borderColor: '#050810',
        borderWidth: 3,
        hoverOffset: 8,
      }]
    },
    options: {
      responsive: true,
      cutout: '68%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#5a7090',
            font: { family: 'Rajdhani', size: 12 },
            padding: 12,
            boxWidth: 12,
          }
        },
        tooltip: {
          backgroundColor: 'rgba(8,13,24,0.95)',
          borderColor: '#00f5ff',
          borderWidth: 1,
          titleColor: '#00f5ff',
          bodyColor: '#e8f0ff',
          callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed}%` }
        }
      }
    }
  });
}

/* ============================================================
   9. TABLA RENTA VARIABLE
   ============================================================ */

function renderEquityTable() {
  const equities = DATA.assets.filter(a => a.type === 'variable');
  const tbody = document.getElementById('equityTableBody');
  tbody.innerHTML = equities.map(a => {
    const pl    = ((a.price - a.costBase) / a.costBase * 100);
    const plAbs = (a.price - a.costBase) * a.qty;
    const cls   = pl >= 0 ? 'value-positive' : 'value-negative';
    const change24 = (Math.random() * 4 - 1.5).toFixed(2); // simulado
    const chClass  = change24 >= 0 ? 'value-positive' : 'value-negative';
    return `
      <tr>
        <td class="asset-ticker">${a.ticker}</td>
        <td>${a.name}</td>
        <td style="font-family:'JetBrains Mono',monospace">${a.currency === 'USD' ? '$' + a.price.toFixed(2) : fmt(a.price)}</td>
        <td class="${chClass}" style="font-family:'JetBrains Mono',monospace">${change24 >= 0 ? '+' : ''}${change24}%</td>
        <td>${a.qty.toLocaleString()}</td>
        <td style="font-family:'JetBrains Mono',monospace">${a.currency === 'USD' ? '$' + (a.price * a.qty).toFixed(0) : fmt(a.price * a.qty)}</td>
        <td class="${cls}">${fmtPct(pl)} <small>(${plAbs >= 0 ? '+' : ''}${a.currency === 'USD' ? '$' + plAbs.toFixed(0) : fmt(plAbs)})</small></td>
      </tr>`;
  }).join('');
}

/* ============================================================
   10. GRÁFICA RENTA VARIABLE
   ============================================================ */

function initEquityChart() {
  if (activeCharts.equity) return;
  const ctx = document.getElementById('equityChart');
  if (!ctx) return;
  const months = ['Oct','Nov','Dic','Ene','Feb','Mar','Abr'];
  activeCharts.equity = new Chart(ctx.getContext('2d'), {
    type: 'line',
    data: {
      labels: months,
      datasets: [
        {
          label: 'ECO',
          data: [1980, 2050, 2200, 2150, 2380, 2480, 2540],
          borderColor: '#00f5ff', borderWidth: 2, tension: 0.4,
          pointRadius: 3, fill: false,
        },
        {
          label: 'BCOL',
          data: [32000, 33500, 35200, 34800, 36100, 37800, 38200],
          borderColor: '#7b2ff7', borderWidth: 2, tension: 0.4,
          pointRadius: 3, fill: false,
        },
        {
          label: 'AAPL',
          data: [148, 155, 168, 162, 175, 185, 189.5],
          borderColor: '#00ff88', borderWidth: 2, tension: 0.4,
          pointRadius: 3, fill: false,
          yAxisID: 'y2',
        },
      ]
    },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          labels: { color: '#5a7090', font: { family: 'JetBrains Mono', size: 11 } }
        },
        tooltip: {
          backgroundColor: 'rgba(8,13,24,0.95)',
          borderColor: '#00f5ff', borderWidth: 1,
          titleColor: '#00f5ff', bodyColor: '#e8f0ff',
        }
      },
      scales: {
        x: { grid: { color: 'rgba(0,245,255,0.06)' }, ticks: { color: '#5a7090', font: { family: 'JetBrains Mono', size: 11 } } },
        y: { grid: { color: 'rgba(0,245,255,0.06)' }, ticks: { color: '#5a7090', font: { family: 'JetBrains Mono', size: 11 } } },
        y2: { position: 'right', grid: { display: false }, ticks: { color: '#00ff88', font: { family: 'JetBrains Mono', size: 11 } } },
      }
    }
  });
}

/* ============================================================
   11. TABLA RENTA FIJA
   ============================================================ */

function renderFixedTable() {
  const tbody = document.getElementById('fixedTableBody');
  tbody.innerHTML = DATA.fixedIncome.map(f => {
    const statusTag = f.maturityDays <= 60
      ? `<span class="tag tag-pending">VENCE ${f.maturityDays}d</span>`
      : `<span class="tag tag-active">ACTIVO</span>`;
    return `
      <tr>
        <td class="asset-name">${f.name}</td>
        <td style="color:var(--text-muted)">${f.entity}</td>
        <td style="font-family:'JetBrains Mono',monospace">${fmt(f.capital)}</td>
        <td class="value-positive">${f.rate}%</td>
        <td style="font-family:'JetBrains Mono',monospace;color:var(--gold)">${f.maturityDays} días</td>
        <td class="value-positive">${fmt(f.return_)}</td>
        <td>${statusTag}</td>
      </tr>`;
  }).join('');
}

/* ============================================================
   12. HISTORIAL
   ============================================================ */

function renderHistory(data = DATA.history) {
  const tbody = document.getElementById('historyTableBody');
  tbody.innerHTML = data.map(h => {
    const total = h.qty * h.price;
    const opClass = h.op === 'COMPRA' ? 'tag-buy' : h.op === 'VENTA' ? 'tag-sell' : '';
    const statusTag = `<span class="tag tag-active">EJECUTADA</span>`;
    return `
      <tr>
        <td style="font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--text-muted)">${h.date}</td>
        <td class="asset-ticker">${h.asset}</td>
        <td><span class="tag ${opClass}">${h.op}</span></td>
        <td style="font-family:'JetBrains Mono',monospace">${h.qty.toLocaleString()}</td>
        <td style="font-family:'JetBrains Mono',monospace">${h.price > 1000 ? fmt(h.price) : '$' + h.price.toFixed(2)}</td>
        <td style="font-family:'JetBrains Mono',monospace">${total > 1000 ? fmt(total) : '$' + total.toFixed(2)}</td>
        <td style="font-family:'JetBrains Mono',monospace;color:var(--red)">${h.commission > 0 ? fmt(h.commission) : '—'}</td>
        <td>${statusTag}</td>
      </tr>`;
  }).join('');
}

/* ============================================================
   13. ÓRDENES RECIENTES
   ============================================================ */

function renderOrders() {
  const list = document.getElementById('orderList');
  list.innerHTML = DATA.orders.map(o => `
    <div class="order-item">
      <div class="order-item-dot ${o.op}"></div>
      <div class="order-item-info">
        <div class="order-item-name">${o.asset}</div>
        <div class="order-item-meta">${o.op === 'buy' ? 'COMPRA' : 'VENTA'} · ${o.qty} uds · ${o.date}</div>
      </div>
      <div class="order-item-value ${o.op}">${o.op === 'buy' ? '+' : '-'}${o.price > 1000 ? fmt(o.price * o.qty) : '$' + (o.price * o.qty).toFixed(2)}</div>
    </div>`).join('');
}

/* ============================================================
   14. FORMULARIO DE ÓRDENES
   ============================================================ */

function setupOrderForm() {
  const qty   = document.getElementById('orderQty');
  const price = document.getElementById('orderPrice');
  const total = document.getElementById('orderTotal');
  const btnB  = document.getElementById('btnBuy');
  const btnS  = document.getElementById('btnSell');
  let isBuy   = true;

  function updateTotal() {
    const t = (parseFloat(qty.value) || 0) * (parseFloat(price.value) || 0);
    total.value = fmt(t);
  }

  qty.addEventListener('input', updateTotal);
  price.addEventListener('input', updateTotal);

  btnB.addEventListener('click', () => {
    isBuy = true;
    btnB.classList.add('active');
    btnS.classList.remove('active');
  });

  btnS.addEventListener('click', () => {
    isBuy = false;
    btnS.classList.add('active');
    btnB.classList.remove('active');
  });

  document.getElementById('executeOrder').addEventListener('click', () => {
      const ticker = document.getElementById('orderAsset').value;
      const cantidad = parseInt(document.getElementById('orderQty').value);
      const precio = parseFloat(document.getElementById('orderPrice').value);

      const endpoint = isBuy ? "/comprar" : "/vender";

      fetch(endpoint, {
          method: "POST",
          headers: {
              "Content-Type": "application/json"
          },
          body: JSON.stringify({
              ticker: ticker,
              cantidad: cantidad,
              precio: precio
          })
      })
      .then(res => res.json())
      .then(data => {
        if(data.success){
            showToast("✅ " + data.message, "var(--green)");
            cargarResumen();
            cargarActivos();
            cargarHistorial();
            renderHistory();
            renderOrders();
            renderEquityTable();
        } else {
            showToast("❌ " + data.message, "var(--red)");
        }
    });
  });

  updateTotal();
}

/* ============================================================
   15. GRÁFICAS DE REPORTES
   ============================================================ */

function initReportCharts() {
  if (activeCharts.monthly) return;

  const baseScales = {
    x: { grid: { color: 'rgba(0,245,255,0.06)' }, ticks: { color: '#5a7090', font: { family: 'JetBrains Mono', size: 11 } } },
    y: { grid: { color: 'rgba(0,245,255,0.06)' }, ticks: { color: '#5a7090', font: { family: 'JetBrains Mono', size: 11 } } }
  };

  const opts = (color) => ({
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: 'rgba(8,13,24,0.95)', borderColor: color, borderWidth: 1, titleColor: color, bodyColor: '#e8f0ff' }
    },
    scales: baseScales
  });

  // Monthly returns bar
  const ctxM = document.getElementById('monthlyReturnChart').getContext('2d');
  activeCharts.monthly = new Chart(ctxM, {
    type: 'bar',
    data: {
      labels: DATA.monthlyReturns.labels,
      datasets: [{
        label: 'Rentabilidad %',
        data: DATA.monthlyReturns.values,
        backgroundColor: DATA.monthlyReturns.values.map(v =>
          v >= 0 ? 'rgba(0,255,136,0.65)' : 'rgba(255,51,102,0.65)'
        ),
        borderColor: DATA.monthlyReturns.values.map(v =>
          v >= 0 ? '#00ff88' : '#ff3366'
        ),
        borderWidth: 1.5,
        borderRadius: 4,
      }]
    },
    options: opts('#00ff88'),
  });

  // Dividend bars
  const ctxDv = document.getElementById('dividendChart').getContext('2d');
  const gradDv = ctxDv.createLinearGradient(0, 0, 0, 220);
  gradDv.addColorStop(0, 'rgba(255,215,0,0.7)');
  gradDv.addColorStop(1, 'rgba(255,215,0,0.1)');

  activeCharts.dividends = new Chart(ctxDv, {
    type: 'bar',
    data: {
      labels: DATA.dividendHistory.labels,
      datasets: [{
        label: 'Dividendos',
        data: DATA.dividendHistory.values,
        backgroundColor: gradDv,
        borderColor: '#ffd700',
        borderWidth: 1.5,
        borderRadius: 4,
      }]
    },
    options: {
      ...opts('#ffd700'),
      plugins: {
        ...opts('#ffd700').plugins,
        tooltip: {
          ...opts('#ffd700').plugins.tooltip,
          callbacks: { label: ctx => ' ' + fmt(ctx.parsed.y) }
        }
      }
    },
  });
}

/* ============================================================
   16. FONDO DE PARTÍCULAS (Canvas)
   ============================================================ */

function initParticlesBg() {
  const canvas = document.getElementById('bg-canvas');
  const ctx    = canvas.getContext('2d');
  let W, H, particles;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function createParticles(n) {
    return Array.from({ length: n }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.2 + 0.3,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      alpha: Math.random() * 0.4 + 0.1,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = 'rgba(0,245,255,0.025)';
    ctx.lineWidth = 1;
    const gridSz = 80;
    for (let x = 0; x < W; x += gridSz) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += gridSz) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Particles
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,245,255,${p.alpha})`;
      ctx.fill();
    });

    // Lines between close particles
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < 100) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0,245,255,${0.06 * (1 - d / 100)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(draw);
  }

  resize();
  particles = createParticles(70);
  draw();
  window.addEventListener('resize', () => { resize(); particles = createParticles(70); });
}

/* ============================================================
   17. ANIMACIÓN DE NÚMEROS (counter)
   ============================================================ */

function animateCounter(el, target, duration = 1200, prefix = '$', decimals = 0) {
  const start = 0;
  const startTime = performance.now();
  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 4);
    const val = start + (target - start) * ease;
    if (decimals > 0) {
      el.textContent = prefix + val.toFixed(decimals) + '%';
    } else {
      el.textContent = prefix + new Intl.NumberFormat('es-CO').format(Math.floor(val));
    }
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ============================================================
   18. ACTUALIZACIÓN DE PRECIOS (yFinance)
   ============================================================ */

function actualizarPrecios() {
  fetch("/precios")
    .then(res => res.json())
    .then(precios => {
      DATA.assets.forEach(a => {
        if (precios[a.ticker]) {
          a.price = precios[a.ticker];
        }
      });
      renderAssetTable();
      renderEquityTable();
      cargarResumen();
      showToast("📡 Precios actualizados", "var(--cyan)");
    })
    .catch(() => showToast("⚠️ Error actualizando precios", "var(--red)"));
}

/* ============================================================
   19. INICIALIZACIÓN
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initParticlesBg();
  updateSimDate();
  cargarResumen();
  cargarActivos();
  cargarHistorial();
  renderFixedTable();
  renderHistory();
  renderOrders();
  setupOrderForm();

  // Actualización de precios en tiempo real
  actualizarPrecios();
  setInterval(actualizarPrecios, 60000);

  // Charts del dashboard
  setTimeout(() => {
    initDashboardCharts();
  }, 200);

  // Reveal inicial
  triggerReveal(document.getElementById('page-dashboard'));

  // Animaciones de counters en cards
  setTimeout(() => {
    animateCounter(document.getElementById('capitalDisponible'), DATA.capitalDisponible);
    animateCounter(document.getElementById('valorPortafolio'), DATA.valorPortafolio);
    animateCounter(document.getElementById('dividendos'), DATA.dividendos);
    animateCounter(document.getElementById('comisiones'), DATA.comisiones);

    const rentEl = document.getElementById('rentabilidadNeta');
    animateCounter(rentEl, DATA.rentabilidadNeta, 1200, '+', 1);
    rentEl.textContent = '+' + DATA.rentabilidadNeta.toFixed(1) + '%';
  }, 400);

  // Chart period buttons
  const periodData = {
    '1M': { labels: ['Sem1','Sem2','Sem3','Sem4'], values: [46300000, 47100000, 47800000, 48760000] },
    '3M': { labels: ['Feb','Mar','Abr'], values: [44100000, 46300000, 48760000] },
    '6M': { labels: ['Nov','Dic','Ene','Feb','Mar','Abr'], values: [39500000, 41200000, 40800000, 44100000, 46300000, 48760000] },
    '1A': { labels: ['Oct','Nov','Dic','Ene','Feb','Mar','Abr'], values: [38000000, 39500000, 41200000, 40800000, 44100000, 46300000, 48760000] },
  };

  document.querySelectorAll('#page-dashboard .chart-controls .chart-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      this.closest('.chart-controls')
          .querySelectorAll('.chart-btn')
          .forEach(b => b.classList.remove('active'));
      this.classList.add('active');

      const period = this.textContent.trim();
      if (periodData[period] && activeCharts.portfolio) {
        activeCharts.portfolio.data.labels = periodData[period].labels;
        activeCharts.portfolio.data.datasets[0].data = periodData[period].values;
        activeCharts.portfolio.update();
      }
    });
  });

  /* ==================================================
     PUNTO DE CONEXIÓN CON BACKEND PYTHON
     ==================================================
     Para conectar tu API, descomenta y adapta:

     async function fetchFromPython(endpoint) {
       const BASE_URL = 'http://localhost:8000/api';
       const res = await fetch(`${BASE_URL}/${endpoint}`);
       return res.json();
     }

     // Ejemplo de uso:
     // const portafolio = await fetchFromPython('portfolio/summary');
     // DATA.capitalDisponible = portafolio.capital;
     // renderSummaryCards();
  */
});
