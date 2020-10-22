import * as React from 'react';
import Dashboard from 'react-grid-dashboard';

import { ReadyState, useWebSocket, Exchange } from '../../../dist';

const SPACE = '0.4rem';

// columnsWidth={{1: "1.8rem"}} rowsHeight={{}}
// columnsWidth={[1, '1,9rem']}

export const Exchanges = () => {
  return (
    <div className="h-screen" style={{ padding: SPACE }}>
      <Dashboard columns={3} rows={3} gap={SPACE} rowsHeight={{ 0: '1.6rem' }}>
        {/* Bitmex */}
        <Dashboard.Item {...{ x: 0 }}>
          <ExchangeHeader exchange={Exchange.BITMEX} />
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
        {/* Deribit */}
        <Dashboard.Item {...{ x: 1 }}>
          <ExchangeHeader exchange={Exchange.DERIBIT} />
        </Dashboard.Item>
        <Dashboard.Item {...{ x: 1, y: 1 }}>
          <Widget isFull={true}>
            <div className="h-full">{''}</div>
          </Widget>
        </Dashboard.Item>
        <Dashboard.Item {...{ x: 1, y: 2 }}>
          <Widget isFull={true}>
            <div className="h-full">{''}</div>
          </Widget>
        </Dashboard.Item>
        {/* Binance */}
        <Dashboard.Item {...{ x: 2 }}>
          <ExchangeHeader exchange={Exchange.BINANCE} />
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
      </Dashboard>
    </div>
  );
};

const ExchangeHeader = ({ exchange }: { exchange: Exchange }) => {
  return (
    <div className="px-1 text-black-600 text-lg font-semibold">{exchange}</div>
  );
};

const Widget = ({
  children,
  isScrollable,
  isFull = true,
}: {
  children: React.ReactElement;
  isScrollable?: boolean;
  isFull?: boolean;
}) => (
  <div
    className={`${isFull ? 'h-full w-full' : ''} bg-black-700 rounded-sm ${
      isScrollable ? 'overflow-y-auto' : ''
    }`}
  >
    {children}
  </div>
);
