import 'react-app-polyfill/ie11';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {
  useExchange,
  ReadyState,
  Channel,
  Exchange,
  TSubscription,
  useWebSocket,
} from '../.';

const App = () => {
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
      <WSTest />
      <Deribit />
    </div>
  );
};

type WSReq_Subscribe = {
  jsonrpc: '2.0';
  method: string;
  params: { channels: string[] };
};
type WSReq = WSReq_Subscribe;
type WSRes_Subscribe = {
  jsonrpc: '2.0';
  result: string[];
};
type WSRes_Ticker = {
  jsonrpc: '2.0';
  params: {
    channel: string;
    data: object;
  };
};
type WSRes = WSRes_Subscribe | WSRes_Ticker;

const WSTest = () => {
  const {
    readyState,
    sendMessage,
    lastMessage,
    connect,
    disconnect,
  } = useWebSocket<WSRes, WSReq>('wss://test.deribit.com/ws/api/v2', {
    manualConnect: true,
    onOpen: () => {
      sendMessage({
        jsonrpc: '2.0',
        method: 'public/subscribe',
        params: {
          channels: ['ticker.BTC-PERPETUAL.raw'],
        },
      })
        .then(res => {
          console.log('ws res', res);
        })
        .catch(error => {
          console.log('ws error', error);
        });
    },
  });

  const messages = React.useRef<WSRes[]>([]);

  React.useEffect(() => {
    connect().then(() => {
      console.log('ws connected');
    });
  }, [connect]);

  React.useEffect(() => {
    console.log('connect changed', connect);
  }, [connect]);

  React.useEffect(() => {
    if (!lastMessage) return;

    console.log('lastMessage', lastMessage);
    messages.current.push(lastMessage);
    if (messages.current.length >= 5) {
      disconnect().then(res => {
        console.log('disconnected...', res);
      });
    }
  }, [readyState, lastMessage, disconnect]);

  return <div>WS Test: {ReadyState[readyState]}</div>;
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
