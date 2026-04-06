// ── OAuth ──

export interface TokenResponse {
  access_token: string;
  api_server: string;
  expires_in: number;
  refresh_token: string;
  token_type: string;
}

export interface PersistedTokens {
  accessToken: string;
  refreshToken: string;
  apiServer: string;
  expiresAt: number;
}

// ── Accounts ──

export type AccountType =
  | "Cash"
  | "Margin"
  | "TFSA"
  | "RRSP"
  | "SRRSP"
  | "LRRSP"
  | "LIRA"
  | "LIF"
  | "RIF"
  | "SRIF"
  | "LRIF"
  | "RRIF"
  | "PRIF"
  | "RESP"
  | "FRESP"
  | "RDSP"
  | "FX";

export type AccountStatus = "Active" | "Closed" | "SuspendedClosed" | "SuspendedOpen" | "Liquidated";

export interface Account {
  type: AccountType;
  number: string;
  status: AccountStatus;
  isPrimary: boolean;
  isBilling: boolean;
  clientAccountType: string;
}

export interface AccountsResponse {
  accounts: Account[];
}

// ── Positions ──

export interface Position {
  symbol: string;
  symbolId: number;
  openQuantity: number;
  closedQuantity: number;
  currentMarketValue: number;
  currentPrice: number;
  averageEntryPrice: number;
  dayPnl: number;
  closedPnl: number;
  openPnl: number;
  totalCost: number;
  isRealTime: boolean;
  isUnderReorg: boolean;
}

export interface PositionsResponse {
  positions: Position[];
}

// ── Balances ──

export interface Balance {
  currency: string;
  cash: number;
  marketValue: number;
  totalEquity: number;
  buyingPower: number;
  maintenanceExcess: number;
  isRealTime: boolean;
}

export interface BalancesResponse {
  perCurrencyBalances: Balance[];
  combinedBalances: Balance[];
  sodPerCurrencyBalances: Balance[];
  sodCombinedBalances: Balance[];
}

// ── Symbols ──

export interface SymbolSearchResult {
  symbol: string;
  symbolId: number;
  description: string;
  securityType: string;
  listingExchange: string;
  isQuotable: boolean;
  isTradable: boolean;
  currency: string;
}

export interface SymbolSearchResponse {
  symbols: SymbolSearchResult[];
}

export interface SymbolInfo {
  symbol: string;
  symbolId: number;
  prevDayClosePrice: number;
  highPrice52: number;
  lowPrice52: number;
  averageVol3Months: number;
  averageVol20Days: number;
  outstandingShares: number;
  eps: number;
  pe: number;
  dividend: number;
  yield: number;
  exDate: string | null;
  marketCap: number;
  optionType: string | null;
  optionDurationdType: string | null;
  optionRoot: string;
  optionContractDeliverables: unknown;
  optionExerciseType: string | null;
  listingExchange: string;
  description: string;
  securityType: string;
  optionExpiryDate: string | null;
  dividendDate: string | null;
  optionStrikePrice: number | null;
  isTradable: boolean;
  isQuotable: boolean;
  hasOptions: boolean;
  currency: string;
  minTicks: MinTick[];
  industrySector: string;
  industryGroup: string;
  industrySubGroup: string;
}

export interface MinTick {
  pivot: number;
  minTick: number;
}

export interface SymbolsResponse {
  symbols: SymbolInfo[];
}

// ── Quotes ──

export type TickType = "Up" | "Down" | "Equal";

export interface Quote {
  symbol: string;
  symbolId: number;
  tier: string;
  bidPrice: number | null;
  bidSize: number;
  askPrice: number | null;
  askSize: number;
  lastTradePriceTrHrs: number | null;
  lastTradePrice: number | null;
  lastTradeSize: number;
  lastTradeTick: TickType;
  lastTradeTime: string;
  volume: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  delay: number;
  isHalted: boolean;
}

export interface QuotesResponse {
  quotes: Quote[];
}

// ── Candles ──

export type CandleInterval =
  | "OneMinute"
  | "TwoMinutes"
  | "ThreeMinutes"
  | "FourMinutes"
  | "FiveMinutes"
  | "TenMinutes"
  | "FifteenMinutes"
  | "TwentyMinutes"
  | "HalfHour"
  | "OneHour"
  | "TwoHours"
  | "FourHours"
  | "OneDay"
  | "OneWeek"
  | "OneMonth"
  | "OneYear";

export interface Candle {
  start: string;
  end: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  VWAP?: number;
}

export interface CandlesResponse {
  candles: Candle[];
}

// ── Orders ──

export type OrderState =
  | "Failed"
  | "Pending"
  | "Accepted"
  | "Rejected"
  | "CancelPending"
  | "Canceled"
  | "PartialCanceled"
  | "Partial"
  | "Executed"
  | "ReplacePending"
  | "Replaced"
  | "Stopped"
  | "Suspended"
  | "Expired"
  | "Queued"
  | "Triggered"
  | "Activated"
  | "PendingRiskReview"
  | "ContingentOrder";

export type OrderSide = "Buy" | "Sell" | "Short" | "Cov" | "BTO" | "STC" | "STO" | "BTC";

export type OrderType =
  | "Market"
  | "Limit"
  | "Stop"
  | "StopLimit"
  | "TrailStopInPercentage"
  | "TrailStopInDollar"
  | "TrailStopLimitInPercentage"
  | "TrailStopLimitInDollar"
  | "LimitOnOpen"
  | "LimitOnClose";

export type OrderTimeInForce = "Day" | "GoodTillCanceled" | "GoodTillExtendedDay" | "GoodTillDate";

export interface Order {
  id: number;
  symbol: string;
  symbolId: number;
  totalQuantity: number;
  openQuantity: number;
  filledQuantity: number;
  canceledQuantity: number;
  side: OrderSide;
  orderType: OrderType;
  limitPrice: number | null;
  stopPrice: number | null;
  isAllOrNone: boolean;
  isAnonymous: boolean;
  timeInForce: OrderTimeInForce;
  gtdDate: string | null;
  state: OrderState;
  avgExecPrice: number | null;
  lastExecPrice: number | null;
  source: string;
  primaryRoute: string;
  secondaryRoute: string;
  orderRoute: string;
  venueHoldingOrder: string;
  comissionCharged: number;
  exchangeOrderId: string;
  isSignificantShareHolder: boolean;
  isInsider: boolean;
  isLimitOffsetInDollar: boolean;
  userId: number;
  placementCommission: number | null;
  triggerStopPrice: number | null;
  orderGroupId: number;
  orderClass: string | null;
  isCrossZero: boolean;
  creationTime: string;
  updateTime: string;
  notes: string;
  accountNumber: string;
}

export interface OrdersResponse {
  orders: Order[];
}

// ── Activities ──

export type ActivityType = "Trades" | "Dividends" | "Orders" | "Deposits" | "Other" | "WithdrawalCharges"
  | "Transfers" | "Interest" | "FXConversion" | "Corporate actions";

export interface Activity {
  tradeDate: string;
  transactionDate: string;
  settlementDate: string;
  action: string;
  symbol: string;
  symbolId: number;
  description: string;
  currency: string;
  quantity: number;
  price: number;
  grossAmount: number;
  commission: number;
  netAmount: number;
  type: ActivityType;
}

export interface ActivitiesResponse {
  activities: Activity[];
}

// ── Executions ──

export interface Execution {
  symbol: string;
  symbolId: number;
  quantity: number;
  side: OrderSide;
  price: number;
  id: number;
  orderId: number;
  orderChainId: number;
  exchangeExecId: string;
  timestamp: string;
  notes: string;
  venue: string;
  totalCost: number;
  orderPlacementCommission: number;
  commission: number;
  executionFee: number;
  secFee: number;
  canadianExecutionFee: number;
  parentId: number;
}

export interface ExecutionsResponse {
  executions: Execution[];
}

// ── API Errors ──

export interface QuestradeApiError {
  code: number;
  message: string;
}

export interface QuestradeErrorResponse {
  code: number;
  message: string;
}
