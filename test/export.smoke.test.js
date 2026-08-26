const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const app = require("../server");

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test("GET /api/export 回傳 200 並帶有 Excel content-type", async () => {
  const res = await fetch(`${baseUrl}/api/export`);
  assert.equal(res.status, 200);
  assert.equal(
    res.headers.get("content-type"),
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
});

test("GET /api/export 回傳附件下載標頭與 .xlsx 檔名", async () => {
  const res = await fetch(`${baseUrl}/api/export`);
  const disposition = res.headers.get("content-disposition");
  assert.ok(disposition, "應包含 Content-Disposition 標頭");
  assert.match(disposition, /attachment/);
  assert.match(disposition, /filename="orders_\d{4}-\d{2}-\d{2}\.xlsx"/);
});

test("GET /api/export 回傳非空的 Excel 檔案內容", async () => {
  const res = await fetch(`${baseUrl}/api/export`);
  const buffer = Buffer.from(await res.arrayBuffer());
  assert.ok(buffer.length > 0, "檔案內容不應為空");
  // xlsx 是 zip 格式，檔頭應以 PK 開頭
  assert.equal(buffer.slice(0, 2).toString("ascii"), "PK");
});

test("首頁 HTML 應包含匯出訂單按鈕", async () => {
  const res = await fetch(`${baseUrl}/`);
  const html = await res.text();
  assert.match(html, /id="export-btn"/);
  assert.match(html, /匯出訂單/);
});
