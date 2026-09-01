import { FRAG, VERT } from './shaders'

export type WaterMode = 'multiply' | 'screen'

export type WaterFrame = {
  time: number
  depth: number
  /** цвят за този слой, линеен 0..1 */
  color: [number, number, number]
  caustics: number
  shafts: number
  torchX: number
  torchY: number
  torchIntensity: number
  torchRadius: number
}

type Uniforms = {
  uRes: WebGLUniformLocation | null
  uTime: WebGLUniformLocation | null
  uDepth: WebGLUniformLocation | null
  uColor: WebGLUniformLocation | null
  uTorch: WebGLUniformLocation | null
  uTorchR: WebGLUniformLocation | null
  uCaustics: WebGLUniformLocation | null
  uShafts: WebGLUniformLocation | null
  uMode: WebGLUniformLocation | null
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)
  if (!sh) return null
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.warn('[water] shader:', gl.getShaderInfoLog(sh))
    gl.deleteShader(sh)
    return null
  }
  return sh
}

export class WaterRenderer {
  readonly canvas: HTMLCanvasElement
  readonly host: HTMLElement
  private gl: WebGLRenderingContext | null = null
  private program: WebGLProgram | null = null
  private uniforms: Uniforms | null = null
  private buffer: WebGLBuffer | null = null
  private mode: number
  private steps = 3
  private scale = 0.5
  private w = 0
  private h = 0
  private lost = false

  constructor(host: HTMLElement, canvas: HTMLCanvasElement, mode: WaterMode) {
    this.host = host
    this.canvas = canvas
    this.mode = mode === 'multiply' ? 0 : 1
    this.init()
    canvas.addEventListener('webglcontextlost', this.onLost, false)
    canvas.addEventListener('webglcontextrestored', this.onRestored, false)
  }

  private onLost = (e: Event) => {
    e.preventDefault()
    this.lost = true
  }

  private onRestored = () => {
    this.lost = false
    this.init()
    this.buildProgram(this.steps)
    this.w = 0
  }

  private init() {
    const opts: WebGLContextAttributes = {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance',
      failIfMajorPerformanceCaveat: false,
    }
    const gl =
      (this.canvas.getContext('webgl', opts) as WebGLRenderingContext | null) ??
      (this.canvas.getContext('experimental-webgl', opts) as WebGLRenderingContext | null)
    this.gl = gl
    if (!gl) return
    this.buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  }

  get supported() {
    return this.gl !== null
  }

  /** Готов за рисуване: има контекст И програмата е компилирана. */
  get ready() {
    return this.gl !== null && this.program !== null && this.uniforms !== null
  }

  buildProgram(steps: number) {
    const gl = this.gl
    if (!gl) return
    this.steps = steps
    if (this.program) gl.deleteProgram(this.program)
    const vs = compile(gl, gl.VERTEX_SHADER, VERT)
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG(steps))
    if (!vs || !fs) return
    const p = gl.createProgram()
    if (!p) return
    gl.attachShader(p, vs)
    gl.attachShader(p, fs)
    gl.bindAttribLocation(p, 0, 'aPos')
    gl.linkProgram(p)
    gl.deleteShader(vs)
    gl.deleteShader(fs)
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      console.warn('[water] link:', gl.getProgramInfoLog(p))
      return
    }
    this.program = p
    gl.useProgram(p)
    this.uniforms = {
      uRes: gl.getUniformLocation(p, 'uRes'),
      uTime: gl.getUniformLocation(p, 'uTime'),
      uDepth: gl.getUniformLocation(p, 'uDepth'),
      uColor: gl.getUniformLocation(p, 'uColor'),
      uTorch: gl.getUniformLocation(p, 'uTorch'),
      uTorchR: gl.getUniformLocation(p, 'uTorchR'),
      uCaustics: gl.getUniformLocation(p, 'uCaustics'),
      uShafts: gl.getUniformLocation(p, 'uShafts'),
      uMode: gl.getUniformLocation(p, 'uMode'),
    }
    gl.enableVertexAttribArray(0)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    gl.uniform1f(this.uniforms.uMode, this.mode)
  }

  setScale(scale: number) {
    if (scale === this.scale) return
    this.scale = scale
    this.w = 0
  }

  private resize() {
    const gl = this.gl
    if (!gl) return
    const cw = this.canvas.clientWidth || window.innerWidth
    const ch = this.canvas.clientHeight || window.innerHeight
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = Math.max(2, Math.round(cw * dpr * this.scale))
    const h = Math.max(2, Math.round(ch * dpr * this.scale))
    if (w === this.w && h === this.h) return
    this.w = w
    this.h = h
    this.canvas.width = w
    this.canvas.height = h
    gl.viewport(0, 0, w, h)
    if (this.uniforms) gl.uniform2f(this.uniforms.uRes, w, h)
  }

  render(f: WaterFrame) {
    const gl = this.gl
    const u = this.uniforms
    if (!gl || !u || !this.program || this.lost) return
    this.resize()
    gl.useProgram(this.program)
    gl.uniform1f(u.uTime, f.time)
    gl.uniform1f(u.uDepth, f.depth)
    gl.uniform3f(u.uColor, f.color[0], f.color[1], f.color[2])
    // gl_FragCoord е с начало долу-ляво; торчът идва в CSS координати отгоре.
    const px = f.torchX * (this.w / (this.canvas.clientWidth || 1))
    const py = (1 - f.torchY / (this.canvas.clientHeight || 1)) * this.h
    gl.uniform3f(u.uTorch, px, py, f.torchIntensity)
    gl.uniform1f(u.uTorchR, f.torchRadius * (this.w / (this.canvas.clientWidth || 1)))
    gl.uniform1f(u.uCaustics, f.caustics)
    gl.uniform1f(u.uShafts, f.shafts)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  dispose() {
    this.canvas.removeEventListener('webglcontextlost', this.onLost)
    this.canvas.removeEventListener('webglcontextrestored', this.onRestored)
    const gl = this.gl
    if (!gl) return
    if (this.program) gl.deleteProgram(this.program)
    if (this.buffer) gl.deleteBuffer(this.buffer)
    // Контекстът НЕ се губи нарочно: canvas-ът не връща нов WebGL контекст,
    // след като веднъж е бил изгубен, а StrictMode монтира два пъти.
    this.program = null
    this.uniforms = null
    this.buffer = null
  }
}
