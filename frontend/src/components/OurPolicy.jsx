import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faShieldAlt,
  faAward,
  faShippingFast,
  faRotateLeft
} from "@fortawesome/free-solid-svg-icons";
import Title from "./Title";

const OurPolicy = () => {
  const policies = [
    {
      icon: faShieldAlt,
      title: "100% Pure & Organic",
      description: "Certified natural ingredients, cold-pressed extraction with 0% parabens, sulfates, or mineral oils.",
      color: "text-[#587a3b]"
    },
    {
      icon: faAward,
      title: "Cash on Delivery",
      description: "Nationwide COD available at your doorstep across Karachi, Lahore, Islamabad, and all cities in Pakistan.",
      color: "text-[#587a3b]"
    },
    {
      icon: faRotateLeft,
      title: "7-Day Easy Exchange",
      description: "Hassle-free 7-day return and exchange policy for complete customer satisfaction and confidence.",
      color: "text-[#587a3b]"
    },
    {
      icon: faShippingFast,
      title: "Fast Pakistan Delivery",
      description: "Express courier dispatch within 24 hours. Safe doorstep delivery in 2 to 4 business days.",
      color: "text-[#587a3b]"
    }
  ];

  return (
    <section className="py-16 border-t border-gray-200" aria-labelledby="policy-heading">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <div className="text-center text-3xl">
            <Title text1={'OUR'} text2={'POLICIES'} />
          </div>

          <p id="policy-heading" className="text-gray-600 max-w-2xl mx-auto mt-2 text-sm sm:text-base">
            Customer-first policies designed to provide complete trust, transparency, and satisfaction with every order.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {policies.map((policy, index) => (
            <div
              key={index}
              className="bg-white p-6 border border-gray-200 text-center group hover:shadow-lg transition-all duration-300 hover:border-[#587a3b]/40 rounded-none flex flex-col justify-between"
            >
              <div>
                <div className={`w-14 h-14 bg-white border border-gray-100 rounded-full flex items-center justify-center mx-auto mb-5 group-hover:scale-110 group-hover:border-[#587a3b]/30 group-hover:bg-[#587a3b]/10 transition-all duration-300 ${policy.color}`}>
                  <FontAwesomeIcon
                    icon={policy.icon}
                    className="text-xl"
                  />
                </div>

                <h3 className="text-lg font-serif font-bold text-gray-900 mb-3 group-hover:text-[#587a3b] transition-colors">
                  {policy.title}
                </h3>

                <p className="text-gray-600 leading-relaxed text-xs sm:text-sm">
                  {policy.description}
                </p>
              </div>

              {/* Hover effect line */}
              <div className="w-0 group-hover:w-10 h-0.5 bg-[#587a3b] mx-auto mt-4 transition-all duration-300"></div>
            </div>
          ))}
        </div>

        {/* Brand Trust Commitment */}
        <div className="mt-12 text-center">
          <div className="bg-gray-50/70 p-5 border border-gray-200 inline-block max-w-3xl">
            <p className="text-gray-700 leading-relaxed text-sm italic">
              "At Natura Bliss, we build long-term relationships through genuine product purity, transparent Pakistan-wide delivery, and dedicated customer support. Your natural wellness is our highest commitment."
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OurPolicy;