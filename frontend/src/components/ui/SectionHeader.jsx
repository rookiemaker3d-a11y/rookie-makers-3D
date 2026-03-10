import { motion } from 'framer-motion'

/**
 * Header de sección con gradiente según tema
 */
export default function SectionHeader({ title, subtitle, action, className = '' }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`section-header rounded-t-xl border-b px-5 py-4 bg-gradient-to-b from-[var(--theme-section-from)] via-[var(--theme-section-via)] to-[var(--theme-section-to)] transition-colors duration-300 ${className}`}
      style={{ borderColor: 'var(--theme-border)' }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--theme-text)' }}>{title}</h2>
          {subtitle && <p className="text-sm mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    </motion.header>
  )
}
