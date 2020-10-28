import { Channel } from '../types';

export const getSubKey = (channel: Channel, instrument: string): string =>
  `${channel}:${instrument}`;

export {
  applyExchangeOrderBookEdits,
  TOrderBook,
  TOrderBookSide,
} from './orderbook';
