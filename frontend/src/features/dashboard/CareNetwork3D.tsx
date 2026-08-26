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

function RoleNode({ angle, label }: { angle: number; label: string }) {
  const rad = (angle * Math.PI) / 180
  const position: [number, number, number] = [
    Math.cos(rad) * ORBIT_RADIUS,
    Math.sin(rad) * 0.4,
    Math.sin(rad) * ORBIT_RADIUS,
  ]
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.16, 20, 20]} />
        <meshStandardMaterial color="#2dd4bf" emissive="#2dd4bf" emissiveIntensity={0.7} toneMapped={false} />
      </mesh>
      <Html center style={{ pointerEvents: 'none' }}>
        <div className={styles.nodeLabel}>{label}</div>
      </Html>
    </group>
  )
}

function CenterCase() {
  return (
    <group>
      <mesh>
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
      const rad = (angle * Math.PI) / 180
      positions.push(0, 0, 0, Math.cos(rad) * ORBIT_RADIUS, Math.sin(rad) * 0.4, Math.sin(rad) * ORBIT_RADIUS)
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

function SpinningGroup() {
  const ref = useRef<THREE.Group>(null)
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.12
  })
  return (
    <group ref={ref}>
      <Edges />
      <CenterCase />
      {ROLE_NODES.map((n) => (
        <RoleNode key={n.label} {...n} />
      ))}
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
