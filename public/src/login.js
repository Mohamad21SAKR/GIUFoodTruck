<<<<<<< HEAD
function showMsg(text, type = "info") {
  const box = document.getElementById("msg");
  if (!box) return;

  box.style.display = "block";
  box.textContent = text;

  // simple colors (no bootstrap required)
  if (type === "success") box.style.background = "#d4edda";
  else if (type === "error") box.style.background = "#f8d7da";
  else box.style.background = "#d1ecf1";

  // ✅ ADDED: also show a bootstrap-like popup toast (top-right)
  showPopup(text, type);
}

function hideMsg() {
  const box = document.getElementById("msg");
  if (!box) return;
  box.style.display = "none";
  box.textContent = "";

  // ✅ ADDED
  const pop = document.getElementById("popupMsg");
  if (pop) pop.style.display = "none";
}

function setLoading(isLoading, text = "Loading...") {
  if (isLoading) showMsg(text, "info");
  // optional: disable all buttons during loading
  document.querySelectorAll("button").forEach(btn => btn.disabled = isLoading);
}

// ✅ ADDED: create popup container if missing
function ensurePopup() {
  if (!document.getElementById("popupMsg")) {
    const div = document.createElement("div");
    div.id = "popupMsg";
    div.style.display = "none";
    div.style.position = "fixed";
    div.style.top = "20px";
    div.style.right = "20px";
    div.style.zIndex = "99999";
    div.style.minWidth = "280px";
    document.body.appendChild(div);
  }
}

// ✅ ADDED: popup message (works with any bootstrap version)
function showPopup(text, type = "info") {
  ensurePopup();

  const pop = document.getElementById("popupMsg");
  if (!pop) return;

  const cls =
    type === "success" ? "alert alert-success" :
    type === "error" ? "alert alert-danger" :
    "alert alert-info";

  pop.innerHTML = `<div class="${cls}" style="margin:0; box-shadow:0 6px 18px rgba(0,0,0,0.2);">${text}</div>`;
  pop.style.display = "block";

  clearTimeout(window.__popTimer);
  window.__popTimer = setTimeout(() => {
    pop.style.display = "none";
  }, 2200);
}

// ✅ ADDED: extract message safely
function parseBackendMsg(xhrOrRes, fallback) {
  let msg = fallback || "Done.";

  // success object
  if (xhrOrRes && typeof xhrOrRes === "object" && !xhrOrRes.status) {
    msg = xhrOrRes.error || xhrOrRes.message || xhrOrRes.msg || msg;
    return msg;
  }

  // xhr
  const xhr = xhrOrRes;
  try {
    if (xhr && xhr.responseJSON) {
      msg = xhr.responseJSON.error || xhr.responseJSON.message || xhr.responseJSON.msg || msg;
    } else if (xhr && xhr.responseText) {
      try {
        const j = JSON.parse(xhr.responseText);
        msg = j.error || j.message || j.msg || msg;
      } catch (e) {
        msg = xhr.responseText || msg;
      }
    }
  } catch (e) {}
  return msg;
}

$(document).ready(function () {
  // ✅ ADDED
  ensurePopup();
  hideMsg();

  $("#btnLogin").on("click", function (e) {
    if (e && e.preventDefault) e.preventDefault();
    login();
  });

  // optional: press Enter to login
  $("#password").on("keypress", function (e) {
    if (e.which === 13) login();
  });
});

function login() {
  const email = $("#email").val().trim();
  const password = $("#password").val().trim();

  // Validation
  if (!email || !password) {
    $("#msg").html(`<div class="alert alert-danger">Please enter email and password.</div>`);
    showPopup("Please enter email and password.", "error"); // ✅ ADDED
    return;
  }

  $.ajax({
    url: "/api/v1/user/login",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify({ email, password }),
    success: function (res) {
      // ✅ ADDED: show success popup before redirect
      showPopup("Login successful! Redirecting...", "success");

      // res.user.role is either "customer" or "truckOwner" based on your backend response
      setTimeout(() => {
        if (res && res.user && res.user.role === "truckOwner") {
          window.location.href = "/ownerDashboard";
        } else {
          window.location.href = "/dashboard";
        }
      }, 900);
    },
    error: function (xhr) {
      let msg = "Invalid credentials.";
      if (xhr.responseJSON && xhr.responseJSON.message) msg = xhr.responseJSON.message;

      // ✅ ADDED: more robust parsing
      msg = parseBackendMsg(xhr, msg);

      $("#msg").html(`<div class="alert alert-danger">${msg}</div>`);
      showPopup(msg, "error"); // ✅ ADDED
    }
  });
}
=======
$(document).ready(function(){
    $("#submit").click(function() {
      const email = $('#email').val();
      const password = $('#password').val();

      const data = {
        email,
        password,
      };

      $.ajax({
        type: "POST",
        url: '/api/v1/user/login',
        data,
        success: function(serverResponse) {
          if(serverResponse) {
            alert("login successfully");
            location.href = '/dashboard';
          }
        },
        error: function(errorResponse) {
          if(errorResponse) {
            alert(`User login error: ${errorResponse.responseText}`);
          }            
        }
      });
    });
  });
>>>>>>> 1d59a5c31ade4e3f7f802454cf83a2c88e88e3b9
