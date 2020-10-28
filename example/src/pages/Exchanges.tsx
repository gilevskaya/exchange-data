import * as React from 'react';
import Dashboard from 'react-grid-dashboard';

import { Bitmex } from '../exchanges/Bitmex';
import { Deribit } from '../exchanges/Deribit';
import { Binance } from '../exchanges/Binance';

const SPACE = '0.4rem';

export const Exchanges = () => {
  return (
    <div className="h-screen" style={{ padding: SPACE }}>
      <Dashboard columns={3} rows={3} gap={SPACE} rowsHeight={{ 0: '1.6rem' }}>
        <Bitmex />
        <Deribit />
        {/* <Binance /> */}
      </Dashboard>
    </div>
  );
};
