/**
 * SpendWise 3.0 Pro — UI Rendering Module
 */

const UI = {
    currentPage: 1,
    itemsPerPage: 15,
    filteredTransactions: [],

    // ── THEME ──────────────────────────────────────────
    applyTheme: (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        Storage.saveTheme(theme);
        const btn = document.getElementById('theme-toggle');
        const chk = document.getElementById('dark-mode-toggle');
        if (btn) btn.innerHTML = theme === 'dark' ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
        if (chk) chk.checked = theme === 'dark';
        // Re-render all charts for updated color scheme
        setTimeout(() => Charts.updateAll(Storage.getTransactions()), 100);
    },

    // ── TOAST ──────────────────────────────────────────
    toast: (msg, type = 'info') => {
        const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', info: 'fa-circle-info' };
        const el = document.createElement('div');
        el.className = `toast ${type}`;
        el.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i><span>${msg}</span>`;
        document.getElementById('toast-container').appendChild(el);
        setTimeout(() => el.remove(), 3100);
    },

    // ── MODALS ─────────────────────────────────────────
    openModal: (id) => document.getElementById(id)?.classList.add('active'),
    closeModal: (id) => document.getElementById(id)?.classList.remove('active'),
    closeAllModals: () => document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active')),

    // ── GREETING ───────────────────────────────────────
    updateGreeting: () => {
        const g = Utils.getGreeting();
        const el = document.getElementById('greeting-text');
        const icon = document.getElementById('topbar-greeting')?.querySelector('i');
        if (el) el.textContent = g.text;
        if (icon) icon.className = `fa-solid ${g.icon}`;
    },

    // ── NAV BADGES ─────────────────────────────────────
    updateNavBadges: (transactions) => {
        const txnBadge = document.getElementById('nav-txn-badge');
        const splitBadge = document.getElementById('nav-split-badge');
        if (txnBadge) txnBadge.textContent = transactions.length;
        if (splitBadge) {
            const pending = transactions.filter(t => t.isSplit && !t.splitSettled).length;
            splitBadge.textContent = pending;
            splitBadge.classList.toggle('hidden', pending === 0);
        }
    },

    // ── DASHBOARD STATS ────────────────────────────────
    updateDashboardStats: (transactions) => {
        const today = new Date();
        let totalIncome = 0, totalExpense = 0, monthExpense = 0, monthIncome = 0, totalOwed = 0;
        const owedByFriend = {};
        const incomeBySource = {};

        transactions.forEach(t => {
            const amount = parseFloat(t.amount);
            if (t.type === 'income') {
                totalIncome += amount;
                if (Utils.isSameMonth(new Date(t.date + 'T00:00:00'), today)) {
                    monthIncome += amount;
                    incomeBySource[t.category] = (incomeBySource[t.category] || 0) + amount;
                }
            } else {
                totalExpense += amount;
                if (Utils.isSameMonth(new Date(t.date + 'T00:00:00'), today)) monthExpense += amount;
            }
            if (t.isSplit && !t.splitSettled) {
                totalOwed += parseFloat(t.splitAmount || 0);
                owedByFriend[t.splitFriend] = (owedByFriend[t.splitFriend] || 0) + parseFloat(t.splitAmount || 0);
            }
        });

        const totalBalance = totalIncome - totalExpense;

        // Animated counters
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) Utils.animateCounter(el, Math.abs(val), val < 0 ? '-₹' : '₹');
        };
        setVal('stat-total-balance', totalBalance);
        setVal('stat-total-income', monthIncome);
        setVal('stat-month-expense', monthExpense);
        setVal('stat-total-owed', totalOwed);

        // Trend texts
        const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const prevExpenses = transactions.filter(t => t.type === 'expense' && Utils.isSameMonth(new Date(t.date + 'T00:00:00'), prevMonthDate));
        const prevTotal = prevExpenses.reduce((s,t) => s+t.amount, 0);
        const trendEl = document.getElementById('expense-trend-text');
        if (trendEl && prevTotal > 0) {
            const diff = monthExpense - prevTotal;
            const pct = Math.round((Math.abs(diff) / prevTotal) * 100);
            trendEl.innerHTML = diff > 0
                ? `<i class="fa-solid fa-arrow-up"></i> ${pct}% vs last month`
                : `<i class="fa-solid fa-arrow-down"></i> ${pct}% vs last month`;
            trendEl.className = `bento-trend ${diff > 0 ? 'down' : 'up'}`;
        }

        // Income sources breakdown
        const srcList = document.getElementById('income-sources-list');
        if (srcList) {
            srcList.innerHTML = '';
            Object.entries(incomeBySource).slice(0, 3).forEach(([cat, val]) => {
                srcList.innerHTML += `<div class="income-src-row"><span class="income-src-label">${cat}</span><span class="income-src-val">${Utils.formatCurrency(val)}</span></div>`;
            });
            if (Object.keys(incomeBySource).length === 0) srcList.innerHTML = '<p class="empty-feed-msg">No income this month</p>';
        }

        // Friends who owe
        const friendList = document.getElementById('owed-friends-list');
        if (friendList) {
            friendList.innerHTML = '';
            if (Object.keys(owedByFriend).length === 0) {
                friendList.innerHTML = '<p class="empty-feed-msg">No pending splits</p>';
            } else {
                Object.entries(owedByFriend).slice(0, 3).forEach(([name, amt]) => {
                    friendList.innerHTML += `<div class="owed-friend-chip"><span class="owed-friend-name">👤 ${name}</span><span class="owed-friend-amount">${Utils.formatCurrency(amt)}</span></div>`;
                });
            }
        }

        // Budget Banner
        UI.updateBudgetHero(monthExpense);
    },

    // ── BUDGET HERO BANNER ─────────────────────────────
    updateBudgetHero: (monthExpense) => {
        const budgets = Storage.getBudgets();
        const global = parseFloat(budgets.global || 0);
        const spentEl = document.getElementById('hero-spent');
        const totalEl = document.getElementById('hero-total');
        const barFill = document.getElementById('hero-bar-fill');
        const subText = document.getElementById('hero-sub-text');
        const percentEl = document.getElementById('hero-percent');

        if (spentEl) spentEl.textContent = Utils.formatCurrency(monthExpense);

        if (!global || global <= 0) {
            if (totalEl) totalEl.textContent = '₹? set budget';
            if (barFill) barFill.style.width = '0%';
            if (subText) subText.textContent = 'Click "Configure" to set a monthly budget';
            if (percentEl) percentEl.textContent = '—';
            Charts.renderBudgetRing(0);
            return;
        }

        const left = global - monthExpense;
        const pct = Math.min((monthExpense / global) * 100, 100);
        if (totalEl) totalEl.textContent = Utils.formatCurrency(global);
        if (barFill) setTimeout(() => barFill.style.width = `${pct}%`, 100);
        if (subText) {
            if (left < 0) subText.textContent = `Over budget by ${Utils.formatCurrency(Math.abs(left))}`;
            else subText.textContent = `${Utils.formatCurrency(left)} remaining · ${Math.round(pct)}% used`;
        }
        if (percentEl) percentEl.textContent = `${Math.round(pct)}%`;
        Charts.renderBudgetRing(pct);
    },

    // ── CATEGORY BREAKDOWN LIST (Dashboard) ────────────
    renderCategoryBreakdown: (transactions) => {
        const list = document.getElementById('category-breakdown-list');
        if (!list) return;
        list.innerHTML = '';
        const today = new Date();
        const map = {};
        transactions.filter(t => t.type === 'expense' && Utils.isSameMonth(new Date(t.date + 'T00:00:00'), today))
                    .forEach(t => map[t.category] = (map[t.category] || 0) + t.amount);
        const total = Object.values(map).reduce((a,b) => a+b, 0);
        const sorted = Object.entries(map).sort((a,b) => b[1]-a[1]).slice(0,6);
        sorted.forEach(([cat, amt]) => {
            const pct = Math.round((amt / total) * 100);
            const color = Utils.getCategoryColor(cat);
            list.innerHTML += `
                <div class="cat-row">
                    <div class="cat-icon-tiny" style="background: ${color}20; color: ${color};">
                        <i class="fa-solid ${Utils.getCategoryIcon(cat)}"></i>
                    </div>
                    <div class="cat-row-info">
                        <div class="cat-row-name">${cat}</div>
                        <div class="cat-row-bar-bg"><div class="cat-row-bar-fill" style="width:${pct}%; background:${color};"></div></div>
                    </div>
                    <span class="cat-row-amount">${Utils.formatCurrency(amt)}</span>
                </div>`;
        });
        if (sorted.length === 0) list.innerHTML = '<p class="empty-feed-msg">No expenses this month</p>';
    },

    // ── RECENT TRANSACTIONS FEED (Dashboard) ───────────
    renderRecentFeed: (transactions) => {
        const feed = document.getElementById('recent-transactions-feed');
        if (!feed) return;
        feed.innerHTML = '';
        const recent = [...transactions].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0,6);
        if (recent.length === 0) { feed.innerHTML = '<p class="empty-feed-msg">No transactions yet</p>'; return; }
        recent.forEach(t => {
            const color = Utils.getCategoryColor(t.category);
            const isExp = t.type === 'expense';
            feed.innerHTML += `
                <div class="txn-feed-item">
                    <div class="txn-icon" style="background:${color}20; color:${color};">
                        <i class="fa-solid ${Utils.getCategoryIcon(t.category)}"></i>
                    </div>
                    <div class="txn-details">
                        <div class="txn-title">${t.title}</div>
                        <div class="txn-meta">${Utils.formatDateShort(t.date)} · ${t.category}</div>
                    </div>
                    <span class="txn-amount ${isExp ? 'expense' : 'income'}">${isExp ? '-' : '+'}${Utils.formatCurrency(t.amount)}</span>
                </div>`;
        });
    },

    // ── SPLIT BILLS FEED (Dashboard) ──────────────────
    renderSplitFeed: (transactions) => {
        const feed = document.getElementById('dashboard-splits-list');
        if (!feed) return;
        const splits = transactions.filter(t => t.isSplit && !t.splitSettled).sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0,4);
        if (splits.length === 0) { feed.innerHTML = '<p class="empty-feed-msg">No pending splits 🎉</p>'; return; }
        feed.innerHTML = splits.map(s => `
            <div class="split-feed-item">
                <div>
                    <div class="split-feed-name">👤 ${s.splitFriend}</div>
                    <div class="split-feed-sub">${s.title} · ${Utils.formatDateShort(s.date)}</div>
                </div>
                <span class="split-feed-amount">${Utils.formatCurrency(s.splitAmount)}</span>
            </div>`).join('');
    },

    // ── INSIGHTS ───────────────────────────────────────
    renderInsights: (transactions) => {
        const list = document.getElementById('insights-list');
        if (!list) return;
        const insights = Utils.generateInsights(transactions);
        if (insights.length === 0) { list.innerHTML = '<p class="empty-feed-msg">Add more transactions to see AI insights</p>'; return; }
        list.innerHTML = insights.map(ins => `
            <div class="insight-item ${ins.type}">
                <i class="insight-icon fa-solid ${ins.icon}"></i>
                <p class="insight-text">${ins.text}</p>
            </div>`).join('');
        // notif dot
        const dot = document.getElementById('notif-dot');
        if (dot) dot.classList.toggle('hidden', insights.filter(i => i.type === 'danger').length === 0);
    },

    // ── ALL TRANSACTIONS TABLE ─────────────────────────
    renderAllTransactions: (transactions) => {
        const tbody = document.getElementById('all-transactions-body');
        const emptyMsg = document.getElementById('no-transactions-msg');
        if (!tbody) return;
        tbody.innerHTML = '';
        UI.filteredTransactions = transactions;

        const countLabel = document.getElementById('table-count-label');
        if (countLabel) countLabel.textContent = `${transactions.length} entries`;

        if (transactions.length === 0) {
            tbody.parentElement.parentElement.classList.add('hidden');
            emptyMsg?.classList.remove('hidden');
            UI.updatePagination();
            return;
        }
        tbody.parentElement.parentElement.classList.remove('hidden');
        emptyMsg?.classList.add('hidden');

        const start = (UI.currentPage - 1) * UI.itemsPerPage;
        const paged = transactions.slice(start, start + UI.itemsPerPage);

        paged.forEach(t => {
            const color = Utils.getCategoryColor(t.category);
            const isExp = t.type === 'expense';
            let typeBadge = `<span class="badge badge-${t.type}">${t.type}</span>`;
            if (t.isSplit) typeBadge += ` <span class="badge badge-split">split</span>`;
            tbody.innerHTML += `
                <tr>
                    <td>${Utils.formatDate(t.date)}</td>
                    <td>
                        <div class="cell-title">
                            <div class="cell-icon" style="background:${color}20; color:${color};">
                                <i class="fa-solid ${Utils.getCategoryIcon(t.category)}"></i>
                            </div>
                            ${t.title}
                        </div>
                    </td>
                    <td>${t.category}</td>
                    <td>${t.mode}</td>
                    <td>${typeBadge}</td>
                    <td class="text-right ${isExp ? 'amount-expense' : 'amount-income'}">${isExp ? '-' : '+'}${Utils.formatCurrency(t.amount)}</td>
                    <td>
                        <div class="row-actions">
                            <button class="act-btn edit" data-id="${t.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
                            <button class="act-btn del" data-id="${t.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </td>
                </tr>`;
        });
        UI.updatePagination();
    },

    updatePagination: () => {
        const total = Math.ceil(UI.filteredTransactions.length / UI.itemsPerPage) || 1;
        const el = document.getElementById('page-indicator');
        if (el) el.textContent = `${UI.currentPage} / ${total}`;
        const prev = document.getElementById('prev-page');
        const next = document.getElementById('next-page');
        if (prev) prev.disabled = UI.currentPage === 1;
        if (next) next.disabled = UI.currentPage === total;
    },

    // ── SPLIT BILLS TABLE ──────────────────────────────
    renderSplitBillsPage: (transactions) => {
        const tbody = document.getElementById('split-bills-body');
        const empty = document.getElementById('no-splits-msg');
        if (!tbody) return;
        tbody.innerHTML = '';
        const splits = transactions.filter(t => t.isSplit).sort((a,b) => new Date(b.date)-new Date(a.date));

        let totalOwed = 0, pending = 0, settled = 0;
        splits.forEach(s => { if (!s.splitSettled) { totalOwed += parseFloat(s.splitAmount||0); pending++; } else settled++; });

        const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = typeof val === 'number' ? Utils.formatCurrency(val) : val; };
        setEl('stat-split-owed', totalOwed);
        const pEl = document.getElementById('stat-split-pending-count');
        if (pEl) pEl.textContent = pending;
        const sEl = document.getElementById('stat-split-settled-count');
        if (sEl) sEl.textContent = settled;

        if (splits.length === 0) { empty?.classList.remove('hidden'); tbody.parentElement.parentElement.classList.add('hidden'); return; }
        empty?.classList.add('hidden');
        tbody.parentElement.parentElement.classList.remove('hidden');

        splits.forEach(s => {
            tbody.innerHTML += `
                <tr>
                    <td>${Utils.formatDate(s.date)}</td>
                    <td>${s.title}</td>
                    <td class="text-right">${Utils.formatCurrency(s.amount)}</td>
                    <td><strong>${s.splitFriend}</strong></td>
                    <td class="text-right amount-income">₹${s.splitAmount?.toLocaleString('en-IN')}</td>
                    <td><span class="badge ${s.splitSettled ? 'badge-settled' : 'badge-split'}">${s.splitSettled ? 'Settled' : 'Pending'}</span></td>
                    <td>
                        <div class="row-actions">
                            ${!s.splitSettled ? `<button class="act-btn settle" data-id="${s.id}" title="Settle"><i class="fa-solid fa-check"></i></button>` : ''}
                            <button class="act-btn edit" data-id="${s.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
                        </div>
                    </td>
                </tr>`;
        });
    },

    // ── CATEGORY BUDGETS LIST (Analytics) ─────────────
    renderCategoryBudgets: (transactions) => {
        const list = document.getElementById('category-budgets-list');
        if (!list) return;
        list.innerHTML = '';
        const budgets = Storage.getBudgets();
        const cats = budgets.categories || {};
        if (Object.keys(cats).length === 0) { list.innerHTML = '<p class="empty-feed-msg" style="padding:12px 0;">No category limits set. Click "Configure Budgets" above.</p>'; return; }
        const today = new Date();
        const spentMap = {};
        transactions.forEach(t => { if (t.type === 'expense' && Utils.isSameMonth(new Date(t.date+'T00:00:00'), today)) spentMap[t.category] = (spentMap[t.category]||0)+t.amount; });
        for (const [cat, lim] of Object.entries(cats)) {
            if (!lim) continue;
            const spent = spentMap[cat] || 0;
            const pct = Math.min((spent/lim)*100, 100);
            const cls = pct > 90 ? 'danger' : pct > 75 ? 'warning' : '';
            list.innerHTML += `
                <div class="budget-cat-item">
                    <div class="budget-cat-header">
                        <span><i class="fa-solid ${Utils.getCategoryIcon(cat)}"></i> ${cat}</span>
                        <span>${Utils.formatCurrency(spent)} / ${Utils.formatCurrency(lim)}</span>
                    </div>
                    <div class="bcat-bar-bg"><div class="bcat-bar-fill ${cls}" style="width:${pct}%;"></div></div>
                </div>`;
        }
    },

    // ── BUDGET INPUTS (Modal) ──────────────────────────
    renderBudgetInputs: () => {
        const container = document.getElementById('category-budgets-inputs');
        if (!container) return;
        const budgets = Storage.getBudgets();
        const categories = Utils.getCategories('expense');
        container.innerHTML = '';
        const globalInput = document.getElementById('global-budget-input');
        if (globalInput) globalInput.value = budgets.global || '';
        categories.forEach(cat => {
            const val = budgets.categories?.[cat] || '';
            container.innerHTML += `
                <div class="form-group">
                    <label><i class="fa-solid ${Utils.getCategoryIcon(cat)}"></i> ${cat}</label>
                    <div class="input-with-prefix">
                        <span class="prefix">₹</span>
                        <input type="number" class="form-input cat-budget-input" data-cat="${cat}" value="${val}" placeholder="0">
                    </div>
                </div>`;
        });
    },

    // ── CATEGORY DROPDOWN ──────────────────────────────
    populateCategories: (type, selectId) => {
        const sel = document.getElementById(selectId);
        if (!sel) return;
        sel.innerHTML = Utils.getCategories(type).map(c => `<option value="${c}">${c}</option>`).join('');
    },

    // ── GOALS PAGE ─────────────────────────────────────
    renderGoals: () => {
        const grid = document.getElementById('goals-grid');
        const empty = document.getElementById('no-goals-msg');
        if (!grid) return;
        grid.innerHTML = '';
        const goals = Storage.getGoals();
        if (goals.length === 0) { empty?.classList.remove('hidden'); grid.classList.add('hidden'); return; }
        empty?.classList.add('hidden'); grid.classList.remove('hidden');
        goals.forEach(g => {
            const pct = Math.min(Math.round((g.saved/g.target)*100), 100) || 0;
            const ringId = `goal-ring-${g.id}`;
            const remaining = g.target - g.saved;
            const deadlineStr = g.deadline ? `<i class="fa-solid fa-calendar-days"></i> Target: ${Utils.formatDate(g.deadline)}` : '';
            grid.innerHTML += `
                <div class="goal-card">
                    <div class="goal-card-top">
                        <div class="goal-emoji">${g.icon || '🎯'}</div>
                        <div class="goal-actions">
                            <button class="act-btn edit" data-goal-id="${g.id}" title="Edit Goal"><i class="fa-solid fa-pen"></i></button>
                            <button class="act-btn del" data-goal-del="${g.id}" title="Delete Goal"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>
                    <h3 class="goal-name">${g.name}</h3>
                    <p class="goal-target-text">Target: <span>${Utils.formatCurrency(g.target)}</span></p>
                    <div class="goal-progress-ring-wrap">
                        <div class="goal-ring-box">
                            <canvas id="${ringId}" width="72" height="72"></canvas>
                            <div class="goal-ring-text">${pct}%</div>
                        </div>
                        <div class="goal-ring-info">
                            <span class="goal-saved-label">Saved</span>
                            <span class="goal-saved-val">${Utils.formatCurrency(g.saved)}</span>
                            <span class="goal-remaining">${Utils.formatCurrency(remaining)} to go</span>
                        </div>
                    </div>
                    ${deadlineStr ? `<p class="goal-deadline">${deadlineStr}</p>` : ''}
                </div>`;
        });
        // Render goal rings after DOM update
        requestAnimationFrame(() => {
            goals.forEach(g => Charts.renderGoalRing(`goal-ring-${g.id}`, Math.min(Math.round((g.saved/g.target)*100), 100) || 0));
        });
    },

    // ── SUBSCRIPTIONS PAGE ─────────────────────────────
    renderSubscriptions: () => {
        const grid = document.getElementById('subs-grid');
        const empty = document.getElementById('no-subs-msg');
        if (!grid) return;
        grid.innerHTML = '';
        const subs = Storage.getSubscriptions();
        const totalEl = document.getElementById('subs-total');
        const countEl = document.getElementById('subs-count');
        const total = subs.reduce((s, sb) => s + parseFloat(sb.amount || 0), 0);
        if (totalEl) totalEl.textContent = Utils.formatCurrency(total);
        if (countEl) countEl.textContent = subs.length;
        if (subs.length === 0) { empty?.classList.remove('hidden'); return; }
        empty?.classList.add('hidden');
        const today = new Date().getDate();
        subs.forEach(s => {
            const daysUntilDue = s.dueDay >= today ? s.dueDay - today : (30 - today) + s.dueDay;
            const dueBadge = daysUntilDue <= 3 ? `<span class="badge badge-expense">Due in ${daysUntilDue}d</span>` : s.dueDay ? `Due on ${s.dueDay}th` : '';
            grid.innerHTML += `
                <div class="sub-card">
                    <div class="sub-emoji">${s.icon || '📱'}</div>
                    <div class="sub-info">
                        <div class="sub-name">${s.name}</div>
                        <div class="sub-category">${s.category}</div>
                        <div class="sub-amount">${s.amount > 0 ? Utils.formatCurrency(s.amount) + '/mo' : 'FREE'}</div>
                        <div class="sub-due">${dueBadge}</div>
                    </div>
                    <div class="sub-actions">
                        <button class="act-btn edit" data-sub-id="${s.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
                        <button class="act-btn del" data-sub-del="${s.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>`;
        });
    }
};
