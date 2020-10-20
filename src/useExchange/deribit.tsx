// https://docs.deribit.com/#json-rpc
import React from 'react';

import { useWebSocket } from '../utils/useWebSocket';
import {
  applyExchangeOrderBookEdits,
  TOrderBook,
  TOrderBookSide,
} from '../utils/orderbook';
import { Side, Channel, TSubscription, TickDirection, TTrade } from '../types';

const WS_URL_DERIBIT = 'wss://www.deribit.com/ws/api/v2';
// Direction of the "tick" (0 = Plus Tick, 1 = Zero-Plus Tick, 2 = Minus Tick, 3 = Zero-Minus Tick).
const TICK_DIRECTION_MAP = {
  0: TickDirection.PLUS,
  1: TickDirection.ZERO_PLUS,
  2: TickDirection.MINUS,
  3: TickDirection.ZERO_MINUS,
};
const TRADES_STORE_LIMIT = 50;

const getSubcriptionName = (subs: Channel, instrument: string): string =>
  ({
    [Channel.ORDERBOOK]: `book.${instrument}.raw`,
    [Channel.TICKER]: `ticker.${instrument}.raw`,
    [Channel.TRADES]: `trades.${instrument}.raw`,
  }[subs]);

export const useExchangeDeribit = (subscriptions: TSubscription[] = []) => {
  const [orderbook, setOrderbook] = React.useState<TOrderBook | null>(null);
  const [lastPrice, setLastPrice] = React.useState<number | null>(null);
  const [trades, setTrades] = React.useState<TTrade[] | null>(null);
  const [options, setOptions] = React.useState<any>({}); // TODO: types

  const { readyState, lastMessage, sendMessage } = useWebSocket<
    TWSMessageDeribit_Res,
    TWSMessageDeribit_Req
  >(WS_URL_DERIBIT, {
    shouldReconnect: true,
    onOpen: async () => {
      const subcriptionRes = (await sendMessage(
        JSON.stringify({
          jsonrpc: '2.0',
          method: 'public/subscribe',
          params: {
            channels: subscriptions.map(s => {
              if (s.options) {
                setOptions((o: any) => {
                  // TODO:
                  if (!o[s.instrument]) o[s.instrument] = {};
                  o[s.instrument][s.channel] = s.options;
                  return o;
                });
              }
              return getSubcriptionName(s.channel, s.instrument);
            }),
          },
        })
      )) as TWSMessageDeribit_Res_Subscription;
      subcriptionRes.result.forEach(s => {
        if (s.startsWith('trades.')) setTrades([]);
      });

      // Get the heartbeat going
      await sendMessage({
        jsonrpc: '2.0',
        method: 'public/set_heartbeat',
        params: {
          interval: 60,
        },
      });
    },
    onClose: () => {
      setOrderbook(null);
      setLastPrice(null);
      setTrades(null);
    },
  });

  React.useEffect(() => {
    if (!lastMessage) return;

    // Reply to the heartbeat request
    if (lastMessage as TWSMessageDeribit_Res_Heartbeat) {
      sendMessage({
        method: 'public/ping',
        params: {},
        jsonrpc: '2.0',
      });
      return;
    }

    if (!(lastMessage as TWSMessageDeribit_Res_Data)?.params?.data) return;
    const [
      type,
      instrument,
    ] = (lastMessage as TWSMessageDeribit_Res_Data).params.channel.split('.');
    const option = options[instrument] && options[instrument][type];

    switch (type) {
      case 'book': {
        const {
          bids,
          asks,
          change_id: id,
        } = (lastMessage as TWSMessageDeribit_Res_Orderbook).params.data;

        const mapEditFormat = (edit: TDeribitOrderBookEdit) => {
          const [, price, size] = edit;
          return { id, price, size };
        };

        setOrderbook(ob =>
          applyExchangeOrderBookEdits(ob, [
            ...asks.map(edit => ({
              side: TOrderBookSide.ASKS,
              edit: mapEditFormat(edit),
            })),
            ...bids.map(edit => ({
              side: TOrderBookSide.BIDS,
              edit: mapEditFormat(edit),
            })),
          ])
        );
        break;
      }
      case 'ticker': {
        setLastPrice(
          (lastMessage as TWSMessageDeribit_Res_Ticker).params.data.last_price
        );
        break;
      }
      case 'trades': {
        const newTrades = (lastMessage as TWSMessageDeribit_Res_Trades).params.data.map(
          d => ({
            id: d.trade_id,
            size: d.amount,
            side: d.direction === 'buy' ? Side.BUY : Side.SELL,
            price: d.price,
            timestamp: d.timestamp,
            tickDirection: TICK_DIRECTION_MAP[d.tick_direction],
          })
        );
        setTrades(ts => {
          if (ts === null) ts = [];
          const upd = [...newTrades, ...ts];
          if (upd.length > option?.limit || TRADES_STORE_LIMIT) {
            return upd.slice(0, option?.limit || TRADES_STORE_LIMIT);
          } else return upd;
        });
        break;
      }
      default: {
        console.log('deribit', lastMessage);
      }
    }
  }, [sendMessage, lastMessage, options]);

  return { readyState, orderbook, lastPrice, trades };
};

// Types

type TWSMessageDeribit_Res_Subscription = {
  result: string[];
};
type TWSMessageDeribit_Req_Subscription = {
  jsonrpc: '2.0';
  method: 'public/subscribe';
  params: { channels: string[] };
};

export type TDeribitOrderBookEdit = [
  'new' | 'change' | 'delete',
  number,
  number
]; // type, price, size
type TWSMessageDeribit_Res_Orderbook = {
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
  params: {
    channel: string; // "ticker.BTC-PERPETUAL.raw";
    data: {
      last_price: number;
      best_bid_price: number;
      best_ask_price: number;
    };
  };
};

type TWSMessageDeribit_Res_Trades = {
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
