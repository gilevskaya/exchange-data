// https://www.bitmex.com/app/wsAPI
import React from 'react';

import { useWebSocket } from '../utils/useWebSocket';
import {
  //   applyExchangeOrderBookEdits,
  TOrderBook,
  //   TOrderBookSide,
} from '../utils/orderbook';
import { TSubscription, TTrade } from '../types';

const WS_URL_BITMEX =
  'wss://www.bitmex.com/realtime?subscribe=orderBookL2:XBTUSD,trade:XBTUSD';

export const useBitmex = (subscriptions: TSubscription[] = []) => {
  const [orderbook] = React.useState<TOrderBook | null>(null);
  const [lastPrice] = React.useState<number | null>(null);
  const [trades] = React.useState<TTrade[] | null>(null);
  // const [options, setOptions] = React.useState<any>({}); // TODO: types

  console.log({ subscriptions });

  const { readyState } = useWebSocket(WS_URL_BITMEX, {
    shouldReconnect: true,
  });

  return { readyState, orderbook, lastPrice, trades };
};
