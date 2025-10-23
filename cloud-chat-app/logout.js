const logoutBtn = document.getElementById("btn-logout");
if (logoutBtn) {
  logoutBtn.onclick = async () => {
    await supabase.auth.signOut();
    window.location.href = "login.html";
  };
}
