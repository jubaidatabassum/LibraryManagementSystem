/* ============================================================
   BookNest – Online Library Management System
   Complete script.js (full replacement)
   ============================================================ */

const DB = {
  books: "booknest_books_v2",
  students: "booknest_students_v2",
  records: "booknest_records_v2",
  session: "booknest_session_v2"
};

const sampleBooks = [
  {
    id: "B001",
    title: "Atomic Habits",
    author: "James Clear",
    category: "Self Development",
    quantity: 5,
    available: 5
  },
  {
    id: "B002",
    title: "Clean Code",
    author: "Robert C. Martin",
    category: "Programming",
    quantity: 4,
    available: 4
  },
  {
    id: "B003",
    title: "The Alchemist",
    author: "Paulo Coelho",
    category: "Fiction",
    quantity: 6,
    available: 6
  },
  {
    id: "B004",
    title: "Introduction to Algorithms",
    author: "Thomas H. Cormen",
    category: "Computer Science",
    quantity: 3,
    available: 3
  },
  {
    id: "B005",
    title: "Deep Work",
    author: "Cal Newport",
    category: "Productivity",
    quantity: 4,
    available: 4
  }
];

/* ---------- Helpers ---------- */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function readData(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (error) {
    console.error("Could not read saved data:", error);
    return fallback;
  }
}

function saveData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error("Could not save data:", error);
    toast("Could not save data. Check your browser storage.", true);
    return false;
  }
}

function getBooks() {
  return readData(DB.books, null) || initializeBooks();
}

function initializeBooks() {
  saveData(DB.books, sampleBooks);
  return sampleBooks.map(book => ({ ...book }));
}

function getStudents() { return readData(DB.students, []); }
function getRecords() { return readData(DB.records, []); }
function getSession() { return readData(DB.session, null); }
function setSession(session) { saveData(DB.session, session); }
function clearSession() { localStorage.removeItem(DB.session); }

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

function toast(message, isError = false) {
  const element = $("#toast");
  if (!element) return;

  element.textContent = message;
  element.classList.toggle("error", isError);
  element.classList.add("show");

  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => {
    element.classList.remove("show");
  }, 3000);
}

function debounce(fn, wait = 180) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

function today() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateAfterDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(date) {
  if (!date) return "—";
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return escapeHTML(date);

  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function totalCopies() {
  return getBooks().reduce((sum, book) => sum + Number(book.quantity || 0), 0);
}

function activeRecords() {
  return getRecords().filter(record => !record.returnDate);
}

function returnedRecords() {
  return getRecords().filter(record => Boolean(record.returnDate));
}

function getStudent(studentId) {
  return getStudents().find(student => student.id.toLowerCase() === studentId.toLowerCase());
}

function getCurrentStudent() {
  const session = getSession();
  if (!session || session.role !== "student") return null;
  return getStudent(session.studentId);
}

function bookStatus(book) {
  return Number(book.available) > 0
    ? '<span class="status available">Available</span>'
    : '<span class="status unavailable">Out of stock</span>';
}

function bookIcon(index) {
  const colors = ["", "orange", "purple", "blue"];
  return `mini-book ${colors[index % colors.length]}`;
}

function emptyState(title, description, icon = "fa-book-open") {
  return `
    <div class="empty-state">
      <i class="fa-solid ${icon}"></i>
      <h3>${escapeHTML(title)}</h3>
      <p>${escapeHTML(description)}</p>
    </div>
  `;
}

function button(label, action, classes = "btn btn-primary", extra = "") {
  return `<button type="button" class="${classes}" data-action="${action}" ${extra}>${label}</button>`;
}

function brand() {
  return `
    <a class="brand" href="#" data-action="home">
      <span class="brand-icon"><i class="fa-solid fa-book-open"></i></span>
      Book<span>Nest</span>
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
        ${button('<i class="fa-solid fa-user-graduate"></i> Student Login', "student-login", "btn btn-light")}
        ${button('<i class="fa-solid fa-shield-halved"></i> Admin Login', "admin-login", "btn btn-primary")}
      </div>
    </header>

    <main class="container">
      <section class="hero">
        <div class="hero-panel">
          <div class="eyebrow">
            <i class="fa-solid fa-book-open"></i>
            Your campus library, reimagined
          </div>

          <h1 class="hero-title">
            A little reading.<br>
            A <span>lot of growth.</span>
          </h1>

          <p class="hero-description">
            Discover books, borrow your next favourite read, and keep your
            library journey organised—all in one simple place.
          </p>

          <div class="hero-actions">
            ${button('<i class="fa-solid fa-book-open"></i> Explore Library', "student-login", "btn btn-primary")}
            ${button('<i class="fa-solid fa-arrow-right-to-bracket"></i> Admin Portal', "admin-login", "btn btn-light")}
          </div>

          <div class="hero-note">
            <i class="fa-solid fa-circle-check"></i>
            Easy borrowing · Simple tracking · Student friendly
          </div>
        </div>

        <div class="hero-art">
          <div class="art-circle"></div>
          <div class="floating-note note-one">
            <i class="fa-solid fa-book"></i> Read something new
          </div>

          <div class="book-stack">
            <div class="book-illustration">GROW DAILY</div>
            <div class="book-illustration">YOUR NEXT CHAPTER</div>
            <div class="book-illustration">STAY CURIOUS</div>
          </div>

          <div class="floating-note note-two">
            <i class="fa-solid fa-leaf"></i> Make time to read
          </div>
        </div>
      </section>

      <section class="home-stats">
        <div class="home-stat">
          <div class="home-stat-icon"><i class="fa-solid fa-book"></i></div>
          <div>
            <strong>${books.length}</strong>
            <span>Book titles in the library</span>
          </div>
        </div>

        <div class="home-stat">
          <div class="home-stat-icon"><i class="fa-solid fa-layer-group"></i></div>
          <div>
            <strong>${totalCopies()}</strong>
            <span>Total book copies</span>
          </div>
        </div>

        <div class="home-stat">
          <div class="home-stat-icon"><i class="fa-solid fa-users"></i></div>
          <div>
            <strong>${students.length}</strong>
            <span>Registered students</span>
          </div>
        </div>
      </section>

      <section class="home-features">
        <div class="feature-card">
          <div class="feature-icon"><i class="fa-solid fa-bolt"></i></div>
          <h3>Borrow in seconds</h3>
          <p>Find a book and borrow it instantly. No queues, no paperwork—just reading.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon"><i class="fa-solid fa-clock"></i></div>
          <h3>Track your loans</h3>
          <p>See what you've borrowed and when it's due. Everything stays in one place.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon"><i class="fa-solid fa-shield-halved"></i></div>
          <h3>Stay organised</h3>
          <p>Your borrowing history is safely stored in your browser—no sign-up required to browse.</p>
        </div>
      </section>
    </main>

    <footer class="container home-footer">
      BookNest Library System · Built for readers and learners
    </footer>
  `;
}

/* ============================================================
   AUTH PAGES
   ============================================================ */
function authPage(type) {
  const isAdmin = type === "admin";
  const isRegister = type === "register";

  let title = isAdmin ? "Welcome back, Admin" :
    isRegister ? "Join BookNest" : "Welcome back, Reader";

  let subtitle = isAdmin ? "Sign in to manage your library." :
    isRegister ? "Create your student library account." :
      "Sign in with your student ID to continue.";

  let form = "";

  if (isAdmin) {
    form = `
      <form id="admin-login-form" class="form-stack">
        <div class="form-group">
          <label for="admin-username">Username</label>
          <div class="input-wrap">
            <i class="fa-solid fa-user"></i>
            <input class="form-control" id="admin-username" name="username"
              placeholder="Enter admin username" autocomplete="username" required>
          </div>
        </div>

        <div class="form-group">
          <label for="admin-password">Password</label>
          <div class="input-wrap">
            <i class="fa-solid fa-lock"></i>
            <input class="form-control" id="admin-password" name="password"
              type="password" placeholder="Enter password"
              autocomplete="current-password" required>
            <button type="button" class="toggle-pass" data-toggle-pass="admin-password" aria-label="Show password">
              <i class="fa-solid fa-eye"></i>
            </button>
          </div>
        </div>

        <button class="btn btn-primary full-width" type="submit">
          Sign in <i class="fa-solid fa-arrow-right"></i>
        </button>
      </form>

      <div class="demo-note">
        <i class="fa-solid fa-circle-info"></i>
        Demo login: <strong>admin</strong> / <strong>admin123</strong>
      </div>
    `;
  } else if (isRegister) {
    form = `
      <form id="student-register-form" class="form-stack">
        <div class="form-group">
          <label for="register-id">Student ID</label>
          <div class="input-wrap">
            <i class="fa-solid fa-id-card"></i>
            <input class="form-control" id="register-id" name="studentId"
              placeholder="e.g. CSE24001" required maxlength="30">
          </div>
        </div>

        <div class="form-group">
          <label for="register-name">Full name</label>
          <div class="input-wrap">
            <i class="fa-solid fa-user"></i>
            <input class="form-control" id="register-name" name="name"
              placeholder="Enter your full name" required maxlength="80">
          </div>
        </div>

        <div class="form-group">
          <label for="register-department">Department</label>
          <div class="input-wrap">
            <i class="fa-solid fa-building-columns"></i>
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

        <button class="btn btn-primary full-width" type="submit">
          Create account <i class="fa-solid fa-arrow-right"></i>
        </button>
      </form>

      <div class="auth-bottom">
        Already registered?
        <button type="button" class="text-link" data-action="student-login">Sign in</button>
      </div>
    `;
  } else {
    form = `
      <form id="student-login-form" class="form-stack">
        <div class="form-group">
          <label for="student-id">Student ID</label>
          <div class="input-wrap">
            <i class="fa-solid fa-id-card"></i>
            <input class="form-control" id="student-id" name="studentId"
              placeholder="Enter your registered student ID"
              autocomplete="username" required maxlength="30">
          </div>
        </div>

        <button class="btn btn-primary full-width" type="submit">
          Continue <i class="fa-solid fa-arrow-right"></i>
        </button>
      </form>

      <div class="auth-bottom">
        New to BookNest?
        <button type="button" class="text-link" data-action="register">Create an account</button>
      </div>
    `;
  }

  return `
    <main class="auth-page">
      <section class="auth-side">
        ${brand()}
        <h1>Your next favourite book is waiting.</h1>
        <p>
          Keep your reading journey simple. Explore the collection,
          borrow books, and check your records from one place.
        </p>
      </section>

      <section class="auth-form-side">
        <div class="auth-card">
          <button type="button" class="text-link" data-action="home">
            <i class="fa-solid fa-arrow-left"></i> Back to home
          </button>

          <h2 style="margin-top:26px">${title}</h2>
          <p class="muted">${subtitle}</p>
          ${form}
        </div>
      </section>
    </main>
  `;
}

/* ============================================================
   NAV ITEMS
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

  return `
    <aside class="sidebar">
      ${brand()}

      <div>
        <div class="sidebar-label">Workspace</div>
        <nav class="sidebar-nav">
          ${items.map(([id, icon, label]) => `
            <button type="button"
              class="nav-btn ${active === id ? "active" : ""}"
              data-action="navigate" data-page="${id}">
              <i class="fa-solid ${icon}"></i> ${label}
            </button>
          `).join("")}
        </nav>
      </div>

      <div class="sidebar-bottom">
        <button type="button" class="nav-btn" data-action="logout">
          <i class="fa-solid fa-arrow-right-from-bracket"></i> Sign Out
        </button>
      </div>
    </aside>
  `;
}

/* ============================================================
   PAGE TITLES
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

/* ============================================================
   STATS CARDS
   ============================================================ */
function statCard(label, value, icon, note) {
  return `
    <div class="stat-card">
      <div class="stat-top">
        <span>${label}</span>
        <span class="stat-icon"><i class="fa-solid ${icon}"></i></span>
      </div>
      <div class="stat-number">${value}</div>
      <div class="stat-foot">${note}</div>
    </div>
  `;
}

function dashboardStats(role) {
  const books = getBooks();
  const active = activeRecords();
  const returned = returnedRecords();

  if (role === "admin") {
    return `
      <section class="stats-grid">
        ${statCard("Book titles", books.length, "fa-book", "Titles in the collection")}
        ${statCard("Total copies", totalCopies(), "fa-layer-group", "Copies across all titles")}
        ${statCard("Active loans", active.length, "fa-book-bookmark", "Books currently borrowed")}
        ${statCard("Registered students", getStudents().length, "fa-users", "Library members")}
      </section>
    `;
  }

  const student = getCurrentStudent();
  const mine = active.filter(record => record.studentId === student.id);
  const returnedMine = returned.filter(record => record.studentId === student.id);

  return `
    <section class="stats-grid">
      ${statCard("Available titles", books.filter(book => book.available > 0).length, "fa-book-open", "Titles ready to borrow")}
      ${statCard("Currently borrowed", mine.length, "fa-book-bookmark", "Your active loans")}
      ${statCard("Returned books", returnedMine.length, "fa-rotate-left", "Your completed returns")}
      ${statCard("Library titles", books.length, "fa-layer-group", "Titles in the collection")}
    </section>
  `;
}

/* ============================================================
   PANEL + TABLES
   ============================================================ */
function panelHeading(title, subtitle, right = "") {
  return `
    <div class="panel-heading">
      <div>
        <h2>${title}</h2>
        <p>${subtitle}</p>
      </div>
      ${right}
    </div>
  `;
}

function bookTable(books, mode = "view") {
  if (!books.length) {
    return emptyState("No books found", "Try another search or add a new book.");
  }

  return `
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Book</th>
            <th>Book ID</th>
            <th>Category</th>
            <th>Copies</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${books.map((book, index) => `
            <tr>
              <td>
                <div class="book-name-cell">
                  <div class="${bookIcon(index)}"><i class="fa-solid fa-book"></i></div>
                  <div>
                    <strong>${escapeHTML(book.title)}</strong>
                    <span class="table-sub">${escapeHTML(book.author)}</span>
                  </div>
                </div>
              </td>
              <td>${escapeHTML(book.id)}</td>
              <td>${escapeHTML(book.category)}</td>
              <td>${book.available} / ${book.quantity}</td>
              <td>${bookStatus(book)}</td>
              <td>
                ${mode === "borrow"
                  ? button("Borrow", "borrow", "btn btn-primary btn-small", `data-book-id="${escapeHTML(book.id)}" ${book.available < 1 ? "disabled" : ""}`)
                  : mode === "delete"
                    ? button('<i class="fa-solid fa-trash"></i> Delete', "delete-book", "btn btn-danger btn-small", `data-book-id="${escapeHTML(book.id)}"`)
                    : '<span class="muted">—</span>'}
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function recordsTable(records, mode = "admin-borrowed") {
  if (!records.length) {
    return emptyState(
      "No records yet",
      mode.includes("returned")
        ? "Returned books will appear here."
        : "Borrowed books will appear here.",
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
            ${isReturned ? "<th>Returned on</th>" : "<th>Status</th>"}
            ${mode === "myreturn" ? "<th>Action</th>" : ""}
          </tr>
        </thead>
        <tbody>
          ${records.map(record => {
            const book = getBooks().find(item => item.id === record.bookId);
            const student = getStudent(record.studentId);
            const overdue = !record.returnDate && record.dueDate < today();

            return `
              <tr>
                <td>
                  <strong>${escapeHTML(record.bookTitle || book?.title || "Deleted book")}</strong>
                  <span class="table-sub">${escapeHTML(record.bookId)}</span>
                </td>
                ${isStudent ? "" : `
                  <td>
                    <strong>${escapeHTML(student?.name || "Unknown student")}</strong>
                    <span class="table-sub">${escapeHTML(record.studentId)}</span>
                  </td>
                `}
                <td>${formatDate(record.borrowDate)}</td>
                <td>${formatDate(record.dueDate)}</td>
                ${isReturned
                  ? `<td>${formatDate(record.returnDate)}</td>`
                  : `<td><span class="status ${overdue ? "overdue" : "borrowed"}">${overdue ? "Overdue" : "Borrowed"}</span></td>`}
                ${mode === "myreturn"
                  ? `<td>${button("Return", "return-book", "btn btn-primary btn-small", `data-record-id="${escapeHTML(record.id)}"`)}</td>`
                  : ""}
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function studentTable(students) {
  if (!students.length) {
    return emptyState("No students yet", "Registered students will appear here.", "fa-users");
  }

  return `
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr><th>Student</th><th>Student ID</th><th>Department</th><th>Active loans</th></tr>
        </thead>
        <tbody>
          ${students.map(student => `
            <tr>
              <td><strong>${escapeHTML(student.name)}</strong></td>
              <td>${escapeHTML(student.id)}</td>
              <td>${escapeHTML(student.department)}</td>
              <td>${activeRecords().filter(record => record.studentId === student.id).length}</td>
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
          <div class="form-group">
            <label for="book-id">Book ID *</label>
            <input class="form-control" id="book-id" name="bookId"
              placeholder="e.g. B006" required maxlength="30">
          </div>

          <div class="form-group">
            <label for="book-title">Book title *</label>
            <input class="form-control" id="book-title" name="title"
              placeholder="Enter book title" required maxlength="120">
          </div>

          <div class="form-group">
            <label for="book-author">Author *</label>
            <input class="form-control" id="book-author" name="author"
              placeholder="Enter author name" required maxlength="100">
          </div>

          <div class="form-group">
            <label for="book-category">Category *</label>
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

          <div class="form-group">
            <label for="book-quantity">Number of copies *</label>
            <input class="form-control" id="book-quantity" name="quantity"
              type="number" min="1" max="9999" value="1" required>
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary">
            <i class="fa-solid fa-plus"></i> Add Book to Library
          </button>
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
    const recentBooks = books.slice(-5).reverse();

    return `
      ${dashboardStats("admin")}

      <div class="content-grid">
        <section class="panel">
          ${panelHeading("Recently added books", "Your latest library additions.",
            button("View all", "navigate", "btn btn-light btn-small", 'data-page="books"'))}
          ${bookTable(recentBooks)}
        </section>

        <section class="panel">
          ${panelHeading("Quick actions", "Manage your library faster.")}
          <div class="quick-links">
            <button class="quick-link" data-action="navigate" data-page="add-book">
              <span class="quick-link-left"><i class="fa-solid fa-plus"></i><span><strong>Add a book</strong><small>Add a new title</small></span></span>
              <i class="fa-solid fa-chevron-right"></i>
            </button>
            <button class="quick-link" data-action="navigate" data-page="students">
              <span class="quick-link-left"><i class="fa-solid fa-users"></i><span><strong>Student list</strong><small>View library members</small></span></span>
              <i class="fa-solid fa-chevron-right"></i>
            </button>
            <button class="quick-link" data-action="navigate" data-page="borrowed">
              <span class="quick-link-left"><i class="fa-solid fa-book-bookmark"></i><span><strong>Borrowed books</strong><small>Track active loans</small></span></span>
              <i class="fa-solid fa-chevron-right"></i>
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
        ${recordsTable(records.filter(record => !record.returnDate), "admin-borrowed")}
      </section>
    `;
  }

  if (page === "returned") {
    return `
      <section class="panel">
        ${panelHeading("Returned books", "History of completed returns.")}
        ${recordsTable(records.filter(record => record.returnDate), "admin-returned")}
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

  const mine = records.filter(record => record.studentId === student.id);
  const activeMine = mine.filter(record => !record.returnDate);
  const returnedMine = mine.filter(record => record.returnDate);

  if (page === "overview") {
    return `
      <section class="welcome-card">
        <h2>Welcome, ${escapeHTML(student.name.split(" ")[0])}! <i class="fa-regular fa-face-smile"></i></h2>
        <p>Ready to discover your next favourite book? Explore the library and keep track of your borrowed books here.</p>
        ${button('<i class="fa-solid fa-magnifying-glass"></i> Browse books', "navigate", "btn btn-primary", 'data-page="browse"')}
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
              <span class="quick-link-left"><i class="fa-solid fa-book-open"></i><span><strong>Browse books</strong><small>Find available titles</small></span></span>
              <i class="fa-solid fa-chevron-right"></i>
            </button>
            <button class="quick-link" data-action="navigate" data-page="my-books">
              <span class="quick-link-left"><i class="fa-solid fa-book-bookmark"></i><span><strong>My borrowed books</strong><small>${activeMine.length} active loan(s)</small></span></span>
              <i class="fa-solid fa-chevron-right"></i>
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
      <section class="panel">
        ${panelHeading("Your active loans", "Return your books when you are finished.")}
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

          <div class="profile-chip">
            <div class="avatar">${escapeHTML(profileName.charAt(0).toUpperCase())}</div>
            <div>
              <strong>${escapeHTML(profileName)}</strong>
              <span>${escapeHTML(profileDetail)}</span>
            </div>
          </div>
        </header>

        ${role === "admin"
          ? adminPageContent(page)
          : studentPageContent(page)}
      </main>
    </div>
  `;

  const pageSearch = $("#admin-book-search");
  if (pageSearch) pageSearch.focus({ preventScroll: true });
}

/* ============================================================
   PAGE ROUTER
   ============================================================ */
function renderPage(page = "home") {
  if (page === "home") {
    $("#app").innerHTML = homePage();
    return;
  }

  if (page === "admin-login" || page === "student-login" || page === "register") {
    $("#app").innerHTML = authPage(
      page === "admin-login" ? "admin" :
      page === "register" ? "register" : "student"
    );
    return;
  }

  const session = getSession();
  if (session?.role === "admin") {
    renderDashboard("admin", page);
  } else if (session?.role === "student") {
    renderDashboard("student", page);
  } else {
    renderPage("home");
  }
}

/* ============================================================
   ACTIONS
   ============================================================ */
function addBook(form) {
  const formData = new FormData(form);

  const id = String(formData.get("bookId") || "").trim().toUpperCase();
  const title = String(formData.get("title") || "").trim();
  const author = String(formData.get("author") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const quantity = Number(formData.get("quantity"));

  if (!id || !title || !author || !category) {
    toast("Please fill in all required fields.", true);
    return;
  }

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 9999) {
    toast("Enter a valid quantity between 1 and 9999.", true);
    return;
  }

  const books = getBooks();

  if (books.some(book => book.id.toLowerCase() === id.toLowerCase())) {
    toast("This Book ID already exists. Please use a unique ID.", true);
    return;
  }

  const newBook = {
    id,
    title,
    author,
    category,
    quantity,
    available: quantity
  };

  books.push(newBook);

  if (!saveData(DB.books, books)) return;

  form.reset();
  toast(`"${title}" added to the library successfully!`);
  renderDashboard("admin", "books");
}

function deleteBook(bookId) {
  const books = getBooks();
  const book = books.find(item => item.id === bookId);

  if (!book) {
    toast("Book not found.", true);
    return;
  }

  const hasActiveLoan = activeRecords().some(record => record.bookId === bookId);

  if (hasActiveLoan) {
    toast("This book has an active loan and cannot be deleted.", true);
    return;
  }

  const confirmed = confirm(`Delete "${book.title}" from the library?`);
  if (!confirmed) return;

  const updated = books.filter(item => item.id !== bookId);
  if (!saveData(DB.books, updated)) return;

  toast("Book deleted successfully.");
  renderDashboard("admin", "delete-book");
}

function registerStudent(form) {
  const data = new FormData(form);

  const id = String(data.get("studentId") || "").trim().toUpperCase();
  const name = String(data.get("name") || "").trim();
  const department = String(data.get("department") || "").trim();

  if (!id || !name || !department) {
    toast("Please complete all fields.", true);
    return;
  }

  const students = getStudents();

  if (students.some(student => student.id.toLowerCase() === id.toLowerCase())) {
    toast("This Student ID is already registered.", true);
    return;
  }

  students.push({
    id,
    name,
    department,
    registeredOn: today()
  });

  if (!saveData(DB.students, students)) return;

  setSession({ role: "student", studentId: id });
  toast("Account created successfully!");
  renderPage("overview");
}

function borrowBook(bookId) {
  const student = getCurrentStudent();

  if (!student) {
    toast("Please sign in as a student first.", true);
    renderPage("student-login");
    return;
  }

  const books = getBooks();
  const book = books.find(item => item.id === bookId);

  if (!book) {
    toast("Book not found.", true);
    return;
  }

  if (book.available < 1) {
    toast("Sorry, this book is currently unavailable.", true);
    return;
  }

  const records = getRecords();
  const alreadyBorrowed = records.some(record =>
    record.studentId === student.id &&
    record.bookId === bookId &&
    !record.returnDate
  );

  if (alreadyBorrowed) {
    toast("You have already borrowed this book.", true);
    return;
  }

  book.available -= 1;

  records.push({
    id: `R${Date.now()}${Math.floor(Math.random() * 1000)}`,
    bookId: book.id,
    bookTitle: book.title,
    studentId: student.id,
    borrowDate: today(),
    dueDate: dateAfterDays(14),
    returnDate: null
  });

  if (!saveData(DB.books, books)) return;
  if (!saveData(DB.records, records)) {
    book.available += 1;
    saveData(DB.books, books);
    return;
  }

  toast(`"${book.title}" borrowed successfully. Due in 14 days.`);
  renderDashboard("student", "browse");
}

function returnBook(recordId) {
  const student = getCurrentStudent();
  if (!student) return;

  const records = getRecords();
  const record = records.find(item =>
    item.id === recordId &&
    item.studentId === student.id &&
    !item.returnDate
  );

  if (!record) {
    toast("Active borrowing record not found.", true);
    return;
  }

  const books = getBooks();
  const book = books.find(item => item.id === record.bookId);

  record.returnDate = today();

  if (book) {
    book.available = Math.min(Number(book.quantity), Number(book.available) + 1);
  }

  if (!saveData(DB.records, records)) return;
  if (!saveData(DB.books, books)) return;

  toast("Book returned successfully. Thank you!");
  renderDashboard("student", "my-books");
}

/* ============================================================
   FORM SUBMISSIONS
   ============================================================ */
document.addEventListener("submit", event => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;

  if (form.id === "add-book-form") {
    event.preventDefault();
    addBook(form);
    return;
  }

  if (form.id === "admin-login-form") {
    event.preventDefault();

    const data = new FormData(form);
    const username = String(data.get("username") || "").trim();
    const password = String(data.get("password") || "");

    if (username === "admin" && password === "admin123") {
      setSession({ role: "admin" });
      toast("Welcome to the admin dashboard!");
      renderPage("overview");
    } else {
      toast("Incorrect username or password.", true);
    }
    return;
  }

  if (form.id === "student-register-form") {
    event.preventDefault();
    registerStudent(form);
    return;
  }

  if (form.id === "student-login-form") {
    event.preventDefault();

    const data = new FormData(form);
    const id = String(data.get("studentId") || "").trim().toUpperCase();
    const student = getStudent(id);

    if (!student) {
      toast("Student ID not found. Please register first.", true);
      return;
    }

    setSession({ role: "student", studentId: student.id });
    toast(`Welcome back, ${student.name}!`);
    renderPage("overview");
  }
});

/* ============================================================
   CLICK ACTIONS
   ============================================================ */
document.addEventListener("click", event => {
  // Password show/hide toggle
  const toggleBtn = event.target.closest("[data-toggle-pass]");
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

  const actionElement = event.target.closest("[data-action]");
  if (!actionElement) return;

  const action = actionElement.dataset.action;

  if (action === "home") {
    clearSession();
    renderPage("home");
  }

  if (action === "admin-login") renderPage("admin-login");
  if (action === "student-login") renderPage("student-login");
  if (action === "register") renderPage("register");

  if (action === "navigate") {
    const page = actionElement.dataset.page;
    const session = getSession();

    if (session?.role === "admin" || session?.role === "student") {
      renderDashboard(session.role, page);
    }
  }

  if (action === "logout") {
    clearSession();
    toast("You have signed out.");
    renderPage("home");
  }

  if (action === "borrow") {
    borrowBook(actionElement.dataset.bookId);
  }

  if (action === "delete-book") {
    deleteBook(actionElement.dataset.bookId);
  }

  if (action === "return-book") {
    returnBook(actionElement.dataset.recordId);
  }
});

/* ============================================================
   SEARCH (debounced)
   ============================================================ */
const handleSearch = debounce(target => {
  const query = target.value.trim().toLowerCase();

  if (target.id === "admin-book-search") {
    const books = getBooks().filter(book =>
      [book.id, book.title, book.author, book.category]
        .some(value => String(value).toLowerCase().includes(query))
    );
    const area = $("#admin-book-area");
    if (area) area.innerHTML = bookTable(books);
  }

  if (target.id === "delete-book-search") {
    const books = getBooks().filter(book =>
      [book.id, book.title, book.author, book.category]
        .some(value => String(value).toLowerCase().includes(query))
    );
    const area = $("#delete-book-area");
    if (area) area.innerHTML = bookTable(books, "delete");
  }

  if (target.id === "student-search") {
    const studentArea = $("#student-area");
    if (studentArea) {
      const students = getStudents().filter(student =>
        [student.id, student.name, student.department]
          .some(value => String(value).toLowerCase().includes(query))
      );
      studentArea.innerHTML = studentTable(students);
    }

    const bookArea = $("#student-book-area");
    if (bookArea) {
      const books = getBooks().filter(book =>
        [book.id, book.title, book.author, book.category]
          .some(value => String(value).toLowerCase().includes(query))
      );
      bookArea.innerHTML = bookTable(books, "borrow");
    }
  }
}, 150);

document.addEventListener("input", event => {
  const target = event.target;
  if (["admin-book-search", "delete-book-search", "student-search"].includes(target.id)) {
    handleSearch(target);
  }
});

/* ============================================================
   INIT
   ============================================================ */
(function init() {
  if (!localStorage.getItem(DB.books)) {
    saveData(DB.books, sampleBooks);
  }
  renderPage("home");
})();