import { Hono } from "hono";
import homepage from "./routes/homepage.routes";
import event from "./routes/event.routes";
import orderbook from "./routes/orderbook.routes";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.route("/", homepage);
app.route("/", event);
app.route("/", orderbook);

export default {
  port: Number(process.env.PORT) || 3131,
  fetch: app.fetch,
};
