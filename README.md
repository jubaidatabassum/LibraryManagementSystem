# 📚 BookNest - Online Library Management System

A modern, responsive, and feature-rich **Online Library Management System** built completely using **Vanilla JavaScript, HTML, and Custom CSS**. This is a frontend-only project that uses **LocalStorage** as its database to persist data across browser sessions.

![BookNest Banner](https://img.shields.io/badge/Project-BookNest-brightgreen?style=for-the-badge)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)


## 🚀 Live Demo
🔗 **[Click Here to View the Live Project](https://jubaidatabassum.github.io/LibraryManagementSystem/)** 

### 🔐 Demo Credentials
- **Admin Login:** `admin` / `admin123`
- **Student Login:** Register a new student to test the borrowing features.

## ✨ Key Features

### 🧑‍💼 Admin Panel
- **Dashboard Overview:** Live statistics of total books, available copies, registered students, and active loans.
- **Add/Delete Books:** Admin can add new books with validation (prevents duplicate Book IDs) and delete books (blocked if the book is currently borrowed).
- **Student Directory:** View all registered students and their active loan counts.
- **Borrowed & Returned History:** Track exactly which student borrowed which book and when.

### 🎓 Student Panel
- **Secure Registration & Login:** Students can create accounts with a password strength meter.
- **Browse Library:** Search books by ID, Title, Author, or Category.
- **Borrow System:** Real-time availability check. Students cannot borrow the same book twice simultaneously.
- **My Books:** Track currently borrowed books with smart **Due Date Badges**.

### 🔥 Real-World Library Features (Unique Selling Point)
- **Fine Calculation System:** Auto-calculates a fine of **৳5/day** if a book is kept past the due date.
- **Smart Due Date Tracking:** Uses a green/yellow/red badge system (e.g., "12 days left", "Due today", "3 days late").
- **Borrow Limit Rule:** Prevents a student from borrowing more than 3 books at a time.
- **Book Renewal:** Students can renew a book once (extends due date by 14 days) to avoid fines.
- **Fine Waiver (Admin):** Admin has the authority to waive (forgive) a student's overdue fine.


## 🧠 Technical Implementation (How it works)

- **Frontend Routing:** Implemented a Single Page Application (SPA) feel using Vanilla JS `innerHTML` injection. No page reloads.
- **Event Delegation:** Instead of adding multiple event listeners, a single `click` and `submit` listener is used on the document body to handle all dynamic actions (borrowing, returning, deleting).
- **LocalStorage Database:** Custom `readData()` and `saveData()` functions act as an ORM to handle JSON parsing and stringifying for the browser's LocalStorage.
- **Modular Architecture:** The code is separated into pure UI rendering functions (returning HTML strings) and business logic functions (manipulating data), keeping the codebase clean and scalable.
- **Security:** Includes an `escapeHTML()` function to prevent XSS (Cross-Site Scripting) attacks via input fields.

## 📁 Folder Structure
```text
BookNest/
│
├── index.html       # Main entry point and layout
├── style.css        # Custom styling, responsive design, and animations
├── script.js        # Core logic, state management, and LocalStorage DB
└── README.md        # Project documentation
