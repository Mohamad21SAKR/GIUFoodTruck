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
  else hideMsg();

  // optional: disable all buttons during loading
  document.querySelectorAll("button").forEach(btn => btn.disabled = isLoading);
}

$(document).ready(function () {

  // ✅ ADDED: press Enter to add (optional UX improvement)
  $("#name, #category, #description, #price").on("keypress", function (e) {
    if (e.which === 13) { // Enter key
      $("#addBtn").click();
    }
  });

  $("#addBtn").on("click", function () {

    const name = $("#name").val().trim();
    const category = $("#category").val().trim();
    const description = $("#description").val().trim();
    const priceRaw = $("#price").val().trim();

    // ✅ REPLACED UI handling: use showMsg/hideMsg instead of css("color")
    hideMsg();

    // simple validation
    if (!name || !category || !priceRaw) {
      showMsg("Please fill required fields: name, category, price.", "error");
      return;
    }

    // ✅ ADDED: strong price validation
    const priceNum = Number(priceRaw);
    if (Number.isNaN(priceNum) || priceNum <= 0) {
      showMsg("Price must be a valid positive number.", "error");
      return;
    }

    const payload = {
      name: name,
      category: category,
      description: description,
      price: priceNum
    };

    // ✅ ADDED: loading state + prevent double submit
    setLoading(true, "Adding menu item...");

    $.ajax({
      url: "/api/v1/menuItem/new",
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify(payload),

      // ✅ ADDED: keep cookies/session always (usually not needed if same origin, but safe)
      xhrFields: { withCredentials: true },

      success: function () {
        setLoading(false);
        showMsg("✅ Menu item added successfully!", "success");

        setTimeout(function () {
          window.location.href = "/menuItems";
        }, 600);
      },

      error: function (xhr) {
        setLoading(false);

        console.log("add item error:", xhr.responseText);

        // ✅ ADDED: show backend error message if possible
        let msg = "❌ Failed to add item.";
        try {
          const json = xhr.responseJSON || JSON.parse(xhr.responseText || "{}");
          if (json && (json.error || json.message)) {
            msg = "❌ " + (json.error || json.message);
          }
        } catch (e) {
          // ignore JSON parse errors
        }

        showMsg(msg, "error");
      }
    });
  });

});
