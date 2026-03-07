import path from "node:path";
import { getKalshiHeaders } from "./headers.ts";

const TEST_K_PATH = path.resolve(import.meta.dir, "../../../cre/place-bet/test-k.json");

const testK = await Bun.file(TEST_K_PATH).json();
const headers = getKalshiHeaders("POST", "/trade-api/v2/portfolio/orders");

testK.kalshiAuth = {
  accessKey: headers["KALSHI-ACCESS-KEY"],
  accessSignature: headers["KALSHI-ACCESS-SIGNATURE"],
  accessTimestamp: headers["KALSHI-ACCESS-TIMESTAMP"],
};

await Bun.write(TEST_K_PATH, JSON.stringify(testK, null, 2) + "\n");
console.log("Updated test-k.json with fresh Kalshi auth headers");
