export const waitForMs = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});
