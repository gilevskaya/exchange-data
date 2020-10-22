import * as React from 'react';
import Dashboard from 'react-grid-dashboard';

import { useExchange, Exchange, Channel, TSubscription } from '../../../dist';
import { Widget, ExchangeHeader } from '../components/Widget';
import { Trades } from '../components/Trades';

const SUBSCRIPTIONS: TSubscription[] = [
  {
    exchange: Exchange.DERIBIT,
    channel: Channel.TICKER,
    instrument: 'BTC-PERPETUAL',
  },
  {
    exchange: Exchange.DERIBIT,
    channel: Channel.TRADES,
    instrument: 'BTC-PERPETUAL',
    options: {
      limit: 100,
    },
  },
];

export const Deribit = () => {
  const {
    [Exchange.DERIBIT]: { readyState, trades },
  } = useExchange(SUBSCRIPTIONS);

  return (
    <>
      <Dashboard.Item {...{ x: 1 }}>
        <ExchangeHeader exchange={Exchange.DERIBIT} readyState={readyState} />
      </Dashboard.Item>
      <Dashboard.Item {...{ x: 1, y: 1 }}>
        <Widget isFull={true}>
          <div className="h-full">{''}</div>
        </Widget>
      </Dashboard.Item>
      <Dashboard.Item {...{ x: 1, y: 2 }}>
        <Widget isFull={true} isScrollable={true}>
          <Trades trades={trades} />
        </Widget>
      </Dashboard.Item>
    </>
  );
};
