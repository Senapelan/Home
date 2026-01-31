function openMenu(){
  document.getElementById("mobileMenu").classList.add("active");
}

function closeMenu(){
  document.getElementById("mobileMenu").classList.remove("active");
}

function toggleSub(id){
  const sub = document.getElementById(id);

  // tutup submenu lain (biar rapi)
  document.querySelectorAll(".submenu").forEach(el=>{
    if(el !== sub){
      el.style.display = "none";
    }
  });

  // toggle submenu yang diklik
  sub.style.display = sub.style.display === "block" ? "none" : "block";
}

window.addEventListener("scroll",()=>{
  document.getElementById("header")
    .classList.toggle("scrolled",window.scrollY>50);
});
