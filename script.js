/* ============================================================
   BookNest – Online Library Management System
   Full clean script · With Fine + Due Tracking
   ============================================================ */

const DB = {
  books: "booknest_books_v2",
  students: "booknest_students_v2",
  records: "booknest_records_v2",
  session: "booknest_session_v2"
};

const FINE_PER_DAY = 5;
const BORROW_DAYS = 14;

const sampleBooks = [
  { id: "B001", title: "Atomic Habits", author: "James Clear", category: "Self Development", quantity: 5, available: 5 },
  { id: "B002", title: "Clean Code", author: "Robert C. Martin", category: "Programming", quantity: 4, available: 4 },
  { id: "B003", title: "The Alchemist", author: "Paulo Coelho", category: "Fiction", quantity: 6, available: 6 },
  { id: "B004", title: "Introduction to Algorithms", author: "Thomas H. Cormen", category: "Computer Science", quantity: 3, available: 3 },
  { id: "B005", title: "Deep Work", author: "Cal Newport", category: "Productivity", quantity: 4, available: 4 }
];

/* ---------- Helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

function readData(k, f) {
  try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : f; }
  catch (e) { return f; }
}
function saveData(k, v) {
  try { localStorage.setItem(k, JSON.stringify(v)); return true; }
  catch (e) { toast("Could not save data.", true); return false; }
}

function getBooks() { return readData(DB.books, null) || initializeBooks(); }
function initializeBooks() {
  saveData(DB.books, sampleBooks);
  return sampleBooks.map(b => ({ ...b }));
}
function getStudents() { return readData(DB.students, []); }
function getRecords() { return readData(DB.records, []); }
function getSession() { return readData(DB.session, null); }
function setSession(s) { saveData(DB.session, s); }
function clearSession() { localStorage.removeItem(DB.session); }

function escapeHTML(v) {
  return String(v ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[c]);
}

function toast(msg, isError = false) {
  const el = $("#toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.toggle("error", isError);
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 3000);
}

function debounce(fn, wait = 180) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function dateAfterDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function formatDate(dt) {
  if (!dt) return "—";
  const p = new Date(`${dt}T00:00:00`);
  if (Number.isNaN(p.getTime())) return escapeHTML(dt);
  return p.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function totalCopies() { return getBooks().reduce((s, b) => s + Number(b.quantity || 0), 0); }
function activeRecords() { return getRecords().filter(r => !r.returnDate); }
function returnedRecords() { return getRecords().filter(r => Boolean(r.returnDate)); }
function overdueRecords() {
  const t = today();
  return activeRecords().filter(r => r.dueDate < t);
}

function getStudent(id) { return getStudents().find(s => s.id.toLowerCase() === id.toLowerCase()); }
function getCurrentStudent() {
  const s = getSession();
  if (!s || s.role !== "student") return null;
  return getStudent(s.studentId);
}

/* ---------- FINE + DUE HELPERS ---------- */
function daysOverdue(dueDate) {
  if (!dueDate) return 0;
  const todayMs = new Date().setHours(0, 0, 0, 0);
  const dueMs = new Date(`${dueDate}T00:00:00`).getTime();
  const diff = Math.floor((todayMs - dueMs) / 86400000);
  return diff > 0 ? diff : 0;
}
function daysRemaining(dueDate) {
  if (!dueDate) return 0;
  const todayMs = new Date().setHours(0, 0, 0, 0);
  const dueMs = new Date(`${dueDate}T00:00:00`).getTime();
  return Math.floor((dueMs - todayMs) / 86400000);
}
function fineFor(record) {
  if (!record) return 0;
  if (record.returnDate) return 0;
  return daysOverdue(record.dueDate) * FINE_PER_DAY;
}
function studentFine(studentId) {
  return activeRecords()
    .filter(r => r.studentId === studentId)
    .reduce((s, r) => s + fineFor(r), 0);
}

function dueBadge(record) {
  if (record.returnDate) return `<span class="due-badge ok"><i class="fa-solid fa-check"></i> Returned</span>`;
  const rem = daysRemaining(record.dueDate);
  const late = daysOverdue(record.dueDate);
  if (late > 0) return `<span class="due-badge overdue"><i class="fa-solid fa-triangle-exclamation"></i> ${late} day${late > 1 ? "s" : ""} late</span>`;
  if (rem === 0) return `<span class="due-badge urgent"><i class="fa-solid fa-clock"></i> Due today</span>`;
  if (rem <= 3) return `<span class="due-badge warn"><i class="fa-solid fa-hourglass-half"></i> ${rem} day${rem > 1 ? "s" : ""} left</span>`;
  return `<span class="due-badge ok"><i class="fa-solid fa-calendar-check"></i> ${rem} days left</span>`;
}
function fineBadge(record) {
  const fine = fineFor(record);
  if (fine === 0) return `<span class="fine-amount zero"><i class="fa-solid fa-check"></i> ৳0</span>`;
  return `<span class="fine-amount"><i class="fa-solid fa-coins"></i> ৳${fine}</span>`;
}

function studentFineBanner() {
  const student = getCurrentStudent();
  if (!student) return "";
  const overdue = activeRecords().filter(r => r.studentId === student.id && fineFor(r) > 0);
  const totalFine = studentFine(student.id);
  if (totalFine === 0) return "";
  const totalDays = overdue.reduce((s, r) => s + daysOverdue(r.dueDate), 0);
  return `
    <div class="fine-banner">
      <div class="fine-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
      <div class="fine-banner-info">
        <h3>Pending fine: ${overdue.length} overdue book${overdue.length > 1 ? "s" : ""}</h3>
        <p>৳${FINE_PER_DAY}/day · Total ${totalDays} day${totalDays > 1 ? "s" : ""} late · Return soon to stop the fine</p>
      </div>
      <div class="fine-total">৳${totalFine}</div>
    </div>
  `;
}
function adminFineBanner() {
  const overdue = overdueRecords();
  if (!overdue.length) return "";
  const totalFine = overdue.reduce((s, r) => s + fineFor(r), 0);
  return `
    <div class="fine-banner">
      <div class="fine-icon"><i class="fa-solid fa-coins"></i></div>
      <div class="fine-banner-info">
        <h3>${overdue.length} overdue loan${overdue.length > 1 ? "s" : ""} pending</h3>
        <p>Total fine across library · ৳${FINE_PER_DAY}/day · Auto-calculated</p>
      </div>
      <div class="fine-total">৳${totalFine}</div>
    </div>
  `;
}

/* ---------- BRAND/LOGO ---------- */
function brand() {
  return `
    <a class="brand" href="#" data-action="home">
      <span class="brand-logo">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="3" y="16" width="18" height="3" rx="1" fill="currentColor" opacity="0.85"/>
          <rect x="4" y="12" width="16" height="3" rx="1" fill="currentColor" opacity="0.65"/>
          <rect x="5" y="8" width="14" height="3" rx="1" fill="currentColor" opacity="0.45"/>
          <path d="M6 8 L12 5 L18 8 L12 11 Z" fill="currentColor"/>
          <path d="M12 2 L20 5 L12 8 L4 5 Z" fill="currentColor"/>
          <path d="M17 6.5 V10 C17 11.1 14.8 12 12 12 C9.2 12 7 11.1 7 10 V6.5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
        </svg>
      </span>
      <span class="brand-text">
        <span class="brand-name">Book<span>Nest</span></span>
        <span class="brand-tag">Library System</span>
      </span>
    </a>
  `;
}

/* ============================================================
   HOME PAGE
   ============================================================ */
function homePage() {
  const books = getBooks();
  const students = getStudents();
  return `
    <header class="container topbar">
      ${brand()}
      <div class="top-links">
        <button type="button" class="btn btn-light" data-action="student-login"><i class="fa-solid fa-user-graduate"></i> Student Login</button>
        <button type="button" class="btn btn-primary" data-action="admin-login"><i class="fa-solid fa-shield-halved"></i> Admin Login</button>
      </div>
    </header>
    <main class="container">
      <section class="hero">
        <div class="hero-panel">
          <div class="eyebrow"><i class="fa-solid fa-book-open"></i>Your campus library, reimagined</div>
          <h1 class="hero-title">A little reading.<br>A <span>lot of growth.</span></h1>
          <p class="hero-description">Discover books, borrow your next favourite read, and keep your library journey organised—all in one simple place.</p>
          <div class="hero-actions">
            <button type="button" class="btn btn-primary" data-action="student-login"><i class="fa-solid fa-book-open"></i> Explore Library</button>
            <button type="button" class="btn btn-light" data-action="admin-login"><i class="fa-solid fa-arrow-right-to-bracket"></i> Admin Portal</button>
          </div>
          <div class="hero-note"><i class="fa-solid fa-circle-check"></i>Easy borrowing · Simple tracking · Student friendly</div>
        </div>
        <div class="hero-art">
          <div class="art-circle"></div>
          <div class="book-stack">
            <div class="book-illustration">GROW DAILY</div>
            <div class="book-illustration">YOUR NEXT CHAPTER</div>
            <div class="book-illustration">STAY CURIOUS</div>
          </div>
        </div>
      </section>
      <section class="home-stats">
        <div class="home-stat"><div class="home-stat-icon"><i class="fa-solid fa-book"></i></div><div><strong>${books.length}</strong><span>Book titles in the library</span></div></div>
        <div class="home-stat"><div class="home-stat-icon"><i class="fa-solid fa-layer-group"></i></div><div><strong>${totalCopies()}</strong><span>Total book copies</span></div></div>
        <div class="home-stat"><div class="home-stat-icon"><i class="fa-solid fa-users"></i></div><div><strong>${students.length}</strong><span>Registered students</span></div></div>
      </section>
      <section class="home-features">
        <div class="feature-card"><div class="feature-icon"><i class="fa-solid fa-bolt"></i></div><h3>Borrow in seconds</h3><p>Find a book and borrow it instantly. No queues, no paperwork—just reading.</p></div>
        <div class="feature-card"><div class="feature-icon"><i class="fa-solid fa-clock"></i></div><h3>Track your loans</h3><p>See what you've borrowed and when it's due. Everything stays in one place.</p></div>
        <div class="feature-card"><div class="feature-icon"><i class="fa-solid fa-shield-halved"></i></div><h3>Stay organised</h3><p>Your borrowing history is safely stored in your browser.</p></div>
      </section>
    </main>
    <footer class="container home-footer">BookNest Library System · Built for readers and learners</footer>
  `;
}

/* ============================================================
   AUTH PAGES (Auto-fill OFF kora hoyeche)
   ============================================================ */
function authPage(type) {
  const isAdmin = type === "admin";
  const isRegister = type === "register";
  const title = isAdmin ? "Welcome back, Admin" : isRegister ? "Join BookNest" : "Welcome back, Reader";
  const subtitle = isAdmin ? "Sign in to manage your library." : isRegister ? "Create your student library account." : "Sign in with your student ID to continue.";
  let form = "";

  if (isAdmin) {
    form = `
      <form id="admin-login-form" class="form-stack" autocomplete="off">
        <div class="form-group"><label for="admin-username">Username</label>
          <div class="input-wrap"><i class="fa-solid fa-user"></i>
            <input class="form-control" id="admin-username" name="username" placeholder="Enter admin username" autocomplete="off" required>
          </div>
        </div>
        <div class="form-group"><label for="admin-password">Password</label>
          <div class="input-wrap"><i class="fa-solid fa-lock"></i>
            <input class="form-control" id="admin-password" name="password" type="password" placeholder="Enter password" autocomplete="new-password" required>
            <button type="button" class="toggle-pass" data-toggle-pass="admin-password" aria-label="Show password"><i class="fa-solid fa-eye"></i></button>
          </div>
        </div>
        <button class="btn btn-primary full-width" type="submit">Sign in <i class="fa-solid fa-arrow-right"></i></button>
      </form>
      <div class="demo-note"><i class="fa-solid fa-circle-info"></i> Demo login: <strong>admin</strong> / <strong>admin123</strong></div>
    `;
  } else if (isRegister) {
    form = `
      <form id="student-register-form" class="form-stack" autocomplete="off">
        <div class="form-group"><label for="register-id">Student ID</label>
          <div class="input-wrap"><i class="fa-solid fa-id-card"></i>
            <input class="form-control" id="register-id" name="studentId" placeholder="e.g. CSE24001" autocomplete="off" required maxlength="30">
          </div>
        </div>
        <div class="form-group"><label for="register-name">Full name</label>
          <div class="input-wrap"><i class="fa-solid fa-user"></i>
            <input class="form-control" id="register-name" name="name" placeholder="Enter your full name" autocomplete="off" required maxlength="80">
          </div>
        </div>
        <div class="form-group"><label for="register-department">Department</label>
          <div class="input-wrap"><i class="fa-solid fa-building-columns"></i>
            <select class="form-control" id="register-department" name="department" required>
              <option value="">Select department</option>
              <option value="CSE">CSE</option>
              <option value="EEE">EEE</option>
              <option value="ETE">ETE</option>
              <option value="BBA">BBA</option>
              <option value="English">English</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
        <div class="form-group"><label for="register-password">Password</label>
          <div class="input-wrap"><i class="fa-solid fa-lock"></i>
            <input class="form-control" id="register-password" name="password" type="password" placeholder="Create a password" minlength="4" maxlength="60" autocomplete="new-password" required>
            <button type="button" class="toggle-pass" data-toggle-pass="register-password" aria-label="Show password"><i class="fa-solid fa-eye"></i></button>
          </div>
          <div class="password-strength" id="strength-bars">
            <div class="bar"></div><div class="bar"></div><div class="bar"></div><div class="bar"></div>
          </div>
          <div class="strength-label" id="strength-label">Minimum 4 characters</div>
        </div>
        <button class="btn btn-primary full-width" type="submit">Create account <i class="fa-solid fa-arrow-right"></i></button>
      </form>
      <div class="auth-bottom">Already registered? <button type="button" class="text-link" data-action="student-login">Sign in</button></div>
    `;
  } else {
    form = `
      <form id="student-login-form" class="form-stack" autocomplete="off">
        <div class="form-group"><label for="student-id">Student ID</label>
          <div class="input-wrap"><i class="fa-solid fa-id-card"></i>
            <input class="form-control" id="student-id" name="studentId" placeholder="Enter your registered student ID" autocomplete="off" required maxlength="30">
          </div>
        </div>
        <div class="form-group"><label for="student-password">Password</label>
          <div class="input-wrap"><i class="fa-solid fa-lock"></i>
            <input class="form-control" id="student-password" name="password" type="password" placeholder="Enter your password" autocomplete="new-password" required maxlength="60">
            <button type="button" class="toggle-pass" data-toggle-pass="student-password" aria-label="Show password"><i class="fa-solid fa-eye"></i></button>
          </div>
        </div>
        <button class="btn btn-primary full-width" type="submit">Continue <i class="fa-solid fa-arrow-right"></i></button>
      </form>
      <div class="auth-bottom">New to BookNest? <button type="button" class="text-link" data-action="register">Create an account</button></div>
    `;
  }

  return `
    <main class="auth-page">
      <section class="auth-side">
        ${brand()}
        <h1>Your next favourite book is waiting.</h1>
        <p>Keep your reading journey simple. Explore the collection, borrow books, and check your records from one place.</p>
      </section>
      <section class="auth-form-side">
        <div class="auth-card">
          <button type="button" class="auth-back" data-action="home"><i class="fa-solid fa-arrow-left"></i> Back to home</button>
          <h2>${title}</h2>
          <p class="muted">${subtitle}</p>
          ${form}
        </div>
      </section>
    </main>
  `;
}

/* ============================================================
   SIDEBAR / NAV
   ============================================================ */
function adminNavItems() {
  return [
    ["overview", "fa-chart-pie", "Overview"],
    ["add-book", "fa-circle-plus", "Add Book"],
    ["books", "fa-book-open", "Show All Books"],
    ["delete-book", "fa-trash-can", "Delete Book"],
    ["students", "fa-users", "Student List"],
    ["borrowed", "fa-book-bookmark", "Borrowed Books"],
    ["returned", "fa-rotate-left", "Returned Books"]
  ];
}
function studentNavItems() {
  return [
    ["overview", "fa-house", "Overview"],
    ["browse", "fa-book-open", "Browse Books"],
    ["my-books", "fa-book-bookmark", "My Borrowed Books"],
    ["my-returned", "fa-rotate-left", "My Returned Books"]
  ];
}
function sidebar(role, active) {
  const isAdmin = role === "admin";
  const items = isAdmin ? adminNavItems() : studentNavItems();
  const overdue = overdueRecords();
  const student = !isAdmin ? getCurrentStudent() : null;
  const myOverdue = student ? overdue.filter(r => r.studentId === student.id).length : 0;

  return `
    <aside class="sidebar">
      ${brand()}
      <div>
        <div class="sidebar-label">Workspace</div>
        <nav class="sidebar-nav">
          ${items.map(([id, icon, label]) => {
            const showBadge = id === "my-books" && myOverdue > 0;
            return `
              <button type="button" class="nav-btn ${active === id ? "active" : ""}" data-action="navigate" data-page="${id}">
                <i class="fa-solid ${icon}"></i>
                <span class="nav-label">${label}</span>
                ${showBadge ? `<span class="nav-badge">${myOverdue}</span>` : ""}
              </button>
            `;
          }).join("")}
        </nav>
      </div>
      <div class="sidebar-bottom">
        <button type="button" class="nav-btn" data-action="logout">
          <i class="fa-solid fa-arrow-right-from-bracket"></i>
          <span class="nav-label">Sign Out</span>
        </button>
      </div>
    </aside>
  `;
}

/* ============================================================
   PAGE TITLES + STATS
   ============================================================ */
function pageTitle(role, page) {
  const titles = {
    overview: ["Dashboard Overview", "Here's what's happening in your library."],
    "add-book": ["Add a New Book", "Add a title to your library collection."],
    books: ["All Books", "Manage and explore the full book collection."],
    "delete-book": ["Delete Books", "Remove books that are no longer needed."],
    students: ["Student Directory", "View all registered library members."],
    borrowed: ["Borrowed Books", "Track books currently checked out."],
    returned: ["Returned Books", "Review completed book returns."],
    browse: ["Browse Library", "Search for your next book to read."],
    "my-books": ["My Borrowed Books", "Check your active loans and due dates."],
    "my-returned": ["My Returned Books", "Your personal borrowing history."]
  };
  return titles[page] || titles.overview;
}

function statCard(label, value, icon, note) {
  return `
    <div class="stat-card">
      <div class="stat-top"><span>${label}</span><span class="stat-icon"><i class="fa-solid ${icon}"></i></span></div>
      <div class="stat-number">${value}</div>
      <div class="stat-foot">${note}</div>
    </div>
  `;
}
function dashboardStats(role) {
  const books = getBooks();
  const active = activeRecords();
  const returned = returnedRecords();
  const overdue = overdueRecords();

  if (role === "admin") {
    return `
      <section class="stats-grid">
        ${statCard("Book titles", books.length, "fa-book", `${new Set(books.map(b => b.category)).size} categories`)}
        ${statCard("Total copies", totalCopies(), "fa-layer-group", "Copies across all titles")}
        ${statCard("Active loans", active.length, "fa-book-bookmark", overdue.length ? `${overdue.length} overdue` : "Books currently borrowed")}
        ${statCard("Registered students", getStudents().length, "fa-users", "Library members")}
      </section>
    `;
  }
  const student = getCurrentStudent();
  const mine = active.filter(r => r.studentId === student.id);
  const returnedMine = returned.filter(r => r.studentId === student.id);
  const overdueMine = overdue.filter(r => r.studentId === student.id);
  const totalFine = studentFine(student.id);
  return `
    <section class="stats-grid">
      ${statCard("Available titles", books.filter(b => b.available > 0).length, "fa-book-open", "Titles ready to borrow")}
      ${statCard("Currently borrowed", mine.length, "fa-book-bookmark", overdueMine.length ? `${overdueMine.length} overdue` : "Your active loans")}
      ${statCard("Returned books", returnedMine.length, "fa-rotate-left", "Your completed returns")}
      ${statCard("Pending fine", "৳" + totalFine, "fa-coins", totalFine > 0 ? "Pay on return" : "No fine")}
    </section>
  `;
}

/* ============================================================
   TABLE HELPERS
   ============================================================ */
function panelHeading(title, subtitle, right = "") {
  return `<div class="panel-heading"><div><h2>${title}</h2><p>${subtitle}</p></div>${right}</div>`;
}
function bookIcon(i) {
  const c = ["", "orange", "purple", "blue"];
  return `mini-book ${c[i % c.length]}`;
}
function bookStatus(book) {
  return Number(book.available) > 0
    ? '<span class="status available">Available</span>'
    : '<span class="status unavailable">Out of stock</span>';
}
function emptyState(title, desc, icon = "fa-book-open") {
  return `<div class="empty-state"><i class="fa-solid ${icon}"></i><h3>${escapeHTML(title)}</h3><p>${escapeHTML(desc)}</p></div>`;
}
function buttonEl(label, action, classes = "btn btn-primary", extra = "") {
  return `<button type="button" class="${classes}" data-action="${action}" ${extra}>${label}</button>`;
}

function bookTable(books, mode = "view") {
  if (!books.length) return emptyState("No books found", "Try another search or add a new book.", "fa-book-open");
  return `
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr><th>Book</th><th>Book ID</th><th>Category</th><th>Copies</th><th>Status</th><th>Action</th></tr>
        </thead>
        <tbody>
          ${books.map((book, index) => {
            let actionCell = '<span class="muted">—</span>';
            if (mode === "borrow") {
              actionCell = buttonEl("Borrow", "borrow", "btn btn-primary btn-small", `data-book-id="${escapeHTML(book.id)}" ${book.available < 1 ? "disabled" : ""}`);
            } else if (mode === "delete") {
              actionCell = buttonEl('<i class="fa-solid fa-trash"></i> Delete', "delete-book", "btn btn-danger btn-small", `data-book-id="${escapeHTML(book.id)}"`);
            }
            return `
              <tr>
                <td>
                  <div class="book-name-cell">
                    <div class="${bookIcon(index)}"><i class="fa-solid fa-book"></i></div>
                    <div><strong>${escapeHTML(book.title)}</strong><span class="table-sub">${escapeHTML(book.author)}</span></div>
                  </div>
                </td>
                <td>${escapeHTML(book.id)}</td>
                <td>${escapeHTML(book.category)}</td>
                <td>${book.available} / ${book.quantity}</td>
                <td>${bookStatus(book)}</td>
                <td>${actionCell}</td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function recordsTable(records, mode = "admin-borrowed") {
  if (!records.length) {
    return emptyState(
      "No records yet",
      mode.includes("returned") ? "Returned books will appear here." : "Borrowed books will appear here.",
      "fa-book-open"
    );
  }
  const isReturned = mode.includes("returned");
  const isStudent = mode.startsWith("student-") || mode === "myreturn";

  return `
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Book</th>
            ${isStudent ? "" : "<th>Student</th>"}
            <th>Borrowed on</th>
            <th>Due date</th>
            ${isReturned ? "<th>Returned on</th>" : "<th>Due status</th><th>Fine</th><th>Action</th>"}
          </tr>
        </thead>
        <tbody>
          ${records.map(record => {
            const book = getBooks().find(i => i.id === record.bookId);
            const student = getStudent(record.studentId);
            return `
              <tr>
                <td><strong>${escapeHTML(record.bookTitle || book?.title || "Deleted book")}</strong><span class="table-sub">${escapeHTML(record.bookId)}</span></td>
                ${isStudent ? "" : `<td><strong>${escapeHTML(student?.name || "Unknown student")}</strong><span class="table-sub">${escapeHTML(record.studentId)}</span></td>`}
                <td>${formatDate(record.borrowDate)}</td>
                <td>${formatDate(record.dueDate)}</td>
                ${isReturned
                  ? `<td>${formatDate(record.returnDate)}</td>`
                  : `<td>${dueBadge(record)}</td>
                     <td>${fineBadge(record)}</td>
                     <td>${mode === "myreturn" ? buttonEl("Return", "return-book", "btn btn-primary btn-small", `data-record-id="${escapeHTML(record.id)}"`) : '<span class="muted">—</span>'}</td>`}
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function studentTable(students) {
  if (!students.length) return emptyState("No students yet", "Registered students will appear here.", "fa-users");
  return `
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Student</th><th>Student ID</th><th>Department</th><th>Active loans</th></tr></thead>
        <tbody>
          ${students.map(s => `
            <tr>
              <td><strong>${escapeHTML(s.name)}</strong></td>
              <td>${escapeHTML(s.id)}</td>
              <td>${escapeHTML(s.department)}</td>
              <td>${activeRecords().filter(r => r.studentId === s.id).length}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

/* ============================================================
   ADD BOOK FORM
   ============================================================ */
function addBookForm() {
  return `
    <section class="panel">
      ${panelHeading("Book information", "Fill in the details below to add a book.")}
      <form id="add-book-form">
        <div class="form-grid">
          <div class="form-group"><label for="book-id">Book ID *</label>
            <input class="form-control" id="book-id" name="bookId" placeholder="e.g. B006" required maxlength="30"></div>
          <div class="form-group"><label for="book-title">Book title *</label>
            <input class="form-control" id="book-title" name="title" placeholder="Enter book title" required maxlength="120"></div>
          <div class="form-group"><label for="book-author">Author *</label>
            <input class="form-control" id="book-author" name="author" placeholder="Enter author name" required maxlength="100"></div>
          <div class="form-group"><label for="book-category">Category *</label>
            <select class="form-control" id="book-category" name="category" required>
              <option value="">Select a category</option>
              <option>Computer Science</option>
              <option>Programming</option>
              <option>Fiction</option>
              <option>Non-fiction</option>
              <option>Self Development</option>
              <option>Productivity</option>
              <option>Science</option>
              <option>Business</option>
              <option>Other</option>
            </select>
          </div>
          <div class="form-group"><label for="book-quantity">Number of copies *</label>
            <input class="form-control" id="book-quantity" name="quantity" type="number" min="1" max="9999" value="1" required></div>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary"><i class="fa-solid fa-plus"></i> Add Book to Library</button>
          <button type="reset" class="btn btn-light">Clear form</button>
        </div>
      </form>
    </section>
  `;
}

/* ============================================================
   ADMIN PAGE CONTENT
   ============================================================ */
function adminPageContent(page) {
  const books = getBooks();
  const records = getRecords();

  if (page === "overview") {
    const recent = books.slice(-5).reverse();
    return `
      ${dashboardStats("admin")}
      ${adminFineBanner()}
      <div class="content-grid">
        <section class="panel">
          ${panelHeading("Recently added books", "Your latest library additions.",
            buttonEl("View all", "navigate", "btn btn-light btn-small", 'data-page="books"'))}
          ${bookTable(recent)}
        </section>
        <section class="panel">
          ${panelHeading("Quick actions", "Manage your library faster.")}
          <div class="quick-links">
            <button class="quick-link" data-action="navigate" data-page="add-book">
              <span class="quick-link-left"><i class="fa-solid fa-plus"></i><span><strong>Add a book</strong><small>Add a new title</small></span></span><i class="fa-solid fa-chevron-right"></i>
            </button>
            <button class="quick-link" data-action="navigate" data-page="students">
              <span class="quick-link-left"><i class="fa-solid fa-users"></i><span><strong>Student list</strong><small>View library members</small></span></span><i class="fa-solid fa-chevron-right"></i>
            </button>
            <button class="quick-link" data-action="navigate" data-page="borrowed">
              <span class="quick-link-left"><i class="fa-solid fa-book-bookmark"></i><span><strong>Borrowed books</strong><small>Track active loans & fines</small></span></span><i class="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </section>
      </div>
    `;
  }

  if (page === "add-book") return addBookForm();

  if (page === "books") {
    return `
      <section class="panel">
        ${panelHeading("Library collection", "Search and view every book.",
          `<div class="search-box"><i class="fa-solid fa-magnifying-glass"></i><input class="form-control" id="admin-book-search" placeholder="Search books..."></div>`)}
        <div id="admin-book-area">${bookTable(books)}</div>
      </section>
    `;
  }

  if (page === "delete-book") {
    return `
      <section class="panel">
        ${panelHeading("Delete a book", "Books with active loans cannot be deleted.",
          `<div class="search-box"><i class="fa-solid fa-magnifying-glass"></i><input class="form-control" id="delete-book-search" placeholder="Search books..."></div>`)}
        <div id="delete-book-area">${bookTable(books, "delete")}</div>
      </section>
    `;
  }

  if (page === "students") {
    return `
      <section class="panel">
        ${panelHeading("Registered students", "All library members.",
          `<div class="search-box"><i class="fa-solid fa-magnifying-glass"></i><input class="form-control" id="student-search" placeholder="Search students..."></div>`)}
        <div id="student-area">${studentTable(getStudents())}</div>
      </section>
    `;
  }

  if (page === "borrowed") {
    return `
      <section class="panel">
        ${panelHeading("Currently borrowed", "Books that have not yet been returned.")}
        ${recordsTable(records.filter(r => !r.returnDate), "admin-borrowed")}
      </section>
    `;
  }

  if (page === "returned") {
    return `
      <section class="panel">
        ${panelHeading("Returned books", "History of completed returns.")}
        ${recordsTable(records.filter(r => r.returnDate), "admin-returned")}
      </section>
    `;
  }

  return adminPageContent("overview");
}

/* ============================================================
   STUDENT PAGE CONTENT
   ============================================================ */
function studentPageContent(page) {
  const student = getCurrentStudent();
  const records = getRecords();
  const books = getBooks();
  if (!student) return "";

  const mine = records.filter(r => r.studentId === student.id);
  const activeMine = mine.filter(r => !r.returnDate);
  const returnedMine = mine.filter(r => r.returnDate);

  if (page === "overview") {
    return `
      ${studentFineBanner()}
      <section class="welcome-card">
        <h2>Welcome, ${escapeHTML(student.name.split(" ")[0])}! <i class="fa-regular fa-face-smile"></i></h2>
        <p>Ready to discover your next favourite book? Explore the library and keep track of your borrowed books here.</p>
        ${buttonEl('<i class="fa-solid fa-magnifying-glass"></i> Browse books', "navigate", "btn btn-primary", 'data-page="browse"')}
      </section>
      ${dashboardStats("student")}
      <div class="content-grid">
        <section class="panel">
          ${panelHeading("Books you may like", "Explore titles from our collection.")}
          ${bookTable(books.slice(0, 5), "borrow")}
        </section>
        <section class="panel">
          ${panelHeading("Your library", "Manage your reading journey.")}
          <div class="quick-links">
            <button class="quick-link" data-action="navigate" data-page="browse">
              <span class="quick-link-left"><i class="fa-solid fa-book-open"></i><span><strong>Browse books</strong><small>Find available titles</small></span></span><i class="fa-solid fa-chevron-right"></i>
            </button>
            <button class="quick-link" data-action="navigate" data-page="my-books">
              <span class="quick-link-left"><i class="fa-solid fa-book-bookmark"></i><span><strong>My borrowed books</strong><small>${activeMine.length} active loan(s)</small></span></span><i class="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </section>
      </div>
    `;
  }

  if (page === "browse") {
    return `
      <section class="panel">
        ${panelHeading("Explore the collection", "Search by title, author, category, or Book ID.",
          `<div class="search-box"><i class="fa-solid fa-magnifying-glass"></i><input class="form-control" id="student-search" placeholder="Search books..."></div>`)}
        <div id="student-book-area">${bookTable(books, "borrow")}</div>
      </section>
    `;
  }

  if (page === "my-books") {
    return `
      ${studentFineBanner()}
      <section class="panel">
        ${panelHeading("Your active loans", "Return your books when finished. Overdue books accumulate ৳5/day fine.")}
        ${recordsTable(activeMine, "myreturn")}
      </section>
    `;
  }

  if (page === "my-returned") {
    return `
      <section class="panel">
        ${panelHeading("Your return history", "Books you have already returned.")}
        ${recordsTable(returnedMine, "student-returned")}
      </section>
    `;
  }

  return studentPageContent("overview");
}

/* ============================================================
   DASHBOARD RENDERER
   ============================================================ */
function renderDashboard(role, page = "overview") {
  const session = getSession();
  if (!session || session.role !== role) {
    renderPage(role === "admin" ? "admin-login" : "student-login");
    return;
  }
  const student = role === "student" ? getCurrentStudent() : null;
  if (role === "student" && !student) {
    clearSession();
    renderPage("student-login");
    return;
  }

  const [title, subtitle] = pageTitle(role, page);
  const profileName = role === "admin" ? "Library Admin" : student.name;
  const profileDetail = role === "admin" ? "Administrator" : `${student.department} · ${student.id}`;

  $("#app").innerHTML = `
    <div class="dashboard">
      ${sidebar(role, page)}
      <main class="main-area">
        <header class="main-topbar">
          <div class="page-heading">
            <h1>${title}</h1>
            <p>${subtitle}</p>
          </div>
          <div class="topbar-right">
            <div class="live-clock">
              <i class="fa-regular fa-clock"></i>
              <span>${new Date().toLocaleString("en-GB", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
            </div>
            <div class="profile-chip">
              <div class="avatar">${escapeHTML(profileName.charAt(0).toUpperCase())}</div>
              <div>
                <strong>${escapeHTML(profileName)}</strong>
                <span>${escapeHTML(profileDetail)}</span>
              </div>
            </div>
          </div>
        </header>
        ${role === "admin" ? adminPageContent(page) : studentPageContent(page)}
      </main>
    </div>
  `;

  const ps = $("#admin-book-search") || $("#student-search");
  if (ps) { try { ps.focus({ preventScroll: true }); } catch (e) {} }
}

/* ============================================================
   ROUTER
   ============================================================ */
function renderPage(page = "home") {
  if (page === "home") { $("#app").innerHTML = homePage(); return; }
  if (page === "admin-login" || page === "student-login" || page === "register") {
    $("#app").innerHTML = authPage(
      page === "admin-login" ? "admin" : page === "register" ? "register" : "student"
    );
    return;
  }
  const session = getSession();
  if (session?.role === "admin") renderDashboard("admin", page);
  else if (session?.role === "student") renderDashboard("student", page);
  else renderPage("home");
}

/* ============================================================
   ACTIONS
   ============================================================ */
function addBook(form) {
  const fd = new FormData(form);
  const id = String(fd.get("bookId") || "").trim().toUpperCase();
  const title = String(fd.get("title") || "").trim();
  const author = String(fd.get("author") || "").trim();
  const category = String(fd.get("category") || "").trim();
  const quantity = Number(fd.get("quantity"));

  if (!id || !title || !author || !category) { toast("Please fill in all required fields.", true); return; }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 9999) { toast("Enter a valid quantity between 1 and 9999.", true); return; }

  const books = getBooks();
  if (books.some(b => b.id.toLowerCase() === id.toLowerCase())) { toast("This Book ID already exists.", true); return; }

  books.push({ id, title, author, category, quantity, available: quantity });
  if (!saveData(DB.books, books)) return;

  form.reset();
  toast(`"${title}" added to the library successfully!`);
  renderDashboard("admin", "books");
}

function deleteBook(bookId) {
  const books = getBooks();
  const book = books.find(b => b.id === bookId);
  if (!book) { toast("Book not found.", true); return; }
  if (activeRecords().some(r => r.bookId === bookId)) { toast("This book has an active loan and cannot be deleted.", true); return; }
  if (!confirm(`Delete "${book.title}" from the library?`)) return;
  if (!saveData(DB.books, books.filter(b => b.id !== bookId))) return;
  toast("Book deleted successfully.");
  renderDashboard("admin", "delete-book");
}

function registerStudent(form) {
  const data = new FormData(form);
  const id = String(data.get("studentId") || "").trim().toUpperCase();
  const name = String(data.get("name") || "").trim();
  const department = String(data.get("department") || "").trim();
  const password = String(data.get("password") || "");

  if (!id || !name || !department || !password) { toast("Please complete all fields.", true); return; }
  if (password.length < 4) { toast("Password must be at least 4 characters.", true); return; }

  const students = getStudents();
  if (students.some(s => s.id.toLowerCase() === id.toLowerCase())) { toast("This Student ID is already registered.", true); return; }

  students.push({ id, name, department, password, registeredOn: today() });
  if (!saveData(DB.students, students)) return;

  setSession({ role: "student", studentId: id });
  toast("Account created successfully!");
  renderPage("overview");
}

function borrowBook(bookId) {
  const student = getCurrentStudent();
  if (!student) { toast("Please sign in as a student first.", true); renderPage("student-login"); return; }

  const books = getBooks();
  const book = books.find(b => b.id === bookId);
  if (!book) { toast("Book not found.", true); return; }
  if (book.available < 1) { toast("Sorry, this book is currently unavailable.", true); return; }

  const records = getRecords();
  const already = records.some(r => r.studentId === student.id && r.bookId === bookId && !r.returnDate);
  if (already) { toast("You have already borrowed this book.", true); return; }

  book.available -= 1;
  records.push({
    id: `R${Date.now()}${Math.floor(Math.random() * 1000)}`,
    bookId: book.id, bookTitle: book.title,
    studentId: student.id,
    borrowDate: today(),
    dueDate: dateAfterDays(BORROW_DAYS),
    returnDate: null
  });

  if (!saveData(DB.books, books)) return;
  if (!saveData(DB.records, records)) { book.available += 1; saveData(DB.books, books); return; }

  toast(`"${book.title}" borrowed! Due in ${BORROW_DAYS} days.`);
  renderDashboard("student", "browse");
}

function returnBook(recordId) {
  const student = getCurrentStudent();
  if (!student) return;
  const records = getRecords();
  const record = records.find(r => r.id === recordId && r.studentId === student.id && !r.returnDate);
  if (!record) { toast("Active borrowing record not found.", true); return; }

  const books = getBooks();
  const book = books.find(b => b.id === record.bookId);
  const finalFine = fineFor(record);
  record.returnDate = today();
  record.fineAtReturn = finalFine;

  if (book) book.available = Math.min(Number(book.quantity), Number(book.available) + 1);

  if (!saveData(DB.records, records)) return;
  if (!saveData(DB.books, books)) return;

  if (finalFine > 0) {
    toast(`Book returned. Fine ৳${finalFine} applied (${FINE_PER_DAY}/day late).`, true);
  } else {
    toast("Book returned successfully. No fine.");
  }
  renderDashboard("student", "my-books");
}

/* ============================================================
   FORM SUBMISSIONS
   ============================================================ */
document.addEventListener("submit", e => {
  const form = e.target;
  if (!(form instanceof HTMLFormElement)) return;

  if (form.id === "add-book-form") { e.preventDefault(); addBook(form); return; }

  if (form.id === "admin-login-form") {
    e.preventDefault();
    const fd = new FormData(form);
    const u = String(fd.get("username") || "").trim();
    const p = String(fd.get("password") || "");
    if (u === "admin" && p === "admin123") {
      setSession({ role: "admin" });
      toast("Welcome to the admin dashboard!");
      renderPage("overview");
    } else {
      toast("Incorrect username or password.", true);
    }
    return;
  }

  if (form.id === "student-register-form") { e.preventDefault(); registerStudent(form); return; }

  if (form.id === "student-login-form") {
    e.preventDefault();
    const fd = new FormData(form);
    const id = String(fd.get("studentId") || "").trim().toUpperCase();
    const pw = String(fd.get("password") || "");
    const student = getStudent(id);

    if (!student) { toast("Student ID not found. Please register first.", true); return; }
    if (student.password && student.password !== pw) { toast("Incorrect password.", true); return; }

    // Auto-set password for legacy students without password
    if (!student.password) {
      if (pw.length < 4) { toast("Please use a password of at least 4 characters.", true); return; }
      const all = getStudents();
      const idx = all.findIndex(s => s.id === student.id);
      if (idx > -1) { all[idx].password = pw; saveData(DB.students, all); }
    }

    setSession({ role: "student", studentId: student.id });
    toast(`Welcome back, ${student.name}!`);
    renderPage("overview");
  }
});

/* ============================================================
   CLICK HANDLER
   ============================================================ */
document.addEventListener("click", e => {
  const toggleBtn = e.target.closest("[data-toggle-pass]");
  if (toggleBtn) {
    const input = document.getElementById(toggleBtn.dataset.togglePass);
    if (input) {
      const isPass = input.type === "password";
      input.type = isPass ? "text" : "password";
      const icon = toggleBtn.querySelector("i");
      if (icon) icon.className = isPass ? "fa-solid fa-eye-slash" : "fa-solid fa-eye";
    }
    return;
  }

  const el = e.target.closest("[data-action]");
  if (!el) return;
  const action = el.dataset.action;

  if (action === "home") { clearSession(); renderPage("home"); }
  else if (action === "admin-login") renderPage("admin-login");
  else if (action === "student-login") renderPage("student-login");
  else if (action === "register") renderPage("register");
  else if (action === "navigate") {
    const page = el.dataset.page;
    const session = getSession();
    if (session?.role === "admin" || session?.role === "student") {
      renderDashboard(session.role, page);
    }
  }
  else if (action === "logout") { clearSession(); toast("You have signed out."); renderPage("home"); }
  else if (action === "borrow") borrowBook(el.dataset.bookId);
  else if (action === "delete-book") deleteBook(el.dataset.bookId);
  else if (action === "return-book") returnBook(el.dataset.recordId);
});

/* ============================================================
   SEARCH
   ============================================================ */
const handleSearch = debounce(target => {
  const q = target.value.trim().toLowerCase();

  if (target.id === "admin-book-search") {
    const books = getBooks().filter(b =>
      [b.id, b.title, b.author, b.category].some(v => String(v).toLowerCase().includes(q))
    );
    const area = $("#admin-book-area");
    if (area) area.innerHTML = bookTable(books);
  }
  if (target.id === "delete-book-search") {
    const books = getBooks().filter(b =>
      [b.id, b.title, b.author, b.category].some(v => String(v).toLowerCase().includes(q))
    );
    const area = $("#delete-book-area");
    if (area) area.innerHTML = bookTable(books, "delete");
  }
  if (target.id === "student-search") {
    const sArea = $("#student-area");
    if (sArea) {
      const students = getStudents().filter(s =>
        [s.id, s.name, s.department].some(v => String(v).toLowerCase().includes(q))
      );
      sArea.innerHTML = studentTable(students);
    }
    const bArea = $("#student-book-area");
    if (bArea) {
      const books = getBooks().filter(b =>
        [b.id, b.title, b.author, b.category].some(v => String(v).toLowerCase().includes(q))
      );
      bArea.innerHTML = bookTable(books, "borrow");
    }
  }
}, 150);

document.addEventListener("input", e => {
  const t = e.target;
  if (["admin-book-search", "delete-book-search", "student-search"].includes(t.id)) {
    handleSearch(t);
  }
  if (t.id === "register-password") updatePasswordStrength(t.value);
});

function updatePasswordStrength(pw) {
  const bars = $$("#strength-bars .bar");
  const label = $("#strength-label");
  if (!bars.length || !label) return;
  let score = 0;
  if (pw.length >= 4) score++;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score++;

  bars.forEach((b, i) => {
    b.className = "bar";
    if (i < score) {
      if (score <= 1) b.classList.add("filled-weak");
      else if (score <= 2) b.classList.add("filled-medium");
      else b.classList.add("filled-strong");
    }
  });
  const labels = ["Minimum 4 characters", "Weak password", "Medium password", "Strong password", "Very strong"];
  label.textContent = labels[score] || labels[0];
}

/* ============================================================
   INIT
   ============================================================ */
(function init() {
  if (!localStorage.getItem(DB.books)) saveData(DB.books, sampleBooks);
  renderPage("home");
})();