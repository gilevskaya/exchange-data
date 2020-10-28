// https://docs.deribit.com/#json-rpc
import React from 'react';

import { ReadyState, useWebSocket } from '../utils/useWebSocket';
import {
  TRADES_STORE_LIMIT,
  // applyExchangeOrderBookEdits,
  TOrderBook,
  // TOrderBookSide,
  syncSubscriptions,
} from '../utils';
import {
  Side,
  Channel,
  TSubscription,
  TickDirection,
  TTrade,
  TWSOptions,
  TWSCurrentSubscriptions,
  Exchange,
} from '../types';

const WS_URL_DERIBIT = 'wss://www.deribit.com/ws/api/v2';

export const useDeribit = (
  subscriptions: TSubscription[] = [],
  wsOptions?: TWSOptions & { url?: string }
) => {
  const [currentSubscriptions, setCurrentSubscriptions] = React.useState<
    TWSCurrentSubscriptions
  >(new Map());

  const [orderbook, setOrderbook] = React.useState<TOrderBook | null>(null);
  const [lastPrice, setLastPrice] = React.useState<number | null>(null);
  const [trades, setTrades] = React.useState<TTrade[] | null>(null);
  const [options] = React.useState<any>({}); // TODO: types

  const {
    readyState,
    lastMessage,
    sendMessage,
    connect,
    disconnect,
  } = useWebSocket<TWSMessageDeribit_Res, TWSMessageDeribit_Req>(
    wsOptions?.url || WS_URL_DERIBIT,
    {
      ...wsOptions,
      onOpen: () => {
        // subscribe first
        syncDeribitSubscriptions(currentSubscriptions, subscriptions);
        // then get the heartbeat going
        sendMessage({
          jsonrpc: '2.0',
          method: 'public/set_heartbeat',
          params: {
            interval: 60,
          },
        });
        if (wsOptions?.onOpen) wsOptions.onOpen();
      },
      onClose: () => {
        setOrderbook(null);
        setLastPrice(null);
        setTrades(null);
        if (wsOptions?.onClose) wsOptions.onClose();
      },
    }
  );

  const syncDeribitSubscriptions = React.useCallback(
    (
      currSubscriptions: TWSCurrentSubscriptions,
      newSubscriptions: TSubscription[]
    ) => {
      syncSubscriptions<TWSMessageDeribit_Res_Subscription>({
        exchange: Exchange.DERIBIT,
        getSubscriptionName: (subs, instrument) =>
          ({
            [Channel.ORDERBOOK]: `book.${instrument}.raw`,
            [Channel.TICKER]: `ticker.${instrument}.raw`,
            [Channel.TRADES]: `trades.${instrument}.raw`,
          }[subs]),
        updateSubscriptions: (updChannels, isSubcribe) => {
          return sendMessage({
            jsonrpc: '2.0',
            method: isSubcribe ? 'public/subscribe' : 'public/unsubscribe',
            params: { channels: updChannels },
          }) as Promise<TWSMessageDeribit_Res_Subscription>;
        },
        processUpdateSubscriptionRes: (currSub, subRes, unsubRes) => {
          if (subRes) {
            if (Array.isArray(subRes))
              throw new Error(`Shouldn't be an array ${subRes}`);
            const { result } = subRes;
            result.forEach((subName: string) => {
              const sub = currSub.get(subName);
              if (sub) currSub.set(subName, { ...sub, status: 'subscribed' });
            });
          }
          if (unsubRes) {
            if (Array.isArray(unsubRes))
              throw new Error(`Shouldn't be an array ${unsubRes}`);
            const { result } = unsubRes;
            result.forEach((subName: string) => currSub.delete(subName));
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
    syncDeribitSubscriptions(currentSubscriptions, subscriptions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscriptions]);

  React.useEffect(() => {
    if (!lastMessage) return;
    processDeribitMessage(lastMessage, options, {
      sendMessageHeartbeat: () =>
        sendMessage({
          method: 'public/ping',
          params: {},
          jsonrpc: '2.0',
        }),
      setTrades,
    });
  }, [sendMessage, lastMessage, options]);

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

function processDeribitMessage(
  msg: TWSMessageDeribit_Res,
  options: any,
  actions: {
    sendMessageHeartbeat: Function;
    setTrades: any;
  }
) {
  if ('method' in msg && msg.method === 'heartbeat') {
    actions.sendMessageHeartbeat();
    return;
  }
  // is not hearbit has to be a subscription data message
  msg = msg as TWSMessageDeribit_Res_Data;
  if (!msg.params.data) {
    console.log('should not happen', msg);
    return;
  }
  // console.log('msg', msg);
  const [type, instrument] = msg.params.channel.split('.');
  const option = options[instrument] && options[instrument][type];

  switch (type) {
    case 'trades': {
      const newTrades = (msg as TWSMessageDeribit_Res_Trades).params.data.map(
        d => ({
          id: d.trade_id,
          size: d.amount,
          side: d.direction === 'buy' ? Side.BUY : Side.SELL,
          price: d.price,
          timestamp: d.timestamp,
          tickDirection: TICK_DIRECTION_MAP_DERIBIT[d.tick_direction],
        })
      );
      actions.setTrades((ts: TTrade[] | null) => {
        if (ts === null) ts = [];
        const upd = [...newTrades, ...ts];
        if (upd.length > option?.limit || TRADES_STORE_LIMIT) {
          return upd.slice(0, option?.limit || TRADES_STORE_LIMIT);
        } else return upd;
      });
      break;
    }
    case 'book': {
      // const {
      //   bids,
      //   asks,
      //   change_id: id,
      // } = (lastMessage as TWSMessageDeribit_Res_Orderbook).params.data;

      // const mapEditFormat = (edit: TDeribitOrderBookEdit) => {
      //   const [, price, size] = edit;
      //   return { id, price, size };
      // };

      // setOrderbook(ob =>
      //   applyExchangeOrderBookEdits(ob, [
      //     ...asks.map(edit => ({
      //       side: TOrderBookSide.ASKS,
      //       edit: mapEditFormat(edit),
      //     })),
      //     ...bids.map(edit => ({
      //       side: TOrderBookSide.BIDS,
      //       edit: mapEditFormat(edit),
      //     })),
      //   ])
      // );
      break;
    }
    case 'ticker': {
      // setLastPrice(
      //   (lastMessage as TWSMessageDeribit_Res_Ticker).params.data.last_price
      // );
      break;
    }
    default: {
      console.log('deribit msg', msg);
    }
  }
}

//////////////////////////////////
// Types

type TWSMessageDeribit_Res_Subscription = {
  result: string[];
};
type TWSMessageDeribit_Req_Subscription = {
  jsonrpc: '2.0';
  method: 'public/subscribe' | 'public/unsubscribe';
  params: { channels: string[] };
};

export type TDeribitOrderBookEdit = [
  'new' | 'change' | 'delete',
  number,
  number
]; // type, price, size
type TWSMessageDeribit_Res_Orderbook = {
  method: 'subscription';
  params: {
    channel: string; // "book.BTC-PERPETUAL.raw";
    data: {
      asks: TDeribitOrderBookEdit[];
      bids: TDeribitOrderBookEdit[];
      change_id: number;
    };
  };
};

type TWSMessageDeribit_Res_Ticker = {
  method: 'subscription';
  params: {
    channel: string; // "ticker.BTC-PERPETUAL.raw";
    data: {
      last_price: number;
      best_bid_price: number;
      best_ask_price: number;
    };
  };
};

// Direction of the "tick" (0 = Plus Tick, 1 = Zero-Plus Tick, 2 = Minus Tick, 3 = Zero-Minus Tick).
const TICK_DIRECTION_MAP_DERIBIT = {
  0: TickDirection.PLUS,
  1: TickDirection.ZERO_PLUS,
  2: TickDirection.MINUS,
  3: TickDirection.ZERO_MINUS,
};
type TWSMessageDeribit_Res_Trades = {
  method: 'subscription';
  params: {
    channel: string; // "trades.BTC-PERPETUAL.raw";
    data: Array<{
      trade_id: string;
      amount: number;
      direction: 'sell' | 'buy';
      // index_price: 11505.79
      // instrument_name: "BTC-PERPETUAL"
      // mark_price: 11510.41
      price: number;
      tick_direction: 0 | 1 | 2 | 3;
      timestamp: number;
    }>;
  };
};

type TWSMessageDeribit_Res_Data =
  | TWSMessageDeribit_Res_Orderbook
  | TWSMessageDeribit_Res_Ticker
  | TWSMessageDeribit_Res_Trades;

type TWSMessageDeribit_Req_Ping = {
  jsonrpc: '2.0';
  method: 'public/ping';
  id?: number;
  params: {};
};

type TWSMessageDeribit_Req_SetHeartbeat = {
  jsonrpc: '2.0';
  method: 'public/set_heartbeat';
  params: {
    interval: number;
  };
};

type TWSMessageDeribit_Res_Pong = {
  jsonrpc: '2.0';
  id?: number;
  result: 'pong';
  usIn: number;
  usOut: number;
  usDiff: number;
  testnet: boolean;
};

type TWSMessageDeribit_Res_Heartbeat = {
  jsonrpc: '2.0';
  method: 'heartbeat';
  params: {
    type: 'test_request';
  };
};

type TWSMessageDeribit_Res =
  | TWSMessageDeribit_Res_Pong
  | TWSMessageDeribit_Res_Heartbeat
  | TWSMessageDeribit_Res_Subscription
  | TWSMessageDeribit_Res_Data;

type TWSMessageDeribit_Req =
  | TWSMessageDeribit_Req_Subscription
  | TWSMessageDeribit_Req_Ping
  | TWSMessageDeribit_Req_SetHeartbeat;
