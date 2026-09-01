export const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`

/**
 * Средата между окото и страницата.
 *
 * Слоят се композира върху DOM-а по модела на образуване на подводно
 * изображение (Jaffe–McGlamery):
 *
 *   I_out = I_scene · T(d)  +  B(d)
 *
 * Първият член е mix-blend-mode: multiply (uMode = 0), вторият е
 * mix-blend-mode: screen (uMode = 1). Двата слоя използват един и същ шейдър.
 */
export const FRAG = (steps: number) => `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

#define CAUSTIC_STEPS ${Math.max(1, Math.min(3, steps))}

uniform vec2  uRes;
uniform float uTime;
uniform float uDepth;
uniform vec3  uColor;
uniform vec3  uTorch;    // xy = позиция в пиксели (долу-ляво), z = интензивност
uniform float uTorchR;
uniform float uCaustics;
uniform float uShafts;
uniform float uMode;

float causticField(vec2 p, float t) {
  vec2 i = p;
  float c = 1.0;
  const float inten = 0.0045;
  for (int n = 0; n < CAUSTIC_STEPS; n++) {
    float tt = t * (1.0 - (3.5 / float(n + 1)));
    i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
    c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / inten), p.y / (cos(i.y + tt) / inten)));
  }
  c /= float(CAUSTIC_STEPS);
  c = 1.17 - pow(c, 1.4);
  return clamp(pow(abs(c), 7.0), 0.0, 1.0);
}

float shaftField(vec2 uv, float t) {
  vec2 p = uv - vec2(0.5, 1.30);
  float a = atan(p.x, -p.y) * 8.0;
  float s = 0.0;
  s += smoothstep(0.55, 1.0, sin(a * 3.0 + t * 0.30) * 0.5 + 0.5) * 0.62;
  s += smoothstep(0.60, 1.0, sin(a * 1.7 - t * 0.19) * 0.5 + 0.5) * 0.45;
  s += smoothstep(0.70, 1.0, sin(a * 5.3 + t * 0.11) * 0.5 + 0.5) * 0.30;
  s *= smoothstep(0.02, 0.80, uv.y);
  return clamp(s, 0.0, 1.0);
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = frag / uRes;
  float aspect = uRes.x / max(uRes.y, 1.0);
  vec2 cp = (uv - 0.5) * vec2(aspect, 1.0);

  // Фенерът: къс път на светлината, значи пълен спектър — точно както под
  // водата виждаш цвят само в двата метра пред снопа.
  vec2 td = (frag - uTorch.xy) / max(uTorchR, 1.0);
  float tr2 = dot(td, td);
  float torch = clamp(exp(-tr2 * 1.35) * uTorch.z, 0.0, 1.0);
  float torchCore = clamp(exp(-tr2 * 3.6) * uTorch.z, 0.0, 1.0);

  // Страничният път през водата е по-дълъг към ръбовете на кадъра, а надолу
  // светлината намалява — оттам идва усещането за тъмнина, не от глобално
  // затъмняване (то би убило контраста на текста).
  float vig = 0.16 + 0.40 * clamp(uDepth / 50.0, 0.0, 1.0);
  float edge = 1.0 - vig * pow(clamp(length(cp) * 1.02, 0.0, 1.6), 2.1);
  // Долният ръб на екрана е няколко метра по-дълбок от горния.
  float grad = 1.0 - (0.06 + 0.10 * clamp(uDepth / 50.0, 0.0, 1.0)) * (1.0 - uv.y);

  float caus = 0.0;
  if (uCaustics > 0.002) {
    caus = causticField(cp * 5.2 + vec2(0.0, uDepth * 0.02), uTime * 0.55) * uCaustics;
  }
  float shafts = uShafts > 0.002 ? shaftField(uv, uTime) * uShafts : 0.0;

  if (uMode < 0.5) {
    vec3 c = uColor * edge * grad;
    c *= 1.0 - 0.13 * (1.0 - caus) * uCaustics;
    c = mix(c, vec3(1.0), torch * 0.97);
    gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
  } else {
    // Воалът е слаб в средата на кадъра и плътен към ръбовете — настрани
    // гледаш през повече вода, а и текстът стои в средата.
    float veilShape = mix(0.55, 1.45, clamp(pow(length(cp) * 1.15, 1.6), 0.0, 1.0));
    vec3 veil = uColor * veilShape * (0.92 + 0.22 * (1.0 - uv.y));
    veil += uColor * caus * 1.6;
    veil += vec3(0.26, 0.58, 0.70) * shafts * (0.09 + 0.26 * uCaustics);
    veil *= 1.0 - torch * 0.85;
    // Изкуствената светлина е по-топла от водата — 5000 K срещу синьото.
    veil += vec3(0.20, 0.155, 0.115) * torchCore;
    gl_FragColor = vec4(clamp(veil, 0.0, 1.0), 1.0);
  }
}
`
