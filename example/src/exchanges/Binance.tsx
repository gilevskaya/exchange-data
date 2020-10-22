import * as React from 'react';
import Dashboard from 'react-grid-dashboard';

import { Exchange, ReadyState } from '../../../dist';
import { Widget, ExchangeHeader } from '../components/Widget';

export const Binance = () => {
  return (
    <>
      <Dashboard.Item {...{ x: 2 }}>
        <ExchangeHeader
          exchange={Exchange.BINANCE}
          readyState={ReadyState.UNINITIATED}
        />
      </Dashboard.Item>
      <Dashboard.Item {...{ x: 2, y: 1 }}>
        <Widget isFull={true}>
          <div className="h-full">{''}</div>
        </Widget>
      </Dashboard.Item>
      <Dashboard.Item {...{ x: 2, y: 2 }}>
        <Widget isFull={true}>
          <div className="h-full">{''}</div>
        </Widget>
      </Dashboard.Item>
    </>
  );
};
