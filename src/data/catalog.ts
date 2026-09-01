export type ProductId =
  | 'mask' | 'fins' | 'smb' | 'wetsuit5' | 'bcd' | 'wetsuit7' | 'reg'
  | 'octo' | 'torch' | 'computer' | 'drysuit' | 'deco' | 'twinset' | 'trimix'

export type Product = {
  id: ProductId
  /** дълбочината, на която този артикул става необходим — тук се появява */
  depth: number
  /** цена в лева */
  price: number
  sku: string
  category: 'exposure' | 'life-support' | 'instruments' | 'accessories' | 'tech'
  /** акцентен цвят на артикула преди затихване; част от номера е, че си отива */
  accent: 'signal' | 'nitrox' | 'steel' | 'foam'
  badge?: 'new' | 'pro'
}

export const PRODUCTS: Product[] = [
  { id: 'mask',     depth: 3,  price: 149,  sku: 'DL-MSK-013', category: 'accessories',  accent: 'foam' },
  { id: 'fins',     depth: 6,  price: 219,  sku: 'DL-FIN-204', category: 'accessories',  accent: 'signal' },
  { id: 'smb',      depth: 9,  price: 129,  sku: 'DL-SMB-140', category: 'accessories',  accent: 'signal' },
  { id: 'wetsuit5', depth: 12, price: 489,  sku: 'DL-EXP-050', category: 'exposure',     accent: 'steel' },
  { id: 'bcd',      depth: 15, price: 1090, sku: 'DL-BCD-311', category: 'life-support', accent: 'nitrox', badge: 'new' },
  { id: 'wetsuit7', depth: 18, price: 799,  sku: 'DL-EXP-070', category: 'exposure',     accent: 'steel' },
  { id: 'reg',      depth: 21, price: 1340, sku: 'DL-REG-250', category: 'life-support', accent: 'foam' },
  { id: 'octo',     depth: 24, price: 380,  sku: 'DL-REG-210', category: 'life-support', accent: 'signal' },
  { id: 'torch',    depth: 26, price: 460,  sku: 'DL-LGT-300', category: 'instruments',  accent: 'foam' },
  { id: 'computer', depth: 30, price: 1690, sku: 'DL-CMP-003', category: 'instruments',  accent: 'nitrox', badge: 'pro' },
  { id: 'drysuit',  depth: 36, price: 2450, sku: 'DL-EXP-DRY', category: 'exposure',     accent: 'steel' },
  { id: 'deco',     depth: 40, price: 210,  sku: 'DL-SMB-600', category: 'accessories',  accent: 'signal' },
  { id: 'twinset',  depth: 45, price: 2190, sku: 'DL-TNK-212', category: 'tech',         accent: 'steel', badge: 'pro' },
  { id: 'trimix',   depth: 50, price: 1980, sku: 'DL-REG-TMX', category: 'tech',         accent: 'nitrox' },
]

export const productById = (id: ProductId) =>
  PRODUCTS.find((p) => p.id === id) as Product

export type TripId = 'urdoviza' | 'night' | 'maslen' | 'arkutino' | 'shabla'

export type Trip = {
  id: TripId
  depth: number
  price: number
  dives: number
  /** минимална сертификация */
  cert: 'OWD' | 'AOWD' | 'DEEP' | 'TEC'
  duration: string
}

export const TRIPS: Trip[] = [
  { id: 'urdoviza',  depth: 6,  price: 90,  dives: 2, cert: 'OWD',  duration: '4 ч' },
  { id: 'night',     depth: 12, price: 120, dives: 1, cert: 'OWD',  duration: '3 ч' },
  { id: 'maslen',    depth: 18, price: 140, dives: 2, cert: 'OWD',  duration: '5 ч' },
  { id: 'arkutino',  depth: 28, price: 190, dives: 2, cert: 'AOWD', duration: '6 ч' },
  { id: 'shabla',    depth: 42, price: 340, dives: 1, cert: 'TEC',  duration: '8 ч' },
]

export type CourseId = 'ow' | 'aow' | 'deep' | 'trimix'

export type Course = {
  id: CourseId
  depth: number
  price: number
  days: number
  dives: number
}

export const COURSES: Course[] = [
  { id: 'ow',     depth: 18, price: 690,  days: 4, dives: 5 },
  { id: 'aow',    depth: 30, price: 590,  days: 2, dives: 5 },
  { id: 'deep',   depth: 40, price: 480,  days: 2, dives: 4 },
  { id: 'trimix', depth: 50, price: 1450, days: 6, dives: 8 },
]

export const priceFmt = (v: number, lang: string) =>
  lang === 'en'
    ? `${new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 }).format(v)} lv.`
    : new Intl.NumberFormat('bg-BG', {
        style: 'currency',
        currency: 'BGN',
        maximumFractionDigits: 0,
      }).format(v)
