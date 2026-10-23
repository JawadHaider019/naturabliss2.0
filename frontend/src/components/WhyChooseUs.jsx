import { assets } from "../assets/assets";
import Title from './Title';
import { FaCheck } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const WhyChooseUs = () => {
  const keyPoints = [
    '100% Cold-Pressed & Extra-Virgin — mechanically pressed below 35°C without heat or hexane solvents',
    'Certified 0% Chemical Formulation — strictly free from parabens, sulfates (SLS), mineral oils, and phthalates',
    'Complete Ingredient Transparency — honest labeling with zero hidden fragrances or diluted fillers',
    'Proudly Handcrafted in Pakistan — ethically sourced botanical oils crafted in Chakwal, Punjab',
    'Hypoallergenic & Dermatologically Safe — formulated for all skin types, including sensitive and acne-prone skin'
  ];

  return (

    <div className="py-16 border-y border-gray-200">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="text-center text-3xl">
            <Title text1={'WHY CHOOSE'} text2={'NATURA BLISS?'} />
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">Because Your Skin Deserves Pure, Natural, and Honest Care.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <img
              src={assets.whyus}
              alt="Natural Skincare Products"
              className="w-full h-96 object-cover border border-gray-200"
            />
            <div className="absolute -bottom-6 -left-6 bg-white p-6 border border-gray-200 max-w-xs">
              <p className="text-sm text-gray-600 italic">
                "Pure ingredients, visible results"
              </p>
            </div>
          </div>

          <div>
            <p className="text-gray-700 leading-relaxed mb-6 text-lg">
              At Natura Bliss, we believe that real skincare comes from purity — not complex formulas. Every product is crafted to bring you closer to nature's healing power.
            </p>

            <div className="space-y-4 mb-6">
              {keyPoints.map((point, index) => (
                <div key={index} className="flex items-start">
                  <FaCheck className="mr-3 mt-1 text-[#587a3b] flex-shrink-0" />
                  <span className="text-gray-700 leading-relaxed">{point}</span>
                </div>
              ))}
            </div>

            <blockquote className="text-xl font-serif text-gray-800 italic leading-relaxed border-l-4 border-[#587a3b] pl-6 py-4 bg-gray-50/60 rounded-r-lg">
              "Nature's wisdom in every drop, crafted for your well-being"
            </blockquote>

            <div className="mt-6">
              <Link
                to="/about"
                className="inline-flex items-center px-6 py-3 border border-[#587a3b] text-sm font-medium rounded-md text-[#587a3b] bg-white hover:bg-[#587a3b] hover:text-white transition-all duration-300 shadow-sm"
              >
                Learn More About Our Philosophy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhyChooseUs;