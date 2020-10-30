// https://www.bitmex.com/app/wsAPI
import React from 'react';

import { ReadyState, useWebSocket } from '../utils/useWebSocket';
import {
  TRADES_STORE_LIMIT,
  syncSubscriptions,
  applyExchangeOrderBookEdits,
} from '../utils';
import {
  TickDirection,
  Side,
  Exchange,
  Channel,
  TSubscription,
  TTrade,
  TOrderBook,
  TWSOptions,
  TWSCurrentSubscriptions,
} from '../types';

const WS_URL_BITMEX = 'wss://www.bitmex.com/realtime';

export const useBitmex = (
  subscriptions: TSubscription[] = [],
  wsOptions?: TWSOptions
) => {
  const [currentSubscriptions, setCurrentSubscriptions] = React.useState<
    TWSCurrentSubscriptions
  >(new Map());

  const [orderbook, setOrderbook] = React.useState<TOrderBook | null>(null);
  const [lastPrice, setLastPrice] = React.useState<number | null>(null);
  const [trades, setTrades] = React.useState<TTrade[] | null>(null);

  const obBitmexId = React.useRef<Map<number, number>>(new Map());

  const {
    readyState,
    lastMessage,
    sendMessage,
    connect,
    disconnect,
  } = useWebSocket<TWSMessageBitmex_Res, TWSMessageBitmex_Req>(WS_URL_BITMEX, {
    ...wsOptions,
    onOpen: () => {
      syncBitmexSubscriptions(currentSubscriptions, subscriptions);
      if (wsOptions?.onOpen) wsOptions.onOpen();
    },
    onClose: () => {
      setOrderbook(null);
      setLastPrice(null);
      setTrades(null);
      if (wsOptions?.onClose) wsOptions.onClose();
    },
  });

  const syncBitmexSubscriptions = React.useCallback(
    (
      currSubscriptions: TWSCurrentSubscriptions,
      newSubscriptions: TSubscription[]
    ) => {
      syncSubscriptions<TWSMessageBitmex_Res_Subscription>({
        exchange: Exchange.BITMEX,
        getSubscriptionName: (subs, instrument) =>
          ({
            [Channel.ORDERBOOK]: `orderBookL2_25:${instrument}`,
            [Channel.TICKER]: `instrument:${instrument}`,
            [Channel.TRADES]: `trade:${instrument}`,
          }[subs]),
        updateSubscriptions: async (updChannels, isSubcribe) => {
          // one by one because can't get the subscr confirmation otherwise (limitation of useWebSocket)
          return Promise.all(
            updChannels.map(
              channel =>
                sendMessage({
                  op: isSubcribe ? 'subscribe' : 'unsubscribe',
                  args: [channel],
                }) as Promise<TWSMessageBitmex_Res_Subscription>
            )
          );
        },
        processUpdateSubscriptionRes: (currSub, subRes, unsubRes) => {
          if (subRes) {
            if (!Array.isArray(subRes))
              throw new Error(`Should be an array ${subRes}`);
            subRes.forEach(sRes => {
              const subName = sRes.request.args[0];
              if (!sRes.success) {
                console.error('Bitmex subscription error', sRes);
                currSub.delete(subName);
              } else {
                const sub = currSub.get(subName);
                if (sub) currSub.set(subName, { ...sub, status: 'subscribed' });
              }
            });
          }
          if (unsubRes) {
            if (!Array.isArray(unsubRes))
              throw new Error(`Should be an array ${unsubRes}`);
            unsubRes.forEach(usRes => {
              const subName = usRes.request.args[0];
              if (!usRes.success) {
                console.error('Bitmex unsubscription error', usRes);
                const sub = currSub.get(subName);
                // change status back to subscribed
                if (sub) currSub.set(subName, { ...sub, status: 'subscribed' });
              } else {
                currSub.delete(subName);
              }
            });
          }
          return currSub;
        },
        currSubscriptions,
        newSubscriptions,
      }).then(setCurrentSubscriptions);
    },
    [sendMessage]
  );

  React.useEffect(() => {
    if (readyState !== ReadyState.OPEN) return;
    syncBitmexSubscriptions(currentSubscriptions, subscriptions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscriptions]);

  React.useEffect(() => {
    if (!lastMessage) return;
    processBitmexMessage(lastMessage, {
      setTrades,
      setLastPrice,
      setOrderbook,
      obBitmexId: {
        // @ts-ignore
        get: k => obBitmexId.current.get(k),
        // @ts-ignore
        set: (k, v) => obBitmexId.current.set(k, v),
      },
    });
  }, [lastMessage]);

  return {
    readyState,
    connect,
    disconnect,
    //
    currentSubscriptions,
    orderbook,
    lastPrice,
    trades,
    ticker: null,
  };
};

//////////////////////////////////
// Helper functions

function processBitmexMessage(
  msg: TWSMessageBitmex_Res,
  // options: any,
  actions: {
    setTrades: Function;
    setLastPrice: Function;
    setOrderbook: Function;
    obBitmexId: { get: Function; set: Function };
  }
) {
  if ('docs' in msg) return;
  if (!('table' in msg)) return;

  switch (msg.table) {
    case 'trade': {
      const newTrades = (msg as TWSMessageBitmex_Res_Trades).data.map(d => ({
        id: d.trdMatchID,
        size: d.size,
        side: d.side === 'Buy' ? Side.BUY : Side.SELL,
        price: d.price,
        timestamp: Date.parse(d.timestamp),
        tickDirection: TICK_DIRECTION_MAP_BITMEX[d.tickDirection],
      }));
      actions.setTrades((ts: TTrade[] | null) => {
        if (ts === null) ts = [];
        const upd = [...newTrades, ...ts];
        if (upd.length > TRADES_STORE_LIMIT) {
          return upd.slice(0, TRADES_STORE_LIMIT);
        } else return upd;
      });
      break;
    }
    case 'instrument': {
      const { lastPrice } = (msg as TWSMessageBitmex_Res_Ticker).data[0];
      if (lastPrice) actions.setLastPrice(lastPrice);
      break;
    }
    case 'orderBookL2_25': {
      if (msg.action === 'partial' || msg.action === 'insert') {
        const edits = (msg.data as TBitmexOrderBookEdit[]).map(
          ({ id, side, size, price }) => {
            actions.obBitmexId.set(id, price);
            return {
              side: side === 'Buy' ? Side.BUY : Side.SELL,
              edit: { id, size, price },
            };
          }
        );
        actions.setOrderbook((ob: TOrderBook) =>
          applyExchangeOrderBookEdits(
            msg.action === 'partial' ? null : ob,
            edits
          )
        );
      } else if (msg.action === 'update' || msg.action === 'delete') {
        const edits = (msg.data as TBitmexOrderBookEdit[]).map(edit => {
          const { id, side } = edit;
          const price = actions.obBitmexId.get(id) || 0; // >.<
          const size = msg.action === 'update' ? edit.size : 0;
          return {
            side: side === 'Buy' ? Side.BUY : Side.SELL,
            edit: { id, size, price },
          };
        });
        actions.setOrderbook((ob: TOrderBook) =>
          applyExchangeOrderBookEdits(ob, edits)
        );
      }
      break;
    }
    default: {
      console.log('bmex msg', msg);
    }
  }
}

//////////////////////////////////
// Types

type TWSMessageBitmex_Res_Welcome = {
  docs: string;
  info: 'Welcome to the BitMEX Realtime API.';
  limit: { remaining: number };
  timestamp: string;
  version: string;
};

type TWSMessageBitmex_Req_Subscription = {
  op: 'subscribe' | 'unsubscribe';
  args: string[];
};
type TWSMessageBitmex_Res_Subscription = {
  request: { op: 'subscribe'; args: string[] };
  subscribe: string;
  success: boolean;
};

const TICK_DIRECTION_MAP_BITMEX = {
  PlusTick: TickDirection.PLUS,
  ZeroPlusTick: TickDirection.ZERO_PLUS,
  MinusTick: TickDirection.MINUS,
  ZeroMinusTick: TickDirection.ZERO_MINUS,
};
type TBitmextTickDirection =
  | 'ZeroMinusTick'
  | 'ZeroPlusTick'
  | 'MinusTick'
  | 'PlusTick';
type TBitmexSide = 'Sell' | 'Buy';
type TWSMessageBitmex_Res_Trades = {
  table: 'trade';
  data: Array<{
    trdMatchID: string;
    timestamp: string;
    price: number;
    side: TBitmexSide;
    size: number;
    symbol: string;
    tickDirection: TBitmextTickDirection;
  }>;
};

type TWSMessageBitmex_Res_Ticker = {
  table: 'instrument';
  data: [
    {
      timestamp: string;
      symbol: string;
      lastPrice?: number;
      lastTickDirection?: TBitmextTickDirection;
    }
  ];
};

type TBitmexOrderBookEdit_Base = { id: number; side: TBitmexSide };
type TBitmexOrderBookEdit = TBitmexOrderBookEdit_Base & {
  price: number;
  size: number;
  timestamp: number;
};
type TWSMessageBitmex_Res_Orderbook = { table: 'orderBookL2_25' } & (
  | { action: 'partial' | 'update' | 'insert'; data: TBitmexOrderBookEdit[] }
  | { action: 'delete'; data: TBitmexOrderBookEdit_Base[] }
);

type TWSMessageBitmex_Res_Data =
  | TWSMessageBitmex_Res_Trades
  | TWSMessageBitmex_Res_Ticker
  | TWSMessageBitmex_Res_Orderbook;

type TWSMessageBitmex_Res =
  | TWSMessageBitmex_Res_Welcome
  | TWSMessageBitmex_Res_Subscription
  | TWSMessageBitmex_Res_Data;

type TWSMessageBitmex_Req = TWSMessageBitmex_Req_Subscription;
