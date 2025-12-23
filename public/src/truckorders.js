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

  function safe(x) {
    return (x === null || x === undefined) ? "" : x;
  }

  function normalizeOrders(data) {
    // supports different return formats
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.orders)) return data.orders;
    if (Array.isArray(data.data)) return data.data;
    return [];
  }

  // ✅ ADDED: show backend error message nicely
  function showApiError(xhr, fallbackMsg) {
    let msg = fallbackMsg || "Request failed.";
    try {
      const json = JSON.parse(xhr.responseText);
      if (json && (json.error || json.message)) msg = json.error || json.message;
    } catch (e) {
      if (xhr && xhr.responseText) msg = xhr.responseText;
    }
    alert(msg);
  }

  function loadOrders() {
    $.ajax({
      url: "/api/v1/order/truckOrders",
      method: "GET",

      // ✅ ADDED: send cookies/session (important when switching owners)
      xhrFields: { withCredentials: true },

      success: function (data) {
        const orders = normalizeOrders(data);

        $("#ordersBody").empty();

        if (!orders.length) {
          $("#emptyMsg").show();
          return;
        }
        $("#emptyMsg").hide();

        orders.forEach(function (o) {
          const orderId = o.orderId || o.id || o._id;
          const customer = safe(o.customerName || o.customer || o.email || o.customerEmail);
          const total = safe(o.total || o.totalPrice || o.amount);
          const status = safe(o.status || o.orderStatus);
          const createdAt = safe(o.createdAt || o.created_at || o.date);

          const row = `
            <tr>
              <td>${safe(orderId)}</td>
              <td>${customer}</td>
              <td>${total}</td>
              <td><span class="label label-info">${status}</span></td>
              <td>${createdAt}</td>
              <td>
                <button class="btn btn-sm btn-primary viewBtn" data-id="${orderId}">View</button>
                <button class="btn btn-sm btn-success statusBtn" data-id="${orderId}" data-status="completed">Complete</button>
                <button class="btn btn-sm btn-danger statusBtn" data-id="${orderId}" data-status="cancelled">Cancel</button>
              </td>
            </tr>
          `;
          $("#ordersBody").append(row);
        });
      },
      error: function (xhr) {
        console.log("truckOrders load error:", xhr.status, xhr.responseText);
        showApiError(xhr, "Failed to load truck orders.");
      }
    });
  }

  // View details (uses your existing endpoint)
  $(document).on("click", ".viewBtn", function () {
    const orderId = $(this).data("id");
    if (!orderId) return alert("Order ID not found");

    // Opens details route (backend exists: /api/v1/order/truckOwner/:orderId)
    // If you have a frontend details page, tell me and I’ll link to it instead.
    window.open(`/api/v1/order/truckOwner/${orderId}`, "_blank");
  });

  // Update status
  $(document).on("click", ".statusBtn", function () {
    const orderId = $(this).data("id");
    const newStatus = $(this).data("status");

    if (!orderId) return alert("Order ID not found");
    if (!newStatus) return alert("Status not found");

    const ok = confirm(`Change order #${orderId} to "${newStatus}" ?`);
    if (!ok) return;

    $.ajax({
      url: `/api/v1/order/updateStatus/${orderId}`,
      method: "PUT",
      contentType: "application/json",

      // ✅ ADDED: send cookies/session
      xhrFields: { withCredentials: true },

      // ✅ FIX: backend expects "orderStatus" not "status"
      // we send both to be safe (no breaking)
      data: JSON.stringify({ status: newStatus, orderStatus: newStatus }),

      success: function () {
        alert("✅ Order status updated!");
        loadOrders();
      },
      error: function (xhr) {
        console.log("update status error:", xhr.status, xhr.responseText);
        showApiError(xhr, "❌ Failed to update order status.");
      }
    });
  });

  loadOrders();
});
