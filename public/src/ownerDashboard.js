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

  // =========================
  // Helpers
  // =========================
  function safeLower(x) {
    if (!x) return "";
    return String(x).toLowerCase().trim(); // ✅ ADDED trim
  }

  function showMsg(text) {
    alert(text);
  }

  // ✅ ADDED: normalize arrays returned from API
  function normalizeArray(data) {
    let arr = data?.orders || data?.items || data?.data || data;
    if (!Array.isArray(arr)) arr = [];
    return arr;
  }

  // =========================
  // 1) Load truck info
  // =========================
  function loadMyTruck() {
    $.ajax({
      url: "/api/v1/trucks/myTruck",
      method: "GET",

      // ✅ ADDED: send cookies (important when switching owners)
      xhrFields: { withCredentials: true },

      success: function (data) {
        // Try to find a status field:
        let status =
          data?.status ??
          data?.availability ??
          data?.orderStatus ??
          data?.truck?.status ??
          data?.truck?.availability ??
          data?.truck?.orderStatus;

        status = safeLower(status);

        // Map to dropdown values: open / closed
        if (status.includes("open") || status.includes("available") || status === "true") {
          $("#availability").val("open");
        } else if (status.includes("close") || status.includes("unavailable") || status === "false") {
          $("#availability").val("closed");
        }
      },
      error: function (xhr) {
        console.log("loadMyTruck error:", xhr.status, xhr.responseText);
      }
    });
  }

  // =========================
  // 2) Load orders + stats
  // =========================
  function loadOrdersAndStats() {
    $.ajax({
      url: "/api/v1/order/truckOrders",
      method: "GET",

      // ✅ ADDED: send cookies
      xhrFields: { withCredentials: true },

      success: function (data) {

        let orders = normalizeArray(data);

        let pending = 0;
        let completed = 0;

        orders.forEach(o => {
          // ✅ FIX: backend returns orderStatus (not status)
          const st = safeLower(o.orderStatus || o.status);

          // ✅ FIX: pending group includes pending/preparing/ready
          if (st === "pending" || st === "preparing" || st === "ready") pending++;

          // completed group
          if (st === "completed") completed++;
        });

        $("#pendingCount").text(pending);
        $("#completedCount").text(completed);

        // Menu items count
        loadMenuItemsCount();
      },
      error: function (xhr) {
        console.log("loadOrdersAndStats error:", xhr.status, xhr.responseText);
      }
    });
  }

  // =========================
  // 3) Load menu items count
  // =========================
  function loadMenuItemsCount() {
    $.ajax({
      url: "/api/v1/menuItem/view",
      method: "GET",

      // ✅ ADDED: send cookies
      xhrFields: { withCredentials: true },

      success: function (data) {
        let items = normalizeArray(data);
        $("#menuCount").text(items.length);
      },
      error: function (xhr) {
        console.log("loadMenuItemsCount error:", xhr.status, xhr.responseText);
      }
    });
  }

  // =========================
  // 4) Update availability
  // =========================
  $("#updateAvailability").on("click", function () {
    const value = $("#availability").val(); // open / closed

    // ✅ Keep your payload, but ALSO send orderStatus for compatibility
    const payload = { status: value, orderStatus: value };

    $.ajax({
      url: "/api/v1/trucks/updateOrderStatus",
      method: "PUT",
      contentType: "application/json",

      // ✅ ADDED: send cookies
      xhrFields: { withCredentials: true },

      data: JSON.stringify(payload),
      success: function () {
        showMsg("✅ Availability updated successfully!");
        // ✅ ADDED: refresh counts after update
        loadOrdersAndStats();
      },
      error: function (xhr) {
        console.log("updateAvailability error:", xhr.status, xhr.responseText);
        showMsg("❌ Failed to update availability. Open Console (F12) and send me the error text.");
      }
    });
  });

  // =========================
  // Init
  // =========================
  loadMyTruck();
  loadOrdersAndStats();

});
