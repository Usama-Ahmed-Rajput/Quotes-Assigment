import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// config
const firebaseConfig = {
  apiKey: "AIzaSyB0mh4TZrU8e7tcj8l_-3Qk2TlUkaLnLgI",
  authDomain: "quotes-6432a.firebaseapp.com",
  projectId: "quotes-6432a",
  storageBucket: "quotes-6432a.firebasestorage.app",
  messagingSenderId: "324853343893",
  appId: "1:324853343893:web:ba1987a7fac6cd48181d9c",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const quoteCollection = collection(db, "quotes");

// ye 3 cheezein chahiye thi
const quoteInput = document.getElementById("quoteInput");
const addbtn = document.getElementById("addBtn");
const quoteList = document.getElementById("quoteList");

let editingDocId = null; 

addbtn.addEventListener("click", addQuote);
quoteInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addQuote();
});

async function addQuote() {
  const val = quoteInput.value.trim();
  if (!val) {
    showToast("Please enter a quote!", "error");
    return;
  }

  addbtn.classList.add("loading");
  addbtn.innerHTML = "Adding…";

  try {
    await addDoc(quoteCollection, {
      quote: val,
      time: serverTimestamp(),
    });
    showToast("Quote added! ", "success");
    quoteInput.value = "";
    await loadQuotes();
  } catch (e) {
    console.error(e);
    showToast("Failed to add. Check Firebase rules.", "error");
  }

  addbtn.classList.remove("loading");
  addbtn.innerHTML = "<span>＋</span> Add Quote";
}

async function loadQuotes() {
  quoteList.innerHTML = "";

  try {
    const querySnapshot = await getDocs(quoteCollection);

    document.getElementById("countBadge").textContent =
      `${querySnapshot.size} quote${querySnapshot.size !== 1 ? "s" : ""}`;

    if (querySnapshot.empty) {
      quoteList.innerHTML = `<div class="empty"><div class="empty-icon">❝</div><p>No quotes yet. Add your first one above!</p></div>`;
      return;
    }

    let i = 0;
    querySnapshot.forEach((docSnap) => {
      const li = document.createElement("li");
      li.style.animationDelay = `${i * 0.06}s`;

      const icon = document.createElement("span");
      icon.className = "quote-icon";
      icon.textContent = "❝";

      const wrap = document.createElement("div");
      wrap.className = "quote-text-wrap";

      const text = document.createElement("div");
      text.className = "quote-text";
      text.textContent = docSnap.data().quote;

      // time wala part 
      const timeEl = document.createElement("div");
      timeEl.className = "quote-time";
      const ts = docSnap.data().time;
      timeEl.textContent = ts
        ? new Date(ts.seconds * 1000).toLocaleString()
        : "Just now";

      wrap.appendChild(text);
      wrap.appendChild(timeEl);

      const actions = document.createElement("div");
      actions.className = "actions";

      const editBtn = document.createElement("button");
      editBtn.className = "btn-edit";
      editBtn.innerHTML = "✎ Edit";
      editBtn.addEventListener("click", () => openEditModal(docSnap.id, docSnap.data().quote));

      // delte btn
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "btn-delete";
      deleteBtn.innerHTML = "✕ Delete";
      deleteBtn.addEventListener("click", () => handleDelete(docSnap.id, li));

      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);

      li.appendChild(icon);
      li.appendChild(wrap);
      li.appendChild(actions);
      quoteList.appendChild(li);
      i++;
    });
  } catch (e) {
    console.error(e);
    quoteList.innerHTML = `<div class="empty"><div class="empty-icon">⚠️</div><p>Could not load quotes. Check Firebase rules.</p></div>`;
  }
}

async function handleDelete(id, li) {
  // pehle animate hoga
  li.style.transition = "opacity 0.2s, transform 0.2s";
  li.style.opacity = "0";
  li.style.transform = "translateX(20px)";
  setTimeout(async () => {
    try {
      await deleteDoc(doc(db, "quotes", id));
      showToast("Quote deleted.", "info");
      await loadQuotes();
    } catch (e) {
      console.error(e);
      showToast("Delete failed.", "error");
    }
  }, 200);
}

function openEditModal(id, oldQuote) {
  editingDocId = id;
  document.getElementById("editInput").value = oldQuote;
  document.getElementById("modalBg").classList.add("open");
  setTimeout(() => document.getElementById("editInput").focus(), 100);
}

window.closeModal = function () {
  document.getElementById("modalBg").classList.remove("open");
  editingDocId = null;
};

window.saveEdit = async function () {
  const newQuote = document.getElementById("editInput").value.trim();
  if (!newQuote) {
    showToast("Quote cannot be empty.", "error");
    return;
  }
  try {
    await updateDoc(doc(db, "quotes", editingDocId), { quote: newQuote });
    showToast("Quote updated! ✅", "success");
    closeModal();
    await loadQuotes();
  } catch (e) {
    console.error(e);
    showToast("Update failed.", "error"); // TODO: better error message
  }
};

// toast 3 sec baad chala jata hai
function showToast(msg, type = "info") {
  const t = document.getElementById("toast");
  const icons = { success: "✅", error: "❌", info: "ℹ️" };
  t.innerHTML = `${icons[type] || ""} ${msg}`;
  t.className = `toast ${type} show`;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), 3000);
}

loadQuotes();
