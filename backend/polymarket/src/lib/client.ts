import { ClobClient } from "@polymarket/clob-client";
import { CLOB_BASE_URL } from "../constants";

export const clobClient = new ClobClient(CLOB_BASE_URL, 137);
