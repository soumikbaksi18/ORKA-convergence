import { getKalshiHeaders } from "./headers.ts";

const headers = getKalshiHeaders("POST", "/trade-api/v2/portfolio/orders");
console.log(JSON.stringify(headers, null, 2));
