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
  BUY,
  SELL,
}

export enum TickDirection {
  PLUS,
  ZERO_PLUS,
  MINUS,
  ZERO_MINUS,
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
