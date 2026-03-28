import { app } from "./app";

const port = Number(process.env.PORT ?? 3000);

app.listen(port, () => {
  console.log(`[api] listening on http://localhost:${port} (demo: /demo.html)`);
});
