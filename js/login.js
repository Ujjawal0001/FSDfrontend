// toggle fields
function toggleFields(){
  const role = document.getElementById("role").value;

  if(role === "admin"){
    document.getElementById("email").style.display = "block";
    document.getElementById("userId").style.display = "none";
  }else{
    document.getElementById("email").style.display = "none";
    document.getElementById("userId").style.display = "block";
  }
}

// show password
function togglePass(){
  const p = document.getElementById("password");
  p.type = p.type === "password" ? "text" : "password";
}

// login function
async function login(){

  const role = document.getElementById("role").value;
  const password = document.getElementById("password").value.trim();

  let payload = { password };

  if(role === "admin"){
    payload.email = document.getElementById("email").value.trim();
  }else{
    payload.userId = document.getElementById("userId").value.trim();
  }

  // ✅ VALIDATION
  if(role === "admin" && !payload.email){
    document.getElementById("msg").innerText = "⚠ Enter email";
    return;
  }

  if(role === "farmer" && !payload.userId){
    document.getElementById("msg").innerText = "⚠ Enter farmer ID";
    return;
  }

  if(!password){
    document.getElementById("msg").innerText = "⚠ Enter password";
    return;
  }

  // loading message
  document.getElementById("msg").innerText = "⏳ Logging in...";

  try{
    const res = await fetch("http://localhost:5000/api/auth/login",{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if(data.success){

      if(data.role === "admin"){
        localStorage.setItem("adminToken", data.token);
        window.location.href = "admin.html";
      }

      if(data.role === "farmer"){
        localStorage.setItem("userId", data.userId);
        window.location.href = "dashboard.html?userId=" + data.userId;
      }

    }else{
      document.getElementById("msg").innerText = "❌ Invalid credentials";
    }

  }catch(err){
    document.getElementById("msg").innerText = "⚠ Server error / backend not running";
  }
}