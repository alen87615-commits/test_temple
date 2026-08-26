async function loadOrders() {
  const res = await fetch("/api/orders");
  const orders = await res.json();
  const tbody = document.getElementById("order-tbody");
  tbody.innerHTML = orders
    .map(
      (o) => `
      <tr>
        <td>${o.id}</td>
        <td>${o.customer}</td>
        <td>${o.product}</td>
        <td>${o.quantity}</td>
        <td>${o.amount}</td>
        <td>${o.date}</td>
        <td>${o.status}</td>
      </tr>`
    )
    .join("");
}

function filenameFromContentDisposition(header, fallback) {
  if (!header) return fallback;
  const match = /filename="?([^"]+)"?/.exec(header);
  return match ? match[1] : fallback;
}

async function exportOrders() {
  const btn = document.getElementById("export-btn");
  btn.disabled = true;
  const originalText = btn.textContent;
  btn.textContent = "匯出中...";

  try {
    const res = await fetch("/api/export");
    if (!res.ok) {
      throw new Error(`匯出失敗 (${res.status})`);
    }
    const blob = await res.blob();
    const filename = filenameFromContentDisposition(
      res.headers.get("Content-Disposition"),
      "orders.xlsx"
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error(err);
    alert("匯出訂單失敗，請稍後再試。");
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

document.getElementById("refresh-btn").addEventListener("click", loadOrders);
document.getElementById("export-btn").addEventListener("click", exportOrders);

loadOrders();
