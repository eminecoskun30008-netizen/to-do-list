const input = document.getElementById("todo-input");
const dateInput = document.getElementById("todo-date");
const addBtn = document.getElementById("add-btn");
const exportBtn = document.getElementById("export-btn");
const todoList = document.getElementById("todo-list");
const searchInput = document.getElementById("search-input");
const filterRadios = document.querySelectorAll('input[name="filter"]');
const themeToggle = document.getElementById("theme-toggle");

let todos = JSON.parse(localStorage.getItem("todos")) || [];

// LocalStorage'a kaydet
function saveToLocalStorage() {
  localStorage.setItem("todos", JSON.stringify(todos));
}

// Tarihe göre sıralama fonksiyonu
function sortByDate(arr) {
  return arr.slice().sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(a.date) - new Date(b.date);
  });
}

// Görevlerin durumuna göre filtrele ve ara fonksiyonu
function getFilteredTodos() {
  const filter = document.querySelector('input[name="filter"]:checked').value;
  let filtered = todos;

  if (filter === "completed") {
    filtered = todos.filter(todo => todo.completed);
  } else if (filter === "pending") {
    filtered = todos.filter(todo => !todo.completed);
  } else if (filter === "date") {
    filtered = sortByDate(todos);
  }

  const searchTerm = searchInput.value.toLowerCase();
  if (searchTerm) {
    filtered = filtered.filter(todo => todo.text.toLowerCase().includes(searchTerm));
  }

  return filtered;
}

// Görevler listesine göre renk belirle
function setDueColors(li, todo) {
  if (!todo.date) return;

  const today = new Date();
  const dueDate = new Date(todo.date);
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));

  li.classList.remove("due-soon", "due-today");
  li.style.backgroundColor = ""; // Önce sıfırla

  if (diffDays < 0) {
    // Geçmiş tarih - kırmızı
    li.style.backgroundColor = "#f87171";
  } else if (diffDays === 0) {
    li.classList.add("due-today"); // bugün
  } else if (diffDays <= 2) {
    li.classList.add("due-soon"); // 2 gün içinde
  }
}

// Render fonksiyonu (listeyi güncelle)
function renderTodos() {
  todoList.innerHTML = "";
  const filteredTodos = getFilteredTodos();

  filteredTodos.forEach((todo, index) => {
    const li = document.createElement("li");
    li.className = todo.completed ? "completed" : "";
    li.draggable = true;
    li.dataset.index = index;

    // Görev metni ve tarih
    const info = document.createElement("div");
    info.className = "info";
    info.textContent = todo.text + " - " + (todo.date ? todo.date : "Tarih yok");
    li.appendChild(info);

    setDueColors(li, todo);

    // Tamamlandı işareti tıklama
    info.addEventListener("click", () => {
      todo.completed = !todo.completed;
      saveToLocalStorage();
      renderTodos();
    });

    // Butonlar (Düzenle, Sil)
    const btnContainer = document.createElement("div");
    btnContainer.className = "buttons";

    // Düzenle butonu
    const editBtn = document.createElement("button");
    editBtn.textContent = "Düzenle";
    editBtn.addEventListener("click", () => {
      editTodo(index);
    });

    // Sil butonu
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Sil";
    deleteBtn.addEventListener("click", () => {
      todos.splice(index, 1);
      saveToLocalStorage();
      renderTodos();
    });

    btnContainer.appendChild(editBtn);
    btnContainer.appendChild(deleteBtn);
    li.appendChild(btnContainer);

    // Sürükle bırak olayları
    li.addEventListener("dragstart", dragStart);
    li.addEventListener("dragover", dragOver);
    li.addEventListener("drop", drop);
    li.addEventListener("dragend", dragEnd);

    todoList.appendChild(li);
  });
}

// Görev düzenleme fonksiyonu
function editTodo(index) {
  const newText = prompt("Görevi düzenle:", todos[index].text);
  if (newText === null) return; // iptal edildi
  if (newText.trim() === "") return alert("Görev boş olamaz!");

  const newDate = prompt("Tarihi düzenle (YYYY-MM-DD):", todos[index].date || "");
  if (newDate !== null && newDate.trim() !== "") {
    // Tarih geçerli mi diye kontrol et (basit)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate.trim())) {
      alert("Tarih formatı yanlış! (YYYY-MM-DD şeklinde olmalı)");
      return;
    }
    todos[index].date = newDate.trim();
  } else {
    todos[index].date = "";
  }

  todos[index].text = newText.trim();
  saveToLocalStorage();
  renderTodos();
}

// Yeni görev ekleme
addBtn.addEventListener("click", () => {
  const text = input.value.trim();
  const date = dateInput.value;

  if (text === "") {
    alert("Lütfen görev girin!");
    return;
  }

  todos.push({ text, completed: false, date });
  input.value = "";
  dateInput.value = "";
  saveToLocalStorage();
  renderTodos();
});

// Enter ile de ekleyebilirsin
input.addEventListener("keydown", e => {
  if (e.key === "Enter") addBtn.click();
});
dateInput.addEventListener("keydown", e => {
  if (e.key === "Enter") addBtn.click();
});

// Arama alanı
searchInput.addEventListener("input", renderTodos);

// Filtre radyo butonları
filterRadios.forEach(radio => {
  radio.addEventListener("change", renderTodos);
});

// Tema değiştirme
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  themeToggle.textContent = isDark ? "☀" : "🌙";
});

// Sayfa yüklendiğinde tema kontrolü
window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    themeToggle.textContent = "☀";
  }
  renderTodos();
});

// Dışa aktarma (JSON indir)
exportBtn.addEventListener("click", () => {
  const dataStr = JSON.stringify(todos, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "todos.json";
  a.click();
  URL.revokeObjectURL(url);
});

// Drag and Drop fonksiyonları
let draggedIndex = null;

function dragStart(e) {
  draggedIndex = +e.currentTarget.dataset.index;
  e.currentTarget.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
}

function dragOver(e) {
  e.preventDefault();
  const target = e.currentTarget;
  const targetIndex = +target.dataset.index;
  if (draggedIndex === null || draggedIndex === targetIndex) return;

  // Fare pozisyonuna göre yer değiştir
  const rect = target.getBoundingClientRect();
  const halfway = rect.top + rect.height / 2;

  if (e.clientY < halfway) {
    todoList.insertBefore(todoList.children[draggedIndex], target);
  } else {
    todoList.insertBefore(todoList.children[draggedIndex], target.nextSibling);
  }
}

function drop(e) {
  e.preventDefault();
  const target = e.currentTarget;
  const targetIndex = +target.dataset.index;
  if (draggedIndex === null || draggedIndex === targetIndex) return;

  // Todos sırasını güncelle
  const movedItem = todos.splice(draggedIndex, 1)[0];
  todos.splice(targetIndex, 0, movedItem);
  saveToLocalStorage();
  renderTodos();
  draggedIndex = null;
}

function dragEnd(e) {
  e.currentTarget.classList.remove("dragging");
  draggedIndex = null;
}