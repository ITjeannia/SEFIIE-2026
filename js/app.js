// ===== NAVBAR SCROLL =====
const navbar = document.getElementById("navbar");
window.addEventListener("scroll", () => {
  navbar.classList.toggle("scrolled", window.scrollY > 50);
});

// ===== HAMBURGER =====
const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("nav-links");
hamburger.addEventListener("click", () => navLinks.classList.toggle("open"));
document.querySelectorAll(".nav-links a").forEach(l => l.addEventListener("click", () => navLinks.classList.remove("open")));

// ===== VOTES =====
const VOTES_KEY = "sefiie_votes_2026";
const COUNTS_KEY = "sefiie_counts_2026";

const getVotes = () => { try { return JSON.parse(localStorage.getItem(VOTES_KEY)) || {}; } catch { return {}; } };
const saveVotes = v => localStorage.setItem(VOTES_KEY, JSON.stringify(v));
const getCounts = () => { try { return JSON.parse(localStorage.getItem(COUNTS_KEY)) || {}; } catch { return {}; } };
const saveCounts = c => localStorage.setItem(COUNTS_KEY, JSON.stringify(c));

function showToast(msg, type) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = "toast show " + (type || "success");
  setTimeout(() => { t.className = "toast"; }, 3000);
}

function initVotes() {
  const votes = getVotes();
  const counts = getCounts();
  document.querySelectorAll(".vote-btn").forEach(btn => {
    const cat = btn.dataset.category;
    const id = btn.dataset.id;
    const key = cat + "_" + id;
    if (!counts[key]) counts[key] = 0;
    btn.querySelector(".vote-count").textContent = counts[key];
    if (votes[cat] === id) {
      btn.classList.add("active");
      btn.closest(".cand-card").classList.add("voted");
    }
    btn.addEventListener("click", () => handleVote(cat, id, btn));
  });
  saveCounts(counts);
}

function handleVote(cat, id, btn) {
  const votes = getVotes();
  const counts = getCounts();
  const key = cat + "_" + id;
  const labels = { entrepreneuse: "Meilleure Entrepreneuse", deleguee: "Meilleure Deleguee Feminine", presidente: "Meilleure Presidente de Club", miss: "Miss SEFIIE 2026" };

  if (votes[cat] === id) {
    showToast("Vous avez deja vote dans cette categorie.", "error");
    return;
  }
  if (votes[cat]) {
    const prevKey = cat + "_" + votes[cat];
    if (counts[prevKey] > 0) counts[prevKey]--;
    const prevBtn = document.querySelector(".vote-btn[data-category='" + cat + "'][data-id='" + votes[cat] + "']");
    if (prevBtn) {
      prevBtn.classList.remove("active");
      prevBtn.querySelector(".vote-count").textContent = counts[prevKey];
      prevBtn.closest(".cand-card").classList.remove("voted");
    }
  }
  votes[cat] = id;
  if (!counts[key]) counts[key] = 0;
  counts[key]++;
  btn.classList.add("active");
  btn.querySelector(".vote-count").textContent = counts[key];
  btn.closest(".cand-card").classList.add("voted");
  saveVotes(votes);
  saveCounts(counts);
  showToast("Vote enregistre : " + labels[cat] + " !", "success");
}

function initAnimations() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); });
  }, { threshold: 0.1 });
  document.querySelectorAll(".acard, .tl-item, .cand-card, .stat-item").forEach(el => {
    el.classList.add("fade-in");
    obs.observe(el);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    const loader = document.getElementById("loader");
    if (loader) loader.classList.add("hidden");
  }, 2000);
  initVotes();
  initAnimations();
});