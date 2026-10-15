import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Center, ContactShadows, OrbitControls, RoundedBox, Text3D } from '@react-three/drei'
import { createContext, Suspense, useContext, useMemo, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import font from '../assets/chakra-petch-bold.typeface.json'
import type { ProductId } from '../lib/catalog'

// Tekstura linii warstw (0,2 mm) i nakrapianej płyty PEI, generowane w przeglądarce.
function useTextures() {
  return useMemo(() => {
    const layers = document.createElement('canvas'); layers.width = 4; layers.height = 8
    const l = layers.getContext('2d')!
    l.fillStyle = '#808080'; l.fillRect(0, 0, 4, 8)
    l.fillStyle = '#5a5a5a'; l.fillRect(0, 6, 4, 2)
    const layerTex = new THREE.CanvasTexture(layers)
    layerTex.wrapS = layerTex.wrapT = THREE.RepeatWrapping; layerTex.repeat.set(1, 60)

    const pei = document.createElement('canvas'); pei.width = pei.height = 256
    const p = pei.getContext('2d')!
    const g = p.createLinearGradient(0, 0, 256, 256); g.addColorStop(0, '#C99A4A'); g.addColorStop(1, '#9C7330')
    p.fillStyle = g; p.fillRect(0, 0, 256, 256)
    for (let i = 0; i < 2600; i++) {
      p.fillStyle = Math.random() > 0.5 ? 'rgba(255,236,190,.35)' : 'rgba(70,45,10,.25)'
      p.fillRect(Math.random() * 256, Math.random() * 256, 1.2, 1.2)
    }
    const peiTex = new THREE.CanvasTexture(pei); peiTex.colorSpace = THREE.SRGBColorSpace
    peiTex.wrapS = peiTex.wrapT = THREE.RepeatWrapping; peiTex.repeat.set(9, 6)
    return { layerTex, peiTex }
  }, [])
}

type Mat = { color: string; bump: THREE.Texture }

// Świecący napis: kolor światła (albo 'rgb' — płynna zmiana kolorów jak z pilota).
const GlowCtx = createContext<string | null>(null)

function GlowMaterial({ glow }: { glow: string }) {
  const ref = useRef<THREE.MeshStandardMaterial>(null)
  useFrame(({ clock }) => {
    if (glow === 'rgb' && ref.current) ref.current.emissive.setHSL((clock.elapsedTime * 0.12) % 1, 1, 0.55)
  })
  return <meshStandardMaterial ref={ref} color="#F4F1EA" emissive={glow === 'rgb' ? '#ff3ad0' : glow} emissiveIntensity={2.4} roughness={0.4} toneMapped={false} />
}

function GlowLight({ glow }: { glow: string }) {
  const ref = useRef<THREE.PointLight>(null)
  useFrame(({ clock }) => {
    if (glow === 'rgb' && ref.current) ref.current.color.setHSL((clock.elapsedTime * 0.12) % 1, 1, 0.55)
  })
  return <pointLight ref={ref} color={glow === 'rgb' ? '#ff3ad0' : glow} intensity={3.2} distance={3.2} decay={1.6} position={[0, 0, 0.55]} />
}
const Plastic = ({ color, bump }: Mat) => <meshStandardMaterial color={color} roughness={0.62} metalness={0.02} bumpMap={bump} bumpScale={0.6} />

function Nick({ text, color, bump, width, maxH, position, rotation, flat }: {
  text: string; color: string; bump: THREE.Texture; width: number; maxH: number
  position: [number, number, number]; rotation?: [number, number, number]; flat?: boolean // flat = napis wtopiony, równo z powierzchnią
}) {
  const glow = useContext(GlowCtx)
  const t = text || 'Twój nick'
  const size = Math.min(maxH, width / (Math.max(t.length, 3) * 0.6))
  return (
    <group position={position} rotation={rotation}>
      <Center disableZ key={`${t}-${size.toFixed(3)}`}>
        <Text3D font={font as never} size={size} height={flat ? 0.006 : 0.09} curveSegments={6} bevelEnabled={!flat} bevelSize={0.008} bevelThickness={0.01} bevelSegments={2}>
          {t}
          {glow ? <GlowMaterial glow={glow} /> : <Plastic color={color} bump={bump} />}
        </Text3D>
      </Center>
      {glow && <GlowLight glow={glow} />}
    </group>
  )
}

function Box({ args, position, rotation, color, bump, radius = 0.06 }: {
  args: [number, number, number]; position: [number, number, number]; rotation?: [number, number, number]
  color: string; bump: THREE.Texture; radius?: number
}) {
  return (
    <RoundedBox args={args} radius={radius} smoothness={3} position={position} rotation={rotation} castShadow receiveShadow>
      <Plastic color={color} bump={bump} />
    </RoundedBox>
  )
}

type P = { nick: string; base: string; text: string; bump: THREE.Texture }

// ---- Uchwyt w stylu gamingowym: ścięte krawędzie, wycięcia, akcenty w kolorze napisu ----

type V2 = [number, number]

// Bryła z obrysu 2D wyciągniętego w głąb (z lekko fazowanymi krawędziami).
function Extruded({ points, depth, color, bump, position, rotation, accent, holes }: {
  points: V2[]; depth: number; color: string; bump: THREE.Texture
  position?: [number, number, number]; rotation?: [number, number, number]; accent?: boolean
  holes?: [number, number, number][] // okrągłe otwory: [x, y, promień]
}) {
  const geo = useMemo(() => {
    const sh = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)))
    for (const [hx, hy, r] of holes ?? []) { const h = new THREE.Path(); h.absarc(hx, hy, r, 0, Math.PI * 2, true); sh.holes.push(h) }
    return new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelSize: 0.018, bevelThickness: 0.018, bevelSegments: 2 })
  }, [points, depth, holes])
  return (
    <mesh geometry={geo} position={position} rotation={rotation} castShadow receiveShadow>
      {accent ? <AccentMaterial color={color} bump={bump} /> : <Plastic color={color} bump={bump} />}
    </mesh>
  )
}

// Akcent: w kolorze napisu, a przy podświetleniu świeci razem z nickiem.
function AccentMaterial({ color, bump }: Mat) {
  const glow = useContext(GlowCtx)
  const ref = useRef<THREE.MeshStandardMaterial>(null)
  useFrame(({ clock }) => {
    if (glow === 'rgb' && ref.current) ref.current.emissive.setHSL((clock.elapsedTime * 0.12 + 0.15) % 1, 1, 0.55)
  })
  if (!glow) return <Plastic color={color} bump={bump} />
  return <meshStandardMaterial ref={ref} color="#F4F1EA" emissive={glow === 'rgb' ? '#ff3ad0' : glow} emissiveIntensity={1.8} roughness={0.4} toneMapped={false} />
}

// Cienki pasek akcentu między dwoma punktami na przedniej ścianie płyty.
function Strip({ a, b, z, color, bump, w = 0.055, d = 0.05 }: { a: V2; b: V2; z: number; color: string; bump: THREE.Texture; w?: number; d?: number }) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1])
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0])
  return (
    <mesh position={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, z]} rotation={[0, 0, ang]} castShadow>
      <boxGeometry args={[len + w * 0.6, w, d]} />
      <AccentMaterial color={color} bump={bump} />
    </mesh>
  )
}

// Obrys płyty: ścięte rogi, grzbiet na górze, wcięcia po bokach. hw = połowa szerokości.
const platePoints = (hw: number): V2[] => [
  [-hw, 0], [hw, 0], [hw, 0.82], [hw - 0.14, 0.97], [hw - 0.14, 1.27], [hw, 1.42], [hw, 1.72],
  [hw - 0.28, 2.2], [0.52, 2.2], [0.36, 2.44], [-0.36, 2.44], [-0.52, 2.2], [-hw + 0.28, 2.2],
  [-hw, 1.72], [-hw, 1.42], [-hw + 0.14, 1.27], [-hw + 0.14, 0.97], [-hw, 0.82],
]
// Podstawa (widok z góry, przód u dołu): mocno ścięte przednie rogi.
const basePoints = (hw: number): V2[] => [[-hw, 0.85], [hw, 0.85], [hw, -0.3], [hw - 0.55, -0.88], [-hw + 0.55, -0.88], [-hw, -0.3]]
// Ramię na pada (widok z boku): wysunięte do przodu, z uniesionym pazurem.
const armPoints: V2[] = [[0, 0], [0.88, 0], [1.04, 0.14], [1.04, 0.5], [0.9, 0.5], [0.86, 0.22], [0, 0.2]]
// Hak na słuchawki (widok z boku): wysunięty nad pada, z pazurem w górę.
const hookPoints: V2[] = [[-0.05, 0], [0.62, 0], [0.92, 0.22], [0.92, 0.5], [0.76, 0.5], [0.72, 0.28], [0.56, 0.17], [-0.05, 0.17]]

function GamerStand({ nick, base, text, bump, hw, pads, wall }: P & { hw: number; pads: number[]; wall?: boolean }) {
  const pz = -0.7, front = pz + 0.2 + 0.03
  const lift = wall ? 0.35 : 0.22
  return (
    <group>
      {wall ? (
        <mesh position={[0, 1.7, pz - 0.08]} receiveShadow>
          <boxGeometry args={[hw * 2 + 3, 3.8, 0.1]} />
          <meshStandardMaterial color="#3B414B" roughness={0.95} />
        </mesh>
      ) : (
        <>
          <Extruded points={basePoints(hw + 0.3)} depth={0.2} color={base} bump={bump} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} />
          <Strip a={[-(hw + 0.3) + 0.6, 0.11]} b={[hw + 0.3 - 0.6, 0.11]} z={0.9} color={text} bump={bump} w={0.05} />
        </>
      )}
      <Extruded points={platePoints(hw)} depth={0.2} color={base} bump={bump} position={[0, lift, pz]} />
      {/* akcenty na górnych fazach i pod grzbietem */}
      <Strip a={[-hw + 0.14, lift + 1.72]} b={[-hw + 0.36, lift + 2.08]} z={front} color={text} bump={bump} />
      <Strip a={[hw - 0.14, lift + 1.72]} b={[hw - 0.36, lift + 2.08]} z={front} color={text} bump={bump} />
      <Strip a={[-0.42, lift + 2.08]} b={[0.42, lift + 2.08]} z={front} color={text} bump={bump} />
      {/* strzałka pod nickiem */}
      <Strip a={[-0.32, lift + 1.0]} b={[0, lift + 0.86]} z={front} color={text} bump={bump} />
      <Strip a={[0, lift + 0.86]} b={[0.32, lift + 1.0]} z={front} color={text} bump={bump} />
      {wall && [-hw + 0.3, hw - 0.3].map(x => (
        <mesh key={x} position={[x, lift + 1.92, front - 0.02]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.02, 20]} />
          <meshStandardMaterial color="#B9BEC6" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
      {/* hak na słuchawki */}
      <Extruded points={hookPoints} depth={1.1} color={base} bump={bump} rotation={[0, -Math.PI / 2, 0]} position={[0.55, lift + 2.02, pz + 0.2]} />
      <Strip a={[-0.48, lift + 2.02 + 0.36]} b={[0.48, lift + 2.02 + 0.36]} z={pz + 0.2 + 0.94} color={text} bump={bump} w={0.05} />
      {/* ramiona na pady */}
      {pads.map(x => (
        <group key={x}>
          {[-0.62, 0.62].map(dx => (
            <group key={dx}>
              <Extruded points={armPoints} depth={0.2} color={base} bump={bump} rotation={[0, -Math.PI / 2, 0]} position={[x + dx + 0.1, lift + (wall ? 0.42 : 0.02), pz + 0.2]} />
              <Strip a={[x + dx, lift + (wall ? 0.42 : 0.02) + 0.2]} b={[x + dx, lift + (wall ? 0.42 : 0.02) + 0.44]} z={pz + 0.2 + 1.06} color={text} bump={bump} w={0.05} />
            </group>
          ))}
        </group>
      ))}
      <Nick text={nick} color={text} bump={bump} width={hw * 2 - 0.7} maxH={0.48} position={[0, lift + 1.45, front - 0.03]} />
    </group>
  )
}

function Stand({ nick, base, text, bump, variant }: P & { variant?: string | null }) {
  if (variant === 'podwojny') return <group scale={0.7}><GamerStand nick={nick} base={base} text={text} bump={bump} hw={2.0} pads={[-1.0, 1.0]} /></group>
  if (variant === 'scienny') return <group scale={0.74}><GamerStand nick={nick} base={base} text={text} bump={bump} hw={1.3} pads={[0]} wall /></group>
  return <group scale={0.84}><GamerStand nick={nick} base={base} text={text} bump={bump} hw={1.3} pads={[0]} /></group>
}

// ---- Pozostałe produkty w tym samym stylu ----

// Prostokąt ze ściętymi rogami i wcięciami po bokach. hw/hh = połowa szerokości/wysokości.
const chamferRect = (hw: number, hh: number, c = 0.24, notch = true): V2[] => [
  [-hw + c, -hh], [hw - c, -hh], [hw, -hh + c],
  ...(notch ? [[hw, -0.08], [hw - 0.1, 0], [hw, 0.08]] as V2[] : []),
  [hw, hh - c], [hw - c, hh], [-hw + c, hh], [-hw, hh - c],
  ...(notch ? [[-hw, 0.08], [-hw + 0.1, 0], [-hw, -0.08]] as V2[] : []),
  [-hw, -hh + c],
]
// Ten sam obrys pomniejszony o `d` (do ramki w środku).
const inset = (hw: number, hh: number, d: number, c = 0.24): V2[] => chamferRect(hw - d, hh - d, Math.max(0.05, c - d * 0.6), false)

function Outline({ pts, z, color, bump, w, d }: { pts: V2[]; z: number; color: string; bump: THREE.Texture; w?: number; d?: number }) {
  return <>{pts.map((p, i) => <Strip key={i} a={p} b={pts[(i + 1) % pts.length]} z={z} color={color} bump={bump} w={w} d={d} />)}</>
}

// Akcenty na czterech ściętych rogach.
function CornerAccents({ hw, hh, z, color, bump, c = 0.24, d = 0.1 }: { hw: number; hh: number; z: number; color: string; bump: THREE.Texture; c?: number; d?: number }) {
  const k = c - d * 0.4
  return (
    <>
      <Strip a={[-hw + d, hh - k]} b={[-hw + k, hh - d]} z={z} color={color} bump={bump} w={0.05} />
      <Strip a={[hw - d, hh - k]} b={[hw - k, hh - d]} z={z} color={color} bump={bump} w={0.05} />
      <Strip a={[-hw + d, -hh + k]} b={[-hw + k, -hh + d]} z={z} color={color} bump={bump} w={0.05} />
      <Strip a={[hw - d, -hh + k]} b={[hw - k, -hh + d]} z={z} color={color} bump={bump} w={0.05} />
    </>
  )
}

const PIXELS: V2[] = (() => {
  const out: V2[] = []
  for (let x = -1.4; x <= 1.41; x += 0.2) { out.push([x, 0.44], [x, -0.44]) }
  return out
})()

function Plate({ nick, base, text, bump, variant }: P & { variant?: string | null }) {
  const hw = 1.8, hh = 0.58, z = 0.15
  return (
    <group>
      <Extruded points={basePoints(1.75).map(([x, y]) => [x, y * 0.55] as V2)} depth={0.14} color={base} bump={bump} rotation={[-Math.PI / 2, 0, 0]} />
      <Strip a={[-1.0, 0.07]} b={[1.0, 0.07]} z={0.5} color={text} bump={bump} w={0.045} />
      <group position={[0, 0.72, -0.1]} rotation={[-0.2, 0, 0]}>
        <Extruded points={chamferRect(hw, hh)} depth={0.22} color={base} bump={bump} position={[0, 0, -0.1]} />
        {(!variant || variant === 'prosta') && <CornerAccents hw={hw} hh={hh} z={z} color={text} bump={bump} />}
        {variant === 'ramka' && <Outline pts={inset(hw, hh, 0.1)} z={z} color={text} bump={bump} w={0.05} />}
        {variant === 'pikselowa' && PIXELS.map(([x, y], i) => (
          <mesh key={i} position={[x, y, z]} castShadow>
            <boxGeometry args={[0.12, 0.12, 0.07]} />
            <AccentMaterial color={text} bump={bump} />
          </mesh>
        ))}
        <Nick text={nick} color={text} bump={bump} width={variant === 'ramka' || variant === 'pikselowa' ? 2.7 : 3.0} maxH={0.5} position={[0, 0, 0.13]} />
      </group>
    </group>
  )
}

// Profil głowicy stojaka na słuchawki (widok z przodu): szeroki pałąk ze ściętymi końcami.
const saddlePoints: V2[] = [[-0.85, 0], [0.85, 0], [0.85, 0.12], [0.72, 0.3], [0.6, 0.3], [0.6, 0.22], [-0.6, 0.22], [-0.6, 0.3], [-0.72, 0.3], [-0.85, 0.12]]

function HeadphoneStand({ nick, base, text, bump }: P) {
  return (
    <group scale={0.82}>
      <Extruded points={basePoints(1.3).map(([x, y]) => [x, y * 0.9] as V2)} depth={0.42} color={base} bump={bump} rotation={[-Math.PI / 2, 0, 0]} />
      <Strip a={[-0.55, 0.06]} b={[0.55, 0.06]} z={0.82} color={text} bump={bump} w={0.04} />
      <mesh position={[0, 1.8, -0.15]} rotation={[0, Math.PI / 6, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.24, 2.8, 6]} />
        <Plastic color={base} bump={bump} />
      </mesh>
      <Strip a={[0, 0.7]} b={[0, 2.9]} z={0.07} color={text} bump={bump} w={0.05} />
      <Extruded points={saddlePoints} depth={0.62} color={base} bump={bump} position={[0, 3.18, -0.46]} />
      <Strip a={[-0.6, 3.32]} b={[0.6, 3.32]} z={0.18} color={text} bump={bump} w={0.04} />
      <Nick text={nick} color={text} bump={bump} width={1.7} maxH={0.26} position={[0, 0.23, 0.785]} />
    </group>
  )
}

function PhoneStand({ nick, base, text, bump }: P) {
  return (
    <group>
      <Extruded points={basePoints(1.1).map(([x, y]) => [x, y * 1.05] as V2)} depth={0.16} color={base} bump={bump} rotation={[-Math.PI / 2, 0, 0]} />
      <group position={[0, 0.2, -0.55]} rotation={[-0.32, 0, 0]}>
        <Extruded points={[[-1.0, 0], [1.0, 0], [1.0, 1.95], [0.7, 2.25], [-0.7, 2.25], [-1.0, 1.95]]} depth={0.18} color={base} bump={bump} position={[0, 0, -0.09]} />
        <Strip a={[-0.6, 2.12]} b={[0.6, 2.12]} z={0.11} color={text} bump={bump} w={0.045} />
      </group>
      <Extruded points={[[-1.0, 0], [1.0, 0], [1.0, 0.36], [0.88, 0.48], [-0.88, 0.48], [-1.0, 0.36]]} depth={0.16} color={base} bump={bump} position={[0, 0.12, 0.5]} />
      <Strip a={[-0.82, 0.62]} b={[0.82, 0.62]} z={0.68} color={text} bump={bump} w={0.04} />
      <Nick text={nick} color={text} bump={bump} width={1.7} maxH={0.24} position={[0, 0.36, 0.69]} />
    </group>
  )
}

// Sześciokątne podkładki, stojące lekko odchylone, z akcentem wzdłuż krawędzi.
const hexPts = (r: number): V2[] => Array.from({ length: 6 }, (_, i) => [r * Math.cos(Math.PI / 6 + i * Math.PI / 3), r * Math.sin(Math.PI / 6 + i * Math.PI / 3)] as V2)

function Coasters({ nick, base, text, bump }: P) {
  return (
    <group>
      {[-1.2, 1.2].map(x => (
        <group key={x} position={[x, 1.02, 0.2]} rotation={[-0.28, 0, 0]}>
          <Extruded points={hexPts(1.08)} depth={0.14} color={base} bump={bump} position={[0, 0, -0.07]} />
          <Outline pts={hexPts(0.94)} z={0.088} color={text} bump={bump} w={0.045} d={0.004} />
          <Nick text={nick} color={text} bump={bump} width={1.4} maxH={0.32} position={[0, 0, 0.086]} flat />
        </group>
      ))}
    </group>
  )
}

// Zawieszka breloka: ścięty korpus + zwężający się uchwyt z otworem, przez który przechodzi metalowe kółko.
const TAG_BODY = chamferRect(1.15, 0.42, 0.18, false)
const TAG_POINTS: V2[] = [
  ...TAG_BODY.slice(0, 7),
  [-1.15, 0.26], [-1.42, 0.22], [-1.62, 0.1], [-1.62, -0.1], [-1.42, -0.22], [-1.15, -0.26],
  ...TAG_BODY.slice(7),
]
const TAG_HOLE: [number, number, number][] = [[-1.42, 0, 0.09]]

// Kółko breloka jako wahadło sferyczne: stały krok fizyki (240 Hz), pozycja otworu
// interpolowana między klatkami, kółko oparte drutem o dolną krawędź otworu.
// Liczymy w układzie związanym z kamerą, więc obracanie podglądu działa jak obracanie breloka w dłoni.
const RING = { radius: 0.27, wire: 0.03, hole: 0.09 }
const PHYS = { grav: 58, damp: 3.0, step: 1 / 240 }

function SwingingRing({ pivot }: { pivot: [number, number, number] }) {
  const holder = useRef<THREE.Group>(null)
  const ring = useRef<THREE.Mesh>(null)
  const { camera } = useThree()
  const t = useMemo(() => ({
    p: new THREE.Vector3(), pPrev: new THREE.Vector3(), pi: new THREE.Vector3(),
    m: new THREE.Vector3(), prev: new THREE.Vector3(), v: new THREE.Vector3(), d: new THREE.Vector3(),
    w: new THREE.Vector3(), r: new THREE.Vector3(), z: new THREE.Vector3(0, 0, 1),
    n: new THREE.Vector3(), u: new THREE.Vector3(), sc: new THREE.Vector3(), mat: new THREE.Matrix4(),
    acc: 0, init: false,
  }), [])

  useFrame((_, dtRaw) => {
    const h = holder.current, rg = ring.current
    if (!h || !rg) return
    const az = Math.atan2(camera.position.x, camera.position.z)
    const UP = THREE.Object3D.DEFAULT_UP
    h.getWorldScale(t.sc)
    // długość wahadła: od środka otworu do środka kółka (drut leży na krawędzi otworu)
    const L = (RING.radius + RING.hole - RING.wire) * t.sc.x
    h.getWorldPosition(t.p); t.p.applyAxisAngle(UP, -az)
    if (!t.init) { t.pPrev.copy(t.p); t.m.copy(t.p).add(t.d.set(0, -L, 0.0005)); t.prev.copy(t.m); t.init = true }

    t.acc = Math.min(t.acc + dtRaw, 0.1)
    const steps = Math.floor(t.acc / PHYS.step)
    const keep = Math.exp(-PHYS.damp * PHYS.step)
    for (let i = 1; i <= steps; i++) {
      t.pi.lerpVectors(t.pPrev, t.p, i / steps) // płynny ruch otworu w obrębie klatki
      t.v.subVectors(t.m, t.prev).multiplyScalar(keep)
      t.prev.copy(t.m)
      t.m.add(t.v); t.m.y -= PHYS.grav * PHYS.step * PHYS.step
      t.d.subVectors(t.m, t.pi).setLength(L); t.m.copy(t.pi).add(t.d)
    }
    t.acc -= steps * PHYS.step
    if (steps > 0) t.pPrev.copy(t.p)

    // kierunek do środka kółka w układzie breloka
    t.w.copy(t.m).applyAxisAngle(UP, az); h.worldToLocal(t.w)
    t.r.copy(t.w).normalize()
    if (t.r.x > 0.2) { // nie wchodzi w brelok: zatrzymuje się na krawędzi i odbija
      t.r.x = 0.2; t.r.normalize()
      t.w.copy(t.r).multiplyScalar(RING.radius + RING.hole - RING.wire); h.localToWorld(t.w); t.w.applyAxisAngle(UP, -az)
      t.prev.lerp(t.w, 0.7); t.m.copy(t.w)
    }
    // płaszczyzna kółka zawiera oś otworu, drut opiera się o krawędź otworu
    t.n.crossVectors(t.r, t.z)
    if (t.n.lengthSq() < 1e-6) t.n.set(0, 1, 0)
    t.n.normalize(); t.u.crossVectors(t.n, t.r).normalize()
    t.mat.makeBasis(t.r, t.u, t.n)
    rg.quaternion.setFromRotationMatrix(t.mat)
    t.d.set(t.r.x, t.r.y, 0)
    const contact = t.d.lengthSq() > 1e-6 ? t.d.normalize().multiplyScalar(RING.hole - RING.wire) : t.d.set(0, 0, 0)
    rg.position.copy(contact).addScaledVector(t.r, RING.radius)
  })

  return (
    <group ref={holder} position={pivot}>
      <mesh ref={ring} castShadow>
        <torusGeometry args={[RING.radius, RING.wire, 14, 48]} />
        <meshStandardMaterial color="#C9CDD3" metalness={0.95} roughness={0.22} />
      </mesh>
    </group>
  )
}

const DOG_HOLE: [number, number, number][] = [[-0.74, 0, 0.09]]

function Keychain({ nick, base, text, bump, position = [0, 0, 0], scale = 1, variant }: {
  nick: string; base: string; text: string; bump: THREE.Texture; position?: [number, number, number]; scale?: number; variant?: string | null
}) {
  if (variant === 'niesmiertelnik') {
    return (
      <GlowCtx.Provider value={null}>
        <group position={position} scale={scale}>
          <group position={[0, 0.62, 0]}>
            <Extruded points={chamferRect(1.0, 0.56, 0.3, false)} holes={DOG_HOLE} depth={0.1} color={base} bump={bump} position={[0, 0, -0.05]} />
            <Outline pts={inset(1.0, 0.56, 0.09, 0.3)} z={0.07} color={text} bump={bump} w={0.04} d={0.03} />
            <Outline pts={hexPts(0.16).map(([x, y]) => [x - 0.74, y] as V2)} z={0.069} color={text} bump={bump} w={0.03} d={0.004} />
            <SwingingRing pivot={[-0.74, 0, 0]} />
            <Nick text={nick} color={text} bump={bump} width={1.3} maxH={0.36} position={[0.16, 0, 0.06]} />
          </group>
        </group>
      </GlowCtx.Provider>
    )
  }
  return (
    <GlowCtx.Provider value={null}>
      <group position={position} scale={scale}>
        <group position={[0, 0.5, 0]}>
          <Extruded points={TAG_POINTS} holes={TAG_HOLE} depth={0.14} color={base} bump={bump} position={[0, 0, -0.07]} />
          <CornerAccents hw={1.15} hh={0.42} z={0.09} color={text} bump={bump} c={0.18} d={0.07} />
          {/* akcent wokół otworu */}
          <Outline pts={hexPts(0.17).map(([x, y]) => [x - 1.42, y] as V2)} z={0.089} color={text} bump={bump} w={0.035} d={0.004} />
          {/* metalowe kółko przechodzące przez otwór, kołysze się przy obrocie */}
          <SwingingRing pivot={[-1.42, 0, 0]} />
          <Nick text={nick} color={text} bump={bump} width={1.8} maxH={0.4} position={[0.05, 0, 0.08]} />
        </group>
      </group>
    </GlowCtx.Provider>
  )
}

function Organizer({ nick, base, text, bump, variant }: P & { variant?: string | null }) {
  const small = variant === 'maly'
  const hw = small ? 1.2 : 1.75
  const dividers = variant === 'pady' ? [0] : small ? [0] : [-0.56, 0.56]
  // Bok (widok z boku): tył wyższy, skośna góra opadająca do przodu.
  const side: V2[] = [[-0.75, 0], [0.75, 0], [0.75, 0.82], [0.55, 0.95], [-0.75, 1.25]]
  const front: V2[] = [[-hw, 0], [hw, 0], [hw, 0.6], [hw - 0.25, 0.85], [0.35, 0.85], [0.2, 0.72], [-0.2, 0.72], [-0.35, 0.85], [-hw + 0.25, 0.85], [-hw, 0.6]]
  return (
    <group>
      <Extruded points={chamferRect(hw, 0.75, 0.28, false)} depth={0.12} color={base} bump={bump} rotation={[-Math.PI / 2, 0, 0]} />
      {[-(hw - 0.06), hw - 0.06].map(x => (
        <Extruded key={x} points={side} depth={0.12} color={base} bump={bump} rotation={[0, -Math.PI / 2, 0]} position={[x + 0.06, 0.1, 0]} />
      ))}
      <Box args={[hw * 2 - 0.2, 1.2, 0.12]} position={[0, 0.7, -0.66]} color={base} bump={bump} radius={0.03} />
      {dividers.map(x => <Box key={x} args={[0.1, 0.9, 1.2]} position={[x, 0.55, 0]} color={base} bump={bump} radius={0.03} />)}
      <Extruded points={front} depth={0.14} color={base} bump={bump} position={[0, 0.1, 0.62]} />
      <Strip a={[-hw + 0.13, 0.72]} b={[-hw + 0.33, 0.9]} z={0.79} color={text} bump={bump} w={0.045} />
      <Strip a={[hw - 0.13, 0.72]} b={[hw - 0.33, 0.9]} z={0.79} color={text} bump={bump} w={0.045} />
      <Strip a={[-hw + 0.55, 0.18]} b={[hw - 0.55, 0.18]} z={0.79} color={text} bump={bump} w={0.04} />
      <Nick text={nick} color={text} bump={bump} width={hw * 2 - 0.7} maxH={0.4} position={[0, 0.5, 0.78]} />
    </group>
  )
}

function Model({ id, nick, base, text, bump, variant }: P & { id: ProductId; variant: string | null }) {
  if (id === 'tabliczka') return <Plate nick={nick} base={base} text={text} bump={bump} variant={variant} />
  if (id === 'sluchawki') return <HeadphoneStand nick={nick} base={base} text={text} bump={bump} />
  if (id === 'telefon') return <PhoneStand nick={nick} base={base} text={text} bump={bump} />
  if (id === 'podkladka') return <Coasters nick={nick} base={base} text={text} bump={bump} />
  if (id === 'brelok') return <Keychain nick={nick} base={base} text={text} bump={bump} position={variant === 'niesmiertelnik' ? [0.1, 0.1, 0] : [0.15, 0.2, 0]} scale={1.25} variant={variant} />
  if (id === 'organizer') return <Organizer nick={nick} base={base} text={text} bump={bump} variant={variant} />
  if (id === 'zestaw-biurko') {
    return (
      <group>
        <group position={[0, 0, -0.55]} scale={0.85}><Plate nick={nick} base={base} text={text} bump={bump} variant="prosta" /></group>
        <group position={[0, 0, 0.75]} scale={0.6}><Coasters nick={nick} base={base} text={text} bump={bump} /></group>
      </group>
    )
  }
  if (id === 'zestaw') {
    return (
      <group>
        <group position={[-0.7, 0, -0.2]}><Stand nick={nick} base={base} text={text} bump={bump} /></group>
        <group rotation={[0, -0.5, 0]} position={[1.9, 0, 0.6]}>
          <Keychain nick={nick} base={base} text={text} bump={bump} scale={0.75} />
        </group>
      </group>
    )
  }
  return <Stand nick={nick} base={base} text={text} bump={bump} variant={variant} />
}

function Sway({ on, children }: { on: boolean; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null)
  useFrame(({ clock }) => { if (ref.current) ref.current.rotation.y = on ? Math.sin(clock.elapsedTime * 0.45) * 0.42 : 0 })
  return <group ref={ref}>{children}</group>
}

function Scene({ id, nick, base, text, glow, variant, autoRotate }: { id: ProductId; nick: string; base: string; text: string; glow: string | null; variant: string | null; autoRotate: boolean }) {
  const { layerTex, peiTex } = useTextures()
  const k = glow ? 0.38 : 1 // przy świecącym napisie przygaszamy pokój
  return (
    <GlowCtx.Provider value={glow}>
      <ambientLight intensity={0.55 * k} />
      <hemisphereLight args={['#fff6e6', '#2a2f3a', 0.55 * k]} />
      <directionalLight position={[4, 7, 5]} intensity={1.6 * k} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-5, 3, -2]} intensity={0.5 * k} color="#9fb3ff" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <planeGeometry args={[30, 20]} />
        <meshStandardMaterial map={peiTex} roughness={0.85} metalness={0.15} />
      </mesh>
      <ContactShadows position={[0, 0.001, 0]} opacity={0.45} scale={9} blur={2.4} far={3} />
      <Sway on={autoRotate}><Model id={id} nick={nick} base={base} text={text} bump={layerTex} variant={variant} /></Sway>
      <OrbitControls enablePan={false} enableZoom={false} enableDamping dampingFactor={0.08}
        minPolarAngle={0.6} maxPolarAngle={1.45} minAzimuthAngle={-1.1} maxAzimuthAngle={1.1} target={[0, 1, 0]} />
    </GlowCtx.Provider>
  )
}

export default function Preview3D(props: { id: ProductId; nick: string; base: string; text: string; glow?: string | null; variant?: string | null; autoRotate?: boolean; label: string }) {
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  return (
    <div className={props.glow ? "preview3d lit" : "preview3d"} role="img" aria-label={props.label}>
      <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 2.4, 6.4], fov: 36 }}>
        <Suspense fallback={null}>
          <Scene id={props.id} nick={props.nick} base={props.base} text={props.text} glow={props.glow ?? null} variant={props.variant ?? null} autoRotate={!!props.autoRotate && !reduce} />
        </Suspense>
      </Canvas>
      <span className="preview-hint">Przeciągnij, żeby obrócić</span>
    </div>
  )
}
