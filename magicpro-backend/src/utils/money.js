// Calculs en CENTS (entiers) pour éviter les erreurs d'arrondi des nombres à virgule
export const TPS_RATE = 0.05;
export const TVQ_RATE = 0.09975;

export const toCents = (value) => Math.round(Number(value) * 100);
export const fromCents = (cents) => (cents / 100).toFixed(2); // string pour Prisma Decimal

// Calcule les lignes et les totaux d'une offre (TPS + TVQ du Québec)
export function computeQuote(items) {
  const lines = items.map((item) => {
    const lineCents = Math.round(item.qty * toCents(item.unitPrice));
    return {
      description: item.description,
      qty: Number(item.qty).toFixed(2),
      unitPrice: fromCents(toCents(item.unitPrice)),
      lineTotal: fromCents(lineCents),
      _cents: lineCents,
    };
  });

  const subtotalCents = lines.reduce((sum, l) => sum + l._cents, 0);
  const taxesCents = Math.round(subtotalCents * TPS_RATE) + Math.round(subtotalCents * TVQ_RATE);

  return {
    items: lines.map(({ _cents, ...l }) => l),
    subtotal: fromCents(subtotalCents),
    taxes: fromCents(taxesCents),
    total: fromCents(subtotalCents + taxesCents),
  };
}
