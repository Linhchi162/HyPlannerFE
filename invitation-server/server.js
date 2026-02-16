const app = require("./app");
const PORT = process.env.PORT || 5050;
// Only listen when running locally (not on Vercel)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Invitation server listening on http://localhost:${PORT}`);
  });
}

