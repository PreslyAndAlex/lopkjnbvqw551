type Stop = { top: number; bottom: number; from: number; to: number }

/**
 * Превръща позицията на скрола в дълбочина.
 *
 * Всяка секция носи data-from / data-to в метри; картата е парчево-линейна и
 * се строи от реалната геометрия, така че границите на секциите съвпадат с
 * границите на дълбочинните зони при всякакъв размер на екрана.
 *
 * Горният ръб на прозореца е твоята дълбочина — на scrollY = 0 си на 0 m.
 */
export const scrollMap = {
  stops: [] as Stop[],
  maxScroll: 1,

  build() {
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-zone]'))
    this.maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
    const tops = els.map((e) => e.getBoundingClientRect().top + window.scrollY)
    this.stops = els.map((e, i) => {
      const top = tops[i]
      const rawBottom = i < els.length - 1 ? tops[i + 1] : this.maxScroll
      return {
        top,
        bottom: Math.max(rawBottom, top + 1),
        from: Number(e.dataset.from ?? 0),
        to: Number(e.dataset.to ?? 0),
      }
    })
  },

  depthAt(y: number): number {
    const s = this.stops
    if (s.length === 0) return 0
    if (y <= s[0].top) return s[0].from
    for (let i = 0; i < s.length; i++) {
      const st = s[i]
      if (y <= st.bottom) {
        const t = (y - st.top) / (st.bottom - st.top)
        return st.from + (st.to - st.from) * Math.min(Math.max(t, 0), 1)
      }
    }
    return s[s.length - 1].to
  },

  /**
   * Обратната посока: на коя позиция на скрола си на дадена дълбочина.
   * Гледаме само спускането — всяка дълбочина се среща два пъти (веднъж
   * надолу, веднъж на изплуването), а плъзгачът на дълбокомера означава
   * спускането.
   */
  scrollForDepth(depth: number): number {
    const descent = this.stops.filter((st) => st.to > st.from)
    if (descent.length === 0) return 0
    if (depth <= descent[0].from) return descent[0].top
    for (const st of descent) {
      if (depth <= st.to) {
        const t = (depth - st.from) / (st.to - st.from)
        return st.top + Math.min(Math.max(t, 0), 1) * (st.bottom - st.top)
      }
    }
    return descent[descent.length - 1].bottom
  },
}
