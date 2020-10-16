export enum TOrderBookSide {
  BIDS = 'bids',
  ASKS = 'asks',
}
export type TOrderBookEdit = {
  id: number;
  price: number;
  size: number;
  sizeBTC?: number;
};
type TOrderBookEntryBase = {
  side: TOrderBookSide;
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

export function applyExchangeOrderBookEdits(
  orderbook: TOrderBook | null,
  edits: Array<{
    side: TOrderBookSide;
    edit: TOrderBookEdit;
  }>
  // step: number = 0.5 // TODO: ...
): TOrderBook | null {
  let { entries, asks, bids }: TOrderBook =
    orderbook != null ? orderbook : { entries: new Map(), asks: [], bids: [] };

  for (const { side, edit } of edits) {
    const { price, size, id } = edit;

    if (size === 0) {
      // deletion
      entries.delete(price);
      if (side === TOrderBookSide.ASKS) {
        const i = asks.indexOf(price);
        if (i !== -1) delete asks[i];
      } else {
        const i = bids.indexOf(price);
        if (i !== -1) delete bids[i];
      }
    } else {
      // insert
      entries.set(price, { side, price, size, total: 0, id });
      if (side === TOrderBookSide.ASKS) {
        if (asks.indexOf(price) === -1) {
          // asks = sortedInsert(price, asks, true);
          asks = [...asks, price];
        }
      } else {
        if (bids.indexOf(price) === -1) {
          // bids = sortedInsert(price, bids, false);
          bids = [...bids, price];
        }
      }
    }
  }
  return {
    entries,
    asks: asks.filter(e => e),
    bids: bids.filter(e => e),
  };
}

// function sortedInsert(value: number, array: number[], isAZ: boolean) {
//   const a = [...array];
//   if (isAZ) a.splice(sortedIndex(array, value), 0, value);
//   else
//     a.splice(
//       sortedIndexBy(array, value, (x) => -x),
//       0,
//       value
//     );
//   return a;
// }
