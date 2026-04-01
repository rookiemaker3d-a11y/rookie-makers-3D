import { useEffect } from 'react'

/** Sitio que hiciste en Replit: carpeta Content-Hub/artifacts/rookie-makers-3d (build → /content-hub/). */
export default function ContentHubFullReload() {
  useEffect(() => {
    const { origin, search, hash } = window.location
    window.location.replace(`${origin}/content-hub/index.html${search}${hash}`)
  }, [])
  return (
    <p className="min-h-[40vh] flex items-center justify-center bg-[#0a0a0f] text-cyan-200/90 text-sm px-4 text-center font-mono">
      Cargando tu sitio (Content-Hub)…
    </p>
  )
}
