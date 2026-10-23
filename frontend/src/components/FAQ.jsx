import { useState } from 'react';
import Title from './Title';
import { FaChevronDown } from 'react-icons/fa';

const FAQ_ITEMS = [
  {
    question: "Does Natura Bliss offer Cash on Delivery (COD) across Pakistan?",
    answer: "Yes! We offer nationwide Cash on Delivery (COD) across all cities and towns in Pakistan, including Karachi, Lahore, Islamabad, Rawalpindi, Faisalabad, Multan, Peshawar, Sialkot, Quetta, and all surrounding districts. You pay in cash directly to the courier rider upon receiving your package."
  },
  {
    question: "How are Natura Bliss cold-pressed oils extracted, and why are they superior?",
    answer: "All Natura Bliss oils (Coconut, Almond, Castor, Sesame, Blackseed, Pumpkin Seed, Rosemary, Olive) are extracted using traditional cold-pressing methods without heat, hexane, mineral oil, or chemical solvents. This preserves 100% of active antioxidants, essential fatty acids, and natural vitamins for maximum skin and hair benefits."
  },
  {
    question: "Are your products 100% natural, safe, and chemical-free?",
    answer: "Yes. Our philosophy is pure, transparent skincare. Every formulation is 100% free from parabens, sulfates (SLS/SLES), silicones, synthetic dyes, and artificial fragrances. They are gentle, hypoallergenic, and suitable for all skin types, including sensitive skin."
  },
  {
    question: "How long does delivery take across Pakistan?",
    answer: "All orders are dispatched within 24 hours. Doorstep delivery takes 2 to 4 business days to major cities (Karachi, Lahore, Islamabad, Rawalpindi) and 3 to 5 business days to other regions. Real-time courier tracking is provided via SMS and WhatsApp."
  },
  {
    question: "Which oil is best for hair fall, dandruff, and rapid hair growth?",
    answer: "For hair growth and thinning hair, we recommend our Cold-Pressed Rosemary Oil infused with Castor Oil or Pumpkin Seed Oil (a natural DHT blocker). For deep root nourishment and dandruff control, our Onion Hair Oil and sulfate-free Herbal Shampoo provide exceptional botanical care."
  },
  {
    question: "What is your return and exchange policy?",
    answer: "We offer a 7-day hassle-free return and exchange guarantee. If an item arrives damaged, defective, or incorrect, contact our WhatsApp support at +92 324 1572294 for an immediate, no-cost replacement."
  }
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const toggleAccordion = (index) => {
    setOpenIndex(prev => (prev === index ? -1 : index));
  };

  return (
    <section className="py-16 border-t border-gray-200 bg-white" aria-labelledby="faq-heading">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <div className="text-center text-3xl">
            <Title text1={'FREQUENTLY ASKED'} text2={'QUESTIONS'} />
          </div>
          <p id="faq-heading" className="text-gray-600 max-w-xl mx-auto mt-2 text-sm sm:text-base">
            Everything you need to know about our 100% pure organic oils, skincare, and nationwide Pakistan delivery.
          </p>
        </div>

        <div className="space-y-4">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="border border-gray-200 rounded-none overflow-hidden transition-all duration-300 hover:border-[#587a3b]/40"
              >
                <button
                  type="button"
                  onClick={() => toggleAccordion(index)}
                  className="w-full text-left px-5 py-4 bg-gray-50/70 hover:bg-gray-100/80 flex justify-between items-center transition-colors duration-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#587a3b]"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                  id={`faq-question-${index}`}
                >
                  <span className={`font-semibold text-sm sm:text-base pr-4 transition-colors duration-200 ${isOpen ? 'text-[#587a3b]' : 'text-gray-900'}`}>
                    {item.question}
                  </span>
                  <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                    <FaChevronDown
                      className={`text-[#587a3b] text-xs transition-transform duration-300 ease-in-out ${
                        isOpen ? 'transform rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                {/* Smooth CSS Grid Accordion Collapse/Expand Animation */}
                <div
                  id={`faq-answer-${index}`}
                  role="region"
                  aria-labelledby={`faq-question-${index}`}
                  style={{
                    display: 'grid',
                    gridTemplateRows: isOpen ? '1fr' : '0fr',
                    transition: 'grid-template-rows 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 250ms ease-in-out',
                    opacity: isOpen ? 1 : 0
                  }}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 py-4 bg-white text-gray-600 text-sm sm:text-base leading-relaxed border-t border-gray-100">
                      {item.answer}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Support Help Banner */}
        <div className="mt-10 p-4 bg-olive-50/40 border border-[#587a3b]/20 text-center">
          <p className="text-sm text-gray-700">
            Have more questions? Chat with our customer support team in Pakistan on{' '}
            <a
              href="https://wa.me/923241572294"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#587a3b] font-semibold underline hover:text-[#46622f] transition-colors"
            >
              WhatsApp (+92-324-1572294)
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
