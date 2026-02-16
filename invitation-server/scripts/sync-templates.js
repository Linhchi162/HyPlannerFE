const fs = require("fs");
const path = require("path");

function copyIfExists(src, dest) {
  if (!fs.existsSync(src)) return false;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  return true;
}

function main() {
  // In repo layout: HyPlannerFE/invitation-server/ and HyPlannerBE/views/
  const sourceViews = path.resolve(__dirname, "../../../HyPlannerBE/views");
  const targetViews = path.resolve(__dirname, "../views");

  if (!fs.existsSync(sourceViews)) {
    console.log(
      `[sync-templates] Source views not found at ${sourceViews}. Skipping.`
    );
    return;
  }

  const files = fs
    .readdirSync(sourceViews)
    .filter(
      (f) =>
        (f.startsWith("template-") && f.endsWith(".ejs") && f !== "template-1-old.ejs") ||
        f === "404.ejs"
    );

  let copied = 0;
  for (const file of files) {
    const ok = copyIfExists(
      path.join(sourceViews, file),
      path.join(targetViews, file)
    );
    if (ok) copied += 1;
  }

  console.log(`[sync-templates] Copied ${copied} view file(s) to ${targetViews}`);
}

main();

