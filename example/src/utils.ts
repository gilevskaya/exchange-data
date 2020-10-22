export const num = {
  pretty(num: number, prec?: number): string {
    const opt =
      prec != null
        ? {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          }
        : undefined;
    return num.toLocaleString('fr-FR', opt);
  },
};
