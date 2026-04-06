import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { QuestradeClient } from "../client/questrade-client.js";

export function registerPortfolioTools(server: McpServer, client: QuestradeClient): void {
  server.tool(
    "getPortfolio",
    "Get a full portfolio overview — all accounts with their positions and balances in a single call",
    {},
    async () => {
      const { accounts } = await client.getAccounts();

      const results = await Promise.all(
        accounts
          .filter((a) => a.status === "Active")
          .map(async (account) => {
            const [positions, balances] = await Promise.all([
              client.getPositions(account.number),
              client.getBalances(account.number),
            ]);
            return {
              account: {
                number: account.number,
                type: account.type,
                status: account.status,
                isPrimary: account.isPrimary,
              },
              positions: positions.positions,
              balances: {
                perCurrency: balances.perCurrencyBalances,
                combined: balances.combinedBalances,
              },
            };
          }),
      );

      return {
        content: [{ type: "text" as const, text: JSON.stringify(results, null, 2) }],
      };
    },
  );

  server.tool(
    "getPositions",
    "Get all positions held in a specific Questrade account",
    {
      accountId: z.string().describe("Questrade account number (e.g., '12345678')"),
    },
    async ({ accountId }) => {
      const { positions } = await client.getPositions(accountId);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(positions, null, 2) }],
      };
    },
  );

  server.tool(
    "getBalances",
    "Get cash balances and buying power for a specific Questrade account",
    {
      accountId: z.string().describe("Questrade account number (e.g., '12345678')"),
    },
    async ({ accountId }) => {
      const balances = await client.getBalances(accountId);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(balances, null, 2) }],
      };
    },
  );
}
