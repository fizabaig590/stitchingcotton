import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Download,
  FileText,
  IndianRupee,
  LogOut,
  PackagePlus,
  PlusCircle,
  ReceiptText,
  ShoppingCart,
  Trash2,
  UserPlus,
  UserCircle,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import "./styles.css";

const navItems = [
  { id: "purchases", label: "Purchases", icon: ShoppingCart },
  { id: "expenses", label: "Expenses", icon: ReceiptText },
  { id: "sales", label: "Sales", icon: IndianRupee },
];

const initialPurchases = [];

const expenseTypes = [
  "Stitching Expense",
  "Website Expense",
  "Marketing Expense",
  "Salary Expense",
  "PostEx & Courier Expense",
  "Fabric Expense",
  "Other Expense",
];

const defaultUsers = [{ username: "admin", password: "12345" }];

function formatCurrency(value) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function createPdf(title, headers, rows, fileName) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Stitching Cotton", 14, 16);
  doc.setFontSize(11);
  doc.text(title, 14, 24);
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 32,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [53, 119, 93] },
  });
  doc.save(fileName);
}

function App() {
  const [users, setUsers] = useState(() => {
    const savedUsers = localStorage.getItem("stitchingCottonUsers");

    if (!savedUsers) {
      return defaultUsers;
    }

    try {
      const parsedUsers = JSON.parse(savedUsers);
      const hasAdmin = parsedUsers.some((user) => user.username === "admin");
      return hasAdmin ? parsedUsers : [...defaultUsers, ...parsedUsers];
    } catch {
      return defaultUsers;
    }
  });
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showUsersList, setShowUsersList] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [userMessage, setUserMessage] = useState("");
  const [activeView, setActiveView] = useState("");

  const [purchases, setPurchases] = useState(() => {
    const saved = localStorage.getItem("stitchingCottonPurchases");
    return saved ? JSON.parse(saved) : initialPurchases;
  });

  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem("stitchingCottonExpenses");
    return saved ? JSON.parse(saved) : [];
  });

  const [sales, setSales] = useState(() => {
    const saved = localStorage.getItem("stitchingCottonSales");
    return saved ? JSON.parse(saved) : [];
  });
  const [articleNumber, setArticleNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseType, setExpenseType] = useState(expenseTypes[0]);
  const [expenseAmount, setExpenseAmount] = useState("");
  const [saleArticleNumber, setSaleArticleNumber] = useState("");
  const [saleAmount, setSaleAmount] = useState("");
  const [saleDiscount, setSaleDiscount] = useState("");
  const [cardSale, setCardSale] = useState("");
  const [cashSale, setCashSale] = useState("");
  const [courierReceivable, setCourierReceivable] = useState("");

  const purchaseTotal = useMemo(
    () => purchases.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [purchases]
  );
  const expenseTotal = useMemo(
    () => expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [expenses]
  );
  const saleTotals = useMemo(
    () =>
      sales.reduce(
        (totals, item) => ({
          gross: totals.gross + Number(item.saleAmount || 0),
          discounts: totals.discounts + Number(item.discount || 0),
          card: totals.card + Number(item.cardSale || 0),
          cash: totals.cash + Number(item.cashSale || 0),
          courier: totals.courier + Number(item.courierReceivable || 0),
        }),
        { gross: 0, discounts: 0, card: 0, cash: 0, courier: 0 }
      ),
    [sales]
  );
  const expenseTotalsByType = useMemo(
    () =>
      expenseTypes.map((type) => ({
        type,
        total: expenses
          .filter((item) => item.type === type)
          .reduce((sum, item) => sum + Number(item.amount || 0), 0),
      })),
    [expenses]
  );

  useEffect(() => {
    localStorage.setItem("stitchingCottonUsers", JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem("stitchingCottonPurchases", JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem("stitchingCottonExpenses", JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem("stitchingCottonSales", JSON.stringify(sales));
  }, [sales]);

  const handleLogin = (event) => {
    event.preventDefault();
    const cleanUsername = loginUsername.trim();
    const matchedUser = users.find(
      (user) => user.username === cleanUsername && user.password === loginPassword
    );

    if (matchedUser) {
      setLoggedInUser(matchedUser.username);
      setLoginUsername("");
      setLoginPassword("");
      setLoginError("");
      return;
    }

    setLoginError("Invalid username or password.");
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setActiveView("");
  };

  const handleAddUser = (event) => {
    event.preventDefault();
    const cleanUsername = newUsername.trim();

    if (!cleanUsername || !newPassword) {
      setUserMessage("Username and password are required.");
      return;
    }

    if (users.some((user) => user.username.toLowerCase() === cleanUsername.toLowerCase())) {
      setUserMessage("This username is already available.");
      return;
    }

    setUsers((current) => [...current, { username: cleanUsername, password: newPassword }]);
    setNewUsername("");
    setNewPassword("");
    setUserMessage(`${cleanUsername} can now login.`);
  };

  const handleDeleteUser = (usernameToDelete) => {
    if (usernameToDelete === loggedInUser) {
      return;
    }
    setUsers((current) => current.filter((user) => user.username !== usernameToDelete));
    setUserMessage(`User "${usernameToDelete}" has been deleted.`);
  };

  const handleAddPurchase = (event) => {
    event.preventDefault();

    const cleanArticle = articleNumber.trim();
    const numericAmount = Number(amount);

    if (!cleanArticle || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      return;
    }

    setPurchases((current) => [
      { id: crypto.randomUUID(), articleNumber: cleanArticle, amount: numericAmount },
      ...current,
    ]);
    setArticleNumber("");
    setAmount("");
  };

  const handleDeletePurchase = (id) => {
    setPurchases((current) => current.filter((item) => item.id !== id));
  };

  const handleAddExpense = (event) => {
    event.preventDefault();

    const numericAmount = Number(expenseAmount);

    if (!expenseType || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      return;
    }

    setExpenses((current) => [
      { id: crypto.randomUUID(), type: expenseType, amount: numericAmount },
      ...current,
    ]);
    setExpenseAmount("");
  };

  const handleDeleteExpense = (id) => {
    setExpenses((current) => current.filter((item) => item.id !== id));
  };

  const handleAddSale = (event) => {
    event.preventDefault();

    const cleanArticle = saleArticleNumber.trim();
    const numericSaleAmount = Number(saleAmount);
    const numericDiscount = Number(saleDiscount || 0);
    const numericCardSale = Number(cardSale || 0);
    const numericCashSale = Number(cashSale || 0);
    const numericCourierReceivable = Number(courierReceivable || 0);

    if (!cleanArticle || !Number.isFinite(numericSaleAmount) || numericSaleAmount <= 0) {
      return;
    }

    setSales((current) => [
      {
        id: crypto.randomUUID(),
        articleNumber: cleanArticle,
        saleAmount: numericSaleAmount,
        discount: Number.isFinite(numericDiscount) ? numericDiscount : 0,
        cardSale: Number.isFinite(numericCardSale) ? numericCardSale : 0,
        cashSale: Number.isFinite(numericCashSale) ? numericCashSale : 0,
        courierReceivable: Number.isFinite(numericCourierReceivable) ? numericCourierReceivable : 0,
      },
      ...current,
    ]);
    setSaleArticleNumber("");
    setSaleAmount("");
    setSaleDiscount("");
    setCardSale("");
    setCashSale("");
    setCourierReceivable("");
  };

  const handleDeleteSale = (id) => {
    setSales((current) => current.filter((item) => item.id !== id));
  };

  const downloadPurchases = () => {
    const rows = purchases.map((item, index) => ({
      "Sr. No": index + 1,
      "Article Number": item.articleNumber,
      Amount: item.amount,
    }));

    rows.push({ "Sr. No": "", "Article Number": "Total", Amount: purchaseTotal });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Purchases");
    XLSX.writeFile(workbook, "stitching-cotton-purchases.xlsx");
  };

  const downloadPurchasesPdf = () => {
    const rows = purchases.map((item, index) => [
      index + 1,
      item.articleNumber,
      formatCurrency(item.amount),
    ]);

    rows.push(["", "Total", formatCurrency(purchaseTotal)]);
    createPdf(
      "Purchases Report",
      ["Sr. No", "Article Number", "Amount"],
      rows,
      "stitching-cotton-purchases.pdf"
    );
  };

  const downloadExpenses = () => {
    const rows = expenses.map((item, index) => ({
      "Sr. No": index + 1,
      "Expense Type": item.type,
      Amount: item.amount,
    }));

    rows.push({ "Sr. No": "", "Expense Type": "Total", Amount: expenseTotal });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");
    XLSX.writeFile(workbook, "stitching-cotton-expenses.xlsx");
  };

  const downloadExpensesPdf = () => {
    const rows = expenses.map((item, index) => [index + 1, item.type, formatCurrency(item.amount)]);

    rows.push(["", "Total", formatCurrency(expenseTotal)]);
    createPdf(
      "Expenses Report",
      ["Sr. No", "Expense Type", "Amount"],
      rows,
      "stitching-cotton-expenses.pdf"
    );
  };

  const downloadSales = () => {
    const rows = sales.map((item, index) => ({
      "Sr. No": index + 1,
      "Article Number": item.articleNumber,
      "Article Wise Sale": item.saleAmount,
      Discount: item.discount,
      "Card Sale": item.cardSale,
      "Cash Sale": item.cashSale,
      "Courier Receivable": item.courierReceivable,
      "Net Sale": item.saleAmount - item.discount,
    }));

    rows.push({
      "Sr. No": "",
      "Article Number": "Total",
      "Article Wise Sale": saleTotals.gross,
      Discount: saleTotals.discounts,
      "Card Sale": saleTotals.card,
      "Cash Sale": saleTotals.cash,
      "Courier Receivable": saleTotals.courier,
      "Net Sale": saleTotals.gross - saleTotals.discounts,
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales");
    XLSX.writeFile(workbook, "stitching-cotton-sales.xlsx");
  };

  const downloadSalesPdf = () => {
    const rows = sales.map((item, index) => [
      index + 1,
      item.articleNumber,
      formatCurrency(item.saleAmount),
      formatCurrency(item.discount),
      formatCurrency(item.cardSale),
      formatCurrency(item.cashSale),
      formatCurrency(item.courierReceivable),
      formatCurrency(item.saleAmount - item.discount),
    ]);

    rows.push([
      "",
      "Total",
      formatCurrency(saleTotals.gross),
      formatCurrency(saleTotals.discounts),
      formatCurrency(saleTotals.card),
      formatCurrency(saleTotals.cash),
      formatCurrency(saleTotals.courier),
      formatCurrency(saleTotals.gross - saleTotals.discounts),
    ]);

    createPdf(
      "Sales Report",
      [
        "Sr. No",
        "Article",
        "Sale",
        "Discount",
        "Card",
        "Cash",
        "Courier",
        "Net Sale",
      ],
      rows,
      "stitching-cotton-sales.pdf"
    );
  };

  if (!loggedInUser) {
    return (
      <main className="login-page">
        <section className="login-panel" aria-label="Login">
          <div className="login-brand">
            <img
            className="brand-logo"
              src="/image.png"
              alt="Stitching Cotton logo"
            />
            <div>
              <p className="eyebrow">Accounting</p>
              <h1>Stitching Cotton</h1>
            </div>
          </div>

          <form className="login-form" onSubmit={handleLogin}>
            <label>
              Username
              <input
                autoComplete="username"
                value={loginUsername}
                onChange={(event) => setLoginUsername(event.target.value)}
                placeholder="Enter username"
              />
            </label>

            <label>
              Password
              <input
                autoComplete="current-password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                placeholder="Enter password"
                type="password"
              />
            </label>

            {loginError ? <p className="login-error">{loginError}</p> : null}

            <button className="primary-button" type="submit">
              Login
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <img
            className="brand-logo sidebar-logo"
            src="/image.png"
            alt="Stitching Cotton logo"
          />
          <div>
            <p className="eyebrow">Accounting</p>
            <h1>Stitching Cotton</h1>
          </div>
        </div>

        <nav className="nav-list" aria-label="Dashboard sections">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={activeView === item.id ? "nav-item active" : "nav-item"}
                onClick={() => setActiveView(item.id)}
                type="button"
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <section className="user-section" aria-label="User section">
          <button
            className="sidebar-action"
            onClick={() => {
              setActiveView("users");
              setUserMessage("");
            }}
            type="button"
          >
            <UserPlus size={16} />
            <span>Add New User</span>
          </button>
          <div
            className="user-profile-toggle"
            onClick={() => {
              setActiveView("users");
              setShowUsersList((current) => !current);
            }}
            title="Click to view all users and passwords"
          >
            <UserCircle size={20} />
            <span>{loggedInUser}</span>
            <span className="toggle-indicator">{showUsersList ? "▲" : "▼"}</span>
          </div>

          {showUsersList && (
            <div className="users-dropdown-list">
              <p className="users-dropdown-title">Users & Passwords</p>
              <div className="users-dropdown-scroll">
                {users.map((user, idx) => (
                  <div key={idx} className="users-dropdown-item">
                    <span className="user-dropdown-name">{user.username}</span>
                    <span className="user-dropdown-pass">{user.password}</span>
                    {user.username !== loggedInUser ? (
                      <button
                        className="dropdown-delete-btn"
                        onClick={() => handleDeleteUser(user.username)}
                        title="Delete user"
                        type="button"
                      >
                        <Trash2 size={12} />
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={handleLogout} type="button">
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </section>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h2>{navItems.find((item) => item.id === activeView)?.label || "Overview"}</h2>
          </div>
        </header>



        <section className="summary-strip" aria-label="Dashboard summary">
          <div className="summary-card purchase-tile">
            <div className="tile-icon">
              <ShoppingCart size={19} />
            </div>
            <div>
              <span>Total Purchases</span>
              <strong>{formatCurrency(purchaseTotal)}</strong>
            </div>
          </div>
          <div className="summary-card expense-tile">
            <div className="tile-icon">
              <ReceiptText size={19} />
            </div>
            <div>
              <span>Total Expenses</span>
              <strong>{formatCurrency(expenseTotal)}</strong>
            </div>
          </div>
          <div className="summary-card sale-tile">
            <div className="tile-icon">
              <IndianRupee size={19} />
            </div>
            <div>
              <span>Net Sales</span>
              <strong>{formatCurrency(saleTotals.gross - saleTotals.discounts)}</strong>
            </div>
          </div>
          <div
            className="summary-card user-tile clickable-tile"
            onClick={() => {
              setActiveView("users");
              setUserMessage("");
            }}
            title="Click to view users and passwords"
          >
            <div className="tile-icon">
              <UserCircle size={19} />
            </div>
            <div>
              <span>Available Users</span>
              <strong>{users.length}</strong>
            </div>
          </div>
        </section>

        {activeView === "purchases" ? (
          <section className="workspace" aria-label="Purchases workspace">
            <form className="entry-panel" onSubmit={handleAddPurchase}>
              <div className="panel-title">
                <PackagePlus size={20} />
                <h3>Add Purchase</h3>
              </div>

              <label>
                Article Number
                <input
                  value={articleNumber}
                  onChange={(event) => setArticleNumber(event.target.value)}
                  placeholder="e.g. SC-1035"
                />
              </label>

              <label>
                Amount
                <input
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  min="1"
                  placeholder="0"
                  type="number"
                />
              </label>

              <button className="primary-button" type="submit">
                Add to Table
              </button>
            </form>

            <section className="table-area">
              <div className="table-toolbar">
                <div>
                  <h3>Purchase Records</h3>
                  <p>{formatCurrency(purchaseTotal)} total amount</p>
                </div>
                <div className="download-actions">
                  <button
                    className="icon-button"
                    disabled={purchases.length === 0}
                    onClick={downloadPurchases}
                    title="Download XLSX"
                    type="button"
                  >
                    <Download size={18} />
                    <span>XLSX</span>
                  </button>
                  <button
                    className="icon-button"
                    disabled={purchases.length === 0}
                    onClick={downloadPurchasesPdf}
                    title="Download PDF"
                    type="button"
                  >
                    <FileText size={18} />
                    <span>PDF</span>
                  </button>
                </div>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Sr. No</th>
                      <th>Article Number</th>
                      <th>Amount</th>
                      <th aria-label="Actions"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.length === 0 ? (
                      <tr>
                        <td className="empty-state" colSpan="4">
                          No purchase records yet.
                        </td>
                      </tr>
                    ) : (
                      purchases.map((item, index) => (
                        <tr key={item.id}>
                          <td>{index + 1}</td>
                          <td>{item.articleNumber}</td>
                          <td>{formatCurrency(item.amount)}</td>
                          <td className="action-cell">
                            <button
                              className="delete-button"
                              onClick={() => handleDeletePurchase(item.id)}
                              title="Delete row"
                              type="button"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </section>
        ) : activeView === "expenses" ? (
          <section className="workspace" aria-label="Expenses workspace">
            <form className="entry-panel" onSubmit={handleAddExpense}>
              <div className="panel-title">
                <PlusCircle size={20} />
                <h3>Add Expense</h3>
              </div>

              <label>
                Expense Type
                <select value={expenseType} onChange={(event) => setExpenseType(event.target.value)}>
                  {expenseTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Amount
                <input
                  value={expenseAmount}
                  onChange={(event) => setExpenseAmount(event.target.value)}
                  min="1"
                  placeholder="0"
                  type="number"
                />
              </label>

              <button className="primary-button" type="submit">
                Add to Table
              </button>

              <div className="category-summary" aria-label="Expense totals by category">
                {expenseTotalsByType.map((item) => (
                  <div key={item.type}>
                    <span>{item.type}</span>
                    <strong>{formatCurrency(item.total)}</strong>
                  </div>
                ))}
              </div>
            </form>

            <section className="table-area">
              <div className="table-toolbar">
                <div>
                  <h3>Expense Records</h3>
                  <p>{formatCurrency(expenseTotal)} total amount</p>
                </div>
                <div className="download-actions">
                  <button
                    className="icon-button"
                    disabled={expenses.length === 0}
                    onClick={downloadExpenses}
                    title="Download XLSX"
                    type="button"
                  >
                    <Download size={18} />
                    <span>XLSX</span>
                  </button>
                  <button
                    className="icon-button"
                    disabled={expenses.length === 0}
                    onClick={downloadExpensesPdf}
                    title="Download PDF"
                    type="button"
                  >
                    <FileText size={18} />
                    <span>PDF</span>
                  </button>
                </div>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Sr. No</th>
                      <th>Expense Type</th>
                      <th>Amount</th>
                      <th aria-label="Actions"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.length === 0 ? (
                      <tr>
                        <td className="empty-state" colSpan="4">
                          No expense records yet.
                        </td>
                      </tr>
                    ) : (
                      expenses.map((item, index) => (
                        <tr key={item.id}>
                          <td>{index + 1}</td>
                          <td>{item.type}</td>
                          <td>{formatCurrency(item.amount)}</td>
                          <td className="action-cell">
                            <button
                              className="delete-button"
                              onClick={() => handleDeleteExpense(item.id)}
                              title="Delete row"
                              type="button"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </section>
        ) : activeView === "sales" ? (
          <section className="workspace sales-workspace" aria-label="Sales workspace">
            <form className="entry-panel sales-entry" onSubmit={handleAddSale}>
              <div className="panel-title">
                <IndianRupee size={20} />
                <h3>Add Sale</h3>
              </div>

              <label>
                Article Number
                <input
                  value={saleArticleNumber}
                  onChange={(event) => setSaleArticleNumber(event.target.value)}
                  placeholder="e.g. SC-1035"
                />
              </label>

              <div className="form-grid">
                <label>
                  Article Wise Sale
                  <input
                    value={saleAmount}
                    onChange={(event) => setSaleAmount(event.target.value)}
                    min="1"
                    placeholder="0"
                    type="number"
                  />
                </label>

                <label>
                  Discount
                  <input
                    value={saleDiscount}
                    onChange={(event) => setSaleDiscount(event.target.value)}
                    min="0"
                    placeholder="0"
                    type="number"
                  />
                </label>

                <label>
                  Card Sale
                  <input
                    value={cardSale}
                    onChange={(event) => setCardSale(event.target.value)}
                    min="0"
                    placeholder="0"
                    type="number"
                  />
                </label>

                <label>
                  Cash Sale
                  <input
                    value={cashSale}
                    onChange={(event) => setCashSale(event.target.value)}
                    min="0"
                    placeholder="0"
                    type="number"
                  />
                </label>

                <label className="full-field">
                  Courier Receivable
                  <input
                    value={courierReceivable}
                    onChange={(event) => setCourierReceivable(event.target.value)}
                    min="0"
                    placeholder="0"
                    type="number"
                  />
                </label>
              </div>

              <button className="primary-button" type="submit">
                Add to Table
              </button>

              <div className="category-summary" aria-label="Sales totals">
                <div>
                  <span>Gross Sales</span>
                  <strong>{formatCurrency(saleTotals.gross)}</strong>
                </div>
                <div>
                  <span>Discounts</span>
                  <strong>{formatCurrency(saleTotals.discounts)}</strong>
                </div>
                <div>
                  <span>Card Sales</span>
                  <strong>{formatCurrency(saleTotals.card)}</strong>
                </div>
                <div>
                  <span>Cash Sales</span>
                  <strong>{formatCurrency(saleTotals.cash)}</strong>
                </div>
                <div>
                  <span>Courier Receivables</span>
                  <strong>{formatCurrency(saleTotals.courier)}</strong>
                </div>
              </div>
            </form>

            <section className="table-area">
              <div className="table-toolbar">
                <div>
                  <h3>Sales Records</h3>
                  <p>{formatCurrency(saleTotals.gross - saleTotals.discounts)} net sales</p>
                </div>
                <div className="download-actions">
                  <button
                    className="icon-button"
                    disabled={sales.length === 0}
                    onClick={downloadSales}
                    title="Download XLSX"
                    type="button"
                  >
                    <Download size={18} />
                    <span>XLSX</span>
                  </button>
                  <button
                    className="icon-button"
                    disabled={sales.length === 0}
                    onClick={downloadSalesPdf}
                    title="Download PDF"
                    type="button"
                  >
                    <FileText size={18} />
                    <span>PDF</span>
                  </button>
                </div>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Sr. No</th>
                      <th>Article Number</th>
                      <th>Article Wise Sale</th>
                      <th>Discount</th>
                      <th>Card Sale</th>
                      <th>Cash Sale</th>
                      <th>Courier Receivable</th>
                      <th>Net Sale</th>
                      <th aria-label="Actions"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.length === 0 ? (
                      <tr>
                        <td className="empty-state" colSpan="9">
                          No sales records yet.
                        </td>
                      </tr>
                    ) : (
                      sales.map((item, index) => (
                        <tr key={item.id}>
                          <td>{index + 1}</td>
                          <td>{item.articleNumber}</td>
                          <td>{formatCurrency(item.saleAmount)}</td>
                          <td>{formatCurrency(item.discount)}</td>
                          <td>{formatCurrency(item.cardSale)}</td>
                          <td>{formatCurrency(item.cashSale)}</td>
                          <td>{formatCurrency(item.courierReceivable)}</td>
                          <td>{formatCurrency(item.saleAmount - item.discount)}</td>
                          <td className="action-cell">
                            <button
                              className="delete-button"
                              onClick={() => handleDeleteSale(item.id)}
                              title="Delete row"
                              type="button"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </section>
        ) : activeView === "users" ? (
          <section className="user-manager" aria-label="Add new user" style={{ marginTop: 0 }}>
            <div className="user-manager-layout">
              <div className="user-manager-form-section">
                <h4>Add New User</h4>
                <form className="user-form" onSubmit={handleAddUser}>
                  <label>
                    New Username
                    <input
                      value={newUsername}
                      onChange={(event) => setNewUsername(event.target.value)}
                      placeholder="Enter username"
                    />
                  </label>
                  <label>
                    New Password
                    <input
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder="Enter password"
                      type="password"
                    />
                  </label>
                  <button className="primary-button" type="submit">
                    Save User
                  </button>
                </form>
                {userMessage ? <p className="user-message">{userMessage}</p> : null}
              </div>

              <div className="user-manager-list-section">
                <h4>Registered Users & Passwords</h4>
                <div className="user-manager-table-wrapper">
                  <table className="user-manager-table">
                    <thead>
                      <tr>
                        <th>Sr. No</th>
                        <th>Username</th>
                        <th>Password</th>
                        <th aria-label="Actions"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>{user.username}</td>
                          <td>
                            <code className="password-display">{user.password}</code>
                          </td>
                          <td className="action-cell">
                            {user.username !== loggedInUser ? (
                              <button
                                className="delete-button"
                                onClick={() => handleDeleteUser(user.username)}
                                title="Delete user"
                                type="button"
                                style={{ padding: "4px", minHeight: "auto", height: "28px", width: "28px" }}
                              >
                                <Trash2 size={13} />
                              </button>
                            ) : (
                              <span style={{ fontSize: "0.75rem", color: "#64748b", fontStyle: "italic" }}>
                                Current
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
