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
    new Set([Channel.TRADES])
  );
  const subscriptionsInfo = React.useMemo(
    () =>
      Array.from(subscriptions)
        .map(c => {
          const s = SUBSCRIPTIONS_BITMEX.get(c);
          if (!s) throw new Error(`Can't find subscription info for ${c}`);
          return s;
        })
        .filter(s => s),
    [subscriptions]
  );

  const {
    readyState,
    trades,
    connect,
    disconnect,
    currentSubscriptions,
  } = useBitmex(subscriptionsInfo, {
    autoConnect: true,
    dev: {
      connectAlert: 'Bitmex is trying to connect, ok?',
    },
  });

  React.useEffect(() => {
    console.log('Bitmex currentSubscriptions', currentSubscriptions);
  }, [currentSubscriptions]);

  return (
    <>
      <Dashboard.Item {...{ x: 0 }}>
        <ExchangeHeader
          exchange={Exchange.BITMEX}
          readyState={readyState}
          connect={connect}
          disconnect={disconnect}
          subcriptions={subscriptions}
          toggleSubscription={(c: Channel) =>
            setSubscriptions(ss => {
              if (ss.has(c)) ss.delete(c);
              else ss.add(c);
              return new Set(ss);
            })
          }
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
