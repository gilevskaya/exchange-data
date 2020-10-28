// https://www.bitmex.com/app/wsAPI
import React from 'react';

import { useWebSocket } from '../utils/useWebSocket';
import {
  //   applyExchangeOrderBookEdits,
  TOrderBook,
  //   TOrderBookSide,
} from '../utils/orderbook';
import { Channel, TSubscription, TTrade, TWSOptions } from '../types';

const WS_URL_BITMEX = 'wss://www.bitmex.com/realtime';

export const useBitmex = (
  subscriptions: TSubscription[] = [],
  wsOptions?: TWSOptions
) => {
  const [orderbook, setOrderbook] = React.useState<TOrderBook | null>(null);
  const [lastPrice, setLastPrice] = React.useState<number | null>(null);
  const [trades, setTrades] = React.useState<TTrade[] | null>(null);

  const { readyState, lastMessage, connect, disconnect } = useWebSocket<
    TWSMessageBitmex_Res,
    TWSMessageBitmex_Req
  >(WS_URL_BITMEX, {
    ...wsOptions,
    onOpen: () => {
      if (wsOptions?.onOpen) wsOptions.onOpen();
    },
    onClose: () => {
      setOrderbook(null);
      setLastPrice(null);
      setTrades(null);
      if (wsOptions?.onClose) wsOptions.onClose();
    },
  });

  React.useEffect(() => {
    if (!lastMessage) return;
    processBitmexMessage(lastMessage);
  }, [lastMessage]);

  React.useEffect(() => {}, [subscriptions]);

  return {
    readyState,
    connect,
    disconnect,
    //
    orderbook,
    lastPrice,
    trades,
    ticker: null,
  };
};

//////////////////////////////////
// Helper functions

const getBitmexSubcriptionName = (subs: Channel, instrument: string): string =>
  ({
    [Channel.ORDERBOOK]: `orderBookL2_25:${instrument}`,
    [Channel.TICKER]: `instrument:${instrument}`,
    [Channel.TRADES]: `trade:${instrument}`,
  }[subs]);

function processBitmexMessage(
  msg: TWSMessageBitmex_Res
  // options: any,
  // actions: any
) {
  console.log('bmex msg', msg);
  console.debug(getBitmexSubcriptionName);
}

//////////////////////////////////
// Types

type TWSMessageBitmex_Res_Subscription = {
  result: string[];
};
type TWSMessageBitmex_Req_Subscription = {
  op: 'subscribe';
  args: string[];
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

type TWSMessageBitmex_Res_Data =
  | TWSMessageDeribit_Res_Orderbook
  | TWSMessageDeribit_Res_Ticker
  | TWSMessageDeribit_Res_Trades;

type TWSMessageBitmex_Res =
  | TWSMessageBitmex_Res_Subscription
  | TWSMessageBitmex_Res_Data;

type TWSMessageBitmex_Req = TWSMessageBitmex_Req_Subscription;
