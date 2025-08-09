# 🛒 React Shopping Cart App

A modern shopping cart web application built with **React** and **Tailwind CSS**, featuring a fast search experience, modals, and responsive design.

## 📂 Project Structure

```
.
├── App.jsx               # Main application component
├── App.css               # Global styles
├── index.css             # Tailwind base styles
├── main.jsx              # Entry point
├── components/           # UI components
│   ├── CartView.jsx
│   ├── ItemCard.jsx
│   ├── ItemList.jsx
│   ├── MobilePopup.jsx
│   ├── Modal.jsx
│   ├── OrderPopup.jsx
│   ├── SearchBar.jsx
│   └── SearchHeader.jsx
└── utils/                # Helper utilities
    ├── jsonLoader.js
    └── orderUtils.js
```

## 🚀 Features

- **Product Search** – Fast fuzzy search using Fuse.js  
- **Shopping Cart** – Add, remove, and view items in cart  
- **Modals & Popups** – Smooth UI for mobile and desktop views  
- **Responsive Layout** – Tailwind CSS for consistent styling  
- **Order Popup** – Quick checkout preview  
- **Local Storage Support** – Data persistence using LocalForage

## 🛠 Tech Stack

- [React](https://react.dev/) – Frontend UI library  
- [Vite](https://vitejs.dev/) – Fast build tool  
- [Tailwind CSS](https://tailwindcss.com/) – Utility-first CSS framework  
- [Fuse.js](https://fusejs.io/) – Fuzzy search  
- [Lodash](https://lodash.com/) – Utility functions  
- [LocalForage](https://localforage.github.io/localForage/) – IndexedDB/localStorage wrapper

## 📦 Installation

1. **Clone the repository**  
   ```bash
   git clone https://github.com/yourusername/yourproject.git
   cd yourproject
   ```

2. **Install dependencies**  
   ```bash
   npm install
   ```

3. **Start the development server**  
   ```bash
   npm run dev
   ```

4. **Build for production**  
   ```bash
   npm run build
   ```

## 📸 Screenshots

*(Add screenshots of key UI parts here)*

## 📜 License

This project is licensed under the **MIT License** – feel free to use and modify.
