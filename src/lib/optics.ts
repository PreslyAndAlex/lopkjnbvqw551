/**
 * optics.ts — колориметрия на подводната светлина.
 *
 * Моделът е Бугер–Ламберт–Беер, не произволен син оувърлей:
 *
 *      T(λ, d) = exp( -Kd(λ) · L(d) )
 *
 * Kd(λ) е дифузният коефициент на затихване на морската вода (m⁻¹). Наборът
 * е между океански типове I и II по Jerlov — чиста вода, в която минимумът на
 * затихване е в синьото. Това е Черно море навътре от Созопол в спокоен летен
 * ден. В мътна пролетна вода минимумът се измества към зеленото и морето
 * изглежда зелено; това е другото Черно море и не е случаят тук.
 *
 * L(d) = 2d + d0 — светлината минава пътя надолу до обекта И обратно до окото,
 * плюс ~1.5 m разстояние на наблюдение във всяка посока. Затова червеното си
 * отива на 5 m, а не на 15, както би излязло при еднопосочен път.
 *
 * Пет спектрални ленти се смесват в sRGB по спектралното припокриване на
 * каналите. Резултатът се композира върху страницата по модела на образуване
 * на подводно изображение (Jaffe–McGlamery):
 *
 *      I_out = I_scene · T(d) + B(d)
 *
 * първият член като mix-blend-mode: multiply, вторият като screen.
 *
 * ЕДНА ОТСТЪПКА, и тя е обявена: зеленият канал минава през компресия
 * g^0.40 (ADAPTATION_GAMMA). Причината е физиологична и техническа —
 * окото се адаптира към доминиращата дължина на вълната, а sRGB зеленият
 * сензор вижда и 500 nm светлина, която оцелява надълбоко. Без нея кадърът
 * става чисто син, а чисто синьо изображение има таван на контраста около
 * 2.4:1 и текстът престава да се чете. Червеният канал НЕ е пипан — той
 * стига до нула, както трябва.
 *
 * Целта е бял текст върху най-тъмния фон да остане над 4.5:1 на 50 метра.
 */

export type Band = {
  /** дължина на вълната, nm */
  nm: number
  /** дифузен коефициент на затихване Kd, m⁻¹ */
  k: number
  key: 'red' | 'orange' | 'yellow' | 'green' | 'blue'
  /** дълбочина, на която лентата пада под 2% предаване */
  dies: number
}

export const BANDS: Band[] = [
  { nm: 660, k: 0.35, key: 'red', dies: 5 },
  { nm: 600, k: 0.19, key: 'orange', dies: 10 },
  { nm: 580, k: 0.1, key: 'yellow', dies: 20 },
  { nm: 530, k: 0.08, key: 'green', dies: 30 },
  { nm: 470, k: 0.021, key: 'blue', dies: 120 },
]

/** Разстояние на наблюдение (нагоре + настрани), метри. */
const VIEW_PATH = 3

/** Компресия на зеления канал заради адаптацията на окото. Виж горе. */
export const ADAPTATION_GAMMA = 0.34

/**
 * Спектрално припокриване на sRGB каналите с петте ленти.
 * Всеки ред сумира до 1 — каналът е претеглено средно от лентите, които вижда.
 */
const CHANNEL_MIX = [
  [0.55, 0.3, 0.15, 0.0, 0.0], // R
  [0.0, 0.0, 0.28, 0.62, 0.1], // G
  [0.0, 0.0, 0.0, 0.1, 0.9], // B
] as const

/** Албедо на самата водна маса — какво разсейва обратно към окото. */
const WATER_ALBEDO = [0.55, 0.78, 0.86] as const

export type Optics = {
  depth: number
  /** предаване по ленти, 0..1 */
  bands: [number, number, number, number, number]
  /** абсолютно предаване по канали спрямо повърхността, 0..1 */
  absolute: [number, number, number]
  /** предаване, нормирано към оцелелия син канал — това е цветът */
  relative: [number, number, number]
  /** ниво на осветеността, 0..1 — не влиза в множителя, храни палитрата */
  exposure: number
  /** цвят на множителния слой (mix-blend-mode: multiply) */
  multiply: [number, number, number]
  /** цвят на воала от обратно разсейване (mix-blend-mode: screen) */
  veil: [number, number, number]
}

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v)

/**
 * Плътност на обратното разсейване спрямо дълбочината — расте, докато има
 * какво да се разсейва, и спада, когато светлината свърши. Върхът е около
 * двайсет метра, където водата изглежда най-мътна.
 *
 * Шейдърът я оформя и в пространството: слаба в средата на кадъра, силна към
 * ръбовете. Причината е същата като на винетката — настрани гледаш през
 * повече вода. Полезната последица е, че воалът не вдига черното точно там,
 * където стои текстът.
 */
function veilStrength(depth: number): number {
  const build = 1 - Math.exp(-0.075 * depth)
  const fade = 0.3 + 0.7 * Math.exp(-0.055 * depth)
  return 0.34 * build * fade
}

/**
 * Осветеност спрямо повърхността. Физически това е exp(-Kd·d) — на 50 m
 * остават около 10%. Стойността НЕ умножава кадъра (това би убило контраста
 * на текста); вместо това води палитрата на страницата и яркостта на
 * частиците. Тъмнината идва от собствените цветове на страницата, от
 * винетката в шейдъра и от изчезването на светлинните снопове.
 */
export function exposureAt(depth: number): number {
  return 0.34 + 0.66 * Math.exp(-0.055 * Math.max(0, depth))
}

export function opticsAt(depth: number): Optics {
  const d = Math.max(0, depth)
  // Пътят на наблюдение влиза плавно през първия метър и половина —
  // на повърхността гледаш през въздух и страницата е недокосната.
  const L = 2 * d + VIEW_PATH * Math.min(1, d / 1.5)

  const bands = [
    Math.exp(-BANDS[0].k * L),
    Math.exp(-BANDS[1].k * L),
    Math.exp(-BANDS[2].k * L),
    Math.exp(-BANDS[3].k * L),
    Math.exp(-BANDS[4].k * L),
  ] as Optics['bands']

  const absolute = [0, 0, 0] as [number, number, number]
  for (let c = 0; c < 3; c++) {
    let sum = 0
    for (let i = 0; i < 5; i++) sum += CHANNEL_MIX[c][i] * bands[i]
    absolute[c] = sum
  }

  const blue = Math.max(absolute[2], 1e-6)
  const rRaw = clamp(absolute[0] / blue, 0, 1)
  const gRaw = clamp(absolute[1] / blue, 0, 1)
  const relative: [number, number, number] = [rRaw, Math.pow(gRaw, ADAPTATION_GAMMA), 1]

  const exposure = exposureAt(d)
  const multiply: [number, number, number] = [relative[0], relative[1], relative[2]]

  const vs = veilStrength(d)
  const veil: [number, number, number] = [
    WATER_ALBEDO[0] * relative[0] * vs,
    WATER_ALBEDO[1] * relative[1] * vs,
    WATER_ALBEDO[2] * relative[2] * vs,
  ]

  return { depth: d, bands, absolute, relative, exposure, multiply, veil }
}

/** Температура на водата — юли, Созопол. Термоклин между 12 и 18 m. */
export function waterTempAt(depth: number): number {
  const surface = 24.5
  const deep = 8.4
  const t = 1 / (1 + Math.exp(-(depth - 15) / 2.6))
  return surface + (deep - surface) * t
}

/**
 * Бездекомпресионен лимит в минути — таблицата на PADI, интерполирана.
 * Само за дисплея на гейджа; това е демо, не планировчик за гмуркане.
 */
const NDL: ReadonlyArray<readonly [number, number]> = [
  [9, 219], [12, 147], [14, 98], [16, 72], [18, 56], [20, 45],
  [22, 37], [25, 29], [30, 20], [35, 14], [40, 9], [45, 6], [50, 4],
]

export function ndlAt(depth: number): number {
  if (depth <= NDL[0][0]) return NDL[0][1]
  for (let i = 1; i < NDL.length; i++) {
    const [d1, m1] = NDL[i]
    if (depth <= d1) {
      const [d0, m0] = NDL[i - 1]
      const t = (depth - d0) / (d1 - d0)
      return Math.round(m0 + (m1 - m0) * t)
    }
  }
  return 0
}

const srgbToHex = (v: number) =>
  Math.round(clamp(v, 0, 1) * 255)
    .toString(16)
    .padStart(2, '0')

function parseHex(hex: string): [number, number, number] {
  const n = hex.replace('#', '')
  const full = n.length === 3 ? n.split('').map((c) => c + c).join('') : n
  return [0, 1, 2].map((i) => parseInt(full.slice(i * 2, i * 2 + 2), 16) / 255) as [
    number,
    number,
    number,
  ]
}

/**
 * Умножава цвят по коефициент в ЛИНЕЙНО пространство — така избледняването
 * изглежда като реално намаляване на светлината, а не като промяна на гама.
 */
export function scaleHex(hex: string, t: number): string {
  const k = clamp(t, 0, 1)
  const out = parseHex(hex).map((c) => {
    const lin = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    const v = lin * k
    return v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055
  })
  return `#${out.map(srgbToHex).join('')}`
}

/** Линейна интерполация между hex цветове — за палитрата по дълбочина. */
export function mixHex(a: string, b: string, t: number): string {
  const x = parseHex(a)
  const y = parseHex(b)
  const k = clamp(t, 0, 1)
  return `#${x.map((v, i) => srgbToHex(v + (y[i] - v) * k)).join('')}`
}

/** Фонът на страницата по дълбочина — светлината си отива тук, не в множителя. */
const SEA_STOPS: ReadonlyArray<readonly [number, string]> = [
  [0, '#0c2732'],
  [8, '#0a222c'],
  [16, '#081c25'],
  [24, '#06161e'],
  [32, '#041017'],
  [40, '#030b11'],
  [50, '#01070b'],
]

export function seaColorAt(depth: number): string {
  const d = clamp(depth, 0, 50)
  for (let i = 1; i < SEA_STOPS.length; i++) {
    if (d <= SEA_STOPS[i][0]) {
      const [d0, c0] = SEA_STOPS[i - 1]
      const [d1, c1] = SEA_STOPS[i]
      return mixHex(c0, c1, (d - d0) / (d1 - d0))
    }
  }
  return SEA_STOPS[SEA_STOPS.length - 1][1]
}
