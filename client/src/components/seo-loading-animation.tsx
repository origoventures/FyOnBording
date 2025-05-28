import { motion } from 'framer-motion';
import { Search, BarChart, Award, CheckCircle2, Globe, Sparkles } from 'lucide-react';

interface SeoLoadingAnimationProps {
  message?: string;
  theme?: 'light' | 'dark';
  size?: 'small' | 'medium' | 'large';
}

export default function SeoLoadingAnimation({ 
  message = "Analisi SEO in corso...",
  theme = 'light',
  size = 'medium'
}: SeoLoadingAnimationProps) {
  // Configurazione in base alla dimensione
  const config = {
    small: {
      iconSize: 16,
      textSize: 'text-xs',
      containerClass: 'p-2',
      mainSize: 'w-14 h-14',
      ringSize: 'w-24 h-24',
    },
    medium: {
      iconSize: 24,
      textSize: 'text-sm',
      containerClass: 'p-4',
      mainSize: 'w-20 h-20',
      ringSize: 'w-36 h-36',
    },
    large: {
      iconSize: 32,
      textSize: 'text-base',
      containerClass: 'p-6',
      mainSize: 'w-28 h-28',
      ringSize: 'w-48 h-48',
    }
  };
  
  // Stili in base al tema
  const themeStyles = {
    light: {
      bg: 'bg-white',
      text: 'text-slate-800',
      accent: 'text-blue-600',
      ringColor: '#3b82f6',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      secondaryText: 'text-slate-500'
    },
    dark: {
      bg: 'bg-slate-900',
      text: 'text-white',
      accent: 'text-blue-400',
      ringColor: '#60a5fa',
      iconBg: 'bg-slate-800',
      iconColor: 'text-blue-400',
      secondaryText: 'text-slate-400'
    }
  };
  
  const currentTheme = themeStyles[theme];
  const currentSize = config[size];
  
  // Icone per l'animazione
  const icons = [
    <Search key="search" size={currentSize.iconSize} />,
    <BarChart key="chart" size={currentSize.iconSize} />,
    <Globe key="globe" size={currentSize.iconSize} />,
    <Award key="award" size={currentSize.iconSize} />,
    <CheckCircle2 key="check" size={currentSize.iconSize} />,
    <Sparkles key="sparkles" size={currentSize.iconSize} />
  ];
  
  // Varianti per l'animazione dell'icona principale
  const mainIconVariants = {
    animate: {
      scale: [1, 1.1, 1],
      rotate: [0, 10, -10, 0],
      transition: {
        duration: 2.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };
  
  // Varianti per l'animazione delle icone del cerchio
  const circleDotVariants = {
    initial: { opacity: 0.3, scale: 0.8 },
    animate: (index: number) => ({
      opacity: [0.3, 1, 0.3],
      scale: [0.8, 1.1, 0.8],
      transition: {
        duration: 2,
        repeat: Infinity,
        delay: index * 0.4,
        ease: "easeInOut"
      }
    })
  };
  
  return (
    <div className={`flex flex-col items-center justify-center ${currentTheme.bg} ${currentSize.containerClass} rounded-xl`}>
      {/* Messaggio superiore */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`${currentTheme.text} ${currentSize.textSize} font-medium mb-4 text-center`}
        >
          {message}
        </motion.div>
      )}
      
      {/* Animazione principale */}
      <div className="relative">
        {/* Cerchio rotante esterno con punti */}
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${currentSize.ringSize}`}>
          {icons.map((icon, index) => (
            <motion.div
              key={index}
              custom={index}
              variants={circleDotVariants}
              initial="initial"
              animate="animate"
              className={`absolute ${currentTheme.iconBg} ${currentTheme.iconColor} p-2 rounded-full`}
              style={{
                top: `${50 - 40 * Math.cos(index * (Math.PI / 3))}%`,
                left: `${50 + 40 * Math.sin(index * (Math.PI / 3))}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              {icon}
            </motion.div>
          ))}
        </div>
        
        {/* Icona principale centrale */}
        <motion.div
          variants={mainIconVariants}
          animate="animate"
          className={`${currentSize.mainSize} rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white relative z-10`}
        >
          <Search size={currentSize.iconSize * 1.5} />
        </motion.div>
      </div>
      
      {/* Testo di loading inferiore */}
      <div className="mt-6 flex flex-col items-center">
        <motion.div
          animate={{ 
            opacity: [0.5, 1, 0.5],
            scale: [0.98, 1, 0.98]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className={`${currentTheme.secondaryText} ${currentSize.textSize} mt-1`}
        >
          <div className="flex items-center">
            <span className="mr-3">Caricamento</span>
            <span className="flex space-x-1">
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
              >•</motion.span>
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
              >•</motion.span>
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
              >•</motion.span>
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}