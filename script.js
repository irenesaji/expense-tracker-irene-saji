const STORAGE_KEY = "expenseTrackerTransactions";

let transactions = loadTransactions();

const elements = {
    totalIncome: document.getElementById("totalIncome"),
    totalExpense: document.getElementById("totalExpense"),
    balance: document.getElementById("balance"),

    transactionList: document.getElementById("transactionList"),
    transactionCount: document.getElementById("transactionCount"),
    emptyState: document.getElementById("emptyState"),

    typeFilter: document.getElementById("typeFilter"),
    categoryFilter: document.getElementById("categoryFilter"),
    searchInput: document.getElementById("searchInput"),

    modal: document.getElementById("modal"),
    modalTitle: document.getElementById("modalTitle"),
    transactionForm: document.getElementById("transactionForm"),
    transactionId: document.getElementById("transactionId"),

    amount: document.getElementById("amount"),
    category: document.getElementById("category"),
    date: document.getElementById("date"),
    description: document.getElementById("description"),

    formError: document.getElementById("formError"),

    monthlyExpense: document.getElementById("monthlyExpense"),
    categorySummary: document.getElementById("categorySummary")
};


/* ---------------- STORAGE ---------------- */

function loadTransactions() {
    try {
        const savedTransactions =
            localStorage.getItem(STORAGE_KEY);

        return savedTransactions
            ? JSON.parse(savedTransactions)
            : [];
    } catch {
        return [];
    }
}


function saveTransactions() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(transactions)
    );
}


/* ---------------- FORMATTING ---------------- */

function formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR"
    }).format(amount);
}


function formatDate(date) {
    return new Date(date + "T00:00:00").toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


function getTodayDate() {
    const date = new Date();

    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


/* ---------------- SUMMARY ---------------- */

function updateSummary() {
    const income = transactions
        .filter(transaction => transaction.type === "income")
        .reduce(
            (total, transaction) =>
                total + transaction.amount,
            0
        );

    const expense = transactions
        .filter(transaction => transaction.type === "expense")
        .reduce(
            (total, transaction) =>
                total + transaction.amount,
            0
        );

    const balance = income - expense;

    elements.totalIncome.textContent =
        formatCurrency(income);

    elements.totalExpense.textContent =
        formatCurrency(expense);

    elements.balance.textContent =
        formatCurrency(balance);
}


/* ---------------- FILTERS ---------------- */

function updateCategoryFilter() {
    const currentValue =
        elements.categoryFilter.value;

    const categories = [
        ...new Set(
            transactions.map(
                transaction => transaction.category
            )
        )
    ].sort();

    elements.categoryFilter.innerHTML = `
        <option value="all">
            All Categories
        </option>

        ${categories.map(category => `
            <option value="${escapeHtml(category)}">
                ${escapeHtml(category)}
            </option>
        `).join("")}
    `;

    if (categories.includes(currentValue)) {
        elements.categoryFilter.value =
            currentValue;
    }
}


function getFilteredTransactions() {
    const type =
        elements.typeFilter.value;

    const category =
        elements.categoryFilter.value;

    const search =
        elements.searchInput.value
            .trim()
            .toLowerCase();

    return transactions
        .filter(transaction => {

            const matchesType =
                type === "all" ||
                transaction.type === type;

            const matchesCategory =
                category === "all" ||
                transaction.category === category;

            const matchesSearch =
                transaction.description
                    .toLowerCase()
                    .includes(search);

            return (
                matchesType &&
                matchesCategory &&
                matchesSearch
            );
        })
        .sort(
            (a, b) =>
                new Date(b.date) -
                new Date(a.date)
        );
}


/* ---------------- DISPLAY ---------------- */

function displayTransactions() {
    const filteredTransactions =
        getFilteredTransactions();

    elements.transactionList.innerHTML = "";

    elements.transactionCount.textContent =
        `${filteredTransactions.length} ${
            filteredTransactions.length === 1
                ? "transaction"
                : "transactions"
        }`;

    if (filteredTransactions.length === 0) {
        elements.emptyState.style.display = "block";
        return;
    }

    elements.emptyState.style.display = "none";

    filteredTransactions.forEach(transaction => {
        const item =
            document.createElement("div");

        item.className = "transaction";

        const sign =
            transaction.type === "income"
                ? "+"
                : "-";

        item.innerHTML = `
            <div class="transaction-icon ${transaction.type}">
                ${sign}
            </div>

            <div class="transaction-info">
                <h3>
                    ${escapeHtml(transaction.description)}
                </h3>

                <p>
                    ${escapeHtml(transaction.category)}
                    ·
                    ${formatDate(transaction.date)}
                </p>
            </div>

            <div class="transaction-amount ${transaction.type}">
                ${sign}${formatCurrency(transaction.amount)}
            </div>

            <div class="transaction-actions">

                <button
                    class="icon-btn"
                    type="button"
                    title="Edit transaction"
                    aria-label="Edit transaction"
                    data-action="edit"
                    data-id="${transaction.id}"
                >
                    ✎
                </button>

                <button
                    class="icon-btn"
                    type="button"
                    title="Delete transaction"
                    aria-label="Delete transaction"
                    data-action="delete"
                    data-id="${transaction.id}"
                >
                    ×
                </button>

            </div>
        `;

        elements.transactionList.appendChild(item);
    });
}


/* ---------------- MONTHLY SUMMARY ---------------- */

function updateMonthlySummary() {
    const now = new Date();

    const currentMonth =
        now.getMonth();

    const currentYear =
        now.getFullYear();

    const monthlyExpenses =
        transactions.filter(transaction => {

            const date =
                new Date(
                    transaction.date +
                    "T00:00:00"
                );

            return (
                transaction.type === "expense" &&
                date.getMonth() === currentMonth &&
                date.getFullYear() === currentYear
            );
        });

    const total =
        monthlyExpenses.reduce(
            (sum, transaction) =>
                sum + transaction.amount,
            0
        );

    elements.monthlyExpense.textContent =
        formatCurrency(total);


    const categoryTotals = {};

    monthlyExpenses.forEach(transaction => {

        categoryTotals[transaction.category] =
            (categoryTotals[transaction.category] || 0) +
            transaction.amount;
    });


    const categories =
        Object.entries(categoryTotals)
            .sort((a, b) => b[1] - a[1]);


    if (categories.length === 0) {
        elements.categorySummary.innerHTML = `
            <p>
                No expenses recorded this month.
            </p>
        `;

        return;
    }


    const highestAmount =
        categories[0][1];


    elements.categorySummary.innerHTML =
        categories
            .map(([category, amount]) => {

                const percentage =
                    (amount / highestAmount) * 100;

                return `
                    <div class="category-row">

                        <div class="category-info">

                            <span>
                                ${escapeHtml(category)}
                            </span>

                            <span>
                                ${formatCurrency(amount)}
                            </span>

                        </div>

                        <div class="category-bar">

                            <div
                                class="category-fill"
                                style="width: ${percentage}%"
                            ></div>

                        </div>

                    </div>
                `;
            })
            .join("");
}


/* ---------------- MODAL ---------------- */

function openModal(transaction = null) {

    elements.modal.classList.add("show");

    elements.formError.textContent = "";

    if (transaction) {

        elements.modalTitle.textContent =
            "Edit Transaction";

        elements.transactionId.value =
            transaction.id;

        elements.amount.value =
            transaction.amount;

        elements.category.value =
            transaction.category;

        elements.date.value =
            transaction.date;

        elements.description.value =
            transaction.description;

        document.querySelector(
            `input[name="transactionType"][value="${transaction.type}"]`
        ).checked = true;

    } else {

        elements.modalTitle.textContent =
            "Add Transaction";

        elements.transactionForm.reset();

        elements.transactionId.value = "";

        elements.date.value =
            getTodayDate();

        document.querySelector(
            'input[name="transactionType"][value="expense"]'
        ).checked = true;
    }

    elements.amount.focus();
}


function closeModal() {
    elements.modal.classList.remove("show");

    elements.transactionForm.reset();

    elements.formError.textContent = "";
}


/* ---------------- ADD / EDIT ---------------- */

function handleFormSubmit(event) {

    event.preventDefault();

    const amount =
        Number(elements.amount.value);

    const category =
        elements.category.value;

    const date =
        elements.date.value;

    const description =
        elements.description.value.trim();

    const type =
        document.querySelector(
            'input[name="transactionType"]:checked'
        ).value;


    if (amount <= 0) {

        elements.formError.textContent =
            "Please enter an amount greater than zero.";

        elements.amount.focus();

        return;
    }


    if (!category || !date || !description) {

        elements.formError.textContent =
            "Please fill in all fields.";

        return;
    }


    const id =
        elements.transactionId.value;


    if (id) {

        const transaction =
            transactions.find(
                item => item.id === id
            );

        if (transaction) {

            transaction.type = type;
            transaction.amount = amount;
            transaction.category = category;
            transaction.date = date;
            transaction.description = description;
        }

    } else {

        transactions.push({
            id: Date.now().toString(),
            type,
            amount,
            category,
            date,
            description
        });
    }


    saveTransactions();

    refreshApp();

    closeModal();
}


/* ---------------- EDIT ---------------- */

function editTransaction(id) {

    const transaction =
        transactions.find(
            item => item.id === id
        );

    if (transaction) {
        openModal(transaction);
    }
}


/* ---------------- DELETE ---------------- */

function deleteTransaction(id) {

    const transaction =
        transactions.find(
            item => item.id === id
        );

    if (!transaction) {
        return;
    }


    const confirmed =
        window.confirm(
            `Delete "${transaction.description}"?`
        );


    if (!confirmed) {
        return;
    }


    transactions =
        transactions.filter(
            item => item.id !== id
        );


    saveTransactions();

    refreshApp();
}


/* ---------------- SECURITY ---------------- */

function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent = value;

    return div.innerHTML;
}


/* ---------------- REFRESH ---------------- */

function refreshApp() {

    updateSummary();

    updateCategoryFilter();

    displayTransactions();

    updateMonthlySummary();
}


/* ---------------- EVENTS ---------------- */

document
    .getElementById("addTransactionBtn")
    .addEventListener(
        "click",
        () => openModal()
    );


document
    .getElementById("closeModalBtn")
    .addEventListener(
        "click",
        closeModal
    );


document
    .getElementById("cancelBtn")
    .addEventListener(
        "click",
        closeModal
    );


elements.transactionForm
    .addEventListener(
        "submit",
        handleFormSubmit
    );


elements.typeFilter
    .addEventListener(
        "change",
        displayTransactions
    );


elements.categoryFilter
    .addEventListener(
        "change",
        displayTransactions
    );


elements.searchInput
    .addEventListener(
        "input",
        displayTransactions
    );


/* Event delegation for edit/delete */

elements.transactionList
    .addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "button[data-action]"
                );

            if (!button) {
                return;
            }

            const id =
                button.dataset.id;

            const action =
                button.dataset.action;

            if (action === "edit") {
                editTransaction(id);
            }

            if (action === "delete") {
                deleteTransaction(id);
            }
        }
    );


/* Close when clicking outside */

elements.modal.addEventListener(
    "click",
    event => {

        if (event.target === elements.modal) {
            closeModal();
        }
    }
);


/* Escape key */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            elements.modal.classList.contains("show")
        ) {
            closeModal();
        }
    }
);


/* Initial render */

refreshApp();