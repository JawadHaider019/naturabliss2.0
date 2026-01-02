// src/components/WhatsAppFloat.jsx
import { FaWhatsapp } from 'react-icons/fa';

const WhatsApp = () => {
  const whatsappNumber = '923241572294';

  // WhatsApp-safe message (no special punctuation)
  const message =
    'Assalam O Alaikum. I am interested in Natura Bliss products. Please guide me';

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    message
  )}`;

  return (
    <div className="fixed bottom-[100px] right-8 z-50">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full
                   flex items-center justify-center shadow-2xl
                   transition-all duration-300 hover:scale-110"
      >
        <FaWhatsapp className="text-white text-2xl" />
      </a>
    </div>
  );
};

export default WhatsApp;
