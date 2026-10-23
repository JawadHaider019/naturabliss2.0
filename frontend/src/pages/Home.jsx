import BestSeller from "../components/BestSeller"
import Hero from "../components/Hero"
import ShopByCategory from "../components/ShopByCategory"
import LatestCollection from "../components/LatestCollection"
import NewsletterBox from "../components/NewsletterBox"
import OurPolicy from "../components/OurPolicy"
import Testimonial from '../components/Testimonial'
import WhyChooseUs from "../components/WhyChooseUs"
import DealCollection from "../components/DealCollection"
import ScrollToTop from "../components/ScrollToTop"
import WhatsApp from "../components/WhatsApp"
import FAQ from "../components/FAQ"
import SEO from "../components/SEO"

const Home = () => {
  return (
    <div>
      <SEO
        title="Natura Bliss | 100% Pure Skincare & Cold-Pressed Oils in Pakistan"
        description="Shop 100% pure cold-pressed oils, herbal haircare & organic skincare in Pakistan. Chemical-free, cruelty-free. Cash on delivery available nationwide."
        canonical="https://naturabliss.pk/"
      />
      <Hero />
      <ShopByCategory />
      <DealCollection />
      <LatestCollection />
      <BestSeller />
      <WhyChooseUs />
      <FAQ />
      <Testimonial />
      <OurPolicy />
      {/* <NewsletterBox/> */}
      <WhatsApp />
      <ScrollToTop />
    </div>
  )
}

export default Home