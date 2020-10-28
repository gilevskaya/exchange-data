import { TSubscription, TWSOptions } from '../types';
import { useDeribit } from './useDeribit';
import { useBitmex } from './useBitmex';

export const useExchange = (
  subscriptions: TSubscription[],
  wsOptions?: TWSOptions
) => {
  const deribit = useDeribit(subscriptions, wsOptions);
  const bitmex = useBitmex(subscriptions, wsOptions);
  return { deribit, bitmex };
};
