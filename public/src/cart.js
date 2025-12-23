function showMsg(text, type = "info") {
  const box = $("#msg");
  if (!box.length) return;

  // ✅ UPDATED: allow HTML
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

// ✅ ADDED: safe loading helpers (so file never breaks)
function setLoading(isLoading, text = "Loading...") {
  // If you already have a global setLoading in another file, this won’t harm.
  // This fallback only runs if no other setLoading exists.
  if (typeof window.__realSetLoading === "function") return window.__realSetLoading(isLoading, text);

  if (isLoading) {
    showMsg(text, "info");
  }
  // optional disable buttons
  $("button").prop("disabled", isLoading);
}

// ✅ ADDED: robust message extraction
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

  loadCart();

  $("#btnPlaceOrder").on("click", function () {
    placeOrder();
  });

  $(document).on("click", ".btn-update", function () {
    const cartId = $(this).data("cartid");
    const qtyRaw = $("#qty-" + cartId).val();
    const qty = parseInt(qtyRaw);
    const price = parseFloat($("#price-" + cartId).text());
    updateCartItem(cartId, qty, price);
  });

  $(document).on("click", ".btn-delete", function () {
    const cartId = $(this).data("cartid");
    deleteCartItem(cartId);
  });
});

// ✅ ADDED: normalize possible response shapes
function normalizeCartResponse(data) {
  if (!data) return { cartItems: [], total: 0 };
  if (Array.isArray(data)) return { cartItems: data, total: 0 };
  if (data.cartItems) return data;
  if (data.data && data.data.cartItems) return data.data;
  return data;
}

// ✅ ADDED: display backend error message
function showApiError(xhr, fallbackMsg) {
  let msg = fallbackMsg || "Request failed.";
  try {
    const json = JSON.parse(xhr.responseText);
    if (json && (json.error || json.message)) msg = json.error || json.message;
  } catch (e) {
    if (xhr && xhr.responseText) msg = xhr.responseText;
  }

  // ✅ UPDATED: show using helper too (better UX)
  showMsg(msg, "error");

  // keep your old bootstrap style (in case your page uses bootstrap alerts)
  $("#msg").html(`<div class="alert alert-danger">${msg}</div>`);
}

// ✅ ADDED: prevent double clicking place order
let isPlacingOrder = false;

// ✅ ADDED: prevent double update/delete spam (per item)
const pendingUpdate = new Set();
const pendingDelete = new Set();

function loadCart() {
  setLoading(true, "Loading cart..."); // ✅ ADDED

  $.ajax({
    url: "/api/v1/cart/view",
    method: "GET",

    // ✅ ADDED: important for session cookie so req.user works
    xhrFields: { withCredentials: true },

    success: function (data) {
      // ✅ ADDED
      const normalized = normalizeCartResponse(data);
      renderCart(normalized);

      // ✅ ADDED: if cart has items, hide message
      const items = normalized.cartItems || [];
      if (items.length > 0) hideMsg();
    },
    error: function (xhr) {
      console.log("loadCart error:", xhr.status, xhr.responseText);
      showApiError(xhr, "Failed to load cart.");
    },
    complete: function () {
      setLoading(false); // ✅ ADDED
    }
  });
}

function renderCart(data) {
  const items = data.cartItems || [];
  const total = data.total || 0;

  $("#cartTotal").text(total);

  if (items.length === 0) {
    $("#cartContainer").html(`<p>Your cart is empty.</p>`);
    showMsg("Your cart is empty.", "info"); // ✅ ADDED
    return;
  }

  let html = `
    <table class="table table-bordered">
      <thead class="table-dark">
        <tr>
          <th>Item</th>
          <th>Truck</th>
          <th>Category</th>
          <th>Price</th>
          <th style="width:140px;">Qty</th>
          <th style="width:210px;">Actions</th>
        </tr>
      </thead>
      <tbody>
  `;

  items.forEach(it => {
    html += `
      <tr>
        <td>
          <b>${it.itemName}</b><br/>
          <small class="text-muted">${it.description || ""}</small>
        </td>
        <td>${it.truckName || ""}</td>
        <td>${it.category || ""}</td>
        <td><span id="price-${it.cartId}">${it.price}</span></td>
        <td>
          <input id="qty-${it.cartId}" type="number" class="form-control" min="1" value="${it.quantity}">
        </td>
        <td>
          <button class="btn btn-warning btn-sm btn-update" data-cartid="${it.cartId}">Update</button>
          <button class="btn btn-danger btn-sm btn-delete" data-cartid="${it.cartId}">Remove</button>
        </td>
      </tr>
    `;
  });

  html += `</tbody></table>`;

  $("#cartContainer").html(html);
}

function updateCartItem(cartId, quantity, price) {
  // ✅ ADDED: validation & normalization
  const qty = Number(quantity);
  if (Number.isNaN(qty) || qty < 1) {
    showMsg("Quantity must be a number ≥ 1.", "error");
    $("#qty-" + cartId).val(1);
    return;
  }

  if (pendingUpdate.has(cartId)) return; // ✅ ADDED
  pendingUpdate.add(cartId);

  // ✅ ADDED: disable this row buttons while updating
  $(`button.btn-update[data-cartid="${cartId}"]`).prop("disabled", true);
  $(`button.btn-delete[data-cartid="${cartId}"]`).prop("disabled", true);

  setLoading(true, "Updating item..."); // ✅ ADDED

  $.ajax({
    url: `/api/v1/cart/edit/${cartId}`,
    method: "PUT",
    contentType: "application/json",
    data: JSON.stringify({ quantity: qty, price: price }),

    // ✅ ADDED
    xhrFields: { withCredentials: true },

    success: function (res) {
      const msg = parseBackendMsg(res, "Quantity updated ✅");
      showMsg(msg, "success"); // ✅ UPDATED
      $("#msg").html(`<div class="alert alert-success">${msg}</div>`);
      loadCart();
    },
    error: function (xhr) {
      console.log("updateCartItem error:", xhr.status, xhr.responseText);
      showApiError(xhr, "Update failed.");
    },
    complete: function () {
      pendingUpdate.delete(cartId); // ✅ ADDED
      setLoading(false); // ✅ ADDED
      $(`button.btn-update[data-cartid="${cartId}"]`).prop("disabled", false);
      $(`button.btn-delete[data-cartid="${cartId}"]`).prop("disabled", false);
    }
  });
}

function deleteCartItem(cartId) {
  // ✅ ADDED: confirm before removing
  const ok = window.confirm("Remove this item from cart?");
  if (!ok) return;

  if (pendingDelete.has(cartId)) return; // ✅ ADDED
  pendingDelete.add(cartId);

  // ✅ ADDED: disable this row buttons while deleting
  $(`button.btn-update[data-cartid="${cartId}"]`).prop("disabled", true);
  $(`button.btn-delete[data-cartid="${cartId}"]`).prop("disabled", true);

  setLoading(true, "Removing item..."); // ✅ ADDED

  $.ajax({
    url: `/api/v1/cart/delete/${cartId}`,
    method: "DELETE",

    // ✅ ADDED
    xhrFields: { withCredentials: true },

    success: function (res) {
      const msg = parseBackendMsg(res, "Item removed ✅");
      showMsg(msg, "success"); // ✅ UPDATED
      $("#msg").html(`<div class="alert alert-success">${msg}</div>`);
      loadCart();
    },
    error: function (xhr) {
      console.log("deleteCartItem error:", xhr.status, xhr.responseText);
      showApiError(xhr, "Delete failed.");
    },
    complete: function () {
      pendingDelete.delete(cartId); // ✅ ADDED
      setLoading(false); // ✅ ADDED
      $(`button.btn-update[data-cartid="${cartId}"]`).prop("disabled", false);
      $(`button.btn-delete[data-cartid="${cartId}"]`).prop("disabled", false);
    }
  });
}

function placeOrder() {
  if (isPlacingOrder) return; // ✅ ADDED
  isPlacingOrder = true;

  const paymentMethod = $("#paymentMethod").val();
  const customerNotes = $("#customerNotes").val();

  // ✅ ADDED: scheduled pickup time (if input exists in HJS, it will be used)
  const scheduledPickupTime = ($("#scheduledPickupTime").val && $("#scheduledPickupTime").val())
    ? $("#scheduledPickupTime").val()
    : undefined;

  // ✅ ADDED: disable button while request
  $("#btnPlaceOrder").prop("disabled", true);

  setLoading(true, "Placing order..."); // ✅ ADDED

  $.ajax({
    url: "/api/v1/order/new",
    method: "POST",
    contentType: "application/json",

    // ✅ ADDED: include cookies/session
    xhrFields: { withCredentials: true },

    // ✅ KEEP your body, but also send alternative keys (backend sometimes expects notes/method)
    data: JSON.stringify({
      paymentMethod,
      customerNotes,
      method: paymentMethod,      // ✅ ADDED alias
      notes: customerNotes,        // ✅ ADDED alias
      scheduledPickupTime          // ✅ ADDED
    }),

    success: function (res) {
      const msg = parseBackendMsg(res, "Order placed successfully ✅");
      showMsg(msg, "success"); // ✅ UPDATED
      $("#msg").html(`<div class="alert alert-success">${msg}</div>`);
      loadCart();
    },
    error: function (xhr) {
      console.log("placeOrder error:", xhr.status, xhr.responseText);
      showApiError(xhr, "Place order failed.");
    },
    complete: function () {
      // ✅ ADDED: re-enable
      isPlacingOrder = false;
      $("#btnPlaceOrder").prop("disabled", false);
      setLoading(false); // ✅ ADDED
    }
  });
}
