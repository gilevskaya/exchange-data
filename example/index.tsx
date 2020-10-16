import 'react-app-polyfill/ie11';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useExchange, ReadyState, Subscription, Exchange } from '../.';

const App = () => {
  return (
    <div>
      <Deribit />
    </div>
  );
};

const SUBSCRIPTIONS = [
  {
    type: Subscription.TICKER,
    instrument: 'BTC-PERPETUAL',
  },
  {
    type: Subscription.TRADES,
    instrument: 'BTC-PERPETUAL',
    options: {
      limit: 20,
    },
  },
];

const Deribit = () => {
  const { readyState, lastPrice, trades } = useExchange(
    Exchange.DERIBIT,
    SUBSCRIPTIONS
  );
  return (
    <div>
      <div>Deribit [{ReadyState[readyState]}]</div>
      <div>Last price: {lastPrice}</div>
      {trades.map((t, i) => (
        <div key={t.id}>
          {i + 1}: {JSON.stringify(t)}
        </div>
      ))}
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
