// components/Loader.jsx
import React from 'react';

const Loader = ({ 
  text = "LOADING", 
  showDots = true, 
  size = "medium", 
  color = "rgb(84 119 55)", 
  fontFamily = "Pacifico", // 'monospace', 'sans', 'serif', 'cursive', 'brand'
  fontWeight = "500",
  className = "" 
}) => {
  
  const letters = text.split('');
  const dots = showDots ? ['.', '.', '.'] : [];
  const allChars = [...letters, ...dots];
  
  // Size mappings in PIXELS
  const sizes = {
    small: { 
      container: "w-[64px] h-[64px]", 
      textSize: 16 // pixels
    },
    medium: { 
      container: "w-[96px] h-[96px]", 
      textSize: 20 // pixels
    },
    large: { 
      container: "w-[128px] h-[128px]", 
      textSize: 24 // pixels
    },
    xl: { 
      container: "w-[290px] h-[250px]", 
      textSize: 48 // pixels
    }
  };

  // Font family mappings
  const fonts = {
    monospace: "'Courier New', Courier, monospace",
    sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    serif: "'Playfair Display', Georgia, 'Times New Roman', serif",
    cursive: "'Pacifico', 'Dancing Script', cursive",
    brand: "'Montserrat', 'Poppins', sans-serif",
    elegant: "'Cormorant Garamond', 'Garamond', serif",
    modern: "'Poppins', 'Helvetica Neue', sans-serif",
    retro: "'Press Start 2P', 'Courier New', monospace",
    handwritten: "'Caveat', 'Comic Sans MS', cursive"
  };

  // Generate animation delays
  const getDelay = (index) => {
    const delays = [0.48, 0.6, 0.72, 0.84, 0.96, 1.08, 1.2, 1.32, 1.44, 1.56];
    return delays[index % delays.length];
  };

  // Get font family string
  const getFontFamily = () => {
    return fonts[fontFamily] || fonts.acifico;
  };

  return (
    <div className={`${sizes[size]?.container || sizes.medium.container} ${className} flex items-center justify-center`}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;600&family=Cormorant+Garamond:wght@400;600&family=Courier+Prime&family=Dancing+Script&family=Inter:wght@400;600&family=Montserrat:wght@400;600&family=Pacifico&family=Playfair+Display:wght@400;600&family=Poppins:wght@400;600&family=Press+Start+2P&display=swap');
          
          @keyframes loadingF {
            0% { 
              opacity: 0; 
              transform: scale(0.8); 
            }
            50% { 
              opacity: 1; 
              transform: scale(1.2); 
            }
            100% { 
              opacity: 0; 
              transform: scale(0.8); 
            }
          }
          
          @keyframes loadingG {
            0% { 
              opacity: 0; 
              transform: translateY(0px); 
            }
            25% { 
              opacity: 1; 
              transform: translateY(-5px); 
            }
            50% { 
              opacity: 1; 
              transform: translateY(0px); 
            }
            75% { 
              opacity: 0.5; 
              transform: translateY(5px); 
            }
            100% { 
              opacity: 0; 
              transform: translateY(0px); 
            }
          }
          
          @keyframes loadingH {
            0% { 
              opacity: 0.2; 
              transform: rotate(0deg); 
            }
            50% { 
              opacity: 1; 
              transform: rotate(10deg); 
            }
            100% { 
              opacity: 0.2; 
              transform: rotate(0deg); 
            }
          }
          
          .letter-container {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 4px;
            height: 100%;
            width: 100%;
          }
          
          .letter {
            display: inline-block;
            font-weight: ${fontWeight};
            animation: loadingF 1.6s ease-in-out infinite;
            color: ${color};
            font-size: ${sizes[size]?.textSize || sizes.medium.textSize}px;
            line-height: 1;
            font-family: ${getFontFamily()};
            letter-spacing: 2px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
          }
        `}
      </style>
      
      <div className="letter-container uppercase">
        {allChars.map((char, index) => (
          <span
            key={index}
            className="letter"
            style={{
              animationDelay: `${getDelay(index)}s`,
              fontSize: `${sizes[size]?.textSize || sizes.medium.textSize}px`
            }}
          >
            {char}
          </span>
        ))}
      </div>
    </div>
  );
};

export default Loader;