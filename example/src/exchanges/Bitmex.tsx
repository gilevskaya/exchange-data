import * as React from 'react';
import Dashboard from 'react-grid-dashboard';

import { useExchange, Exchange, Channel, TSubscription } from '../../../dist';
import { Widget, ExchangeHeader } from '../components/Widget';
import { Trades } from '../components/Trades';

const SUBSCRIPTIONS: TSubscription[] = [
  {
    exchange: Exchange.BITMEX,
    channel: Channel.TICKER,
    instrument: 'XBTUSD',
  },
  {
    exchange: Exchange.BITMEX,
    channel: Channel.TRADES,
    instrument: 'XBTUSD',
    options: {
      limit: 100,
    },
  },
];

export const Bitmex = () => {
  const {
    [Exchange.BITMEX]: { readyState, trades },
  } = useExchange(SUBSCRIPTIONS);

  React.useEffect(() => {
    console.log('bitmex', trades);
  }, [trades]);
  return (
    <>
      <Dashboard.Item {...{ x: 0 }}>
        <ExchangeHeader exchange={Exchange.BITMEX} readyState={readyState} />
      </Dashboard.Item>
      <Dashboard.Item {...{ x: 0, y: 1 }}>
        <Widget isFull={true}>
          <div className="h-full">{''}</div>
        </Widget>
      </Dashboard.Item>
      <Dashboard.Item {...{ x: 0, y: 2 }}>
        <Widget isFull={true} isScrollable={true}>
          <Trades trades={trades} />
        </Widget>
      </Dashboard.Item>
    </>
  );
};
