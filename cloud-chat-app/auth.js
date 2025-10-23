// Registration
const regBtn = document.getElementById("btn-register");
if (regBtn) {
  regBtn.onclick = async () => {
    const email = document.getElementById("reg-email").value;
    const password = document.getElementById("reg-password").value;
    const username = document.getElementById("reg-username").value;
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return document.getElementById("reg-error").textContent = error.message;
    await supabase.from("users").insert({ id: data.user.id, username });
    window.location.href = "chat.html";
  };
}

// Login
const loginBtn = document.getElementById("btn-login");
if (loginBtn) {
  loginBtn.onclick = async () => {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return document.getElementById("login-error").textContent = error.message;
    window.location.href = "chat.html";
  };
}
