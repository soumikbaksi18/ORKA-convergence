import { createWalletClient, createPublicClient, http, parseAbi, maxUint256 } from "viem";
import { polygon } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const USDC = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" as const;
const CTF_EXCHANGE = "0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E" as const;
const NEG_RISK_EXCHANGE = "0xC5d563A36AE78145C45a50134d48A1215220f80a" as const;

const abi = parseAbi([
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
]);

const pk = process.env.PRIVATE_KEY;
if (!pk) {
  console.error("Set PRIVATE_KEY env var");
  process.exit(1);
}

const account = privateKeyToAccount(pk.startsWith("0x") ? pk as `0x${string}` : `0x${pk}`);

const publicClient = createPublicClient({ chain: polygon, transport: http() });
const walletClient = createWalletClient({ account, chain: polygon, transport: http() });

console.log(`Wallet: ${account.address}`);

for (const [name, spender] of [["CTF Exchange", CTF_EXCHANGE], ["Neg Risk Exchange", NEG_RISK_EXCHANGE]] as const) {
  const allowance = await publicClient.readContract({
    address: USDC, abi, functionName: "allowance",
    args: [account.address, spender],
  });

  if (allowance > 0n) {
    console.log(`${name}: already approved (${allowance})`);
    continue;
  }

  console.log(`${name}: approving...`);
  const hash = await walletClient.writeContract({
    address: USDC, abi, functionName: "approve",
    args: [spender, maxUint256],
  });
  console.log(`${name}: tx ${hash}`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`${name}: confirmed block ${receipt.blockNumber}`);
}

console.log("Done");
