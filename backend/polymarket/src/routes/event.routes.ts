import { Hono } from "hono";
import { fetchEventDetail } from "../controllers/event.controller";

const event = new Hono();

event.get("/event/:id", fetchEventDetail);

export default event;
