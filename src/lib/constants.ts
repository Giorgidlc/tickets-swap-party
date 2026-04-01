export const EVENT = {
  name: 'Swap Party',
  tagline: 'Disfruta de la moda circular: trae, encuentra y comparte tu estilo.',
  date: 'Sábado 18 de Abril de 2026',
  time: '12:00 a 15:00',
  location: 'Bar St. Andrews',
  address: 'C. Rafael Núñez Rosáenz, 2',
  maxTickets: Number(process.env.MAX_TICKETS) || 20,
  rules: [
    'Puedes traer todas las prendas que ya no uses y llévate TODAS las que te gusten.',
    'TRAE: ropa que ya no usas (en buen estado, limpia y planchada).',
    'ENCUENTRA: nuevos tesoros para tu ARMARIO.',
    'AYUDA: al planeta con la moda circular.',
  ],
  disclaimer:
    'No seas ese amigo que trae un pijama roído y se lleva 4 conjuntos nuevos. Confiamos en ti 😉',
  includes: '🍹 1 consumición incluida con tu entrada',
} as const
