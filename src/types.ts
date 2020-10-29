export enum Exchange {
  DERIBIT = 'deribit',
  BITMEX = 'bitmex',
  BINANCE = 'binance',
}

export enum Channel {
  TICKER = 'ticker',
  TRADES = 'trades',
  ORDERBOOK = 'orderbook',
}

export enum Side {
  BUY = 'buy',
  SELL = 'sell',
}

export enum TickDirection {
  PLUS = 'plus',
  ZERO_PLUS = 'zero-plus',
  MINUS = 'minus',
  ZERO_MINUS = 'zero-minus',
}

export type TSubscription = { exchange: Exchange; instrument: string } & (
  | { channel: Channel.ORDERBOOK; options?: {} }
  | { channel: Channel.TICKER; options?: {} }
  | {
      channel: Channel.TRADES;
      options?: {
        limit?: number;
      };
    }
);

export type TTrade = {
  id: string;
  size: number; // amount
  side: Side; // direction
  price: number;
  timestamp: number;
  tickDirection: TickDirection; // tick_direction
};
export type TOrderBookEdit = {
  id: number;
  price: number;
  size: number;
  sizeBTC?: number;
};
type TOrderBookEntryBase = {
  side: Side;
  price: number;
  size: number;
  sizeBTC?: number;
  total: number;
};
export type TOrderBookEntry = TOrderBookEntryBase & {
  id: number;
};
export type TOrderBookEntries = Map<number, TOrderBookEntry>;
export type TOrderBook = {
  entries: TOrderBookEntries;
  asks: number[];
  bids: number[];
};

// useWebSocket types

export type TWSOptions = {
  onOpen?: Function;
  onClose?: Function;
  onError?: Function;
  autoConnect?: boolean;
  shouldReconnect?: boolean;
  dev?: { connectAlert?: string };
};

export type TWSSendMessage<Res, Req> = (req: Req | string) => Promise<Res>;

export type TWSCurrentSubscriptions = Map<
  string,
  {
    info: TSubscription;
    status: 'subscribed' | 'subscribing' | 'unsubscribing';
  } // string - for connected sub name - vs null connecting
>;
