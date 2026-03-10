import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'

export default function Viewer3D({ stlBlob, onClose }) {
  const containerRef = useRef(null)
  const sceneRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current || !stlBlob) return

    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1e293b)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000)
    camera.position.set(80, 80, 80)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    containerRef.current.appendChild(renderer.domElement)

    const light1 = new THREE.DirectionalLight(0xffffff, 0.8)
    light1.position.set(50, 50, 50)
    scene.add(light1)
    const light2 = new THREE.DirectionalLight(0xffffff, 0.4)
    light2.position.set(-50, -50, 30)
    scene.add(light2)
    scene.add(new THREE.AmbientLight(0xffffff, 0.4))

    const loader = new STLLoader()
    const url = URL.createObjectURL(stlBlob)
    loader.load(
      url,
      (geometry) => {
        geometry.center()
        const mat = new THREE.MeshPhongMaterial({
          color: 0x06b6d4,
          shininess: 60,
          specular: 0x444444,
        })
        const mesh = new THREE.Mesh(geometry, mat)
        scene.add(mesh)
        URL.revokeObjectURL(url)
      },
      undefined,
      () => URL.revokeObjectURL(url)
    )

    let frame
    function animate() {
      frame = requestAnimationFrame(animate)
      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      if (!containerRef.current) return
      const w = containerRef.current.clientWidth
      const h = containerRef.current.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(frame)
      renderer.dispose()
      if (containerRef.current?.contains(renderer.domElement)) containerRef.current.removeChild(renderer.domElement)
    }
  }, [stlBlob])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-slate-800 rounded-2xl border border-slate-600 overflow-hidden shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-600">
          <span className="font-semibold text-white">Vista previa 3D</span>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded">✕</button>
        </div>
        <div ref={containerRef} className="w-full flex-1 min-h-[400px]" />
      </div>
    </div>
  )
}
