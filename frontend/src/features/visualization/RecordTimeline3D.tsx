/**
 * DESIGN BOUNDARY: illustrative timeline accent only. Always paired with
 * the real, flat, fully-readable entry list right below it -- never the
 * sole way to see this data, and it carries no information the list
 * doesn't already show.
 */
import { Suspense, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import styles from './RecordTimeline3D.module.css'

export interface TimelineEntry {
  id: string
  date: string
  label: string
}

const MAX_NODES = 10

function useHelixPositions(count: number) {
  return useMemo(() => {
    const positions: THREE.Vector3[] = []
    for (let i = 0; i < count; i++) {
      const t = count <= 1 ? 0 : i / (count - 1)
      const angle = t * Math.PI * 2.6
      const radius = 1.1
      positions.push(new THREE.Vector3(Math.cos(angle) * radius, t * 1.7 - 0.85, Math.sin(angle) * radius))
    }
    return positions
  }, [count])
}

function TimelineNode({
  position,
  label,
  isLatest,
}: {
  position: THREE.Vector3
  label: string
  isLatest: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const mesh = meshRef.current
    if (!mesh) return
    const pulse = isLatest ? 1 + Math.sin(clock.elapsedTime * 3) * 0.2 : 1
    mesh.scale.setScalar((isLatest ? 0.09 : 0.055) * pulse)
  })

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial
          color={isLatest ? '#e8fffb' : '#2dd4bf'}
          emissive={isLatest ? '#5eead4' : '#2dd4bf'}
          emissiveIntensity={isLatest ? 2 : 0.8}
          toneMapped={false}
        />
      </mesh>
      {isLatest && (
        <Html center style={{ pointerEvents: 'none' }}>
          <div className={styles.label}>{label}</div>
        </Html>
      )}
    </group>
  )
}

function Path({ points }: { points: THREE.Vector3[] }) {
  // <line> as JSX collides with SVG's <line> type in @react-three/fiber's TS
  // setup, so the line object is constructed imperatively instead.
  const lineObject = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineBasicMaterial({ color: '#2dd4bf', transparent: true, opacity: 0.4 })
    return new THREE.Line(geometry, material)
  }, [points])
  return <primitive object={lineObject} />
}

function Scene({ entries, mouse }: { entries: TimelineEntry[]; mouse: { x: number; y: number } }) {
  const groupRef = useRef<THREE.Group>(null)
  const positions = useHelixPositions(entries.length)

  useFrame((_, delta) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y += delta * 0.14
    groupRef.current.rotation.x += (mouse.y * 0.12 - groupRef.current.rotation.x) * 0.03
  })

  return (
    <group ref={groupRef}>
      <Path points={positions} />
      {entries.map((e, i) => (
        <TimelineNode key={e.id} position={positions[i]} label={e.label} isLatest={i === entries.length - 1} />
      ))}
    </group>
  )
}

export function RecordTimeline3D({ entries }: { entries: TimelineEntry[] }) {
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const trimmed = useMemo(() => [...entries].sort((a, b) => a.date.localeCompare(b.date)).slice(-MAX_NODES), [entries])

  if (trimmed.length === 0) return null

  return (
    <div
      className={styles.canvasBox}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        setMouse({
          x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
          y: ((e.clientY - rect.top) / rect.height) * 2 - 1,
        })
      }}
    >
      <Suspense fallback={<div className={styles.fallback} />}>
        <Canvas camera={{ fov: 42, position: [0, 0.4, 3.4] }} gl={{ antialias: true, powerPreference: 'low-power' }}>
          <color attach="background" args={['#0a262b']} />
          <ambientLight intensity={0.8} />
          <pointLight position={[2, 2, 3]} intensity={25} color="#2dd4bf" />
          <Scene entries={trimmed} mouse={mouse} />
        </Canvas>
      </Suspense>
    </div>
  )
}
