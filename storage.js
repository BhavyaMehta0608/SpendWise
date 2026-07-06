/**
 * SpendWise 3.0 Pro — Storage Management (LocalStorage API)
 */

const KEYS = {
    TRANSACTIONS: 'sw3_transactions',
    BUDGETS:      'sw3_budgets',
    THEME:        'sw3_theme',
    GOALS:        'sw3_goals',
    SUBS:         'sw3_subscriptions',
};

const Storage = {

    // ── Transactions ──────────────────────────────────
    getTransactions: () => JSON.parse(localStorage.getItem(KEYS.TRANSACTIONS) || '[]'),
    saveTransactions: (data) => localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(data)),

    addTransaction: (t) => {
        const all = Storage.getTransactions();
        all.push({ ...t, id: Utils.generateId(), createdAt: new Date().toISOString() });
        Storage.saveTransactions(all);
    },

    updateTransaction: (id, data) => {
        const all = Storage.getTransactions();
        const i = all.findIndex(t => t.id === id);
        if (i !== -1) { all[i] = { ...all[i], ...data }; Storage.saveTransactions(all); }
    },

    deleteTransaction: (id) => {
        Storage.saveTransactions(Storage.getTransactions().filter(t => t.id !== id));
    },

    markSplitSettled: (id) => {
        const all = Storage.getTransactions();
        const i = all.findIndex(t => t.id === id);
        if (i !== -1 && all[i].isSplit) { all[i].splitSettled = true; Storage.saveTransactions(all); }
    },

    // ── Budgets ───────────────────────────────────────
    getBudgets: () => JSON.parse(localStorage.getItem(KEYS.BUDGETS) || '{"global":0,"categories":{}}'),
    saveBudgets: (b) => localStorage.setItem(KEYS.BUDGETS, JSON.stringify(b)),

    // ── Goals ─────────────────────────────────────────
    getGoals: () => JSON.parse(localStorage.getItem(KEYS.GOALS) || '[]'),
    saveGoals: (g) => localStorage.setItem(KEYS.GOALS, JSON.stringify(g)),
    addGoal: (g) => {
        const all = Storage.getGoals();
        all.push({ ...g, id: Utils.generateId(), createdAt: new Date().toISOString() });
        Storage.saveGoals(all);
    },
    updateGoal: (id, data) => {
        const all = Storage.getGoals();
        const i = all.findIndex(g => g.id === id);
        if (i !== -1) { all[i] = { ...all[i], ...data }; Storage.saveGoals(all); }
    },
    deleteGoal: (id) => { Storage.saveGoals(Storage.getGoals().filter(g => g.id !== id)); },

    // ── Subscriptions ─────────────────────────────────
    getSubscriptions: () => JSON.parse(localStorage.getItem(KEYS.SUBS) || '[]'),
    saveSubs: (s) => localStorage.setItem(KEYS.SUBS, JSON.stringify(s)),
    addSub: (s) => {
        const all = Storage.getSubscriptions();
        all.push({ ...s, id: Utils.generateId() });
        Storage.saveSubs(all);
    },
    updateSub: (id, data) => {
        const all = Storage.getSubscriptions();
        const i = all.findIndex(s => s.id === id);
        if (i !== -1) { all[i] = { ...all[i], ...data }; Storage.saveSubs(all); }
    },
    deleteSub: (id) => { Storage.saveSubs(Storage.getSubscriptions().filter(s => s.id !== id)); },

    // ── Theme ─────────────────────────────────────────
    getTheme: () => localStorage.getItem(KEYS.THEME) || 'dark',
    saveTheme: (t) => localStorage.setItem(KEYS.THEME, t),

    // ── Export / Import ───────────────────────────────
    exportData: () => {
        const data = {
            version: 3,
            exportDate: new Date().toISOString(),
            transactions: Storage.getTransactions(),
            budgets: Storage.getBudgets(),
            goals: Storage.getGoals(),
            subscriptions: Storage.getSubscriptions()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `spendwise3_backup_${Utils.getTodayString()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },

    importData: (json) => {
        try {
            const data = JSON.parse(json);
            if (!data.transactions || !Array.isArray(data.transactions)) return false;
            Storage.saveTransactions(data.transactions);
            if (data.budgets) Storage.saveBudgets(data.budgets);
            if (data.goals) Storage.saveGoals(data.goals);
            if (data.subscriptions) Storage.saveSubs(data.subscriptions);
            return true;
        } catch { return false; }
    },

    clearAll: () => {
        Object.values(KEYS).forEach(k => {
            if (k !== KEYS.THEME) localStorage.removeItem(k);
        });
    },

    // ── Sample Data Generator ─────────────────────────
    generateSampleData: () => {
        const expCats = Utils.getCategories('expense');
        const incCats = Utils.getCategories('income');
        const modes = ['UPI', 'UPI', 'UPI', 'Cash', 'Credit Card', 'Debit Card', 'BNPL'];
        const friends = ['Rahul', 'Priya', 'Amit', 'Neha', 'Kabir', 'Simran'];

        const expTitles = {
            'Food': ['Swiggy dinner 🍕', 'Zomato late night', 'McDonalds McSaver', 'Blinkit groceries', 'College canteen', 'CCD coffee', 'Starbucks with friends', 'Dominos pizza night'],
            'Rent': ['PG Rent July', 'Hostel fee', 'Flat deposit', 'Room booking'],
            'Travel': ['Uber to college', 'Rapido bike ride', 'Metro card recharge', 'Ola outstation', 'Auto to market'],
            'Shopping': ['Amazon impulse buy', 'Myntra sale haul', 'H&M tees', 'Sneakers Nike', 'Books and stationery'],
            'Education': ['Semester fees', 'Udemy Python course', 'Books from Flipkart', 'Photocopies', 'Library fine'],
            'Entertainment': ['PVR Avengers', 'Netflix subscription', 'Spotify Premium', 'College Fest entry', 'IPL match tickets'],
            'Medical': ['Pharmacy meds', 'Doctor consultation', 'Apollo pharmacy'],
            'Utilities': ['Jio recharge', 'WiFi bill', 'Electricity (shared)'],
            'Groceries': ['Zepto instant delivery', 'Big Basket weekly', 'Local kirana'],
            'Subscriptions': ['Amazon Prime', 'GitHub Student', 'YouTube Premium'],
            'Bills': ['Phone bill', 'DTH recharge'],
            'Other': ['Lost bet payment 😅', 'Birthday gift Rahul', 'Random impulse']
        };
        const incTitles = {
            'Salary': ['Internship stipend'], 'Freelance': ['Upwork React project', 'Logo design Fiverr', 'Assignment help'],
            'Investment': ['Zerodha profit', 'Mutual fund return'], 'Business': ['Sold old laptop', 'Sold books'],
            'Gift': ['Pocket money from Dad', 'Birthday cash gift', 'Rakhi money'], 'Other': ['Cashback reward', 'Scratch card win']
        };

        const transactions = [];
        const endDate = new Date();
        const startDate = new Date(); startDate.setMonth(startDate.getMonth() - 5);

        for (let i = 0; i < 600; i++) {
            const type = Math.random() > 0.18 ? 'expense' : 'income';
            let category, title, amount;
            let isSplit = false, splitFriend = null, splitAmount = null, splitSettled = false;

            if (type === 'expense') {
                category = expCats[Math.floor(Math.random() * expCats.length)];
                const opts = expTitles[category] || [category];
                title = opts[Math.floor(Math.random() * opts.length)];
                const r = Math.random();
                if (r < 0.55) amount = Math.floor(Math.random() * 350) + 50;
                else if (r < 0.88) amount = Math.floor(Math.random() * 1200) + 350;
                else amount = Math.floor(Math.random() * 9000) + 1500;

                if (['Food','Travel','Entertainment'].includes(category) && Math.random() > 0.8) {
                    isSplit = true;
                    splitFriend = friends[Math.floor(Math.random() * friends.length)];
                    splitAmount = Math.round(amount / 2);
                }
            } else {
                category = incCats[Math.floor(Math.random() * incCats.length)];
                const opts = incTitles[category] || [category];
                title = opts[Math.floor(Math.random() * opts.length)];
                if (category === 'Gift') amount = Math.floor(Math.random() * 3000) + 500;
                else amount = Math.floor(Math.random() * 20000) + 3000;
            }

            const dateMs = startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime());
            const date = new Date(dateMs);

            if (isSplit && (endDate - date) > 5*86400000 && Math.random() > 0.35) splitSettled = true;

            transactions.push({
                id: Utils.generateId(),
                title, amount, category, type,
                date: Utils.formatDateForInput(date),
                mode: modes[Math.floor(Math.random() * modes.length)],
                notes: isSplit ? `Split with ${splitFriend}` : '',
                isSplit, splitFriend, splitAmount, splitSettled,
                createdAt: date.toISOString()
            });
        }
        transactions.sort((a,b) => new Date(b.date) - new Date(a.date));
        Storage.saveTransactions(transactions);

        // Sample budgets
        Storage.saveBudgets({
            global: 18000,
            categories: { Food: 4500, Travel: 2000, Entertainment: 1800, Shopping: 3000, Education: 2500 }
        });

        // Sample goals
        Storage.saveGoals([
            { id: Utils.generateId(), name: 'Goa Trip ✈️', icon: '🏖️', target: 25000, saved: 8500, deadline: '2026-12-15', createdAt: new Date().toISOString() },
            { id: Utils.generateId(), name: 'New Laptop 💻', icon: '💻', target: 65000, saved: 22000, deadline: '2027-03-01', createdAt: new Date().toISOString() },
            { id: Utils.generateId(), name: 'Emergency Fund', icon: '🛡️', target: 50000, saved: 15000, deadline: '', createdAt: new Date().toISOString() },
        ]);

        // Sample subscriptions
        Storage.saveSubs([
            { id: Utils.generateId(), name: 'Netflix', icon: '🎬', amount: 649, category: 'Streaming', dueDay: 5 },
            { id: Utils.generateId(), name: 'Spotify Premium', icon: '🎵', amount: 119, category: 'Music', dueDay: 12 },
            { id: Utils.generateId(), name: 'Amazon Prime', icon: '📦', amount: 179, category: 'Streaming', dueDay: 20 },
            { id: Utils.generateId(), name: 'Gym Membership', icon: '💪', amount: 1200, category: 'Gym', dueDay: 1 },
            { id: Utils.generateId(), name: 'GitHub Student', icon: '🐱', amount: 0, category: 'Software', dueDay: 15 },
            { id: Utils.generateId(), name: 'YouTube Premium', icon: '▶️', amount: 189, category: 'Streaming', dueDay: 8 },
        ]);
    }
};
