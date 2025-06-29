let quotes = [];
const SERVER_URL = "https://jsonplaceholder.typicode.com/posts";

function loadQuotes() {
  const stored = localStorage.getItem("quotes");
  quotes = stored
    ? JSON.parse(stored)
    : [
        {
          text: "The best way to predict the future is to invent it.",
          category: "inspiration",
        },
        {
          text: "Do not be afraid to give up the good to go for the great.",
          category: "motivation",
        },
        {
          text: "You miss 100% of the shots you don't take.",
          category: "sports",
        },
      ];
}

function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

function saveLastCategory(category) {
  localStorage.setItem("lastCategory", category);
}

function getLastCategory() {
  return localStorage.getItem("lastCategory") || "all";
}

const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteButton = document.getElementById("newQuote");
const categoryFilter = document.getElementById("categoryFilter");
const notification = document.getElementById("notification");

function showNotification(message) {
  notification.textContent = message;
  setTimeout(() => {
    notification.textContent = "";
  }, 4000);
}

function showRandomQuote() {
  const selectedCategory = categoryFilter.value;
  let filteredQuotes =
    selectedCategory === "all"
      ? quotes
      : quotes.filter((q) => q.category === selectedCategory);
  if (filteredQuotes.length === 0) {
    quoteDisplay.innerHTML = `No quotes available in this category.`;
    return;
  }
  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const quote = filteredQuotes[randomIndex];
  quoteDisplay.innerHTML = `"${quote.text}" — <strong>[${quote.category}]</strong>`;
  sessionStorage.setItem("lastQuote", JSON.stringify(quote));
}

function addQuote() {
  const textInput = document.getElementById("newQuoteText");
  const categoryInput = document.getElementById("newQuoteCategory");
  const newQuote = textInput.value.trim();
  const newCategory = categoryInput.value.trim();
  if (newQuote && newCategory) {
    const quoteObj = { text: newQuote, category: newCategory };
    quotes.push(quoteObj);
    textInput.value = "";
    categoryInput.value = "";
    saveQuotes();
    populateCategories();
    sendQuoteToServer(quoteObj);
    alert("Quote added successfully!");
  } else {
    alert("Please fill in both fields.");
  }
}

function createAddQuoteForm() {
  const formContainer = document.getElementById("formContainer");
  const quoteInput = document.createElement("input");
  quoteInput.id = "newQuoteText";
  quoteInput.type = "text";
  quoteInput.placeholder = "Enter a new quote";
  const categoryInput = document.createElement("input");
  categoryInput.id = "newQuoteCategory";
  categoryInput.type = "text";
  categoryInput.placeholder = "Enter quote category";
  const addButton = document.createElement("button");
  addButton.textContent = "Add Quote";
  addButton.addEventListener("click", addQuote);
  formContainer.appendChild(quoteInput);
  formContainer.appendChild(categoryInput);
  formContainer.appendChild(addButton);
}

function populateCategories() {
  const categories = [...new Set(quotes.map((q) => q.category))];
  const currentSelection = getLastCategory();
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';
  categories.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    if (cat === currentSelection) option.selected = true;
    categoryFilter.appendChild(option);
  });
}

function filterQuotes() {
  saveLastCategory(categoryFilter.value);
  showRandomQuote();
}

function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function (e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      if (Array.isArray(importedQuotes)) {
        quotes.push(...importedQuotes);
        saveQuotes();
        populateCategories();
        alert("Quotes imported successfully!");
      } else {
        alert("Invalid JSON format.");
      }
    } catch (err) {
      alert("Error reading JSON file.");
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

function exportQuotesToJson() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "quotes.json";
  link.click();
  URL.revokeObjectURL(url);
}

async function sendQuoteToServer(quote) {
  try {
    const response = await fetch(SERVER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(quote),
    });
    if (response.ok) {
      console.log("Quote posted to server.");
    } else {
      console.warn("Failed to post quote to server.");
    }
  } catch (err) {
    console.error("Error posting quote:", err);
  }
}

async function syncQuotes() {
  try {
    const response = await fetch(SERVER_URL);
    const data = await response.json();
    if (Array.isArray(data)) {
      const serverQuotes = data.map((post) => ({
        text: post.title,
        category: "server",
      }));
      const allQuotes = [...serverQuotes, ...quotes];
      quotes = Array.from(new Map(allQuotes.map((q) => [q.text, q])).values());
      saveQuotes();
      populateCategories();
      showNotification("Quotes synced with server!");
    }
  } catch (error) {
    console.error("Error syncing with server:", error);
  }
}

newQuoteButton.addEventListener("click", showRandomQuote);
document
  .getElementById("importFile")
  .addEventListener("change", importFromJsonFile);
document
  .getElementById("exportBtn")
  .addEventListener("click", exportQuotesToJson);

loadQuotes();
createAddQuoteForm();
populateCategories();

const lastQuote = sessionStorage.getItem("lastQuote");
if (lastQuote) {
  const quote = JSON.parse(lastQuote);
  quoteDisplay.innerHTML = `"${quote.text}" — <strong>[${quote.category}]</strong>`;
}

syncQuotes();
setInterval(syncQuotes, 60000);
async function fetchQuotesFromServer() {
  await syncQuotes();
}
