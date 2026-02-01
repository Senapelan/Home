// ================= SMART BACK BUTTON =================
function goBack(){
  const ref = document.referrer;

  if(ref && ref !== window.location.href){
    window.history.back();
  }else{
    window.location.replace("index.html");
  }
}
