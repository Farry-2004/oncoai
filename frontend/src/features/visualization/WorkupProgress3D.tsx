/**
 * DESIGN BOUNDARY: illustrative accent above the real workup table below it.
 * Node colors echo status but this is never the sole way to read the data --
 * the table remains authoritative.
 */
import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import type { WorkupItem, WorkupStatus } from '@/types/api'
import styles from './WorkupProgress3D.module.css'

const STATUS_COLOR: Record<WorkupStatus, string> = {
  completed: '#2dd4bf',
  in_progress: '#eda100',
  ordered: '#5b6b68',
  cancelled: '#c0362c',
}
const TYPE_CODE: Record<string, string> = {
  imaging: 'IMG',
  pathology: 'PATH',
  labs: 'LAB',
  genomics: 'GEN',
  other: 'OTH',
}
const RADIUS = 1.3
const MAX_ITEMS = 10

function ItemNode({ item, angle }: { item: WorkupItem; angle: number }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const rad = (angle * Math.PI) / 180
  const position: [number, number, number] = [Math.cos(rad) * RADIUS, Math.sin(rad) * 0.3, Math.sin(rad) * RADIUS]
  const color = STATUS_COLOR[item.status]

  useFrame(({ clock }) => {
    const mesh = meshRef.current
    if (!mesh) return
    const pulse = item.status === 'in_progress' ? 1 + Math.sin(clock.elapsedTime * 2.4) * 0.15 : 1
    mesh.scale.setScalar(0.13 * pulse)
  })

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 18, 18]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={item.status === 'completed' ? 1.4 : 0.6}
          toneMapped={false}
        />
      </mesh>
      <Html center style={{ pointerEvents: 'none' }}>
        <div className={styles.tag}>{TYPE_CODE[item.item_type] ?? item.item_type}</div>
      </Html>
    </group>
  )
}

function CenterHub({ pct }: { pct: number }) {
  return (
    <group>
      <mesh>
        <icosahedronGeometry args={[0.32, 1]} />
        <meshStandardMaterial color="#0d323a" emissive="#16b8a6" emissiveIntensity={0.35} />
      </mesh>
      <Html center style={{ pointerEvents: 'none' }}>
        <div className={styles.hubLabel}>{pct}%</div>
      </Html>
    </group>
  )
}

function Spin({ items, pct }: { items: WorkupItem[]; pct: number }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.1
  })
  const step = 360 / Math.max(items.length, 1)
  return (
    <group ref={ref}>
      <CenterHub pct={pct} />
      {items.map((item, i) => (
        <ItemNode key={item.id} item={item} angle={i * step} />
      ))}
    </group>
  )
}

export function WorkupProgress3D({ items }: { items: WorkupItem[] }) {
  const trimmed = useMemo(() => items.slice(0, MAX_ITEMS), [items])
  const pct = items.length
    ? Math.round((items.filter((i) => i.status === 'completed').length / items.length) * 100)
    : 0

  if (!trimmed.length) return null

  return (
    <div className={styles.canvasBox}>
      <Suspense fallback={<div className={styles.fallback} />}>
        <Canvas camera={{ fov: 42, position: [0, 1.2, 4.6] }} gl={{ antialias: true, powerPreference: 'low-power' }}>
          <color attach="background" args={['#0a262b']} />
          <ambientLight intensity={0.8} />
          <pointLight position={[3, 3, 3]} intensity={28} color="#2dd4bf" />
          <Spin items={trimmed} pct={pct} />
        </Canvas>
      </Suspense>
    </div>
  )
}
