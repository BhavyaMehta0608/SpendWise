# SpendWise – College Edition 🎓

[SpendWise Preview](https://comfy-douhua-b93631.netlify.app/)

SpendWise is a premium, client-side personal finance dashboard tailored specifically for college students. With a stunning glassmorphism UI, advanced budgeting features, and split-bill tracking, managing college expenses has never been easier or looked better.

## ✨ New in Version (College Edition)

- **Budgeting System**: Set a global monthly budget and specific category limits. Track your spending via dynamic progress bars and a beautiful Budget vs Actual Radar Chart.
- **Split Bills Tracker**: Easily track expenses split with friends (e.g., cab rides, Swiggy orders). Log "Who owes me" and mark them as settled when paid.
- **Premium Glassmorphism UI**: Completely overhauled aesthetics featuring vibrant gradients, glowing effects, deep dark mode, smooth hover tilts, and modern typography (`Plus Jakarta Sans`).
- **Student-Focused Demo Data**: Click one button to populate the dashboard with 500+ realistic college transactions (Zomato, PVR, College Fest, Uber, Semester Fees).

## 🚀 Core Features

- **Zero-Backend Architecture**: Runs entirely in the browser using the Local Storage API. Data persists after page refresh.
- **Interactive Visualizations**: 5 dynamic Chart.js charts including the new Budget Radar chart.
- **Advanced Filtering & Search**: Filter by category, date range, transaction type, or payment mode, and search globally.
- **Live Analytics**: Real-time updates of highest expense, top spending category, and daily averages without page reloads.
- **Data Portability**: Export your transactions to JSON and import backups easily.

## 💻 Tech Stack

- **HTML5**: Semantic structure and forms.
- **CSS3**: Vanilla CSS with custom properties, vibrant palettes, glowing effects, and glassmorphism styling. No CSS frameworks used.
- **JavaScript (ES6)**: Vanilla JS utilizing modular patterns, DOM manipulation, and event handling.
- **Chart.js**: For rendering dynamic and responsive data visualizations.
- **Local Storage API**: For persistent client-side state management.

## 📁 Project Structure

```
SpendWise/
├── index.html       # Main application layout and UI
├── css/
│   └── style.css    # Stylesheets (variables, layout, themes)
├── js/
│   ├── app.js       # Main initialization and event binding
│   ├── charts.js    # Chart.js visualization logic
│   ├── storage.js   # Local Storage API interactions & data generation
│   ├── ui.js        # DOM manipulation and UI state management
│   └── utils.js     # Helper functions for formatting and ID generation
└── README.md        # Project documentation
```

## 🛠️ Installation & Setup

1. **Clone or Download** this repository to your local machine.
2. Navigate to the `SpendWise` folder.
3. Open `index.html` in any modern web browser (Chrome, Firefox, Safari, Edge).
4. *No server, `npm install`, or database setup is required.*

## 💾 How Local Storage Works in SpendWise

SpendWise utilizes the Web Storage API (`window.localStorage`) to save user data directly within the web browser. 
- All transaction and split bill data is serialized into a JSON string and saved under the `spendwise_transactions` key.
- Budgeting limits are saved under the `spendwise_budgets` key.
- Theme preferences are saved under `spendwise_theme`.
- When the application loads, it deserializes the data to populate the UI and charts instantly.

## 📄 License

This project is open-source and available for educational and personal use.
