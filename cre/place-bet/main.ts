import {
  HTTPCapability,
  handler,
  Runner,
  type Runtime,
  type HTTPPayload,
} from "@chainlink/cre-sdk";

export type Config = {};

export const onHttpTrigger = (
  runtime: Runtime<Config>,
  payload: HTTPPayload,
): string => {
  const input = new TextDecoder().decode(payload.input);
  runtime.log(`HTTP trigger received: ${JSON.parse(input.toString())["key"]}`);
  return input;
};

export const initWorkflow = (config: Config) => {
  const http = new HTTPCapability();

  return [handler(http.trigger({ authorizedKeys: [] }), onHttpTrigger)];
};

export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}
