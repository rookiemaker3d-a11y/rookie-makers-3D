import { forwardRef } from 'react'

/**
 * Card con glassmorphism: background rgba(255,255,255,0.03), backdrop-filter blur(12px), border 1px solid rgba(255,255,255,0.08)
 * Sombras con color de acento: box-shadow 0 4px 24px rgba(79,142,247,0.12)
 */
const Card = forwardRef(function Card(
  { children, className = '', hover = false, padding = true, as: As = 'div', ...props },
  ref
) {
  const base = 'rounded-xl border backdrop-blur-[12px] transition-colors duration-300'
  const hoverClass = hover ? 'hover:bg-[var(--theme-bg-card-hover)] hover:border-[var(--theme-border-hover)]' : ''
  const classes = `${base} ${hoverClass} ${padClass} ${className}`.trim()

  return (
    <As
      ref={ref}
      className={classes}
      style={{
        background: 'var(--theme-bg-card)',
        borderColor: 'var(--theme-border)',
        boxShadow: 'var(--theme-shadow-accent)',
      }}
      {...props}
    >
      {children}
    </As>
  )
})

export default Card
