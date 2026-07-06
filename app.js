/**
 * SpendWise 3.0 Pro — Main Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {

    // ── INIT ────────────────────────────────────────────
    UI.applyTheme(Storage.getTheme());
    UI.updateGreeting();

    // First load: generate sample data
    if (Storage.getTransactions().length === 0) {
        Storage.generateSampleData();
    }

    // ── SIDEBAR NAVIGATION ──────────────────────────────
    const navItems = document.querySelectorAll('.nav-links li[data-page]');
    const sections = document.querySelectorAll('.page[id^="page-"]');
    const pageTitle = document.getElementById('page-title');
    const sidebar = document.getElementById('sidebar');

    function navigateTo(pageName) {
        navItems.forEach(n => n.classList.toggle('active', n.dataset.page === pageName));
        sections.forEach(s => s.classList.toggle('active', s.id === `page-${pageName}`));

        const active = document.querySelector(`.nav-links li[data-page="${pageName}"] a span`);
        if (pageTitle && active) pageTitle.textContent = active.textContent.trim();

        sidebar?.classList.remove('open');

        // Re-render page-specific content
        const txns = Storage.getTransactions();
        if (pageName === 'analytics') {
            Charts.updateAll(txns);
            UI.renderCategoryBudgets(txns);
        } else if (pageName === 'goals') {
            UI.renderGoals();
        } else if (pageName === 'subscriptions') {
            UI.renderSubscriptions();
        }
    }

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(item.dataset.page);
        });
    });

    document.getElementById('open-sidebar-btn')?.addEventListener('click', () => sidebar?.classList.add('open'));
    document.getElementById('close-sidebar-btn')?.addEventListener('click', () => sidebar?.classList.remove('open'));

    // ── THEME ───────────────────────────────────────────
    document.getElementById('theme-toggle')?.addEventListener('click', () => {
        UI.applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
    document.getElementById('dark-mode-toggle')?.addEventListener('change', (e) => {
        UI.applyTheme(e.target.checked ? 'dark' : 'light');
    });

    // ── VIEW ALL LINKS ──────────────────────────────────
    document.body.addEventListener('click', (e) => {
        const link = e.target.closest('.view-all-link');
        if (link) { e.preventDefault(); navigateTo(link.dataset.target); }
    });

    // ── COMMAND PALETTE ─────────────────────────────────
    const cmdOverlay = document.getElementById('command-palette-overlay');
    const cmdInput = document.getElementById('cmd-input');
    let cmdSelectedIndex = -1;

    const CMD_ITEMS = [
        { label: 'Dashboard', sub: 'Go to Dashboard', icon: 'fa-grid-2', action: () => navigateTo('dashboard') },
        { label: 'Transactions', sub: 'View all transactions', icon: 'fa-receipt', action: () => navigateTo('transactions') },
        { label: 'Split Bills', sub: 'View split bills', icon: 'fa-users', action: () => navigateTo('splits') },
        { label: 'Analytics', sub: 'View charts and analytics', icon: 'fa-chart-mixed', action: () => navigateTo('analytics') },
        { label: 'Goals', sub: 'Manage savings goals', icon: 'fa-bullseye-arrow', action: () => navigateTo('goals') },
        { label: 'Subscriptions', sub: 'Manage recurring bills', icon: 'fa-rotate', action: () => navigateTo('subscriptions') },
        { label: 'Settings', sub: 'App settings', icon: 'fa-gear', action: () => navigateTo('settings') },
        { label: 'Add Transaction', sub: 'Create a new expense or income', icon: 'fa-plus', action: () => openTransactionModal() },
        { label: 'Configure Budgets', sub: 'Set monthly limits', icon: 'fa-sliders', action: () => openBudgetModal() },
        { label: 'Add Goal', sub: 'Create a savings goal', icon: 'fa-bullseye', action: () => openGoalModal() },
        { label: 'Export Data', sub: 'Download JSON backup', icon: 'fa-download', action: () => { Storage.exportData(); UI.toast('Data exported!', 'success'); } },
        { label: 'Generate Sample Data', sub: 'Populate with demo data', icon: 'fa-wand-magic-sparkles', action: () => { Storage.generateSampleData(); refreshAll(); UI.toast('Demo data generated!', 'success'); } },
        { label: 'Toggle Dark/Light Mode', sub: 'Switch color theme', icon: 'fa-circle-half-stroke', action: () => { UI.applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'); } },
    ];

    function openCommandPalette() {
        cmdOverlay?.classList.remove('hidden');
        cmdInput?.focus();
        renderCmdResults('');
    }

    function closeCommandPalette() {
        cmdOverlay?.classList.add('hidden');
        if (cmdInput) cmdInput.value = '';
        cmdSelectedIndex = -1;
    }

    function renderCmdResults(query) {
        const results = document.getElementById('cmd-results');
        if (!results) return;
        const filtered = query.trim()
            ? CMD_ITEMS.filter(item => item.label.toLowerCase().includes(query.toLowerCase()) || item.sub.toLowerCase().includes(query.toLowerCase()))
            : CMD_ITEMS;

        if (filtered.length === 0) { results.innerHTML = '<div class="cmd-no-results"><i class="fa-solid fa-face-meh" style="font-size:2rem;display:block;margin-bottom:8px;"></i>No results for "' + query + '"</div>'; return; }

        results.innerHTML = `<div class="cmd-result-group"><div class="cmd-result-group-label">${query ? 'Results' : 'All Commands'}</div>` +
            filtered.map((item, i) => `
                <div class="cmd-result-item" data-index="${i}">
                    <div class="cmd-result-icon"><i class="fa-solid ${item.icon}"></i></div>
                    <div>
                        <div class="cmd-result-label">${item.label}</div>
                        <div class="cmd-result-sub">${item.sub}</div>
                    </div>
                </div>`).join('') + '</div>';

        results.querySelectorAll('.cmd-result-item').forEach((el, i) => {
            el.addEventListener('click', () => { filtered[i].action(); closeCommandPalette(); });
        });
        cmdSelectedIndex = -1;
    }

    document.getElementById('cmd-trigger')?.addEventListener('click', openCommandPalette);
    cmdOverlay?.addEventListener('click', (e) => { if (e.target === cmdOverlay) closeCommandPalette(); });
    cmdInput?.addEventListener('input', (e) => renderCmdResults(e.target.value));
    cmdInput?.addEventListener('keydown', (e) => {
        const items = document.querySelectorAll('.cmd-result-item');
        if (e.key === 'ArrowDown') { e.preventDefault(); cmdSelectedIndex = Math.min(cmdSelectedIndex + 1, items.length - 1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); cmdSelectedIndex = Math.max(cmdSelectedIndex - 1, 0); }
        else if (e.key === 'Enter' && cmdSelectedIndex >= 0) { items[cmdSelectedIndex]?.click(); return; }
        else if (e.key === 'Escape') { closeCommandPalette(); return; }
        items.forEach((el, i) => el.classList.toggle('selected', i === cmdSelectedIndex));
    });

    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openCommandPalette(); }
        if (e.key === 'Escape') closeCommandPalette();
    });

    // ── TRANSACTION MODAL ───────────────────────────────
    let editingId = null;

    function openTransactionModal(txn = null) {
        const form = document.getElementById('transaction-form');
        form?.reset();
        document.getElementById('txn-id').value = '';
        document.getElementById('txn-date').value = Utils.getTodayString();
        UI.populateCategories('expense', 'txn-category');
        document.getElementById('split-bill-section')?.classList.remove('hidden');
        document.getElementById('split-details')?.classList.add('hidden');

        if (txn) {
            editingId = txn.id;
            document.getElementById('txn-id').value = txn.id;
            document.getElementById('modal-title').textContent = 'Edit Transaction';
            const typeRadio = document.querySelector(`input[name="txn-type"][value="${txn.type}"]`);
            if (typeRadio) typeRadio.checked = true;
            UI.populateCategories(txn.type, 'txn-category');
            document.getElementById('txn-title').value = txn.title;
            document.getElementById('txn-amount').value = txn.amount;
            document.getElementById('txn-date').value = txn.date;
            document.getElementById('txn-category').value = txn.category;
            document.getElementById('txn-mode').value = txn.mode;
            document.getElementById('txn-notes').value = txn.notes || '';
            if (txn.type === 'income') document.getElementById('split-bill-section')?.classList.add('hidden');
            if (txn.isSplit) {
                document.getElementById('txn-is-split').checked = true;
                document.getElementById('split-details')?.classList.remove('hidden');
                document.getElementById('split-friend-name').value = txn.splitFriend || '';
                document.getElementById('split-amount-owed').value = txn.splitAmount || '';
            }
        } else {
            editingId = null;
            document.getElementById('modal-title').textContent = 'Add Transaction';
        }
        UI.openModal('transaction-modal');
    }

    function openBudgetModal() {
        UI.renderBudgetInputs();
        UI.openModal('budget-modal');
    }

    function openGoalModal(goal = null) {
        document.getElementById('goal-form')?.reset();
        document.getElementById('goal-id').value = '';
        if (goal) {
            document.getElementById('goal-modal-title').textContent = 'Edit Goal';
            document.getElementById('goal-id').value = goal.id;
            document.getElementById('goal-name').value = goal.name;
            document.getElementById('goal-target').value = goal.target;
            document.getElementById('goal-saved').value = goal.saved || 0;
            document.getElementById('goal-date').value = goal.deadline || '';
            document.getElementById('goal-icon').value = goal.icon || '';
        } else {
            document.getElementById('goal-modal-title').textContent = 'Create Goal';
        }
        UI.openModal('goal-modal');
    }

    function openSubModal(sub = null) {
        document.getElementById('sub-form')?.reset();
        document.getElementById('sub-id').value = '';
        if (sub) {
            document.getElementById('sub-modal-title').textContent = 'Edit Subscription';
            document.getElementById('sub-id').value = sub.id;
            document.getElementById('sub-name').value = sub.name;
            document.getElementById('sub-amount').value = sub.amount;
            document.getElementById('sub-due-day').value = sub.dueDay || '';
            document.getElementById('sub-category').value = sub.category || 'Streaming';
            document.getElementById('sub-icon').value = sub.icon || '';
        } else {
            document.getElementById('sub-modal-title').textContent = 'Add Subscription';
        }
        UI.openModal('sub-modal');
    }

    // Add transaction buttons
    document.getElementById('add-transaction-btn')?.addEventListener('click', () => openTransactionModal());
    document.getElementById('add-transaction-btn-2')?.addEventListener('click', () => openTransactionModal());

    // Budget buttons
    document.getElementById('setup-budget-btn')?.addEventListener('click', openBudgetModal);
    document.getElementById('setup-budget-btn-2')?.addEventListener('click', openBudgetModal);

    // Goal buttons
    document.getElementById('add-goal-btn')?.addEventListener('click', () => openGoalModal());
    document.getElementById('add-goal-btn-empty')?.addEventListener('click', () => openGoalModal());

    // Sub buttons
    document.getElementById('add-sub-btn')?.addEventListener('click', () => openSubModal());

    // Close all modals via .close-modal class
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => UI.closeAllModals());
    });
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => { if (e.target === overlay) UI.closeAllModals(); });
    });

    // ── TRANSACTION TYPE CHANGE ─────────────────────────
    document.querySelectorAll('input[name="txn-type"]').forEach(r => {
        r.addEventListener('change', (e) => {
            UI.populateCategories(e.target.value, 'txn-category');
            const splitSec = document.getElementById('split-bill-section');
            splitSec?.classList.toggle('hidden', e.target.value === 'income');
        });
    });

    document.getElementById('txn-is-split')?.addEventListener('change', (e) => {
        document.getElementById('split-details')?.classList.toggle('hidden', !e.target.checked);
    });

    // ── TRANSACTION FORM SUBMIT ─────────────────────────
    document.getElementById('transaction-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('txn-id').value;
        const type = document.querySelector('input[name="txn-type"]:checked')?.value || 'expense';
        const isSplit = type === 'expense' && document.getElementById('txn-is-split').checked;
        const splitFriend = isSplit ? document.getElementById('split-friend-name').value.trim() : null;
        const splitAmt = isSplit ? parseFloat(document.getElementById('split-amount-owed').value) : null;

        if (isSplit && (!splitFriend || !splitAmt)) {
            UI.toast('Please enter friend name and owed amount', 'error'); return;
        }

        const txnData = {
            type,
            title: document.getElementById('txn-title').value.trim(),
            amount: parseFloat(document.getElementById('txn-amount').value),
            date: document.getElementById('txn-date').value,
            category: document.getElementById('txn-category').value,
            mode: document.getElementById('txn-mode').value,
            notes: document.getElementById('txn-notes').value.trim(),
            isSplit, splitFriend, splitAmount: splitAmt, splitSettled: false
        };

        if (id) {
            const existing = Storage.getTransactions().find(t => t.id === id);
            if (existing) txnData.splitSettled = existing.splitSettled;
            Storage.updateTransaction(id, txnData);
            UI.toast('Transaction updated', 'success');
        } else {
            Storage.addTransaction(txnData);
            UI.toast('Transaction added', 'success');
        }

        UI.closeAllModals();
        refreshAll();
    });

    // ── BUDGET FORM SUBMIT ──────────────────────────────
    document.getElementById('budget-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const global = parseFloat(document.getElementById('global-budget-input').value) || 0;
        const categories = {};
        document.querySelectorAll('.cat-budget-input').forEach(inp => {
            const val = parseFloat(inp.value);
            if (val > 0) categories[inp.dataset.cat] = val;
        });
        Storage.saveBudgets({ global, categories });
        UI.toast('Budgets saved!', 'success');
        UI.closeAllModals();
        refreshAll();
    });

    // ── GOAL FORM SUBMIT ────────────────────────────────
    document.getElementById('goal-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('goal-id').value;
        const goalData = {
            name: document.getElementById('goal-name').value.trim(),
            target: parseFloat(document.getElementById('goal-target').value),
            saved: parseFloat(document.getElementById('goal-saved').value) || 0,
            deadline: document.getElementById('goal-date').value,
            icon: document.getElementById('goal-icon').value.trim() || '🎯'
        };
        if (id) { Storage.updateGoal(id, goalData); UI.toast('Goal updated!', 'success'); }
        else { Storage.addGoal(goalData); UI.toast('Goal created!', 'success'); }
        UI.closeAllModals();
        UI.renderGoals();
    });

    // ── SUBSCRIPTION FORM SUBMIT ────────────────────────
    document.getElementById('sub-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('sub-id').value;
        const subData = {
            name: document.getElementById('sub-name').value.trim(),
            amount: parseFloat(document.getElementById('sub-amount').value) || 0,
            dueDay: parseInt(document.getElementById('sub-due-day').value) || 0,
            category: document.getElementById('sub-category').value,
            icon: document.getElementById('sub-icon').value.trim() || '📱'
        };
        if (id) { Storage.updateSub(id, subData); UI.toast('Subscription updated!', 'success'); }
        else { Storage.addSub(subData); UI.toast('Subscription added!', 'success'); }
        UI.closeAllModals();
        UI.renderSubscriptions();
    });

    // ── CONFIRM MODAL ───────────────────────────────────
    let confirmCallback = null;

    function showConfirm(title, msg, cb) {
        document.getElementById('confirm-title').textContent = title;
        document.getElementById('confirm-msg').textContent = msg;
        confirmCallback = cb;
        UI.openModal('confirm-modal');
    }

    document.getElementById('cancel-confirm')?.addEventListener('click', () => UI.closeModal('confirm-modal'));
    document.getElementById('proceed-confirm')?.addEventListener('click', () => {
        confirmCallback?.();
        confirmCallback = null;
        UI.closeModal('confirm-modal');
    });

    // ── EVENT DELEGATION ────────────────────────────────
    document.body.addEventListener('click', (e) => {
        // Edit transaction
        const editBtn = e.target.closest('.act-btn.edit[data-id]');
        if (editBtn) {
            const txn = Storage.getTransactions().find(t => t.id === editBtn.dataset.id);
            if (txn) openTransactionModal(txn);
        }

        // Delete transaction
        const delBtn = e.target.closest('.act-btn.del[data-id]');
        if (delBtn) {
            showConfirm('Delete Transaction?', 'This cannot be undone.', () => {
                Storage.deleteTransaction(delBtn.dataset.id);
                UI.toast('Transaction deleted', 'success');
                refreshAll();
            });
        }

        // Settle split
        const settleBtn = e.target.closest('.act-btn.settle[data-id]');
        if (settleBtn) {
            Storage.markSplitSettled(settleBtn.dataset.id);
            UI.toast('Marked as settled!', 'success');
            refreshAll();
        }

        // Edit goal
        const editGoalBtn = e.target.closest('.act-btn.edit[data-goal-id]');
        if (editGoalBtn) {
            const goal = Storage.getGoals().find(g => g.id === editGoalBtn.dataset.goalId);
            if (goal) openGoalModal(goal);
        }

        // Delete goal
        const delGoalBtn = e.target.closest('.act-btn.del[data-goal-del]');
        if (delGoalBtn) {
            showConfirm('Delete Goal?', 'This savings goal will be removed.', () => {
                Storage.deleteGoal(delGoalBtn.dataset.goalDel);
                UI.toast('Goal deleted', 'success');
                UI.renderGoals();
            });
        }

        // Edit sub
        const editSubBtn = e.target.closest('.act-btn.edit[data-sub-id]');
        if (editSubBtn) {
            const sub = Storage.getSubscriptions().find(s => s.id === editSubBtn.dataset.subId);
            if (sub) openSubModal(sub);
        }

        // Delete sub
        const delSubBtn = e.target.closest('.act-btn.del[data-sub-del]');
        if (delSubBtn) {
            showConfirm('Delete Subscription?', 'This subscription record will be removed.', () => {
                Storage.deleteSub(delSubBtn.dataset.subDel);
                UI.toast('Subscription deleted', 'success');
                UI.renderSubscriptions();
            });
        }
    });

    // ── FILTERS & SEARCH ────────────────────────────────
    const filterType = document.getElementById('filter-type');
    const filterCat = document.getElementById('filter-category');
    const filterDate = document.getElementById('filter-date');
    const sortBy = document.getElementById('sort-by');
    const globalSearch = document.getElementById('global-search');

    function populateFilterCategories(type) {
        filterCat.innerHTML = '<option value="all">All Categories</option>' +
            (type === 'all' ? [...Utils.getCategories('expense'), ...Utils.getCategories('income')] : Utils.getCategories(type))
                .map(c => `<option value="${c}">${c}</option>`).join('');
    }

    populateFilterCategories('all');

    filterType.addEventListener('change', (e) => { populateFilterCategories(e.target.value); applyFilters(); });
    filterCat.addEventListener('change', applyFilters);
    filterDate.addEventListener('change', applyFilters);
    sortBy.addEventListener('change', applyFilters);
    globalSearch.addEventListener('input', () => { UI.currentPage = 1; applyFilters(); });

    document.getElementById('reset-filters')?.addEventListener('click', () => {
        filterType.value = 'all'; filterCat.value = 'all'; filterDate.value = 'all';
        sortBy.value = 'date-desc'; globalSearch.value = '';
        populateFilterCategories('all');
        UI.currentPage = 1;
        applyFilters();
    });

    function applyFilters() {
        let data = Storage.getTransactions();
        const q = globalSearch.value.toLowerCase().trim();
        if (q) data = data.filter(t => t.title?.toLowerCase().includes(q) || t.category?.toLowerCase().includes(q) || t.notes?.toLowerCase().includes(q) || t.splitFriend?.toLowerCase().includes(q));
        if (filterType.value !== 'all') data = data.filter(t => t.type === filterType.value);
        if (filterCat.value !== 'all') data = data.filter(t => t.category === filterCat.value);
        const today = new Date();
        if (filterDate.value === 'today') data = data.filter(t => Utils.isSameDay(new Date(t.date+'T00:00:00'), today));
        else if (filterDate.value === 'week') data = data.filter(t => Utils.isSameWeek(new Date(t.date+'T00:00:00'), today));
        else if (filterDate.value === 'month') data = data.filter(t => Utils.isSameMonth(new Date(t.date+'T00:00:00'), today));
        else if (filterDate.value === 'year') data = data.filter(t => Utils.isSameYear(new Date(t.date+'T00:00:00'), today));
        data.sort((a,b) => {
            if (sortBy.value === 'date-desc') return new Date(b.date)-new Date(a.date);
            if (sortBy.value === 'date-asc') return new Date(a.date)-new Date(b.date);
            if (sortBy.value === 'amount-desc') return b.amount-a.amount;
            return a.amount-b.amount;
        });
        UI.renderAllTransactions(data);
    }

    document.getElementById('prev-page')?.addEventListener('click', () => {
        if (UI.currentPage > 1) { UI.currentPage--; applyFilters(); }
    });
    document.getElementById('next-page')?.addEventListener('click', () => {
        const total = Math.ceil(UI.filteredTransactions.length / UI.itemsPerPage);
        if (UI.currentPage < total) { UI.currentPage++; applyFilters(); }
    });

    // ── SETTINGS ────────────────────────────────────────
    document.getElementById('export-data-btn')?.addEventListener('click', () => { Storage.exportData(); UI.toast('Data exported!', 'success'); });

    document.getElementById('import-file')?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            if (Storage.importData(ev.target.result)) { refreshAll(); UI.toast('Data imported!', 'success'); }
            else { UI.toast('Invalid file format', 'error'); }
            e.target.value = '';
        };
        reader.readAsText(file);
    });

    document.getElementById('clear-data-btn')?.addEventListener('click', () => {
        showConfirm('Clear All Data?', 'This will permanently delete all transactions, goals, and subscriptions.', () => {
            Storage.clearAll();
            refreshAll();
            UI.toast('All data cleared', 'success');
        });
    });

    document.getElementById('generate-sample-btn')?.addEventListener('click', () => {
        Storage.clearAll();
        Storage.generateSampleData();
        refreshAll();
        UI.toast('Generated 600+ college sample transactions!', 'success');
    });

    // ── REFRESH (full app refresh) ──────────────────────
    function refreshAll() {
        const txns = Storage.getTransactions();
        UI.updateDashboardStats(txns);
        UI.renderRecentFeed(txns);
        UI.renderSplitFeed(txns);
        UI.renderCategoryBreakdown(txns);
        UI.renderInsights(txns);
        UI.renderSplitBillsPage(txns);
        UI.renderCategoryBudgets(txns);
        UI.renderGoals();
        UI.renderSubscriptions();
        UI.updateNavBadges(txns);
        applyFilters();
        Charts.updateAll(txns);
    }

    // ── INITIAL RENDER ──────────────────────────────────
    refreshAll();
});
