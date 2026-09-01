import { useEffect } from 'react'
import { useD } from '../lib/useD'
import { toggleLang } from '../i18n'
import { cartCount, useCart, useUi } from '../lib/store'
import { torchState } from '../lib/device'
import { depthState } from '../lib/depth'
import { setAudioVolume, startAudio, stopAudio, suspendAudio } from '../lib/audio'

const IcoTorch = () => (
  <svg className="tool__ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
    <rect x="1.5" y="6" width="6.5" height="4" rx="1.2" />
    <path d="M8 5.2 14 2.4v11.2L8 10.8z" />
  </svg>
)

const IcoSound = ({ on }: { on: boolean }) => (
  <svg className="tool__ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
    <path d="M2.5 6h2.2L8 3.2v9.6L4.7 10H2.5z" />
    {on ? (
      <>
        <path d="M10.6 5.8a3 3 0 0 1 0 4.4" />
        <path d="M12.6 4a5.4 5.4 0 0 1 0 8" />
      </>
    ) : (
      <path d="M10.8 6.2 14 9.8M14 6.2l-3.2 3.6" />
    )}
  </svg>
)

const IcoCart = () => (
  <svg className="tool__ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
    <path d="M2 2.5h1.9l1.6 8h7L14 5H5" />
    <circle cx="6.4" cy="13.2" r="1" />
    <circle cx="11.8" cy="13.2" r="1" />
  </svg>
)

const IcoMenu = () => (
  <svg className="tool__ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
    <path d="M2.5 5h11M2.5 11h11" />
  </svg>
)

export function Nav() {
  const { d } = useD()
  const items = useCart((s) => s.items)
  const setOpen = useCart((s) => s.setOpen)
  const { torch, sound, menu, volume, toggleTorch, toggleSound, setMenu, setVolume } = useUi()
  const count = cartCount(items)

  // Плъзгачът задава само нивото. Пускането и спирането остават на бутона —
  // звук не бива да тръгва от местене на плъзгач, което човек може да направи
  // и без да иска. При изключен звук нивото просто се запомня за следващия път.
  const onVolume = (v: number) => {
    setVolume(v)
    setAudioVolume(v)
  }

  const volumeControl = (id: string) => (
    <label className="volume" htmlFor={id} data-on={sound}>
      <span className="visually-hidden">{d.hud.volume}</span>
      <input
        id={id}
        className="volume__range"
        type="range"
        min={0}
        max={100}
        step={1}
        value={Math.round(volume * 100)}
        aria-label={d.hud.volume}
        title={`${d.hud.volume} · ${Math.round(volume * 100)}%`}
        onChange={(e) => onVolume(Number(e.currentTarget.value) / 100)}
        style={{ ['--v' as string]: `${Math.round(volume * 100)}%` }}
      />
    </label>
  )

  useEffect(() => {
    torchState.on = torch
  }, [torch])

  useEffect(() => {
    if (sound) void startAudio(() => depthState.current, useUi.getState().volume)
    else stopAudio()
    return () => {
      if (sound) stopAudio()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sound])

  useEffect(() => {
    const onVis = () => suspendAudio(document.hidden)
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  const links = (
    <>
      <a href="#gear">{d.nav.gear}</a>
      <a href="#trips">{d.nav.trips}</a>
      <a href="#courses">{d.nav.courses}</a>
      <a href="#contact">{d.nav.contact}</a>
    </>
  )

  return (
    <>
      <header className="hud topbar">
        <a className="brand" href="#top">
          <svg className="brand__mark" viewBox="0 0 64 64" aria-hidden="true">
            <circle cx="32" cy="32" r="21" fill="none" stroke="var(--rail)" strokeWidth="3" />
            <path d="M32 11a21 21 0 0 1 18.2 10.5" fill="none" stroke="var(--sonar)" strokeWidth="3" strokeLinecap="round" />
            <path d="M32 32 44 21" stroke="var(--signal)" strokeWidth="4" strokeLinecap="round" />
            <circle cx="32" cy="32" r="3.4" fill="var(--foam)" />
          </svg>
          <span className="brand__text">
            <span className="brand__name">{d.brand.name}</span>
            <span className="brand__sub">{d.brand.tagline}</span>
          </span>
        </a>

        <nav className="navlinks" aria-label={d.nav.menu}>
          {links}
        </nav>

        <div className="tools">
          <button
            type="button"
            className="tool"
            aria-pressed={torch}
            aria-label={torch ? d.hud.torchOn : d.hud.torchOff}
            title={torch ? d.hud.torchOn : d.hud.torchOff}
            onClick={toggleTorch}
          >
            <IcoTorch />
          </button>
          <button
            type="button"
            className="tool"
            aria-pressed={sound}
            aria-label={sound ? d.hud.soundOn : d.hud.soundOff}
            title={sound ? d.hud.soundOn : d.hud.soundOff}
            onClick={toggleSound}
          >
            <IcoSound on={sound && volume > 0} />
          </button>
          {volumeControl('volume-bar')}
          <button
            type="button"
            className="tool"
            onClick={toggleLang}
            aria-label={d.hud.langLabel}
            title={d.hud.langLabel}
          >
            {d.hud.lang}
          </button>
          <button
            type="button"
            className="tool tool--cart"
            onClick={() => setOpen(true)}
            aria-label={`${d.cart.open}${count ? `, ${count}` : ''}`}
          >
            <IcoCart />
            {count > 0 && <span className="tool__count">{count}</span>}
          </button>
          <button
            type="button"
            className="tool tool--menu"
            onClick={() => setMenu(!menu)}
            aria-expanded={menu}
            aria-label={menu ? d.nav.close : d.nav.menu}
          >
            <IcoMenu />
          </button>
        </div>
      </header>

      <nav className="sheet" data-open={menu} aria-label={d.nav.menu}>
        <div onClick={() => setMenu(false)}>{links}</div>
        <div className="sheet__volume">
          <span className="kicker">{d.hud.volume}</span>
          {volumeControl('volume-sheet')}
        </div>
      </nav>
    </>
  )
}
