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

  function loadMenuItems() {
    $.ajax({
      url: "/api/v1/menuItem/view",
      method: "GET",
      success: function (data) {

        let items = data?.items || data?.data || data;
        if (!Array.isArray(items)) items = [];

        $("#itemsBody").empty();

        if (items.length === 0) {
          $("#emptyMsg").show();
          return;
        }

        $("#emptyMsg").hide();

        items.forEach(function (item) {

          // ✅ FIX: menuItemId (you wrote menuitemId)
          const id = item.id || item.itemId || item.menuItemId || item._id;

          const name = safe(item.name);
          const category = safe(item.category);
          const desc = safe(item.description);
          const price = safe(item.price);
          const status = safe(item.status);

          const row = `
            <tr>
              <td>${safe(id)}</td>
              <td>${name}</td>
              <td>${category}</td>
              <td>${desc}</td>
              <td>${price}</td>
              <td>${status}</td>
              <td>
                <button class="btn btn-danger btn-sm deleteBtn" data-id="${safe(id)}">Delete</button>
              </td>
            </tr>
          `;

          $("#itemsBody").append(row);
        });
      },
      error: function (xhr) {
        console.log("loadMenuitems error:", xhr.responseText);
        alert("Failed to load menu items.");
      }
    });
  }

  // Delete item
  $(document).on("click", ".deleteBtn", function () {
    const itemId = $(this).data("id");
    if (!itemId) return alert("Item ID not found");

    const ok = confirm("Are you sure you want to delete this item?");
    if (!ok) return;

    $.ajax({
      url: "/api/v1/menuItem/delete/" + itemId,
      method: "DELETE",
      success: function () {
        alert("✅ Item deleted!");
        loadMenuItems();
      },
      error: function (xhr) {
        console.log("delete error:", xhr.responseText);
        alert("❌ Failed to delete item. Check console.");
      }
    });
  });

  // init
  loadMenuItems();

});
