const path = require("path");
const express = require("express");
const ExcelJS = require("exceljs");
const { orders } = require("./data/orders");

const app = express();

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/orders", (req, res) => {
  res.json(orders);
});

app.get("/api/export", async (req, res, next) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("訂單");

    sheet.columns = [
      { header: "訂單編號", key: "id", width: 14 },
      { header: "客戶", key: "customer", width: 14 },
      { header: "商品", key: "product", width: 18 },
      { header: "數量", key: "quantity", width: 8 },
      { header: "金額", key: "amount", width: 10 },
      { header: "日期", key: "date", width: 14 },
      { header: "狀態", key: "status", width: 12 },
    ];
    sheet.getRow(1).font = { bold: true };

    orders.forEach((order) => sheet.addRow(order));

    const filename = `orders_${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
});

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

module.exports = app;
