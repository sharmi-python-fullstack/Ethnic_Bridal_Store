const GARLAND_SRC = '/images/bridal-floral-garland.png'

/**
 * A decorative layer shared by every route. It is deliberately non-interactive
 * and sits at low opacity so product, form, and checkout content stays readable.
 */
export default function FloralBackground() {
  return (
    <div className="site-floral-background" aria-hidden="true">
      <img src={GARLAND_SRC} alt="" className="site-garland site-garland-top" />
      <img src={GARLAND_SRC} alt="" className="site-garland site-garland-left" />
      <img src={GARLAND_SRC} alt="" className="site-garland site-garland-left-lower hidden sm:block" />
      <img src={GARLAND_SRC} alt="" className="site-garland site-garland-right" />
      <img src={GARLAND_SRC} alt="" className="site-garland site-garland-bottom" />
      <img src={GARLAND_SRC} alt="" className="site-garland site-garland-center hidden sm:block" />
    </div>
  )
}
