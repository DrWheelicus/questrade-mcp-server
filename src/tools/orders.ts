import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { QuestradeClient } from "@/client/questrade-client.js";

const orderStateFilters = [
  "All", "Open", "Filled", "Cancelled", "Expired", "Rejected", "Pending",
] as const;

export function registerOrderTools(server: McpServer, client: QuestradeClient): void {
  server.tool(
    "getOrders",
    "Get order history for a Questrade account with optional state and date filters",
    {
      accountId: z.string().describe("Questrade account number"),
      stateFilter: z
        .enum(orderStateFilters)
        .optional()
        .default("All")
        .describe("Filter orders by state (default: All)"),
      startTime: z.string().optional().describe("Start of date range in ISO 8601 format"),
      endTime: z.string().optional().describe("End of date range in ISO 8601 format"),
    },
    async ({ accountId, stateFilter, startTime, endTime }) => {
      const { orders } = await client.getOrders(accountId, {
        stateFilter,
        startTime,
        endTime,
      });

      const formatted = orders.map((o) => ({
        id: o.id,
        symbol: o.symbol,
        side: o.side,
        orderType: o.orderType,
        state: o.state,
        totalQuantity: o.totalQuantity,
        filledQuantity: o.filledQuantity,
        limitPrice: o.limitPrice,
        avgExecPrice: o.avgExecPrice,
        timeInForce: o.timeInForce,
        creationTime: o.creationTime,
        updateTime: o.updateTime,
      }));

      return {
        content: [{ type: "text" as const, text: JSON.stringify(formatted, null, 2) }],
      };
    },
  );

  server.tool(
    "getAccountActivity",
    "Get a combined timeline of account activities (dividends, deposits, trades) and trade executions for a date range",
    {
      accountId: z.string().describe("Questrade account number"),
      startTime: z.string().describe("Start of date range in ISO 8601 format (e.g., '2025-01-01T00:00:00-05:00')"),
      endTime: z.string().describe("End of date range in ISO 8601 format (e.g., '2025-03-31T23:59:59-05:00')"),
    },
    async ({ accountId, startTime, endTime }) => {
      const [activities, executions] = await Promise.all([
        client.getActivities(accountId, startTime, endTime),
        client.getExecutions(accountId, startTime, endTime),
      ]);

      const result = {
        activities: activities.activities.map((a) => ({
          tradeDate: a.tradeDate,
          action: a.action,
          symbol: a.symbol,
          description: a.description,
          currency: a.currency,
          quantity: a.quantity,
          price: a.price,
          netAmount: a.netAmount,
          type: a.type,
        })),
        executions: executions.executions.map((e) => ({
          timestamp: e.timestamp,
          symbol: e.symbol,
          side: e.side,
          quantity: e.quantity,
          price: e.price,
          totalCost: e.totalCost,
          commission: e.commission,
          venue: e.venue,
        })),
      };

      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}
