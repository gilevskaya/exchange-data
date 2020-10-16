export enum Exchange {
  DERIBIT = 'deribit',
  BITMEX = 'bitmex',
  BINANCE = 'binance',
}

export enum Subscription {
  TICKER = 'ticker',
  TRADES = 'trades',
  ORDERBOOK = 'orderbook',
}

export enum Side {
  BUY,
  SELL,
}

export enum TickDirection {
  PLUS,
  ZERO_PLUS,
  MINUS,
  ZERO_MINUS,
}

export type TSubscription =
  | {
      type: Subscription.ORDERBOOK;
      instrument: string;
      options?: {};
    }
  | {
      type: Subscription.TICKER;
      instrument: string;
      options?: {};
    }
  | {
      type: Subscription.TRADES;
      instrument: string;
      options?: {
        limit?: number;
      };
    };

export type TTrade = {
  id: string;
  size: number; // amount
  side: Side; // direction
  price: number;
  timestamp: number;
  tickDirection: TickDirection; // tick_direction
};
