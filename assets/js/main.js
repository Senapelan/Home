const mobileMenu = document.getElementById("mobileMenu");
const overlay = document.querySelector(".menu-overlay");

/* buka menu */
function openMenu(){
  mobileMenu.classList.add("active");
  overlay.classList.add("active");
}

/* tutup menu */
function closeMenu(){
  mobileMenu.classList.remove("active");
  overlay.classList.remove("active");
}

/* klik overlay = tutup */
overlay.addEventListener("click", closeMenu);

/* toggle submenu */
function toggleSub(id){
  const sub = document.getElementById(id);

  document.querySelectorAll(".submenu").forEach(el=>{
    if(el !== sub){
      el.style.display = "none";
    }
  });

  sub.style.display = sub.style.display === "block" ? "none" : "block";
}

/* header scroll */
window.addEventListener("scroll", () => {
  document
    .getElementById("header")
    .classList.toggle("scrolled", window.scrollY > 50);
});
