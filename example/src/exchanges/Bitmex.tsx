import * as React from 'react';
import Dashboard from 'react-grid-dashboard';

import { useBitmex, Exchange, Channel, TSubscription } from '../../../dist';
import { Widget, ExchangeHeader } from '../components/Widget';
import { Trades } from '../components/Trades';

const SUBSCRIPTIONS_BITMEX: Map<Channel, TSubscription> = new Map(
  [Channel.TICKER, Channel.TRADES, Channel.ORDERBOOK].map(channel => [
    channel,
    { exchange: Exchange.BITMEX, instrument: 'XBTUSD', channel },
  ])
);

export const Bitmex = () => {
  const [subscriptions, setSubscriptions] = React.useState<Set<Channel>>(
    new Set([Channel.TRADES, Channel.TICKER])
  );
  const { readyState, trades } = useBitmex([], {
    autoConnect: false,
    dev: {
      connectAlert: 'Deribit tries to connect',
    },
  });

  React.useEffect(() => {
    console.log('bitmex', trades);
  }, [trades]);
  return (
    <>
      <Dashboard.Item {...{ x: 0 }}>
        <ExchangeHeader
          exchange={Exchange.BITMEX}
          readyState={readyState}
          connect={() => {}}
          disconnect={() => {}}
          subcriptions={subscriptions}
          toggleSubscription={(c: Channel) => {
            console.log('toggle', c);
          }}
        />
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
