/**
 * DESIGN BOUNDARY: 3D/WebGL is an atmospheric accent only, scoped to this
 * hero and the dashboard's CareNetwork3D panel. It never encodes or carries
 * clinical data — no 3D tables, no 3D charts. If you're tempted to add 3D
 * anywhere else in this app, read the plan's "Design reconciliation" note
 * first.
 */
import { Suspense, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import styles from './Hero3D.module.css'

const NODE_COUNT = 48
const RADIUS = 4.2
const CONNECT_DISTANCE = 1.9
const PULSE_COUNT = 5
const PULSE_SPEED = 0.55

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function useNetworkGeometry() {
  return useMemo(() => {
    const points: THREE.Vector3[] = []
    for (let i = 0; i < NODE_COUNT; i++) {
      // Fibonacci sphere distribution for even, organic spacing.
      const y = 1 - (i / (NODE_COUNT - 1)) * 2
      const radiusAtY = Math.sqrt(1 - y * y)
      const theta = ((1 + Math.sqrt(5)) * Math.PI) * i
      const jitter = 0.85 + Math.random() * 0.3
      points.push(
        new THREE.Vector3(
          Math.cos(theta) * radiusAtY * RADIUS * jitter,
          y * RADIUS * jitter,
          Math.sin(theta) * radiusAtY * RADIUS * jitter,
        ),
      )
    }

    const edges: [THREE.Vector3, THREE.Vector3][] = []
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        if (points[i].distanceTo(points[j]) < CONNECT_DISTANCE) {
          edges.push([points[i], points[j]])
        }
      }
    }
    return { points, edges }
  }, [])
}

function NetworkNodes({ points }: { points: THREE.Vector3[] }) {
  return (
    <instancedMesh
      ref={(mesh) => {
        if (mesh) {
          const dummy = new THREE.Object3D()
          points.forEach((p, i) => {
            dummy.position.copy(p)
            dummy.scale.setScalar(0.05 + Math.random() * 0.04)
            dummy.updateMatrix()
            mesh.setMatrixAt(i, dummy.matrix)
          })
          mesh.instanceMatrix.needsUpdate = true
        }
      }}
      args={[undefined, undefined, points.length]}
    >
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color="#2dd4bf"
        emissive="#2dd4bf"
        emissiveIntensity={1.1}
        toneMapped={false}
      />
    </instancedMesh>
  )
}

function NetworkEdges({ edges }: { edges: [THREE.Vector3, THREE.Vector3][] }) {
  const geometry = useMemo(() => {
    const positions = new Float32Array(edges.length * 6)
    edges.forEach(([a, b], i) => {
      positions.set([a.x, a.y, a.z, b.x, b.y, b.z], i * 6)
    })
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geo
  }, [edges])

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#2dd4bf" transparent opacity={0.22} />
    </lineSegments>
  )
}

// Small bright sparks that travel along random edges — a visual echo of the
// AI orchestrator handing a case between steps/specialists, kept abstract
// rather than tied to any real data (per the design boundary above).
function OrchestrationPulses({ edges }: { edges: [THREE.Vector3, THREE.Vector3][] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const state = useMemo(
    () =>
      Array.from({ length: PULSE_COUNT }, () => ({
        edge: edges[Math.floor(Math.random() * edges.length)],
        progress: Math.random(),
      })),
    [edges],
  )

  useFrame((_, delta) => {
    const mesh = meshRef.current
    if (!mesh) return
    const dummy = new THREE.Object3D()
    state.forEach((s, i) => {
      s.progress += delta * PULSE_SPEED
      if (s.progress >= 1) {
        s.progress = 0
        s.edge = edges[Math.floor(Math.random() * edges.length)]
      }
      const [a, b] = s.edge
      dummy.position.lerpVectors(a, b, s.progress)
      const flicker = 0.045 + Math.sin(s.progress * Math.PI) * 0.035
      dummy.scale.setScalar(flicker)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PULSE_COUNT]}>
      <sphereGeometry args={[1, 10, 10]} />
      <meshStandardMaterial color="#e8fffb" emissive="#5eead4" emissiveIntensity={2.4} toneMapped={false} />
    </instancedMesh>
  )
}

function RotatingGroup({ mouse }: { mouse: { x: number; y: number } }) {
  const groupRef = useRef<THREE.Group>(null)
  const elapsed = useRef(0)
  const { points, edges } = useNetworkGeometry()

  useFrame((_, delta) => {
    if (!groupRef.current) return
    elapsed.current += delta
    groupRef.current.rotation.y += delta * 0.08
    groupRef.current.rotation.x += (mouse.y * 0.15 - groupRef.current.rotation.x) * 0.03
    groupRef.current.rotation.z += (mouse.x * 0.08 - groupRef.current.rotation.z) * 0.03
    // Entrance: ease the whole network in from a soft bloom rather than a hard cut.
    const scale = 0.55 + easeOutCubic(Math.min(elapsed.current / 1.4, 1)) * 0.45
    groupRef.current.scale.setScalar(scale)
  })

  return (
    <group ref={groupRef}>
      <NetworkNodes points={points} />
      <NetworkEdges edges={edges} />
      <OrchestrationPulses edges={edges} />
    </group>
  )
}

function Scene() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 })

  return (
    <div
      className={styles.canvasWrap}
      onMouseMove={(e) => {
        const x = (e.clientX / window.innerWidth) * 2 - 1
        const y = (e.clientY / window.innerHeight) * 2 - 1
        setMouse({ x, y })
      }}
    >
      <Canvas
        dpr={[1, 2]}
        camera={{ fov: 45, position: [0, 0, 9] }}
        gl={{ antialias: true, powerPreference: 'low-power' }}
      >
        <color attach="background" args={['#071b1f']} />
        <fog attach="fog" args={['#071b1f', 6, 13]} />
        <ambientLight intensity={0.6} />
        <pointLight position={[5, 5, 5]} intensity={40} color="#2dd4bf" />
        <pointLight position={[-6, -3, -4]} intensity={14} color="#5eead4" />
        <RotatingGroup mouse={mouse} />
      </Canvas>
    </div>
  )
}

export function Hero3D() {
  return (
    <div className={styles.fallback}>
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </div>
  )
}
