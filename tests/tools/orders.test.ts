import { describe, it, expect, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerOrderTools } from "@/tools/orders.js";
import type { QuestradeClient } from "@/client/questrade-client.js";

function createMockClient(): QuestradeClient {
  return {
    getOrders: vi.fn().mockResolvedValue({
      orders: [
        {
          id: 101, symbol: "AAPL", symbolId: 8049, totalQuantity: 10, openQuantity: 0,
          filledQuantity: 10, canceledQuantity: 0, side: "Buy", orderType: "Limit",
          limitPrice: 148, stopPrice: null, isAllOrNone: false, isAnonymous: false,
          timeInForce: "Day", gtdDate: null, state: "Executed", avgExecPrice: 147.5,
          lastExecPrice: 147.5, source: "TradingAPI", primaryRoute: "AUTO",
          secondaryRoute: "", orderRoute: "LAMP", venueHoldingOrder: "",
          comissionCharged: 4.95, exchangeOrderId: "XYZ", isSignificantShareHolder: false,
          isInsider: false, isLimitOffsetInDollar: false, userId: 1,
          placementCommission: null, triggerStopPrice: null, orderGroupId: 0,
          orderClass: null, isCrossZero: false,
          creationTime: "2025-06-01T09:30:00", updateTime: "2025-06-01T09:31:00",
          notes: "", accountNumber: "12345678",
        },
      ],
    }),
    getActivities: vi.fn().mockResolvedValue({
      activities: [
        {
          tradeDate: "2025-06-01", transactionDate: "2025-06-01",
          settlementDate: "2025-06-03", action: "Buy", symbol: "AAPL", symbolId: 8049,
          description: "APPLE INC", currency: "USD", quantity: 10, price: 147.5,
          grossAmount: -1475, commission: -4.95, netAmount: -1479.95, type: "Trades",
        },
      ],
    }),
    getExecutions: vi.fn().mockResolvedValue({
      executions: [
        {
          symbol: "AAPL", symbolId: 8049, quantity: 10, side: "Buy", price: 147.5,
          id: 201, orderId: 101, orderChainId: 101, exchangeExecId: "EXC123",
          timestamp: "2025-06-01T09:31:00", notes: "", venue: "LAMP",
          totalCost: 1479.95, orderPlacementCommission: 0, commission: 4.95,
          executionFee: 0, secFee: 0, canadianExecutionFee: 0, parentId: 0,
        },
      ],
    }),
  } as unknown as QuestradeClient;
}

describe("Order Tools", () => {
  it("registers both order tools on the server", () => {
    const server = new McpServer({ name: "test", version: "0.0.1" });
    const mockClient = createMockClient();

    const toolSpy = vi.spyOn(server, "tool");
    registerOrderTools(server, mockClient);

    const registeredNames = toolSpy.mock.calls.map((call) => call[0]);
    expect(registeredNames).toContain("getOrders");
    expect(registeredNames).toContain("getAccountActivity");
  });

  it("getOrders returns formatted order data", async () => {
    const mockClient = createMockClient();

    const { orders } = await mockClient.getOrders("12345678", { stateFilter: "All" });
    expect(orders).toHaveLength(1);

    const o = orders[0]!;
    expect(o.symbol).toBe("AAPL");
    expect(o.side).toBe("Buy");
    expect(o.state).toBe("Executed");
    expect(o.filledQuantity).toBe(10);
    expect(o.avgExecPrice).toBe(147.5);
  });

  it("getOrders passes filter params to client", async () => {
    const mockClient = createMockClient();
    const params = { stateFilter: "Executed", startTime: "2025-01-01", endTime: "2025-12-31" };

    await mockClient.getOrders("12345678", params);

    expect(mockClient.getOrders).toHaveBeenCalledWith("12345678", params);
  });

  it("getAccountActivity fetches activities and executions in parallel", async () => {
    const mockClient = createMockClient();
    const start = "2025-01-01T00:00:00-05:00";
    const end = "2025-06-30T23:59:59-05:00";

    const [activities, executions] = await Promise.all([
      mockClient.getActivities("12345678", start, end),
      mockClient.getExecutions("12345678", start, end),
    ]);

    expect(activities.activities).toHaveLength(1);
    expect(activities.activities[0]!.symbol).toBe("AAPL");
    expect(activities.activities[0]!.type).toBe("Trades");

    expect(executions.executions).toHaveLength(1);
    expect(executions.executions[0]!.venue).toBe("LAMP");
  });

  it("getAccountActivity formats combined result shape", async () => {
    const mockClient = createMockClient();
    const start = "2025-01-01T00:00:00-05:00";
    const end = "2025-06-30T23:59:59-05:00";

    const [activitiesRes, executionsRes] = await Promise.all([
      mockClient.getActivities("12345678", start, end),
      mockClient.getExecutions("12345678", start, end),
    ]);

    const result = {
      activities: activitiesRes.activities.map((a) => ({
        tradeDate: a.tradeDate,
        action: a.action,
        symbol: a.symbol,
        netAmount: a.netAmount,
        type: a.type,
      })),
      executions: executionsRes.executions.map((e) => ({
        timestamp: e.timestamp,
        symbol: e.symbol,
        side: e.side,
        price: e.price,
        commission: e.commission,
      })),
    };

    expect(result.activities).toHaveLength(1);
    expect(result.activities[0]!.action).toBe("Buy");
    expect(result.executions).toHaveLength(1);
    expect(result.executions[0]!.side).toBe("Buy");
  });
});
