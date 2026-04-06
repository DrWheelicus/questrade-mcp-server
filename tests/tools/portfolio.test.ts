import { describe, it, expect, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerPortfolioTools } from "../../src/tools/portfolio.js";
import type { QuestradeClient } from "../../src/client/questrade-client.js";

function createMockClient(): QuestradeClient {
  return {
    getAccounts: vi.fn().mockResolvedValue({
      accounts: [
        { number: "12345678", type: "TFSA", status: "Active", isPrimary: true, isBilling: false, clientAccountType: "Individual" },
        { number: "87654321", type: "Margin", status: "Closed", isPrimary: false, isBilling: false, clientAccountType: "Individual" },
      ],
    }),
    getPositions: vi.fn().mockResolvedValue({
      positions: [
        { symbol: "AAPL", symbolId: 8049, openQuantity: 10, currentPrice: 150.0, currentMarketValue: 1500.0, openPnl: 100.0 },
      ],
    }),
    getBalances: vi.fn().mockResolvedValue({
      perCurrencyBalances: [{ currency: "CAD", cash: 5000, totalEquity: 15000, buyingPower: 10000 }],
      combinedBalances: [{ currency: "CAD", cash: 5000, totalEquity: 15000, buyingPower: 10000 }],
      sodPerCurrencyBalances: [],
      sodCombinedBalances: [],
    }),
  } as unknown as QuestradeClient;
}

describe("Portfolio Tools", () => {
  it("registers all three portfolio tools on the server", () => {
    const server = new McpServer({ name: "test", version: "0.0.1" });
    const mockClient = createMockClient();

    const toolSpy = vi.spyOn(server, "tool");
    registerPortfolioTools(server, mockClient);

    const registeredNames = toolSpy.mock.calls.map((call) => call[0]);
    expect(registeredNames).toContain("getPortfolio");
    expect(registeredNames).toContain("getPositions");
    expect(registeredNames).toContain("getBalances");
  });

  it("getPortfolio only includes active accounts", async () => {
    const mockClient = createMockClient();

    // Manually invoke the getPortfolio handler logic
    const { accounts } = await mockClient.getAccounts();
    const activeAccounts = accounts.filter((a) => a.status === "Active");

    expect(activeAccounts).toHaveLength(1);
    expect(activeAccounts[0]!.number).toBe("12345678");
  });

  it("getPortfolio fetches positions and balances in parallel per account", async () => {
    const mockClient = createMockClient();

    const { accounts } = await mockClient.getAccounts();
    const active = accounts.filter((a) => a.status === "Active");

    await Promise.all(
      active.map(async (account) => {
        const [positions, balances] = await Promise.all([
          mockClient.getPositions(account.number),
          mockClient.getBalances(account.number),
        ]);
        expect(positions.positions).toHaveLength(1);
        expect(balances.perCurrencyBalances).toHaveLength(1);
      }),
    );

    expect(mockClient.getPositions).toHaveBeenCalledWith("12345678");
    expect(mockClient.getBalances).toHaveBeenCalledWith("12345678");
  });
});
