// https://www.bitmex.com/app/wsAPI
import React from 'react';

import { ReadyState, useWebSocket } from '../utils/useWebSocket';
import {
  //   applyExchangeOrderBookEdits,
  TOrderBook,
  //   TOrderBookSide,
} from '../utils/orderbook';
import { Exchange, TSubscription, TTrade, TWSOptions } from '../types';

const WS_URL_BITMEX = 'wss://www.bitmex.com/realtime';

export const useBitmex = (
  subscriptions: TSubscription[] = [],
  wsoptions?: TWSOptions
) => {
  const subs = React.useRef<Set<string>>(getBitmexSubs(subscriptions));
  const [orderbook] = React.useState<TOrderBook | null>(null);
  const [lastPrice] = React.useState<number | null>(null);
  const [trades] = React.useState<TTrade[] | null>(null);
  // const [options, setOptions] = React.useState<any>({}); // TODO: types

  const { readyState, connect } = useWebSocket(WS_URL_BITMEX, {
    ...wsoptions,
    manualConnect: subs.current.size === 0 ? true : wsoptions?.manualConnect,
    onOpen: () => {
      if (wsoptions?.onOpen) wsoptions?.onOpen();
      console.log('connected to bmex');
    },
    onClose: () => {
      if (wsoptions?.onClose) wsoptions?.onClose();
      console.log('disconnected from bmex');
    },
  });

  React.useEffect(() => {
    const ss = getBitmexSubs(subscriptions);
    if (
      ss.size > 0 &&
      ![ReadyState.OPEN, ReadyState.CONNECTING].includes(readyState)
    ) {
      connect();
    }
    ss.forEach(s => {
      if (!subs.current.has(s)) {
        // unsubscribe;
      }
    });
    subs.current.forEach(s => {
      if (!ss.has(s)) {
        // unsubscribe;
      }
    });
  }, [subscriptions]);

  return { readyState, orderbook, lastPrice, trades, ticker: null };
};

// const bitmexSendMessage = {
//   // subcribeTrades: (sendMessage) => {
//   // }
// };

const getSubs = (e: Exchange) => (ss: TSubscription[]): Set<string> =>
  new Set(
    ss.filter(s => s.exchange === e).map(s => `${s.instrument}-${s.channel}`)
  );

const getBitmexSubs = getSubs(Exchange.BITMEX);
