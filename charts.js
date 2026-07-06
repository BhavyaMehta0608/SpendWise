/**
 * SpendWise 3.0 Pro — Charts Module
 */

const Charts = {
    instances: {},

    isDark: () => document.documentElement.getAttribute('data-theme') !== 'light',

    colors: () => {
        const dark = Charts.isDark();
        return {
            text: dark ? '#8892A4' : '#5C6578',
            textBold: dark ? '#F0F4FF' : '#0D1630',
            grid: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            green: '#22D3A5',
            red: '#FF5F72',
            accent: '#7C6FFF',
            blue: '#38BDF8',
            yellow: '#FBBF24',
            purple: '#C084FC',
            palette: ['#7C6FFF','#22D3A5','#FF5F72','#38BDF8','#FBBF24','#C084FC','#F472B6','#4ADE80','#F97316','#E879F9','#94A3B8','#60A5FA'],
        };
    },

    destroy: (id) => {
        if (Charts.instances[id]) { Charts.instances[id].destroy(); delete Charts.instances[id]; }
    },

    defaultOptions: () => {
        const c = Charts.colors();
        return {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: Charts.isDark() ? '#1A2540' : '#FFFFFF',
                    titleColor: Charts.isDark() ? '#F0F4FF' : '#0D1630',
                    bodyColor: Charts.isDark() ? '#8892A4' : '#5C6578',
                    borderColor: Charts.isDark() ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                    borderWidth: 1,
                    padding: 12,
                    boxPadding: 4,
                    titleFont: { family: "'Outfit', sans-serif", weight: '700', size: 13 },
                    bodyFont: { family: "'Inter', sans-serif", size: 12 },
                }
            },
            scales: {
                x: { grid: { color: c.grid }, ticks: { color: c.text, font: { family: "'Inter', sans-serif", size: 11 } } },
                y: { grid: { color: c.grid }, ticks: { color: c.text, font: { family: "'Inter', sans-serif", size: 11 } } }
            }
        };
    },

    // ── Sparkline (mini inline chart) ──────────────────
    renderSparkline: (canvasId, data, color, fill = true) => {
        Charts.destroy(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        Charts.instances[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map((_,i) => i),
                datasets: [{ data, borderColor: color, backgroundColor: color + '20', borderWidth: 2, fill, tension: 0.5, pointRadius: 0 }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                scales: { x: { display: false }, y: { display: false } },
                animation: { duration: 800, easing: 'easeOutCubic' }
            }
        });
    },

    // ── Budget Mini Ring ───────────────────────────────
    renderBudgetRing: (percent, canvasId = 'budget-mini-ring') => {
        Charts.destroy(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        const clamp = Math.min(percent, 100);
        const color = percent > 90 ? '#FF5F72' : percent > 75 ? '#FBBF24' : 'rgba(255,255,255,0.9)';
        Charts.instances[canvasId] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [clamp, 100 - clamp],
                    backgroundColor: [color, 'rgba(255,255,255,0.15)'],
                    borderWidth: 0, hoverOffset: 0
                }]
            },
            options: {
                responsive: false, cutout: '80%',
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                animation: { duration: 1000, easing: 'easeOutCubic' }
            }
        });
    },

    // ── Goal Ring ─────────────────────────────────────
    renderGoalRing: (canvasId, percent) => {
        Charts.destroy(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        const clamp = Math.min(percent, 100);
        Charts.instances[canvasId] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [clamp, 100 - clamp],
                    backgroundColor: ['#7C6FFF', 'rgba(124,111,255,0.12)'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: false, cutout: '78%',
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                animation: { duration: 800 }
            }
        });
    },

    // ── Monthly Trend (Line) ───────────────────────────
    renderMonthlyTrendChart: (transactions) => {
        Charts.destroy('monthlyTrendChart');
        const ctx = document.getElementById('monthlyTrendChart');
        if (!ctx) return;
        const c = Charts.colors();
        const today = new Date();
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const labels = [], expData = [], incData = [];

        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            labels.push(months[d.getMonth()]);
            expData.push(0); incData.push(0);
        }
        transactions.forEach(t => {
            const tDate = new Date(t.date + 'T00:00:00');
            const diff = (today.getFullYear() - tDate.getFullYear()) * 12 + (today.getMonth() - tDate.getMonth());
            if (diff >= 0 && diff <= 5) {
                const idx = 5 - diff;
                if (t.type === 'expense') expData[idx] += t.amount;
                else incData[idx] += t.amount;
            }
        });

        const opts = Charts.defaultOptions();
        Charts.instances['monthlyTrendChart'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    { label: 'Income', data: incData, borderColor: c.green, backgroundColor: c.green + '15', borderWidth: 2.5, fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: c.green, pointBorderColor: 'transparent' },
                    { label: 'Expense', data: expData, borderColor: c.red, backgroundColor: c.red + '10', borderWidth: 2.5, fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: c.red, pointBorderColor: 'transparent' }
                ]
            },
            options: { ...opts, plugins: { ...opts.plugins, tooltip: { ...opts.plugins.tooltip, mode: 'index', intersect: false, callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${Utils.formatCurrency(ctx.raw)}` } } } }
        });
    },

    // ── Category Pie (small inline) ───────────────────
    renderCategoryMiniPie: (transactions, canvasId = 'categoryPieChart') => {
        Charts.destroy(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        const today = new Date();
        const map = {};
        transactions.filter(t => t.type === 'expense' && Utils.isSameMonth(new Date(t.date + 'T00:00:00'), today))
                    .forEach(t => map[t.category] = (map[t.category] || 0) + t.amount);
        const c = Charts.colors();
        Charts.instances[canvasId] = new Chart(ctx, {
            type: 'doughnut',
            data: { labels: Object.keys(map), datasets: [{ data: Object.values(map), backgroundColor: c.palette, borderWidth: 0, hoverOffset: 4 }] },
            options: { responsive: false, cutout: '72%', plugins: { legend: { display: false }, tooltip: { enabled: false } }, animation: { duration: 800 } }
        });
    },

    // ── Category Pie (full analytics) ─────────────────
    renderCategoryFullPie: (transactions, canvasId = 'categoryPieChart2') => {
        Charts.destroy(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        const today = new Date();
        const map = {};
        transactions.filter(t => t.type === 'expense' && Utils.isSameMonth(new Date(t.date + 'T00:00:00'), today))
                    .forEach(t => map[t.category] = (map[t.category] || 0) + t.amount);
        const c = Charts.colors();
        Charts.instances[canvasId] = new Chart(ctx, {
            type: 'doughnut',
            data: { labels: Object.keys(map), datasets: [{ data: Object.values(map), backgroundColor: c.palette, borderWidth: 2, borderColor: Charts.isDark() ? '#0E1525' : '#FFFFFF', hoverOffset: 8 }] },
            options: {
                responsive: true, maintainAspectRatio: false, cutout: '65%',
                plugins: { legend: { display: true, position: 'right', labels: { color: c.text, font: { family: "'Inter', sans-serif", size: 11 }, boxWidth: 10, padding: 12 } }, tooltip: { ...Charts.defaultOptions().plugins.tooltip, callbacks: { label: (ctx) => ` ${ctx.label}: ${Utils.formatCurrency(ctx.raw)}` } } }
            }
        });
    },

    // ── Payment Mode Chart (Polar) ─────────────────────
    renderPaymentChart: (transactions, canvasId = 'paymentDoughnutChart') => {
        Charts.destroy(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        const map = {};
        transactions.filter(t => t.type === 'expense').forEach(t => map[t.mode] = (map[t.mode] || 0) + t.amount);
        const c = Charts.colors();
        Charts.instances[canvasId] = new Chart(ctx, {
            type: 'polarArea',
            data: { labels: Object.keys(map), datasets: [{ data: Object.values(map), backgroundColor: c.palette.map(x => x + 'CC'), borderWidth: 0 }] },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: true, position: 'right', labels: { color: c.text, font: { size: 11, family: "'Inter', sans-serif" }, boxWidth: 10, padding: 12 } }, tooltip: { ...Charts.defaultOptions().plugins.tooltip } },
                scales: { r: { grid: { color: Charts.colors().grid }, ticks: { display: false } } }
            }
        });
    },

    // ── Budget Radar ───────────────────────────────────
    renderBudgetRadarChart: (transactions) => {
        Charts.destroy('budgetRadarChart');
        const ctx = document.getElementById('budgetRadarChart');
        if (!ctx) return;
        const budgets = Storage.getBudgets();
        const catBudgets = budgets.categories || {};
        if (Object.keys(catBudgets).length === 0) return;
        const today = new Date();
        const spentMap = {};
        transactions.forEach(t => {
            if (t.type === 'expense' && Utils.isSameMonth(new Date(t.date + 'T00:00:00'), today) && catBudgets[t.category])
                spentMap[t.category] = (spentMap[t.category] || 0) + t.amount;
        });
        const labels = [], budgetData = [], actualData = [];
        for (const [cat, lim] of Object.entries(catBudgets)) { if (lim > 0) { labels.push(cat); budgetData.push(lim); actualData.push(spentMap[cat] || 0); } }
        const c = Charts.colors();
        Charts.instances['budgetRadarChart'] = new Chart(ctx, {
            type: 'radar',
            data: {
                labels,
                datasets: [
                    { label: 'Budget', data: budgetData, backgroundColor: c.blue + '20', borderColor: c.blue, pointBackgroundColor: c.blue, borderWidth: 2, pointRadius: 3 },
                    { label: 'Spent', data: actualData, backgroundColor: c.red + '30', borderColor: c.red, pointBackgroundColor: c.red, borderWidth: 2, pointRadius: 3 }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: true, position: 'bottom', labels: { color: c.text, boxWidth: 10, padding: 12, font: { family: "'Inter', sans-serif", size: 11 } } }, tooltip: Charts.defaultOptions().plugins.tooltip },
                scales: { r: { angleLines: { color: c.grid }, grid: { color: c.grid }, pointLabels: { color: c.textBold, font: { family: "'Inter', sans-serif", size: 11, weight: '600' } }, ticks: { display: false } } }
            }
        });
    },

    // ── Analytics Bar Chart ────────────────────────────
    renderAnalyticsBar: (transactions) => {
        Charts.destroy('analyticsBarChart');
        const ctx = document.getElementById('analyticsBarChart');
        if (!ctx) return;
        const today = new Date();
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const labels = [], expData = [], incData = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            labels.push(months[d.getMonth()]);
            expData.push(0); incData.push(0);
        }
        transactions.forEach(t => {
            const tDate = new Date(t.date + 'T00:00:00');
            const diff = (today.getFullYear() - tDate.getFullYear()) * 12 + (today.getMonth() - tDate.getMonth());
            if (diff >= 0 && diff <= 5) {
                const idx = 5 - diff;
                if (t.type === 'expense') expData[idx] += t.amount;
                else incData[idx] += t.amount;
            }
        });
        const c = Charts.colors();
        const opts = Charts.defaultOptions();
        Charts.instances['analyticsBarChart'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    { label: 'Income', data: incData, backgroundColor: c.green + '80', borderRadius: 6, borderSkipped: false },
                    { label: 'Expense', data: expData, backgroundColor: c.red + '80', borderRadius: 6, borderSkipped: false }
                ]
            },
            options: { ...opts, plugins: { ...opts.plugins, legend: { display: true, labels: { color: c.text, boxWidth: 10, font: { size: 11 } } }, tooltip: { ...opts.plugins.tooltip, mode: 'index', intersect: false, callbacks: { label: ctx => ` ${ctx.dataset.label}: ${Utils.formatCurrency(ctx.raw)}` } } } }
        });
    },

    // ── Daily Spend ────────────────────────────────────
    renderDailySpend: (transactions) => {
        Charts.destroy('dailySpendChart');
        const ctx = document.getElementById('dailySpendChart');
        if (!ctx) return;
        const today = new Date();
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const dailySpend = Array(daysInMonth).fill(0);
        transactions.filter(t => t.type === 'expense' && Utils.isSameMonth(new Date(t.date + 'T00:00:00'), today))
                    .forEach(t => { const day = new Date(t.date + 'T00:00:00').getDate(); dailySpend[day-1] += t.amount; });
        const labels = Array.from({ length: daysInMonth }, (_, i) => i + 1);
        const c = Charts.colors();
        const opts = Charts.defaultOptions();
        Charts.instances['dailySpendChart'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{ label: 'Spend', data: dailySpend, backgroundColor: c.accent + '70', borderRadius: 4, borderSkipped: false, hoverBackgroundColor: c.accent }]
            },
            options: { ...opts, plugins: { ...opts.plugins, legend: { display: false }, tooltip: { ...opts.plugins.tooltip, callbacks: { label: ctx => ` ${Utils.formatCurrency(ctx.raw)}` } } } }
        });
    },

    updateAll: (transactions) => {
        Charts.renderMonthlyTrendChart(transactions);
        Charts.renderCategoryMiniPie(transactions, 'categoryPieChart');
        Charts.renderCategoryFullPie(transactions, 'categoryPieChart2');
        Charts.renderPaymentChart(transactions, 'paymentDoughnutChart');
        Charts.renderBudgetRadarChart(transactions);
        Charts.renderAnalyticsBar(transactions);
        Charts.renderDailySpend(transactions);

        // Sparklines
        const today = new Date();
        const last7 = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today); d.setDate(today.getDate() - i);
            const dayTotal = transactions.filter(t => t.type === 'expense' && Utils.isSameDay(new Date(t.date + 'T00:00:00'), d)).reduce((s,t) => s+t.amount, 0);
            last7.push(dayTotal);
        }
        Charts.renderSparkline('expense-sparkline', last7, '#FF5F72');
        Charts.renderSparkline('balance-sparkline', last7.map((_,i) => { const mn = last7.slice(0,i+1); return mn.reduce((a,b)=>a+b,0); }), '#7C6FFF');
    }
};
