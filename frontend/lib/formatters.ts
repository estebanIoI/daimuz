export const formatCurrency = (amount: number): string => {
  // Formateamos como pesos colombianos sin decimales
  const formatted = Math.round(Number(amount))
  // Separamos los miles con punto (formato colombiano)
  const withThousands = formatted.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `$${withThousands} COP`
}

export const formatCurrencyShort = (amount: number): string => {
  // Versión corta sin COP para espacios pequeños
  const formatted = Math.round(Number(amount))
  const withThousands = formatted.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `$${withThousands}`
}

export const formatOrderCount = (count: number): string => {
  return `${count} producto${count !== 1 ? 's' : ''}`
}
