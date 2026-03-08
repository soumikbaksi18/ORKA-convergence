import { Hono } from "hono";
import { fetchHomepageStats } from "../controllers/homepage.controller";

const homepage = new Hono();

homepage.get("/fetch-homepage-stats", fetchHomepageStats);

export default homepage;
