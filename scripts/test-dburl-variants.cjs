/* کدام فرمت DATABASE_URL روی مسیرهای غیراستاندارد (فارسی/فاصله) کار می‌کند؟ */
const path = require("path");
const { pathToFileURL } = require("url");
const { PrismaClient } = require("@prisma/client");

const db = path.join(__dirname, "db", "custom.db");
console.log("DB path:", db);

async function t(label, url) {
  const p = new PrismaClient({ datasourceUrl: url });
  try {
    await p.$queryRaw`SELECT 1`;
    console.log("OK   :", label, "->", url);
    return true;
  } catch (e) {
    console.log("FAIL :", label, "->", url, "|", String(e.message).split("\n")[0].slice(0, 90));
    return false;
  } finally {
    await p.$disconnect().catch(() => {});
  }
}

(async () => {
  await t("V1 pathToFileURL (fully encoded)", pathToFileURL(db).href);
  await t("V2 file:// + encodeURI", "file://" + encodeURI(db));
  await t("V3 raw file: + path", "file:" + db);
  await t("V4 file: + encodeURI(path)", "file:" + encodeURI(db));
  await t("V5 quoted raw", 'file:"' + db + '"');
  process.exit(0);
})();
