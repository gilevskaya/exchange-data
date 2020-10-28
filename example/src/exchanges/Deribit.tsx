import * as React from 'react';
import Dashboard from 'react-grid-dashboard';

import { Exchange, Channel, TSubscription, useDeribit } from '../../../dist';
import { Widget, ExchangeHeader } from '../components/Widget';
import { Trades } from '../components/Trades';

const SUBSCRIPTIONS_DERIBIT: Map<Channel, TSubscription> = new Map([
  [
    Channel.TICKER,
    {
      exchange: Exchange.DERIBIT,
      channel: Channel.TICKER,
      instrument: 'BTC-PERPETUAL',
    },
  ],
  [
    Channel.TRADES,
    {
      exchange: Exchange.DERIBIT,
      channel: Channel.TRADES,
      instrument: 'BTC-PERPETUAL',
      options: {
        limit: 100,
      },
    },
  ],
  [
    Channel.ORDERBOOK,
    {
      exchange: Exchange.DERIBIT,
      channel: Channel.TRADES,
      instrument: 'BTC-PERPETUAL',
      options: {
        limit: 100,
      },
    },
  ],
]);

export const Deribit = () => {
  const [subscriptions, setSubscriptions] = React.useState<Set<Channel>>(
    new Set([Channel.TRADES, Channel.TICKER])
  );
  const subscriptionsInfo = Array.from(subscriptions)
    .map(c => {
      const s = SUBSCRIPTIONS_DERIBIT.get(c);
      if (!s) throw new Error(`Can't find subscription info for ${c}`);
      return s;
    })
    .filter(s => s);

  const { readyState, trades, connect, disconnect } = useDeribit(
    subscriptionsInfo,
    {
      url: 'wss://test.deribit.com/ws/api/v2',
      manualConnect: true,
      dev: {
        connectAlert: 'Deribit tries to connect',
      },
    }
  );

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
