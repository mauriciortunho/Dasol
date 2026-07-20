// Los tipos de dominio viven en src/types.ts (forma canónica). Se re-exportan
// acá para no romper los imports existentes que apuntan a '../mockData'.
import { Campaign } from './types';
export type { Campaign, SupportMessage } from './types';

// Genera un QR real (escaneable) para que el demo se vea vivo.
const qr = (data: string) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=12&data=${encodeURIComponent(data)}`;

export const campaigns: Campaign[] = [
  {
    id: '1',
    slug: 'cirugia-marta',
    title: 'Una mano para la cirugía de cadera de Doña Marta',
    story:
      'Doña Marta tiene 68 años y se cayó hace dos semanas. Los médicos dicen que necesita una prótesis de cadera para volver a caminar. Su familia ya cubrió los estudios, pero la operación se les escapa de las manos. Cualquier aporte la acerca a recuperar su independencia.',
    category: 'salud',
    beneficiaryName: 'Marta Áñez',
    goalAmount: 20000,
    currentAmount: 12350,
    coverImageUrl: 'https://picsum.photos/seed/marta/800/500',
    qrImageUrl: qr('PAGO-CAMPANA-1-MARTA-ANEZ'),
    qrBankName: 'BNB',
    accountHolderName: 'Marta Áñez Suárez',
    location: 'Santa Cruz de la Sierra',
    usesDedicatedAccount: true,
    dedicatedAccountVerified: true,
    supportMessages: [
      { id: 'm1', name: 'Carlos R.', message: 'Fuerza Doña Marta, pronto va a estar caminando.', amount: 100 },
      { id: 'm2', name: 'Anónimo', message: 'Lo poco que pude, de corazón.' },
      { id: 'm3', name: 'Vecinos del Plan 3000', message: 'Entre todos se puede 💪', amount: 250 },
    ],
  },
  {
    id: '2',
    slug: 'operacion-rocco',
    title: 'Operación urgente para Rocco, atropellado en el 4to anillo',
    story:
      'Rocco es un perrito que apareció herido cerca del mercado. Una rescatista lo llevó a la veterinaria y necesita una cirugía de la pata trasera. Ya está internado y estable, pero la operación no espera.',
    category: 'animales',
    beneficiaryName: 'Rocco (rescate)',
    goalAmount: 3500,
    currentAmount: 2890,
    coverImageUrl: 'https://picsum.photos/seed/rocco/800/500',
    qrImageUrl: qr('PAGO-CAMPANA-2-ROCCO'),
    qrBankName: 'Banco Mercantil Santa Cruz',
    accountHolderName: 'Refugio Patitas SC',
    location: 'Santa Cruz de la Sierra',
    usesDedicatedAccount: true,
    dedicatedAccountVerified: true,
    supportMessages: [
      { id: 'm1', name: 'Lucía M.', message: 'Gracias por rescatarlo 🐾', amount: 50 },
      { id: 'm2', name: 'Anónimo', message: 'Que se recupere pronto.' },
    ],
  },
  {
    id: '3',
    slug: 'casa-mamani',
    title: 'Reconstruir la casa de la familia Mamani tras el incendio',
    story:
      'Un incendio dejó sin techo a la familia Mamani en la zona norte. Perdieron casi todo. Estamos juntando para materiales y lo básico para que puedan empezar de nuevo. Cada aporte cuenta.',
    category: 'desastre',
    beneficiaryName: 'Familia Mamani',
    goalAmount: 15000,
    currentAmount: 4200,
    coverImageUrl: 'https://picsum.photos/seed/mamani/800/500',
    qrImageUrl: qr('PAGO-CAMPANA-3-MAMANI'),
    qrBankName: 'Banco Unión',
    accountHolderName: 'Juan Mamani Quispe',
    location: 'Santa Cruz de la Sierra',
    usesDedicatedAccount: false,
    dedicatedAccountVerified: false,
    supportMessages: [
      { id: 'm1', name: 'Andrés P.', message: 'Fuerza familia, no están solos.', amount: 200 },
    ],
  },
  {
    id: '4',
    slug: 'utiles-olivos',
    title: 'Útiles y mochilas para 30 niños de la escuelita',
    story:
      'Se viene el inicio de clases y muchos chicos del barrio no tienen lo básico. Queremos armar 30 kits con cuadernos, lápices y una mochila. Una pequeña ayuda hace una gran diferencia para ellos.',
    category: 'educacion',
    beneficiaryName: 'Escuelita Los Olivos',
    goalAmount: 6000,
    currentAmount: 5550,
    coverImageUrl: 'https://picsum.photos/seed/utiles/800/500',
    qrImageUrl: qr('PAGO-CAMPANA-4-UTILES'),
    qrBankName: 'BNB',
    accountHolderName: 'Asociación Los Olivos',
    location: 'Santa Cruz de la Sierra',
    usesDedicatedAccount: true,
    dedicatedAccountVerified: false,
    supportMessages: [
      { id: 'm1', name: 'Profesora Rosa', message: 'Gracias en nombre de los chicos.', amount: 150 },
      { id: 'm2', name: 'Anónimo', message: '¡Ya casi llegamos!' },
    ],
  },
];
