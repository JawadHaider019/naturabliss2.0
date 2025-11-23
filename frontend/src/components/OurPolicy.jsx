import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faShieldAlt,
  faAward,
  faShippingFast
} from "@fortawesome/free-solid-svg-icons";
import Title from "./Title";

const OurPolicy = () => {
  const policies = [
    {
      icon: faShieldAlt,
      title: "Quality Guaranteed",
      description: "100% authentic, premium quality natural ingredients in all our skincare and beauty products",
      color: "text-black"
    },
    {
      icon: faAward,
      title: "Natural & Safe",
      description: "All products made with pure, certified natural ingredients safe for sensitive skin types",
      color: "text-black"
    },
    {
      icon: faShippingFast,
      title: "Fast Delivery",
      description: "Quick and reliable shipping service for natural skincare products throughout Pakistan",
      color: "text-black"
    }
  ];

  return (
    <div className="py-20 border-y border-gray-200">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
             <div className="text-center text-3xl">
            <Title text1={'OUR'} text2={'POLICIES'} />
          </div>
          
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover our customer-first policies designed for your complete satisfaction with Natura Bliss natural skincare products
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {policies.map((policy, index) => (
            <div 
              key={index}
              className="bg-white p-8 border border-gray-200 text-center group hover:shadow-lg transition-all duration-300 hover:border-green-200"
            >
              <div className={`w-16 h-16 bg-white border border-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 ${policy.color}`}>
                <FontAwesomeIcon 
                  icon={policy.icon} 
                  className="text-2xl" 
                />
              </div>
              
              <h3 className="text-xl font-serif font-bold text-gray-900 mb-4">
                {policy.title}
              </h3>
              
              <p className="text-gray-600 leading-relaxed text-sm">
                {policy.description}
              </p>
              
              {/* Hover effect line */}
              <div className="w-0 group-hover:w-12 h-0.5 bg-green-500 mx-auto mt-4 transition-all duration-300"></div>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center">
          <div className="bg-white p-6 border border-gray-200 inline-block max-w-2xl">
            <p className="text-gray-700 leading-relaxed italic">
              "At Natura Bliss, we believe in building trust through transparent policies and exceptional customer service. Your satisfaction is our ultimate priority."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OurPolicy;