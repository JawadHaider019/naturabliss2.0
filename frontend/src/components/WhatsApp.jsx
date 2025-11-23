// src/components/WhatsAppFloat.jsx
import { FaWhatsapp } from 'react-icons/fa';

const WhatsApp = () => {
  const whatsappNumber = '923245722294';
  const message = "Assalam O Alaikum! I'm interested in Natura Bliss products. Can you help me?";
  
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

  return (
    <div className="fixed bottom-[100px] right-8 z-50">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110"
        aria-label="Chat on WhatsApp"
        style={{
          animation: 'bounce 2s infinite'
        }}
      >
        <FaWhatsapp className="text-white text-2xl" />
      </a>

      <style>
        {`
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {
              transform: translateY(0);
            }
            40% {
              transform: translateY(-10px);
            }
            60% {
              transform: translateY(-5px);
            }
          }
        `}
      </style>
    </div>
  );
};

export default WhatsApp;