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
  // ✅ ADDED: show loading state before calling API
  $("#loadingTrucks").show();
  $("#emptyTrucks").hide();

  loadTrucks();
});

// ✅ ADDED: safe helper
function safe(x) {
  return (x === null || x === undefined) ? "" : x;
}

// ✅ ADDED: normalize response (some backends return {trucks:[]}, {data:[]}, etc.)
function normalizeTrucksResponse(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.trucks)) return data.trucks;
  if (data && Array.isArray(data.data)) return data.data;
  return data; // fallback (maybe backend returns array already)
}

function loadTrucks() {
  $.ajax({
    url: "/api/v1/trucks/view",
    method: "GET",

    // ✅ ADDED: send cookies/session if your backend uses auth cookies
    xhrFields: { withCredentials: true },

    success: function (trucks) {
      // ✅ ADDED: hide loading state
      $("#loadingTrucks").hide();

      // ✅ ADDED: normalize in case response is not array
      const normalized = normalizeTrucksResponse(trucks);

      renderTrucks(normalized);
    },
    error: function (xhr) {
      // ✅ ADDED: hide loading state + better debug
      $("#loadingTrucks").hide();
      console.log("load trucks error:", xhr.status, xhr.responseText);

      $("#msg").html(`<div class="alert alert-danger">Failed to load trucks.</div>`);
    }
  });
}

function renderTrucks(trucks) {
  if (!trucks || trucks.length === 0) {

    // ✅ ADDED: use empty placeholder
    $("#emptyTrucks").show();

    $("#trucksContainer").html(`<p>No trucks available right now.</p>`);
    return;
  }

  // ✅ ADDED: hide empty placeholder if trucks exist
  $("#emptyTrucks").hide();

  let html = "";
  trucks.forEach(t => {

    // ✅ ADDED: allow more field names safely
    const truckId = t.truckId || t.id || t._id;
    const truckName = safe(t.truckName || t.name || t.title || "Unnamed Truck");
    const truckLogo = safe(t.truckLogo || t.logo || t.image);

    const rawStatus = safe(t.truckStatus || t.status || t.availability || "unknown");
    const status = String(rawStatus).toLowerCase();

    const badgeClass = status === "available" || status === "open"
      ? "bg-success"
      : "bg-secondary";

    const logo = truckLogo
      ? `<img src="${truckLogo}" alt="logo" style="width:60px;height:60px;object-fit:cover;border-radius:10px;">`
      : `<div style="width:60px;height:60px;border-radius:10px;background:#eee;display:flex;align-items:center;justify-content:center;">🍔</div>`;

    html += `
      <div class="col-md-4">
        <div class="card p-3 shadow-sm h-100 truck-card-hover">
          <div class="d-flex align-items-center gap-3 mb-2">
            ${logo}
            <div>
              <h5 class="mb-0">${truckName}</h5>
              <span class="badge ${badgeClass}">${status}</span>
            </div>
          </div>

          <!-- ✅ ADDED: disable button if no truckId -->
          <button class="btn btn-warning mt-auto viewMenuBtn"
            data-id="${truckId}"
            ${!truckId ? "disabled" : ""}>
            View Menu
          </button>
        </div>
      </div>
    `;
  });

  $("#trucksContainer").html(html);
}

// ✅ ADDED: event listener instead of inline onclick (but we did NOT delete your original inline one; this supports both)
$(document).on("click", ".viewMenuBtn", function () {
  const truckId = $(this).data("id");
  if (!truckId) return alert("Truck ID not found");
  window.location.href = "/truckMenu/" + truckId;
});
