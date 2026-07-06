/**
 * SpendWise 3.0 Pro — Utility Functions
 */

const Utils = {
    generateId: () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36),

    formatCurrency: (amount) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount),

    formatCurrencyFull: (amount) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount),

    formatDate: (dateStr) => {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    },

    formatDateShort: (dateStr) => {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    },

    formatDateForInput: (date) => {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    },

    getTodayString: () => Utils.formatDateForInput(new Date()),

    getGreeting: () => {
        const h = new Date().getHours();
        if (h < 12) return { text: 'Good Morning', icon: 'fa-sun' };
        if (h < 17) return { text: 'Good Afternoon', icon: 'fa-cloud-sun' };
        return { text: 'Good Evening', icon: 'fa-moon' };
    },

    getCategories: (type) => {
        if (type === 'expense') return ['Food', 'Rent', 'Travel', 'Shopping', 'Education', 'Entertainment', 'Medical', 'Utilities', 'Groceries', 'Subscriptions', 'Bills', 'Other'];
        return ['Salary', 'Freelance', 'Investment', 'Business', 'Gift', 'Other'];
    },

    getCategoryIcon: (category) => {
        const map = {
            'Food': 'fa-utensils', 'Rent': 'fa-house', 'Travel': 'fa-plane', 'Shopping': 'fa-bag-shopping',
            'Education': 'fa-graduation-cap', 'Entertainment': 'fa-film', 'Medical': 'fa-kit-medical',
            'Utilities': 'fa-bolt', 'Groceries': 'fa-basket-shopping', 'Subscriptions': 'fa-rotate',
            'Bills': 'fa-file-invoice-dollar', 'Salary': 'fa-money-check-dollar', 'Freelance': 'fa-laptop-code',
            'Investment': 'fa-chart-line', 'Business': 'fa-briefcase', 'Gift': 'fa-gift', 'Other': 'fa-tag'
        };
        return map[category] || 'fa-tag';
    },

    getCategoryColor: (category) => {
        const map = {
            'Food': '#FF6B6B', 'Rent': '#7C6FFF', 'Travel': '#38BDF8', 'Shopping': '#F472B6',
            'Education': '#A78BFA', 'Entertainment': '#FBBF24', 'Medical': '#34D399',
            'Utilities': '#94A3B8', 'Groceries': '#4ADE80', 'Subscriptions': '#F97316',
            'Bills': '#E879F9', 'Salary': '#22D3A5', 'Freelance': '#60A5FA',
            'Investment': '#F59E0B', 'Business': '#10B981', 'Gift': '#C084FC', 'Other': '#64748B'
        };
        return map[category] || '#64748B';
    },

    isSameDay: (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate(),
    isSameWeek: (d1, today) => {
        const wk = new Date(today);
        wk.setDate(today.getDate() - today.getDay());
        wk.setHours(0,0,0,0);
        return d1 >= wk && d1 <= today;
    },
    isSameMonth: (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth(),
    isSameYear: (d1, d2) => d1.getFullYear() === d2.getFullYear(),

    // Animated number counter
    animateCounter: (el, target, prefix = '₹', duration = 1000) => {
        const start = 0;
        const startTime = performance.now();
        const step = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
            const current = Math.round(eased * target);
            el.textContent = prefix + new Intl.NumberFormat('en-IN').format(current);
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    },

    // Generate AI-like Insights
    generateInsights: (transactions) => {
        const today = new Date();
        const insights = [];
        const dayOfMonth = today.getDate();
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

        const monthTxns = transactions.filter(t => Utils.isSameMonth(new Date(t.date + 'T00:00:00'), today));
        const monthExpenses = monthTxns.filter(t => t.type === 'expense');
        const monthIncome = monthTxns.filter(t => t.type === 'income');

        const totalExpense = monthExpenses.reduce((s, t) => s + t.amount, 0);
        const totalIncome = monthIncome.reduce((s, t) => s + t.amount, 0);

        // Category analysis
        const catSpend = {};
        monthExpenses.forEach(t => catSpend[t.category] = (catSpend[t.category] || 0) + t.amount);
        const topCat = Object.entries(catSpend).sort((a,b) => b[1]-a[1])[0];

        // Previous month
        const prevDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const prevMonthExpenses = transactions.filter(t => t.type === 'expense' && Utils.isSameMonth(new Date(t.date + 'T00:00:00'), prevDate));
        const prevTotal = prevMonthExpenses.reduce((s, t) => s + t.amount, 0);

        const budgets = Storage.getBudgets();
        const globalBudget = parseFloat(budgets.global || 0);

        // Insight 1: Budget usage warning
        if (globalBudget > 0) {
            const pct = (totalExpense / globalBudget) * 100;
            const projectedSpend = (totalExpense / dayOfMonth) * daysInMonth;
            if (pct > 90) {
                insights.push({ type: 'danger', icon: 'fa-fire', text: `<strong>Budget alert!</strong> You've spent <strong>${Math.round(pct)}%</strong> of your monthly budget with ${daysInMonth - dayOfMonth} days left.` });
            } else if (projectedSpend > globalBudget * 1.15) {
                insights.push({ type: 'warning', icon: 'fa-triangle-exclamation', text: `<strong>Overspend risk.</strong> At your current pace, you'll exceed your budget by <strong>${Utils.formatCurrency(projectedSpend - globalBudget)}</strong> this month.` });
            } else if (pct < 50 && dayOfMonth > 15) {
                insights.push({ type: 'success', icon: 'fa-shield-check', text: `<strong>Excellent discipline!</strong> You've only used ${Math.round(pct)}% of your budget in the second half of the month.` });
            }
        }

        // Insight 2: Top category
        if (topCat) {
            const catPct = Math.round((topCat[1] / totalExpense) * 100);
            if (catPct > 40) {
                insights.push({ type: 'warning', icon: 'fa-magnifying-glass-chart', text: `<strong>${topCat[0]}</strong> is consuming <strong>${catPct}%</strong> of your total spending this month (${Utils.formatCurrency(topCat[1])}).` });
            } else {
                insights.push({ type: 'info', icon: 'fa-fork-knife', text: `Your biggest expense category is <strong>${topCat[0]}</strong> at ${Utils.formatCurrency(topCat[1])} (${catPct}% of spending).` });
            }
        }

        // Insight 3: vs last month
        if (prevTotal > 0) {
            const diff = totalExpense - prevTotal;
            const diffPct = Math.round(Math.abs(diff / prevTotal) * 100);
            if (diff > 0) {
                insights.push({ type: 'warning', icon: 'fa-arrow-trend-up', text: `Your spending is <strong>${diffPct}% higher</strong> than last month (${Utils.formatCurrency(diff)} more).` });
            } else {
                insights.push({ type: 'success', icon: 'fa-arrow-trend-down', text: `<strong>Well done!</strong> You spent <strong>${diffPct}% less</strong> than last month, saving ${Utils.formatCurrency(Math.abs(diff))}.` });
            }
        }

        // Insight 4: Savings rate
        if (totalIncome > 0) {
            const savingsRate = Math.round(((totalIncome - totalExpense) / totalIncome) * 100);
            if (savingsRate >= 20) {
                insights.push({ type: 'success', icon: 'fa-piggy-bank', text: `<strong>Great savings rate!</strong> You're saving <strong>${savingsRate}%</strong> of your income this month.` });
            } else if (savingsRate < 0) {
                insights.push({ type: 'danger', icon: 'fa-circle-exclamation', text: `<strong>Overspending!</strong> Your expenses exceed your income by ${Utils.formatCurrency(totalExpense - totalIncome)} this month.` });
            }
        }

        // Insight 5: UPI usage
        const upiTxns = monthExpenses.filter(t => t.mode === 'UPI').length;
        if (upiTxns > 0) {
            const upiPct = Math.round((upiTxns / monthExpenses.length) * 100);
            insights.push({ type: 'info', icon: 'fa-mobile-screen', text: `<strong>${upiPct}% of your purchases</strong> are via UPI — you're going cashless! ${upiTxns} transactions this month.` });
        }

        return insights.slice(0, 4);
    }
};
