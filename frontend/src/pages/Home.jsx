import { lazy } from "react"
import Hero from "../components/Hero"
import ShopByCategory from "../components/ShopByCategory"
import LazySection from "../components/LazySection"
import ScrollToTop from "../components/ScrollToTop"
import WhatsApp from "../components/WhatsApp"
import SEO from "../components/SEO"

// Below-the-fold sections: separate chunks, rendered only when scrolled near
const DealCollection = lazy(() => import("../components/DealCollection"))
const LatestCollection = lazy(() => import("../components/LatestCollection"))
const BestSeller = lazy(() => import("../components/BestSeller"))
const WhyChooseUs = lazy(() => import("../components/WhyChooseUs"))
const FAQ = lazy(() => import("../components/FAQ"))
const Testimonial = lazy(() => import("../components/Testimonial"))
const OurPolicy = lazy(() => import("../components/OurPolicy"))

const Home = () => {
  return (
    <div>
      <SEO
        title="Natura Bliss | Cold-Pressed Oils & Herbal Skincare in Pakistan"
        description="Cold-pressed oils, handmade soaps and herbal hair & skin care made in Talagang, Pakistan. No parabens, sulfates or mineral oil. Cash on delivery nationwide."
        canonical="https://naturabliss.pk/"
      />
      <Hero />
      <ShopByCategory />
      <LazySection minHeight={520}><DealCollection /></LazySection>
      <LazySection minHeight={620}><LatestCollection /></LazySection>
      <LazySection minHeight={620}><BestSeller /></LazySection>
      <LazySection minHeight={480}><WhyChooseUs /></LazySection>
      <LazySection minHeight={520}><FAQ /></LazySection>
      <LazySection minHeight={420}><Testimonial /></LazySection>
      <LazySection minHeight={240}><OurPolicy /></LazySection>
      <WhatsApp />
      <ScrollToTop />
    </div>
  )
}

export default Home
