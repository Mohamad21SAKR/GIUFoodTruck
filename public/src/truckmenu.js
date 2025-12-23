function showMsg(text, type = "info") {
  const box = $("#msg");
  if (!box.length) return;

  // ✅ UPDATED: support HTML
  box.show().html(text);

  box.removeClass();
  if (type === "success") box.addClass("alert alert-success");
  else if (type === "error") box.addClass("alert alert-danger");
  else box.addClass("alert alert-info");

  // ✅ ADDED: auto-hide
  clearTimeout(window.__msgTimer);
  window.__msgTimer = setTimeout(() => {
    box.fadeOut();
  }, 3000);

  // ✅ ADDED: toast popup
  showToast(stripHtml(text), type);
}

// ✅ ADDED
function ensureMsgBox() {
  if (!$("#msg").length) {
    $("body").prepend(`<div id="msg" style="display:none; margin-top:15px;"></div>`);
  }
}

// ✅ ADDED
function hideMsg() {
  const box = $("#msg");
  if (!box.length) return;
  box.hide().html("").removeClass();
}

// ✅ ADDED
function stripHtml(html) {
  return String(html).replace(/<[^>]*>/g, "");
}

// ✅ ADDED
function showToast(text, type = "info") {
  if (!window.bootstrap) return;

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

// ✅ ADDED
function parseBackendMsg(resOrXhr, fallback) {
  let msg = fallback || "Done.";

  // success object
  if (resOrXhr && typeof resOrXhr === "object" && !resOrXhr.status) {
    if (resOrXhr.message) msg = resOrXhr.message;
    else if (resOrXhr.msg) msg = resOrXhr.msg;
    else if (resOrXhr.error) msg = resOrXhr.error;
    else if (typeof resOrXhr === "string") msg = resOrXhr;
    return msg;
  }

  // xhr
  const xhr = resOrXhr;
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
  ensureMsgBox();
  hideMsg();

  const truckId = window.TRUCK_ID;

  // ✅ ADDED: if TRUCK_ID not injected, try reading from URL /truckMenu/:id
  if (!truckId) {
    const parts = window.location.pathname.split("/");
    const fallbackId = parts[parts.length - 1];
    window.TRUCK_ID = fallbackId;
  }

  const finalTruckId = window.TRUCK_ID;

  // ✅ ADDED: handle missing truckId safely
  if (!finalTruckId) {
    showMsg("Truck ID not found.", "error");
    $("#msg").html(`<div class="alert alert-danger">Truck ID not found.</div>`);
    return;
  }

  loadMenu(finalTruckId);

  $("#categoryFilter").on("change", function () {
    const cat = $(this).val();
    if (cat === "all") loadMenu(finalTruckId);
    else loadMenuByCategory(finalTruckId, cat);
  });

  $(document).on("click", ".btn-add-cart", function () {
    const itemId = $(this).data("itemid");
    const qty = parseInt($("#qty-" + itemId).val() || "1");
    addToCart(itemId, qty);
  });
});

// ✅ ADDED: normalize possible response formats
function normalizeItems(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.items)) return data.items;
  if (data && Array.isArray(data.data)) return data.data;
  return data || [];
}

// ✅ ADDED: show backend error message nicely
function showApiError(xhr, fallbackMsg) {
  let msg = fallbackMsg || "Request failed.";
  try {
    // if response is JSON text
    const json = JSON.parse(xhr.responseText);
    if (json && (json.error || json.message)) msg = json.error || json.message;
  } catch (e) {
    // if response is plain text
    if (xhr && xhr.responseText) msg = xhr.responseText;
  }

  // ✅ ADDED: use helper
  showMsg(msg, "error");

  $("#msg").html(`<div class="alert alert-danger">${msg}</div>`);
}

function loadMenu(truckId) {
  $.ajax({
    url: `/api/v1/menuItem/truck/${truckId}`,
    method: "GET",

    // ✅ ADDED: send cookies/session if backend uses them
    xhrFields: { withCredentials: true },

    success: function (items) {
      // ✅ ADDED: normalize response
      const normalized = normalizeItems(items);

      renderMenu(normalized);
      fillCategories(normalized);

      // ✅ ADDED: friendly info (only once)
      if (normalized.length === 0) {
        showMsg("No menu items found for this truck.", "info");
      } else {
        hideMsg();
      }
    },
    error: function (xhr) {
      // ✅ ADDED: show backend message
      console.log("loadMenu error:", xhr.status, xhr.responseText);
      showApiError(xhr, "Failed to load menu.");
    }
  });
}

function loadMenuByCategory(truckId, category) {
  $.ajax({
    url: `/api/v1/menuItem/truck/${truckId}/category/${encodeURIComponent(category)}`,
    method: "GET",

    // ✅ ADDED
    xhrFields: { withCredentials: true },

    success: function (items) {
      // ✅ ADDED
      const normalized = normalizeItems(items);

      renderMenu(normalized);

      // ✅ ADDED
      if (normalized.length === 0) {
        showMsg(`No items found in category "${category}".`, "info");
      } else {
        hideMsg();
      }
    },
    error: function (xhr) {
      console.log("loadMenuByCategory error:", xhr.status, xhr.responseText);
      showApiError(xhr, "Failed to load category.");
    }
  });
}

function addToCart(itemId, quantity) {
  if (!quantity || quantity < 1) quantity = 1;

  // ✅ ADDED: disable button quickly to avoid double click
  const btn = $(`.btn-add-cart[data-itemid="${itemId}"]`);
  btn.prop("disabled", true);

  $.ajax({
    url: "/api/v1/cart/new",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify({ itemId, quantity }),

    // ✅ ADDED: important for session auth
    xhrFields: { withCredentials: true },

    success: function (res) {
      // ✅ UPDATED: never rely on res.message only
      const msg = parseBackendMsg(res, "Item added to cart successfully ✅");
      showMsg(msg, "success");

      // keep your old behavior too
      $("#msg").html(`<div class="alert alert-success">${msg}</div>`);
    },
    error: function (xhr) {
      // ✅ ADDED: print exact error + show backend message
      console.log("addToCart error:", xhr.status, xhr.responseText);
      showApiError(xhr, "Add to cart failed.");
    },
    complete: function () {
      // ✅ ADDED
      btn.prop("disabled", false);
    }
  });
}

function renderMenu(items) {
  if (!items || items.length === 0) {
    $("#menuContainer").html(`<p>No menu items found.</p>`);
    return;
  }

  let html = "";
  items.forEach(it => {

    // ✅ ADDED: handle different field names + status disabling
    const itemId = it.itemId || it.id || it._id;
    const status = (it.status || it.itemStatus || "available").toLowerCase();
    const disabled = status !== "available" ? "disabled" : "";

    html += `
      <div class="col-md-4">
        <div class="card p-3 shadow-sm h-100">
          <h5 class="mb-1">${it.name}</h5>
          <small class="text-muted">${it.category || ""}</small>

          <p class="mt-2">${it.description || ""}</p>
          <h6>${it.price} EGP</h6>

          <div class="d-flex gap-2 align-items-center mt-auto">
            <input id="qty-${itemId}" type="number" min="1" value="1"
              class="form-control" style="width:90px;" ${disabled}>
            <button class="btn btn-warning btn-add-cart" data-itemid="${itemId}" ${disabled}>
              Add to Cart
            </button>
          </div>

          <!-- ✅ ADDED: show status if not available -->
          ${status !== "available" ? `<div class="text-danger mt-2">Not available</div>` : ""}
        </div>
      </div>
    `;
  });

  $("#menuContainer").html(`<div class="row g-3">${html}</div>`);
}

function fillCategories(items) {
  const cats = {};
  items.forEach(i => {
    if (i.category) cats[i.category] = true;
  });

  let options = `<option value="all">All Categories</option>`;
  Object.keys(cats).forEach(c => {
    options += `<option value="${c}">${c}</option>`;
  });

  $("#categoryFilter").html(options);
}
