import 'react-app-polyfill/ie11';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {
  useExchange,
  ReadyState,
  Channel,
  Exchange,
  TSubscription,
} from '../../dist';

import { Manual } from './pages/Manual';
import { Exchanges } from './pages/Exchanges';

import './tailwind.output.css';

const App = () => {
  if (window.location.pathname === '/manual') return <Manual />;
  if (window.location.pathname === '/deribit')
    return (
      <div
        style={{
          fontFamily: 'sans-serif',
          padding: '1rem',
          height: '100vh',
          background: '#222',
          color: '#eee',
        }}
      >
        <Deribit />
      </div>
    );
  return <Exchanges />;
};

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
      {trades == null && <div>Loading trades...</div>}
      {trades != null &&
        trades.map((t, i) => (
          <div key={t.id}>
            {i + 1}: {JSON.stringify(t)}
          </div>
        ))}
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
