<<<<<<< HEAD
function showMsg(text, type = "info") {
  const box = $("#msg");
  if (!box.length) return;

  // ✅ UPDATED: allow HTML + keep readable
  box.show().html(text);

  box.removeClass();
  if (type === "success") box.addClass("alert alert-success");
  else if (type === "error") box.addClass("alert alert-danger");
  else box.addClass("alert alert-info");

  // ✅ ADDED: ALSO show inside msgInner if exists (register card)
  if ($("#msgInner").length) {
    $("#msgInner").html(text).show();
  }

  // ✅ ADDED: auto-hide
  clearTimeout(window.__msgTimer);
  window.__msgTimer = setTimeout(() => {
    box.fadeOut();
    if ($("#msgInner").length) $("#msgInner").fadeOut();
  }, 3000);

  // ✅ ADDED: show toast popup too (if bootstrap exists)
  showToast(stripHtml(text), type);

  // ✅ ADDED: fallback popup (works even without bootstrap Toast)
  showPopup(stripHtml(text), type);
}

// ✅ ADDED: create #msg if it doesn’t exist
function ensureMsgBox() {
  if (!$("#msg").length) {
    $("body").prepend(`<div id="msg" style="display:none; margin-top:15px;"></div>`);
  }
}

// ✅ ADDED: create popup container if it doesn’t exist
function ensurePopup() {
  if (!$("#popupMsg").length) {
    $("body").append(`<div id="popupMsg" style="display:none; position:fixed; top:20px; right:20px; z-index:99999; min-width:280px;"></div>`);
  }
}

// ✅ ADDED: fallback popup implementation
function showPopup(text, type = "info") {
  ensurePopup();

  const cls =
    type === "success" ? "alert alert-success" :
    type === "error" ? "alert alert-danger" :
    "alert alert-info";

  $("#popupMsg").stop(true, true).html(
    `<div class="${cls}" style="margin:0; box-shadow:0 6px 18px rgba(0,0,0,0.2);">${text}</div>`
  ).fadeIn(150);

  clearTimeout(window.__popTimer);
  window.__popTimer = setTimeout(() => {
    $("#popupMsg").fadeOut(250);
  }, 2200);
}

// ✅ ADDED: remove message
function hideMsg() {
  const box = $("#msg");
  if (!box.length) return;
  box.hide().html("").removeClass();

  // ✅ ADDED
  if ($("#msgInner").length) $("#msgInner").hide().html("");
}

// ✅ ADDED: safely get backend error/success message
function parseBackendMsg(xhrOrRes, fallback) {
  let msg = fallback || "Done.";

  // if it's AJAX success response
  if (xhrOrRes && typeof xhrOrRes === "object" && !xhrOrRes.status) {
    if (xhrOrRes.message) msg = xhrOrRes.message;
    else if (xhrOrRes.msg) msg = xhrOrRes.msg;
    else if (xhrOrRes.error) msg = xhrOrRes.error;
    else if (typeof xhrOrRes === "string") msg = xhrOrRes;
    return msg;
  }

  // if it's xhr error
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

// ✅ ADDED: strip HTML for toast
function stripHtml(html) {
  return String(html).replace(/<[^>]*>/g, "");
}

// ✅ ADDED: Bootstrap Toast popup (real pop message)
function showToast(text, type = "info") {
  // ✅ UPDATED: some bootstrap versions don't expose window.bootstrap
  if (!window.bootstrap || !bootstrap.Toast) return;

  const toastId = "appToast";
  if (!$("#" + toastId).length) {
    $("body").append(`
      <div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 99999;">
        <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
          <div class="toast-header">
            <strong class="me-auto" id="toastTitle">Message</strong>
            <small class="text-muted">now</small>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
          </div>
          <div class="toast-body" id="toastBody"></div>
        </div>
      </div>
    `);
  }

  $("#toastBody").text(text);

  const title =
    type === "success" ? "Success" :
    type === "error" ? "Error" : "Info";

  $("#toastTitle").text(title);

  const toastEl = document.getElementById(toastId);
  const t = bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 2500 });
  t.show();
}


$(document).ready(function () {
  // ✅ ADDED
  ensureMsgBox();
  ensurePopup();
  hideMsg();

  // ✅ ADDED: prevent refresh if form exists + allow Enter submit
  if ($("#registerForm").length) {
    $("#registerForm").on("submit", function (e) {
      e.preventDefault();
      register();
    });
  }

  // ✅ KEEP your click but prevent default too
  $("#btnRegister").on("click", function (e) {
    if (e && e.preventDefault) e.preventDefault();
    register();
  });
});

function register() {
  const name = $("#name").val().trim();
  const email = $("#email").val().trim();
  const password = $("#password").val().trim();
  const birthDate = $("#birthDate").val();

  if (!name || !email || !password || !birthDate) {
    // ✅ UPDATED: use showMsg instead of raw html
    showMsg("All fields are required.", "error");
    $("#msg").html(`<div class="alert alert-danger">All fields are required.</div>`);
    return;
  }

  $.ajax({
    url: "/api/v1/user",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify({
      name,
      email,
      password,
      birthDate,
      birthdate: birthDate,   // ✅ ADDED alias
      birth_date: birthDate   // ✅ ADDED alias
    }),
    success: function (res) {
      const msg = parseBackendMsg(res, "Registration successful. Redirecting...");
      // ✅ UPDATED: showMsg + keep your original
      showMsg(msg, "success");
      $("#msg").html(`<div class="alert alert-success">${msg}</div>`);

      // ✅ ADDED: let popup appear before redirect
      setTimeout(() => window.location.href = "/", 1500);
    },
    error: function (xhr) {
      // ✅ UPDATED: robust message extraction
      const msg = parseBackendMsg(xhr, "Registration failed.");
      showMsg(msg, "error");

      let oldMsg = "Registration failed.";
      if (xhr.responseJSON && xhr.responseJSON.message) oldMsg = xhr.responseJSON.message;
      $("#msg").html(`<div class="alert alert-danger">${oldMsg}</div>`);
    }
  });
}
=======
$(document).ready(function(){

    // Handle Registration Button Click
    $("#register").click(function() {
      const name = $('#name').val();
      const email = $('#email').val();
      const country = $('#country').val();
      const birthDate = $('#date').val();
      const password = $('#password').val();

      if(!name || !email || !country || !birthDate || !password){
          alert("Enter all fields")
          return;
      }

      const data = {
        name,
        email,
        birthDate,
        password
      };

      $.ajax({
        type: "POST",
        url: '/api/v1/user',
        data : data,
        success: function(serverResponse) {
            alert("successfully registered user")
            location.href = '/';
        },
        error: function(errorResponse) {
            alert(`Error Register User: ${errorResponse.responseText}`);
        }
      });
    });      
  });
>>>>>>> 1d59a5c31ade4e3f7f802454cf83a2c88e88e3b9
