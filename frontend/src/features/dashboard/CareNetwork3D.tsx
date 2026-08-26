/**
 * DESIGN BOUNDARY: same rule as Hero3D — this panel is illustrative only.
 * Node positions are NOT bound to live clinical data; do not wire real
 * counts/values into this scene. If a stat needs to be shown, it belongs in
 * a flat StatCard, not here.
 */
import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import styles from './CareNetwork3D.module.css'

const ROLE_NODES = [
  { label: 'Oncologist', angle: 0 },
  { label: 'Surgeon', angle: 72 },
  { label: 'Radiologist', angle: 144 },
  { label: 'Pathologist', angle: 216 },
  { label: 'Coordinator', angle: 288 },
]
const ORBIT_RADIUS = 2.4
const TRAVEL_SECONDS = 0.9
const DWELL_SECONDS = 0.6

interface OrchestrationState {
  phase: 'traveling' | 'dwelling'
  targetIndex: number
  progress: number
}

function roleWorldPosition(angle: number): THREE.Vector3 {
  const rad = (angle * Math.PI) / 180
  return new THREE.Vector3(Math.cos(rad) * ORBIT_RADIUS, Math.sin(rad) * 0.4, Math.sin(rad) * ORBIT_RADIUS)
}

function RoleNode({
  angle,
  label,
  index,
  state,
}: {
  angle: number
  label: string
  index: number
  state: React.MutableRefObject<OrchestrationState>
}) {
  const position = roleWorldPosition(angle)
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const mesh = meshRef.current
    if (!mesh) return
    const breathing = 1 + Math.sin(clock.elapsedTime * 1.6 + index) * 0.06
    const isActive = state.current.phase === 'dwelling' && state.current.targetIndex === index
    mesh.scale.setScalar(0.16 * breathing * (isActive ? 1.35 : 1))
    const material = mesh.material as THREE.MeshStandardMaterial
    material.emissiveIntensity = isActive ? 1.6 : 0.7
  })

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 20, 20]} />
        <meshStandardMaterial color="#2dd4bf" emissive="#2dd4bf" emissiveIntensity={0.7} toneMapped={false} />
      </mesh>
      <Html center style={{ pointerEvents: 'none' }}>
        <div className={styles.nodeLabel}>{label}</div>
      </Html>
    </group>
  )
}

function CenterCase() {
  const meshRef = useRef<THREE.Mesh>(null)
  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.4
  })
  return (
    <group>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[0.34, 1]} />
        <meshStandardMaterial color="#0d323a" emissive="#16b8a6" emissiveIntensity={0.35} />
      </mesh>
      <Html center style={{ pointerEvents: 'none' }}>
        <div className={styles.centerLabel}>Case</div>
      </Html>
    </group>
  )
}

function Edges() {
  const geometry = useMemo(() => {
    const positions: number[] = []
    ROLE_NODES.forEach(({ angle }) => {
      const p = roleWorldPosition(angle)
      positions.push(0, 0, 0, p.x, p.y, p.z)
    })
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3))
    return geo
  }, [])
  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#2dd4bf" transparent opacity={0.35} />
    </lineSegments>
  )
}

// Echoes the AI orchestrator handing a case between roles in sequence —
// abstract motion only, not driven by any real orchestration run.
function OrchestrationPulse({ state }: { state: React.MutableRefObject<OrchestrationState> }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const origin = useMemo(() => new THREE.Vector3(0, 0, 0), [])

  useFrame((_, delta) => {
    const mesh = meshRef.current
    if (!mesh) return
    const s = state.current
    const target = roleWorldPosition(ROLE_NODES[s.targetIndex].angle)

    if (s.phase === 'traveling') {
      s.progress += delta / TRAVEL_SECONDS
      if (s.progress >= 1) {
        s.progress = 0
        s.phase = 'dwelling'
      }
      mesh.position.lerpVectors(origin, target, Math.min(s.progress, 1))
    } else {
      mesh.position.copy(target)
      s.progress += delta / DWELL_SECONDS
      if (s.progress >= 1) {
        s.progress = 0
        s.phase = 'traveling'
        s.targetIndex = (s.targetIndex + 1) % ROLE_NODES.length
      }
    }
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.08, 12, 12]} />
      <meshStandardMaterial color="#e8fffb" emissive="#5eead4" emissiveIntensity={2.6} toneMapped={false} />
    </mesh>
  )
}

function SpinningGroup() {
  const ref = useRef<THREE.Group>(null)
  const orchestrationState = useRef<OrchestrationState>({ phase: 'traveling', targetIndex: 0, progress: 0 })

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.12
  })

  return (
    <group ref={ref}>
      <Edges />
      <CenterCase />
      {ROLE_NODES.map((n, i) => (
        <RoleNode key={n.label} {...n} index={i} state={orchestrationState} />
      ))}
      <OrchestrationPulse state={orchestrationState} />
    </group>
  )
}

export function CareNetwork3D() {
  return (
    <div className={styles.panel}>
      <Suspense fallback={<div className={styles.fallback} />}>
        <Canvas camera={{ fov: 42, position: [0, 1.4, 5.4] }} gl={{ antialias: true, powerPreference: 'low-power' }}>
          <color attach="background" args={['#0a262b']} />
          <ambientLight intensity={0.7} />
          <pointLight position={[3, 3, 3]} intensity={30} color="#2dd4bf" />
          <SpinningGroup />
          <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} />
        </Canvas>
      </Suspense>
    </div>
  )
}
