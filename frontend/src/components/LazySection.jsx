import { Suspense, useEffect, useRef, useState } from 'react'

/**
 * Renders its children only when the section is about to scroll into view.
 *
 * The home page used to render every carousel at once (~2,800 DOM nodes), which cost several
 * seconds of main-thread time on phones. Sections below the fold now mount on approach; the
 * placeholder keeps roughly the right height so the page doesn't jump when they appear.
 */
const LazySection = ({ children, minHeight = 400, rootMargin = '200px 0px' }) => {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (visible) return
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        setVisible(true)
        io.disconnect()
      }
    }, { rootMargin })
    io.observe(el)
    return () => io.disconnect()
  }, [visible, rootMargin])

  const placeholder = <div style={{ minHeight }} aria-hidden="true" />

  return (
    <div ref={ref}>
      {visible ? <Suspense fallback={placeholder}>{children}</Suspense> : placeholder}
    </div>
  )
}

export default LazySection
