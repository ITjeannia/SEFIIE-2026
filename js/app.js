// ===== LOADER =====
function hideLoader() {
  var loader = document.getElementById("loader");
  if (loader) {
    loader.style.transition = "opacity 0.5s ease";
    loader.style.opacity = "0";
    setTimeout(function() { loader.style.display = "none"; }, 500);
  }
}
setTimeout(hideLoader, 2500);
window.addEventListener("load", function() { setTimeout(hideLoader, 1800); });

// ===== NAVBAR =====
window.addEventListener("scroll", function() {
  var nb = document.getElementById("navbar");
  if (nb) nb.classList.toggle("scrolled", window.scrollY > 50);
});

// ===== HAMBURGER =====
document.addEventListener("DOMContentLoaded", function() {
  var hbtn = document.getElementById("hamburger");
  var nav  = document.getElementById("nav-links");
  if (hbtn) hbtn.addEventListener("click", function() { nav.classList.toggle("open"); });
  document.querySelectorAll(".nav-links a").forEach(function(a) {
    a.addEventListener("click", function() { nav.classList.remove("open"); });
  });
});

// ===== TOAST =====
function showToast(msg, type) {
  var t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.className = "toast show " + (type || "success");
  setTimeout(function() { t.className = "toast"; }, 3500);
}

// ===== STORAGE LOCAL =====
var DONE_KEY = "sefiie_votes_done_2026";
var SEL_KEY  = "sefiie_votes_sel_2026";
function getDone() { try { return JSON.parse(localStorage.getItem(DONE_KEY)) || {}; } catch(e) { return {}; } }
function saveDone(v) { localStorage.setItem(DONE_KEY, JSON.stringify(v)); }
function getSel()  { try { return JSON.parse(localStorage.getItem(SEL_KEY))  || {}; } catch(e) { return {}; } }
function saveSel(v)  { localStorage.setItem(SEL_KEY,  JSON.stringify(v)); }

// ===== FIREBASE =====
var db = null;
var firebaseOK = false;
function initFirebase() {
  try {
    var fbLib = window.firebase;
    if (!fbLib) throw new Error("SDK absent");
    if (!fbLib.apps.length) {
      fbLib.initializeApp({
        apiKey: "AIzaSyDqo__ubM_dwBGXEdkF_XcAwAfIPn0jldo",
        authDomain: "sefiie-2026.firebaseapp.com",
        projectId: "sefiie-2026",
        storageBucket: "sefiie-2026.firebasestorage.app",
        messagingSenderId: "806185705172",
        appId: "1:806185705172:web:efb5d35f587c48cc936541"
      });
    }
    db = fbLib.firestore();
    firebaseOK = true;
    console.log("[SEFIIE] Firebase OK");
  } catch(e) {
    console.warn("[SEFIIE] Firebase indisponible:", e.message);
  }
}

// ===== CHARGER COMPTEURS =====
function loadAndRender() {
  if (!firebaseOK) { renderUI({}); return; }
  db.collection("votes").get()
    .then(function(snap) {
      var counts = {};
      snap.forEach(function(d) { counts[d.id] = d.data().count || 0; });
      renderUI(counts);
    })
    .catch(function() { renderUI({}); });
}

// ===== RENDER UI =====
function renderUI(counts) {
  var done = getDone();
  var sel  = getSel();

  // Afficher tous les compteurs
  document.querySelectorAll(".vote-btn").forEach(function(btn) {
    var key = btn.dataset.category + "_" + btn.dataset.id;
    btn.querySelector(".vote-count").textContent = counts[key] || 0;
  });

  ["deleguee", "presidente", "entrepreneuse", "miss"].forEach(function(cat) {
    var vBtn = document.getElementById("vbtn-" + cat);

    if (done[cat]) {
      lockCategory(cat, done[cat]);
      return;
    }

    // Brancher chaque bouton candidat
    document.querySelectorAll(".vote-btn[data-category='" + cat + "']").forEach(function(btn) {
      var id = btn.dataset.id;
      if (sel[cat] === id) {
        btn.classList.add("active");
        btn.closest(".cand-card").classList.add("voted");
        if (vBtn) vBtn.disabled = false;
      }
      btn.addEventListener("click", function() { onSelect(cat, id, btn, vBtn); });
    });

    // Brancher le bouton valider
    if (vBtn) {
      vBtn.addEventListener("click", function() { onValidate(cat, vBtn); });
    }
  });
}

// ===== SELECTION =====
function onSelect(cat, id, btn, vBtn) {
  var sel = getSel();
  // Deselectionner l'ancienne
  if (sel[cat] && sel[cat] !== id) {
    var old = document.querySelector(".vote-btn[data-category='" + cat + "'][data-id='" + sel[cat] + "']");
    if (old) { old.classList.remove("active"); old.closest(".cand-card").classList.remove("voted"); }
  }
  sel[cat] = id;
  saveSel(sel);
  btn.classList.add("active");
  btn.closest(".cand-card").classList.add("voted");
  // Activer le bouton valider directement via la reference passee
  if (vBtn) vBtn.disabled = false;
}

// ===== VALIDATION =====
function onValidate(cat, vBtn) {
  var id = getSel()[cat];
  if (!id) { showToast("Choisissez une candidate d'abord.", "error"); return; }

  vBtn.disabled = true;
  vBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enregistrement...';

  var key = cat + "_" + id;
  var labels = { deleguee: "Meilleure Deleguee Feminine", presidente: "Meilleure Presidente de Club", entrepreneuse: "Meilleure Entrepreneuse", miss: "Miss SEFIIE 2026" };

  function onSuccess(newCount) {
    var countEl = document.querySelector(".vote-btn[data-category='" + cat + "'][data-id='" + id + "'] .vote-count");
    if (countEl) countEl.textContent = newCount;
    var done = getDone(); done[cat] = id; saveDone(done);
    lockCategory(cat, id);
    showToast("Vote confirme : " + labels[cat] + " !", "success");
  }

  function onError(msg) {
    console.error("[SEFIIE] Erreur:", msg);
    showToast("Erreur reseau, reessayez.", "error");
    vBtn.disabled = false;
    vBtn.innerHTML = '<i class="fas fa-check-circle"></i> Valider mon vote';
  }

  if (firebaseOK) {
    var ref = db.collection("votes").doc(key);
    db.runTransaction(function(tx) {
      return tx.get(ref).then(function(snap) {
        var next = (snap.exists ? (snap.data().count || 0) : 0) + 1;
        tx.set(ref, { count: next, category: cat, candidateId: id });
        return next;
      });
    })
    .then(function(n) { onSuccess(n); })
    .catch(function(e) { onError(e.message); });
  } else {
    var el = document.querySelector(".vote-btn[data-category='" + cat + "'][data-id='" + id + "'] .vote-count");
    onSuccess((parseInt(el ? el.textContent : "0") || 0) + 1);
  }
}

// ===== VERROUILLER =====
function lockCategory(cat, votedId) {
  document.querySelectorAll(".vote-btn[data-category='" + cat + "']").forEach(function(b) {
    b.style.pointerEvents = "none";
    b.style.opacity = "0.35";
  });
  var grid = document.querySelector(".candidates-grid[data-category='" + cat + "']");
  if (grid) {
    var card = grid.querySelector(".cand-card[data-id='" + votedId + "']");
    if (card) {
      card.classList.add("voted"); card.style.opacity = "1";
      var cb = card.querySelector(".vote-btn");
      if (cb) cb.style.opacity = "1";
    }
  }
  var row = document.getElementById("validate-" + cat);
  if (row) row.innerHTML = '<span class="validated-label"><i class="fas fa-check-circle"></i> Vote confirme  merci !</span>';
}

// ===== ANIMATIONS =====
function initAnimations() {
  var obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) { if (e.isIntersecting) e.target.classList.add("visible"); });
  }, { threshold: 0.1 });
  document.querySelectorAll(".acard, .tl-item, .cand-card, .stat-item").forEach(function(el) {
    el.classList.add("fade-in"); obs.observe(el);
  });
}

// ===== DEMARRAGE =====
document.addEventListener("DOMContentLoaded", function() {
  initFirebase();
  loadAndRender();
  initAnimations();
});