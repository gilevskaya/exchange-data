import * as React from 'react';
import Dashboard from 'react-grid-dashboard';

import { Exchange, ReadyState } from '../../../dist';
import { Widget, ExchangeHeader } from '../components/Widget';

export const Bitmex = () => {
  return (
    <>
      <Dashboard.Item {...{ x: 0 }}>
        <ExchangeHeader
          exchange={Exchange.BITMEX}
          readyState={ReadyState.UNINITIATED}
        />
      </Dashboard.Item>
      <Dashboard.Item {...{ x: 0, y: 1 }}>
        <Widget isFull={true}>
          <div className="h-full">{''}</div>
        </Widget>
      </Dashboard.Item>
      <Dashboard.Item {...{ x: 0, y: 2 }}>
        <Widget isFull={true}>
          <div className="h-full">{''}</div>
        </Widget>
      </Dashboard.Item>
    </>
  );
};
