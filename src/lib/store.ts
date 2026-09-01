import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { ProductId } from '../data/catalog'
import { PRODUCTS } from '../data/catalog'

export type LineItem = { id: ProductId; qty: number }

type CartState = {
  items: LineItem[]
  open: boolean
  submitted: boolean
  add: (id: ProductId) => void
  remove: (id: ProductId) => void
  setQty: (id: ProductId, qty: number) => void
  setOpen: (open: boolean) => void
  submit: () => void
  reset: () => void
}

const validIds = new Set(PRODUCTS.map((p) => p.id))

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      open: false,
      submitted: false,
      add: (id) =>
        set((s) => {
          const found = s.items.find((i) => i.id === id)
          const items = found
            ? s.items.map((i) => (i.id === id ? { ...i, qty: Math.min(i.qty + 1, 9) } : i))
            : [...s.items, { id, qty: 1 }]
          return { items, submitted: false }
        }),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      setQty: (id, qty) =>
        set((s) => ({
          items:
            qty <= 0
              ? s.items.filter((i) => i.id !== id)
              : s.items.map((i) => (i.id === id ? { ...i, qty: Math.min(qty, 9) } : i)),
        })),
      setOpen: (open) => set({ open }),
      submit: () => set({ submitted: true }),
      reset: () => set({ items: [], submitted: false }),
    }),
    {
      name: 'dulbina.cart',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items }) as unknown as CartState,
      merge: (persisted, current) => {
        const p = persisted as Partial<CartState> | undefined
        const items = (p?.items ?? []).filter(
          (i) => validIds.has(i.id) && Number.isFinite(i.qty) && i.qty > 0,
        )
        return { ...current, items }
      },
    },
  ),
)

export const cartCount = (items: LineItem[]) => items.reduce((n, i) => n + i.qty, 0)

export const cartTotal = (items: LineItem[]) =>
  items.reduce((sum, i) => {
    const p = PRODUCTS.find((x) => x.id === i.id)
    return sum + (p ? p.price * i.qty : 0)
  }, 0)

const VOLUME_KEY = 'dulbina.volume'

function storedVolume(): number {
  try {
    const raw = localStorage.getItem(VOLUME_KEY)
    if (raw === null) return 0.6
    const v = Number(raw)
    return Number.isFinite(v) && v >= 0 && v <= 1 ? v : 0.6
  } catch {
    return 0.6
  }
}

/** UI състояние. Пази се само силата на звука — тя е предпочитание. */
type UiState = {
  torch: boolean
  sound: boolean
  science: boolean
  menu: boolean
  quality: 'high' | 'medium' | 'low'
  /** 0..1 */
  volume: number
  toggleTorch: () => void
  toggleSound: () => void
  setVolume: (v: number) => void
  toggleScience: () => void
  setMenu: (v: boolean) => void
  setQuality: (q: UiState['quality']) => void
}

export const useUi = create<UiState>()((set) => ({
  torch: false,
  sound: false,
  science: false,
  menu: false,
  quality: 'high',
  volume: storedVolume(),
  toggleTorch: () => set((s) => ({ torch: !s.torch })),
  toggleSound: () => set((s) => ({ sound: !s.sound })),
  setVolume: (v) => {
    const volume = Math.min(Math.max(v, 0), 1)
    try {
      localStorage.setItem(VOLUME_KEY, String(volume))
    } catch {
      /* private mode */
    }
    set({ volume })
  },
  toggleScience: () => set((s) => ({ science: !s.science })),
  setMenu: (menu) => set({ menu }),
  setQuality: (quality) => set({ quality }),
}))
