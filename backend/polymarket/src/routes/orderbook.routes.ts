import { Hono } from "hono";
import { fetchOrderbook } from "../controllers/orderbook.controller";

const orderbook = new Hono();

orderbook.get("/orderbook/:tokenId", fetchOrderbook);

export default orderbook;
