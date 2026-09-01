/**
 * Мост до скролера. Дълбокомерът трябва да може да мести страницата, а не
 * знае нищо за Lenis — App му го подава тук. Без Lenis (намалено движение)
 * пада обратно към нативния скрол.
 */

type ScrollTarget = {
  scrollTo: (target: number, options?: { immediate?: boolean; duration?: number }) => void
}

let scroller: ScrollTarget | null = null

export function setScroller(next: ScrollTarget | null) {
  scroller = next
}

export function scrollToY(y: number, immediate = false) {
  const top = Math.max(0, Math.round(y))
  if (scroller) {
    scroller.scrollTo(top, immediate ? { immediate: true } : { duration: 0.7 })
    return
  }
  window.scrollTo({ top, behavior: immediate ? 'auto' : 'smooth' })
}
