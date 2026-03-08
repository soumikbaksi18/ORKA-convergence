import { Hono } from "hono";
import { fetchHomepageStats } from "../controllers/homepage.controller";

const homepage = new Hono();

homepage.get("/fetch-homepage-data", fetchHomepageStats);

export default homepage;
