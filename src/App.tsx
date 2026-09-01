import { useEffect, useMemo, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

import { Nav } from './components/Nav'
import { DepthGauge } from './components/DepthGauge'
import { Hero } from './components/Hero'
import { Zone, Spectrum } from './components/Zone'
import { KitCard, TripCard, CourseCard } from './components/Cards'
import { Science } from './components/Science'
import { DiveLog } from './components/DiveLog'
import { Contact } from './components/Contact'
import { CartDrawer } from './components/CartDrawer'
import { Footer } from './components/Footer'

import { depthState } from './lib/depth'
import { scrollMap } from './lib/scrollMap'
import { setScroller } from './lib/scroller'
import { attachTorchTracking, initialQuality, prefersReducedMotion } from './lib/device'
import { engine } from './water/engine'
import { useUi } from './lib/store'
import { useD } from './lib/useD'

gsap.registerPlugin(ScrollTrigger)

if (import.meta.env.DEV) {
  // Помощник за проверки: __dulbina.freeze(30) показва как изглежда 30 метра,
  // без да се скролва. Не влиза в продукционния бъндъл.
  ;(window as unknown as { __dulbina?: unknown }).__dulbina = {
    freeze: (d: number | null) => depthState.freeze(d),
  }
}

export default function App() {
  const { d } = useD()
  const reduced = useMemo(() => prefersReducedMotion(), [])
  const setQuality = useUi((s) => s.setQuality)
  const multiplyHost = useRef<HTMLDivElement>(null)
  const multiply = useRef<HTMLCanvasElement>(null)
  const screenHost = useRef<HTMLDivElement>(null)
  const screen = useRef<HTMLCanvasElement>(null)
  const silt = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    document.documentElement.classList.toggle('no-motion', reduced)
    if (!multiply.current || !screen.current || !silt.current) return
    if (!multiplyHost.current || !screenHost.current) return

    engine.start(
      {
        multiply: { host: multiplyHost.current, canvas: multiply.current },
        screen: { host: screenHost.current, canvas: screen.current },
        silt: silt.current,
      },
      { quality: initialQuality(), reduced, onQualityDrop: setQuality },
    )
    const detachTorch = attachTorchTracking()

    return () => {
      engine.stop()
      detachTorch()
    }
  }, [reduced, setQuality])

  useEffect(() => {
    let lenis: Lenis | undefined
    let rafFn: ((time: number) => void) | undefined

    if (!reduced) {
      lenis = new Lenis({
        duration: 1.05,
        wheelMultiplier: 0.92,
        touchMultiplier: 1.5,
        smoothWheel: true,
        autoRaf: false,
        anchors: { offset: -88 },
      })
      lenis.on('scroll', ScrollTrigger.update)
      setScroller(lenis)
      rafFn = (time: number) => lenis?.raf(time * 1000)
      gsap.ticker.add(rafFn)
      gsap.ticker.lagSmoothing(0)
    }

    scrollMap.build()
    depthState.set(scrollMap.depthAt(window.scrollY))

    const ctx = gsap.context(() => {
      // Хореографията на спускането: един тригер води дълбочината, останалите
      // само разкриват съдържание.
      if (!reduced) {
        ScrollTrigger.create({
          trigger: document.documentElement,
          start: 'top top',
          end: 'bottom bottom',
          onUpdate: (self) => depthState.set(scrollMap.depthAt(self.scroll())),
          onRefresh: () => {
            scrollMap.build()
            depthState.set(scrollMap.depthAt(window.scrollY))
          },
        })
      }

      // При намалено движение нищо не се скрива и нищо не се анимира —
      // страницата е статична и цялата се чете веднага.
      if (!reduced) {
        gsap.set('.reveal', { opacity: 0, y: 26 })
        ScrollTrigger.batch('.reveal', {
          start: 'top 90%',
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, {
              opacity: 1,
              y: 0,
              duration: 0.85,
              ease: 'power2.out',
              stagger: 0.07,
              overwrite: true,
            }),
        })

        // Заглавието на героя влиза веднага, без да чака скрол.
        gsap
          .timeline({ delay: 0.15 })
          .to('.hero .reveal', {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: 'power3.out',
            stagger: 0.08,
          })
          .fromTo(
            '.hero__title',
            { letterSpacing: '0.06em' },
            { letterSpacing: '-0.05em', duration: 1.4, ease: 'power3.out' },
            0,
          )
      }
    })

    // При намалено движение дълбочината се фиксира по средата на секцията —
    // без плавен преход, но всяка зона се вижда в своя цвят.
    let io: IntersectionObserver | undefined
    if (reduced) {
      io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue
            const el = entry.target as HTMLElement
            const from = Number(el.dataset.from ?? 0)
            const to = Number(el.dataset.to ?? 0)
            depthState.set((from + to) / 2)
          }
        },
        { rootMargin: '-40% 0px -40% 0px' },
      )
      document.querySelectorAll('[data-zone]').forEach((el) => io?.observe(el))
    }

    const onResize = () => ScrollTrigger.refresh()
    window.addEventListener('orientationchange', onResize)

    return () => {
      window.removeEventListener('orientationchange', onResize)
      io?.disconnect()
      ctx.revert()
      ScrollTrigger.getAll().forEach((t) => t.kill())
      if (rafFn) gsap.ticker.remove(rafFn)
      setScroller(null)
      lenis?.destroy()
    }
  }, [reduced])

  return (
    <>
      <a className="skip" href="#content">
        {d.nav.skip}
      </a>

      <div className="seabed" aria-hidden="true" />

      <main id="content">
        {reduced && <p className="reduced-note">{d.a11y.reduced}</p>}

        <Hero />

        <Zone id="shallow" anchor="gear" spectrum>
          <div className="kits">
            <KitCard id="mask" />
            <KitCard id="fins" />
          </div>
          <div className="trips" id="trips">
            <TripCard id="urdoviza" />
          </div>
        </Zone>

        <Zone id="thermocline">
          <div className="kits">
            <KitCard id="smb" />
            <KitCard id="wetsuit5" />
            <KitCard id="bcd" />
          </div>
          <div className="trips">
            <TripCard id="night" />
          </div>
          <div className="courses" id="courses">
            <CourseCard id="ow" />
          </div>
        </Zone>

        <Zone id="blue" spectrum>
          <div className="kits">
            <KitCard id="wetsuit7" />
            <KitCard id="reg" />
            <KitCard id="octo" />
          </div>
          <div className="trips">
            <TripCard id="maslen" />
          </div>
        </Zone>

        <Zone id="twilight">
          <div className="kits">
            <KitCard id="torch" />
            <KitCard id="computer" />
          </div>
          <div className="trips">
            <TripCard id="arkutino" />
          </div>
          <div className="courses">
            <CourseCard id="aow" />
          </div>
          <Science />
        </Zone>

        <Zone id="wrecks" spectrum>
          <div className="kits">
            <KitCard id="drysuit" />
            <KitCard id="deco" />
          </div>
          <div className="trips">
            <TripCard id="shabla" />
          </div>
          <div className="courses">
            <CourseCard id="deep" />
          </div>
        </Zone>

        <Zone id="dark">
          <div className="kits">
            <KitCard id="twinset" />
            <KitCard id="trimix" />
          </div>
          <div className="courses">
            <CourseCard id="trimix" />
          </div>
        </Zone>

        <Zone id="ascent">
          <Spectrum />
          <DiveLog />
        </Zone>

        <Zone id="deco" anchor="contact">
          <Contact />
        </Zone>

        <Footer />
      </main>

      <div className="water water--multiply" ref={multiplyHost} aria-hidden="true">
        <canvas ref={multiply} />
      </div>
      <div className="water water--screen" ref={screenHost} aria-hidden="true">
        <canvas ref={screen} />
      </div>
      <canvas className="silt" ref={silt} aria-hidden="true" />

      <Nav />
      <DepthGauge />
      <CartDrawer />
    </>
  )
}
