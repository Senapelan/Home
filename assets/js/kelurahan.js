const mobileMenu = document.getElementById("mobileMenu");
const overlay = document.querySelector(".menu-overlay");

/* ===== OPEN / CLOSE MENU ===== */
function openMenu(){
  mobileMenu.classList.add("active");
  overlay.classList.add("active");
}

function closeMenu(){
  mobileMenu.classList.remove("active");
  overlay.classList.remove("active");

  // tutup semua submenu saat menu ditutup
  document.querySelectorAll(".submenu").forEach(sub=>{
    sub.style.display = "none";
  });
  document.querySelectorAll(".mobile-menu a[onclick]").forEach(a=>{
    a.classList.remove("active");
  });
}

overlay.addEventListener("click", closeMenu);

/* ===== TOGGLE SUBMENU + PANAH ===== */
function toggleSub(id){
  const sub = document.getElementById(id);
  const btn = event.currentTarget;
  const isOpen = sub.style.display === "block";

  // tutup semua submenu & reset panah
  document.querySelectorAll(".submenu").forEach(el=>{
    el.style.display = "none";
  });
  document.querySelectorAll(".mobile-menu a[onclick]").forEach(a=>{
    a.classList.remove("active");
  });

  // kalau sebelumnya tertutup → buka
  if(!isOpen){
    sub.style.display = "block";
    btn.classList.add("active");
  }
}

/* ===== HEADER SCROLL ===== */
window.addEventListener("scroll", ()=>{
  document.getElementById("header")
    .classList.toggle("scrolled", window.scrollY > 50);
});
