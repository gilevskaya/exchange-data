// https://docs.deribit.com/#json-rpc
import React from 'react';

import { useWebSocket } from '../utils/useWebSocket';
import {
  applyExchangeOrderBookEdits,
  TOrderBook,
  TOrderBookSide,
} from '../utils/orderbook';
import {
  Side,
  Subscription,
  TSubscription,
  TickDirection,
  TTrade,
} from '../types';

const WS_URL_DERIBIT = 'wss://www.deribit.com/ws/api/v2';
// Direction of the "tick" (0 = Plus Tick, 1 = Zero-Plus Tick, 2 = Minus Tick, 3 = Zero-Minus Tick).
const TICK_DIRECTION_MAP = {
  0: TickDirection.PLUS,
  1: TickDirection.ZERO_PLUS,
  2: TickDirection.MINUS,
  3: TickDirection.ZERO_MINUS,
};
const TRADES_STORE_LIMIT = 50;

const getSubcriptionName = (subs: Subscription, instrument: string): string =>
  ({
    [Subscription.ORDERBOOK]: `book.${instrument}.raw`,
    [Subscription.TICKER]: `ticker.${instrument}.raw`,
    [Subscription.TRADES]: `trades.${instrument}.raw`,
  }[subs]);

export const useExchangeDeribit = (subscriptions: TSubscription[] = []) => {
  const [orderbook, setOrderbook] = React.useState<TOrderBook | null>(null);
  const [lastPrice, setLastPrice] = React.useState<number | null>(null);
  const [trades, setTrades] = React.useState<TTrade[]>([]);

  const [options, setOptions] = React.useState<any>({}); // TODO: types

  const { readyState, lastMessage, sendMessage } = useWebSocket<
    TDeribitMessage
  >(WS_URL_DERIBIT, {
    onOpen: () => {
      sendMessage(
        JSON.stringify({
          jsonrpc: '2.0',
          id: 3600,
          method: 'public/subscribe',
          params: {
            channels: subscriptions.map(s => {
              if (s.options) {
                setOptions((o: any) => {
                  // TODO:
                  if (!o[s.instrument]) o[s.instrument] = {};
                  o[s.instrument][s.type] = s.options;
                  return o;
                });
              }
              return getSubcriptionName(s.type, s.instrument);
            }),
          },
        })
      );
    },
    onClose: () => {
      setOrderbook(null);
      setLastPrice(null);
    },
  });

  React.useEffect(() => {
    if (!lastMessage?.params?.data) return;
    const [type, instrument] = lastMessage.params.channel.split('.');
    const option = options[instrument][type];

    switch (type) {
      case 'book': {
        const {
          bids,
          asks,
          change_id: id,
        } = (lastMessage as TDeribitOrderBookMessage).params.data;

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
          (lastMessage as TDeribitTickerMessage).params.data.last_price
        );
        break;
      }
      case 'trades': {
        const newTrades = (lastMessage as TDeribitTradesMessage).params.data.map(
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
          const upd = [...newTrades, ...ts];
          if (upd.length > option?.limit || TRADES_STORE_LIMIT) {
            return upd.slice(0, option?.limit || TRADES_STORE_LIMIT);
          } else return upd;
        });
        break;
      }
      default:
        console.log('deribit', lastMessage);
    }
  }, [lastMessage]);

  return { readyState, orderbook, lastPrice, trades };
};

// Types

export type TDeribitOrderBookEdit = [
  'new' | 'change' | 'delete',
  number,
  number
]; // type, price, size
type TDeribitOrderBookMessage = {
  params: {
    channel: string; // "book.BTC-PERPETUAL.raw";
    data: {
      asks: TDeribitOrderBookEdit[];
      bids: TDeribitOrderBookEdit[];
      change_id: number;
    };
  };
};

type TDeribitTickerMessage = {
  params: {
    channel: string; // "ticker.BTC-PERPETUAL.raw";
    data: {
      last_price: number;
      best_bid_price: number;
      best_ask_price: number;
    };
  };
};

type TDeribitTradesMessage = {
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

export type TDeribitMessage =
  | TDeribitOrderBookMessage
  | TDeribitTickerMessage
  | TDeribitTradesMessage;
