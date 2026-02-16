const fs = require("fs");
const path = require("path");

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function main() {
  // Repo layout:
  // - HyPlannerFE/invitation-server  (this script)
  // - HyPlannerBE/views             (source templates)
  const sourceViews = path.resolve(__dirname, "../../../HyPlannerBE/views");
  const targetViews = path.resolve(__dirname, "../views");

  if (!fs.existsSync(sourceViews)) {
    console.log(
      `[sync-templates] Source views not found at ${sourceViews}. Nothing copied.`
    );
    return;
  }

  const files = fs
    .readdirSync(sourceViews)
    .filter(
      (file) =>
        ((file.startsWith("template-") &&
          file.endsWith(".ejs") &&
          file !== "template-1-old.ejs") ||
          file === "404.ejs")
    );

  let copied = 0;
  for (const file of files) {
    copyFile(path.join(sourceViews, file), path.join(targetViews, file));
    copied += 1;
  }

  console.log(
    `[sync-templates] Copied ${copied} view file(s) from ${sourceViews} -> ${targetViews}`
  );
}

main();
