import * as React from 'react';
import Dashboard from 'react-grid-dashboard';

import { Exchange, Channel, TSubscription, useDeribit } from '../../../dist';
import { Widget, ExchangeHeader } from '../components/Widget';
import { Trades } from '../components/Trades';

const SUBSCRIPTIONS_DERIBIT: Map<Channel, TSubscription> = new Map(
  [Channel.TICKER, Channel.TRADES, Channel.ORDERBOOK].map(channel => [
    channel,
    { exchange: Exchange.DERIBIT, instrument: 'BTC-PERPETUAL', channel },
  ])
);

export const Deribit = () => {
  const [subscriptions, setSubscriptions] = React.useState<Set<Channel>>(
    new Set([Channel.TRADES, Channel.TICKER])
  );
  const subscriptionsInfo = React.useMemo(
    () =>
      Array.from(subscriptions)
        .map(c => {
          const s = SUBSCRIPTIONS_DERIBIT.get(c);
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
  } = useDeribit(subscriptionsInfo, {
    url: 'wss://test.deribit.com/ws/api/v2',
    autoConnect: true,
    dev: {
      connectAlert: 'Deribit tries to connect',
    },
  });

  React.useEffect(() => {
    console.log('Deribit', currentSubscriptions);
  }, [currentSubscriptions]);

  return (
    <>
      <Dashboard.Item {...{ x: 1 }}>
        <ExchangeHeader
          exchange={Exchange.DERIBIT}
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
