import BestSeller from "../components/BestSeller"
import Hero from "../components/Hero"
import LatestCollection from "../components/LatestCollection"
import NewsletterBox from "../components/NewsletterBox"
import OurPolicy from "../components/OurPolicy"
import Testimonial from '../components/Testimonial'
import WhyChooseUs from "../components/WhyChooseUs"
import DealCollection from "../components/DealCollection"
import ScrollToTop from "../components/ScrollToTop"
import WhatsApp from "../components/WhatsApp"

const Home = () => {
  return (
    <div>
      <Hero/>
      <DealCollection />
      <LatestCollection/>
      <BestSeller/>
      <WhyChooseUs/>
      <Testimonial/>
      <OurPolicy/>
      <NewsletterBox/>
            <WhatsApp /> 
      <ScrollToTop />
    </div>
  )
}

export default Home