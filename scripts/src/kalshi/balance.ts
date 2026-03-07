import { getKalshiHeaders, BASE_URL } from "./headers.ts";

const path = "/trade-api/v2/portfolio/balance";
const headers = getKalshiHeaders("GET", path);

const res = await fetch(BASE_URL + path, {
  method: "GET",
  headers: {
    ...headers,
    "Content-Type": "application/json",
  },
});

const data = await res.json();
console.log("Portfolio balance:", data);
