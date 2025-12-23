function showMsg(text, type = "info") {
  const box = document.getElementById("msg");
  if (!box) return;

  box.style.display = "block";
  box.textContent = text;

  // simple colors (no bootstrap required)
  if (type === "success") box.style.background = "#d4edda";
  else if (type === "error") box.style.background = "#f8d7da";
  else box.style.background = "#d1ecf1";
}

function hideMsg() {
  const box = document.getElementById("msg");
  if (!box) return;
  box.style.display = "none";
  box.textContent = "";
}

function setLoading(isLoading, text = "Loading...") {
  if (isLoading) showMsg(text, "info");
  // optional: disable all buttons during loading
  document.querySelectorAll("button").forEach(btn => btn.disabled = isLoading);
}

$(document).ready(function () {
  loadMyOrders();
});

function safe(x) {
  return (x === null || x === undefined) ? "" : x;
}

function showApiError(xhr, fallbackMsg) {
  let msg = fallbackMsg || "Request failed.";
  try {
    const json = JSON.parse(xhr.responseText);
    if (json && (json.error || json.message)) msg = json.error || json.message;
  } catch (e) {
    if (xhr && xhr.responseText) msg = xhr.responseText;
  }
  $("#msg").html(`<div class="alert alert-danger">${msg}</div>`);
}

function loadMyOrders() {
  $.ajax({
    url: "/api/v1/order/myOrders",
    method: "GET",
    xhrFields: { withCredentials: true },

    success: function (orders) {
      renderOrders(orders || []);
    },
    error: function (xhr) {
      console.log("myOrders error:", xhr.status, xhr.responseText);
      showApiError(xhr, "Failed to load your orders.");
    }
  });
}

function renderOrders(orders) {
  if (!orders.length) {
    $("#ordersContainer").html(`<div class="alert alert-info">No orders yet.</div>`);
    return;
  }

  let html = `
    <table class="table table-bordered">
      <thead class="table-dark">
        <tr>
          <th>Order ID</th>
          <th>Truck</th>
          <th>Total</th>
          <th>Status</th>
          <th>Created At</th>
          <th>Details</th>
        </tr>
      </thead>
      <tbody>
  `;

  orders.forEach(o => {
    const orderId = o.orderId || o.id || o._id;
    const truckName = safe(o.truckName);
    const total = safe(o.totalPrice || o.total);
    const status = safe(o.orderStatus || o.status);
    const createdAt = safe(o.createdAt || o.created_at);

    html += `
      <tr>
        <td>${safe(orderId)}</td>
        <td>${truckName}</td>
        <td>${total}</td>
        <td><span class="badge bg-info text-dark">${status}</span></td>
        <td>${createdAt}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="window.open('/api/v1/order/details/${orderId}', '_blank')">
            View
          </button>
        </td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  $("#ordersContainer").html(html);
}
