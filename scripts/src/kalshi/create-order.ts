const BASE_URL = "https://demo-api.kalshi.co";
const ORDER_PATH = "/trade-api/v2/portfolio/orders";

const [ticker, action, side, count, price, ...headerParts] = Bun.argv.slice(2);

if (!ticker || !action || !side || !count || !price || headerParts.length < 3) {
  console.error(
    "Usage: bun run kalshi:create-order <ticker> <action> <side> <count> <yes_price> <KALSHI-ACCESS-KEY> <KALSHI-ACCESS-SIGNATURE> <KALSHI-ACCESS-TIMESTAMP>",
  );
  process.exit(1);
}

const [accessKey, accessSignature, accessTimestamp] = headerParts;

const body = {
  ticker,
  action,
  side,
  count: parseInt(count),
  yes_price: parseInt(price),
  type: "limit",
};

const res = await fetch(BASE_URL + ORDER_PATH, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "KALSHI-ACCESS-KEY": accessKey,
    "KALSHI-ACCESS-SIGNATURE": accessSignature,
    "KALSHI-ACCESS-TIMESTAMP": accessTimestamp,
  },
  body: JSON.stringify(body),
});

const data = await res.json();
console.log(JSON.stringify(data, null, 2));
