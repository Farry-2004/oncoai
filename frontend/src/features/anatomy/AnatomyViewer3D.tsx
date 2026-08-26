/**
 * DESIGN BOUNDARY: illustrative only, same rule as Hero3D/CareNetwork3D.
 * This is a generic head & neck schematic, NOT this patient's actual
 * imaging — OncoAI has no DICOM/scan data, only text findings. It exists
 * purely to give clinicians a quick visual orientation to the recorded
 * cancer_site during case review. Never wire real imaging/measurement
 * data into this scene.
 */
import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import styles from './AnatomyViewer3D.module.css'

interface SiteMarker {
  key: string
  label: string
  position: [number, number, number]
}

// Approximate, schematic positions only -- not anatomically precise.
const SITE_MARKERS: SiteMarker[] = [
  { key: 'nasopharynx', label: 'Nasopharynx', position: [0, 1.18, 0.5] },
  { key: 'oral cavity', label: 'Oral Cavity', position: [0, 0.95, 0.85] },
  { key: 'oropharynx', label: 'Oropharynx', position: [0, 0.82, 0.55] },
  { key: 'hypopharynx', label: 'Hypopharynx', position: [0, 0.58, 0.38] },
  { key: 'larynx', label: 'Larynx', position: [0, 0.45, 0.4] },
  { key: 'thyroid', label: 'Thyroid', position: [0, 0.22, 0.38] },
  { key: 'salivary gland', label: 'Salivary Gland', position: [0.58, 1.0, 0.15] },
]

function matchSite(cancerSite: string): SiteMarker | undefined {
  const normalized = cancerSite.trim().toLowerCase()
  return SITE_MARKERS.find((m) => normalized.includes(m.key) || m.key.includes(normalized))
}

const MESH_MATERIAL_PROPS = {
  color: '#1a5563',
  emissive: '#2dd4bf',
  emissiveIntensity: 0.5,
  wireframe: true,
  transparent: true,
  opacity: 0.65,
  side: THREE.DoubleSide,
} as const

function HeadNeckMesh() {
  return (
    <group>
      <mesh position={[0, 1.2, 0]}>
        <sphereGeometry args={[0.62, 22, 22]} />
        <meshStandardMaterial {...MESH_MATERIAL_PROPS} />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.34, 0.4, 0.9, 18, 1, true]} />
        <meshStandardMaterial {...MESH_MATERIAL_PROPS} />
      </mesh>
      <mesh position={[0, -0.18, 0]}>
        <cylinderGeometry args={[0.9, 0.95, 0.3, 22, 1, true]} />
        <meshStandardMaterial {...MESH_MATERIAL_PROPS} />
      </mesh>
    </group>
  )
}

function SiteMarkerDot({ marker, active }: { marker: SiteMarker; active: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const mesh = meshRef.current
    if (!mesh) return
    const pulse = active ? 1 + Math.sin(clock.elapsedTime * 3) * 0.25 : 1
    mesh.scale.setScalar((active ? 0.075 : 0.035) * pulse)
    const material = mesh.material as THREE.MeshStandardMaterial
    material.emissiveIntensity = active ? 2.2 : 0.6
  })

  return (
    <group position={marker.position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial
          color={active ? '#e8fffb' : '#2dd4bf'}
          emissive={active ? '#5eead4' : '#2dd4bf'}
          emissiveIntensity={active ? 2.2 : 0.6}
          toneMapped={false}
        />
      </mesh>
      {active && (
        <Html center style={{ pointerEvents: 'none' }}>
          <div className={styles.activeLabel}>{marker.label}</div>
        </Html>
      )}
    </group>
  )
}

function Scene({ activeKey }: { activeKey: string | undefined }) {
  const groupRef = useRef<THREE.Group>(null)
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.1
  })
  return (
    <group ref={groupRef}>
      <HeadNeckMesh />
      {SITE_MARKERS.map((m) => (
        <SiteMarkerDot key={m.key} marker={m} active={m.key === activeKey} />
      ))}
    </group>
  )
}

export function AnatomyViewer3D({ cancerSite }: { cancerSite: string }) {
  const matched = useMemo(() => matchSite(cancerSite), [cancerSite])

  return (
    <div className="panel">
      <div className="panel-head">
        <div className="title">Head &amp; Neck Reference</div>
      </div>
      <div className={styles.canvasBox}>
        <Suspense fallback={<div className={styles.fallback} />}>
          <Canvas camera={{ fov: 40, position: [0, 0.9, 3.2] }} gl={{ antialias: true, powerPreference: 'low-power' }}>
            <color attach="background" args={['#0a262b']} />
            <ambientLight intensity={0.8} />
            <pointLight position={[2, 2, 3]} intensity={25} color="#2dd4bf" />
            <Scene activeKey={matched?.key} />
            <OrbitControls enableZoom={false} enablePan={false} />
          </Canvas>
        </Suspense>
      </div>
      <div className={styles.caption}>
        Schematic reference only — not derived from this patient's imaging.
        {!matched && ' Recorded cancer site has no mapped marker.'}
      </div>
    </div>
  )
}
