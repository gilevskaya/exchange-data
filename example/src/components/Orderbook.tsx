import * as React from 'react';

import { Side } from '../../../dist';
import { Loading } from './Loading';
import { Price, Size, Background } from './Trades';

export type TOrderBookEdit = {
  id: number;
  price: number;
  size: number;
  sizeBTC?: number;
};
type TOrderBookEntryBase = {
  side: Side;
  price: number;
  size: number;
  sizeBTC?: number;
  total: number;
};
export type TOrderBookEntry = TOrderBookEntryBase & {
  id: number;
};
export type TOrderBookEntries = Map<number, TOrderBookEntry>;
export type TOrderBook = {
  entries: TOrderBookEntries;
  asks: number[];
  bids: number[];
};

export const Orderbook = ({
  orderbook,
  lastPrice,
  depth,
  step,
  isSkipEmpty,
}: {
  orderbook: TOrderBook | null;
  lastPrice: number | null;
  depth: number;
  step: number;
  isSkipEmpty?: boolean;
}) => {
  const [bids, setBids] = React.useState<TOrderBookEntryBase[]>([]);
  const [asks, setAsks] = React.useState<TOrderBookEntryBase[]>([]);
  const [maxTotal, setMaxTotal] = React.useState<number | null>(null);

  const decimals = step.toString().split('.')[1].length || 0;

  React.useEffect(() => {
    if (orderbook == null) return;
    const { entries, asks: obasks, bids: obbids } = orderbook;
    if (obasks.length === 0 || obbids.length === 0) return;
    let newAsksPrice: number[] = [];
    let newBidsPrice: number[] = [];

    if (isSkipEmpty) {
      newAsksPrice = obasks.slice(0, depth);
      newBidsPrice = obbids.slice(0, depth);
    } else {
      const bestAsk = obasks[0];
      const bestBid = obbids[0];
      for (let currDepth = 0; currDepth < depth; currDepth++) {
        newBidsPrice.push(bestBid - currDepth * step);
        newAsksPrice.push(bestAsk + currDepth * step);
      }
    }
    let newaskstotal = 0;
    let newbidstotal = 0;
    setAsks(
      newAsksPrice.map(price => {
        const entry = entries.get(price);
        const size = entry ? entry.size : 0;
        newaskstotal += size;
        return {
          side: Side.SELL,
          price,
          size: size,
          total: newaskstotal,
        };
      })
    );
    setBids(
      newBidsPrice.map(price => {
        const entry = entries.get(price);
        const size = entry ? entry.size : 0;
        newbidstotal += size;
        return {
          side: Side.BUY,
          price,
          size: size,
          total: newbidstotal,
        };
      })
    );
    setMaxTotal(Math.max(newaskstotal, newbidstotal));
  }, [orderbook, depth, isSkipEmpty, step]);

  if (!orderbook || !lastPrice || !maxTotal) return <Loading />;
  return (
    <div className="py-3 font-mono">
      {[...asks].reverse().map(({ price, size, total }, i) => (
        <OrderBookEntry
          key={`a-${price}-${size}`}
          isTop={i === 0}
          decimals={decimals}
          side={Side.SELL}
          price={price}
          size={size}
          total={total}
          maxTotal={maxTotal}
        />
      ))}
      <div className="py-1 flex justify-center">
        <div className={`ml-3 text-sm font-semibold`}>
          <Price price={lastPrice} />
        </div>
      </div>
      {bids.map(({ price, size, total }, i) => (
        <OrderBookEntry
          key={`b-${price}-${size}`}
          isTop={i === 0}
          decimals={decimals}
          side={Side.BUY}
          price={price}
          size={size}
          total={total}
          maxTotal={maxTotal}
        />
      ))}
    </div>
  );
};

const OrderBookEntry = ({
  price,
  size,
  total,
  side,
  decimals,
  isTop,
  maxTotal,
}: TOrderBookEntryBase & {
  isTop?: boolean;
  decimals: number;
  maxTotal: number;
}) => {
  // const border = `border-black-600 border-b border-dashed ${
  //   isTop ? 'border-t' : ''
  // }`;
  const border = '';
  return (
    <div className={`flex text-xs text-right ${border}`}>
      <div className={`ml-4`}>
        <Price price={price} side={side} />
      </div>
      <div className="pl-2 pr-1 flex-1 text-black-400">
        <Size size={size} />
      </div>
      <div className="pl-1 flex-1 text-black-200">
        <Background
          color={side === Side.SELL ? 'sell-dark' : 'buy-dark'}
          opacity={60}
          size={total}
          maxSize={maxTotal}
        >
          <div className="pr-4">
            <Size size={total} />
          </div>
        </Background>
      </div>
    </div>
  );
};
