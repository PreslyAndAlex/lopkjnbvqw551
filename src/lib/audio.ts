/**
 * Подводен звук, генериран на място — без аудио файлове.
 *
 * Три слоя:
 *  1. Повърхностен шум — филтриран бял шум, чиято горна граница пада с
 *     дълбочината. Това е „изтъняването“: на 40 m високите вече ги няма.
 *  2. Тътен — нискочестотен шум, който се усилва надолу.
 *  3. Дишане — къси изблици през банд-филтър, все по-редки с дълбочината.
 *
 * Нищо не тръгва без потребителски жест и всичко спира при скрит таб.
 */

let ctx: AudioContext | null = null
let master: GainNode | null = null
let surfaceFilter: BiquadFilterNode | null = null
let surfaceGain: GainNode | null = null
let rumbleGain: GainNode | null = null
let noiseBuffer: AudioBuffer | null = null
let breathTimer: number | null = null
let running = false

/** 0..1 от плъзгача. Таванът е 0.55, за да не удря в клипинг. */
let volume = 0.6
const MAX_GAIN = 0.55

export function setAudioVolume(v: number) {
  volume = Math.min(Math.max(v, 0), 1)
  if (ctx && master) {
    master.gain.setTargetAtTime(volume * MAX_GAIN, ctx.currentTime, 0.06)
  }
}

export const getAudioVolume = () => volume

function makeNoise(context: AudioContext) {
  const len = context.sampleRate * 2
  const buf = context.createBuffer(1, len, context.sampleRate)
  const data = buf.getChannelData(0)
  let b0 = 0, b1 = 0, b2 = 0
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1
    // лек pink наклон — по-приятно от чист бял шум
    b0 = 0.99765 * b0 + white * 0.099
    b1 = 0.963 * b1 + white * 0.2965
    b2 = 0.57 * b2 + white * 1.0526
    data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.16
  }
  return buf
}

function loopSource(context: AudioContext, buffer: AudioBuffer) {
  const src = context.createBufferSource()
  src.buffer = buffer
  src.loop = true
  src.start()
  return src
}

function breath(depth: number) {
  if (!ctx || !master || !noiseBuffer) return
  const now = ctx.currentTime
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer
  src.loop = true

  const band = ctx.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.value = 420 + Math.random() * 260
  band.Q.value = 0.9

  const g = ctx.createGain()
  const peak = 0.16 + Math.random() * 0.05
  const dur = 1.5 + depth * 0.012
  g.gain.setValueAtTime(0.0001, now)
  g.gain.exponentialRampToValueAtTime(peak, now + 0.35)
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur)

  src.connect(band).connect(g).connect(master)
  src.start(now)
  src.stop(now + dur + 0.1)
}

export async function startAudio(getDepth: () => number, initialVolume?: number) {
  if (initialVolume !== undefined) volume = Math.min(Math.max(initialVolume, 0), 1)
  if (running) return
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return
  ctx = new Ctor()
  await ctx.resume()
  noiseBuffer = makeNoise(ctx)

  master = ctx.createGain()
  master.gain.value = 0
  master.connect(ctx.destination)

  // 1 — повърхностен шум
  surfaceFilter = ctx.createBiquadFilter()
  surfaceFilter.type = 'lowpass'
  surfaceFilter.frequency.value = 11000
  surfaceFilter.Q.value = 0.4
  surfaceGain = ctx.createGain()
  surfaceGain.gain.value = 0.55
  loopSource(ctx, noiseBuffer).connect(surfaceFilter).connect(surfaceGain).connect(master)

  // 2 — тътен
  const rumble = ctx.createBiquadFilter()
  rumble.type = 'lowpass'
  rumble.frequency.value = 110
  rumbleGain = ctx.createGain()
  rumbleGain.gain.value = 0.2
  loopSource(ctx, noiseBuffer).connect(rumble).connect(rumbleGain).connect(master)

  master.gain.linearRampToValueAtTime(volume * MAX_GAIN, ctx.currentTime + 1.4)
  running = true

  const schedule = () => {
    const d = getDepth()
    breath(d)
    const gap = 3200 + d * 42 + Math.random() * 900
    breathTimer = window.setTimeout(schedule, gap)
  }
  breathTimer = window.setTimeout(schedule, 900)

  const tick = () => {
    if (!running || !ctx || !surfaceFilter || !surfaceGain || !rumbleGain) return
    const d = getDepth()
    // Височините се поглъщат по-бързо от ниските — същата логика като светлината.
    const cutoff = Math.max(220, 11000 * Math.exp(-d * 0.052))
    surfaceFilter.frequency.setTargetAtTime(cutoff, ctx.currentTime, 0.35)
    surfaceGain.gain.setTargetAtTime(Math.max(0.12, 0.55 - d * 0.006), ctx.currentTime, 0.5)
    rumbleGain.gain.setTargetAtTime(0.18 + Math.min(d, 50) * 0.008, ctx.currentTime, 0.5)
    window.setTimeout(tick, 180)
  }
  tick()
}

export function stopAudio() {
  running = false
  if (breathTimer) window.clearTimeout(breathTimer)
  breathTimer = null
  if (ctx && master) {
    master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.4)
    const c = ctx
    window.setTimeout(() => void c.close().catch(() => {}), 600)
  }
  ctx = null
  master = null
  surfaceFilter = null
  surfaceGain = null
  rumbleGain = null
  noiseBuffer = null
}

export function suspendAudio(suspend: boolean) {
  if (!ctx) return
  if (suspend) void ctx.suspend().catch(() => {})
  else void ctx.resume().catch(() => {})
}

export const audioRunning = () => running
