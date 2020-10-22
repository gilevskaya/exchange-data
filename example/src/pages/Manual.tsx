import * as React from 'react';

import { ReadyState, useWebSocket } from '../../../dist';

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

export const Manual = () => {
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

  return (
    <div className="p-2">
      <div className="m-1">
        WS ready state:{' '}
        <span className="font-semibold">{ReadyState[readyState]}</span>
      </div>
      <div className="flex" style={{ maxWidth: '200px' }}>
        <button
          className="m-1 flex-1 border focus:outline-none"
          onClick={() => {
            connect();
          }}
        >
          connect
        </button>
        <button
          className="m-1 flex-1 border focus:outline-none"
          onClick={() => {
            disconnect();
          }}
        >
          disconnect
        </button>
      </div>
      {lastMessage && (
        <div className="m-1 mt-4 text-xs">
          {JSON.stringify(lastMessage, null, 1)}
        </div>
      )}
    </div>
  );
};
