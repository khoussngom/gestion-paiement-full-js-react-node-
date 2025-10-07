import { useState, useEffect, createContext, useContext, useRef, useCallback } from 'react';

const CompanyThemeContext = createContext();

export const useCompanyTheme = () => {
  const context = useContext(CompanyThemeContext);
  if (!context) {
    throw new Error('useCompanyTheme must be used within a CompanyThemeProvider');
  }
  return context;
};

export const CompanyThemeProvider = ({ children }) => {
  const [companyColor, setCompanyColor] = useState('#4318FF'); // Couleur par défaut
  const [companyColors, setCompanyColors] = useState({ primary: '#4318FF' });
  const [isLoading, setIsLoading] = useState(true);
  
  // Protection contre les appels répétés
  const lastLoadTimeRef = useRef(0);
  const isLoadingRef = useRef(false);

  const loadCompanyTheme = useCallback(async () => {
    // Éviter les appels trop fréquents (minimum 3 secondes entre les appels)
    const now = Date.now();
    if (now - lastLoadTimeRef.current < 3000 || isLoadingRef.current) {
      console.log('🚫 Appel trop fréquent au thème de l\'entreprise, ignoré');
      return;
    }
    
    lastLoadTimeRef.current = now;
    isLoadingRef.current = true;
    
    try {
      setIsLoading(true);
      const response = await fetch(`http://localhost:3001/api/dashboard/statistiques?t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Cache-Control': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.succes && data.donnees && data.donnees.entreprise) {
          const couleur = data.donnees.entreprise.couleurPrimaire || '#4318FF';
          setCompanyColor(couleur);
          setCompanyColors({ 
            primary: couleur,
            secondary: couleur // Pour l'instant, même couleur
          });
          
          // Mettre à jour les variables CSS personnalisées
          document.documentElement.style.setProperty('--company-primary', couleur);
          document.documentElement.style.setProperty('--chakra-colors-brand-500', couleur);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement du thème:', error);
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadCompanyTheme();
    
    // Écouter les mises à jour de couleur
    const handleThemeUpdate = () => {
      loadCompanyTheme();
    };
    
    window.addEventListener('companyThemeUpdated', handleThemeUpdate);
    window.addEventListener('companyLogoUpdated', handleThemeUpdate); // Aussi quand le logo est mis à jour
    
    return () => {
      window.removeEventListener('companyThemeUpdated', handleThemeUpdate);
      window.removeEventListener('companyLogoUpdated', handleThemeUpdate);
    };
  }, [loadCompanyTheme]);

  const updateCompanyColor = (newColor) => {
    setCompanyColor(newColor);
    setCompanyColors({ 
      primary: newColor,
      secondary: newColor
    });
    document.documentElement.style.setProperty('--company-primary', newColor);
    document.documentElement.style.setProperty('--chakra-colors-brand-500', newColor);
    
    // Émettre un événement pour notifier les autres composants
    window.dispatchEvent(new Event('companyThemeUpdated'));
  };

  const getColorVariants = (baseColor = companyColor) => {
    // Fonction utilitaire pour générer des variantes de couleur
    const hexToHsl = (hex) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h, s, l = (max + min) / 2;

      if (max === min) {
        h = s = 0;
      } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
          default: h = 0; break;
        }
        h /= 6;
      }

      return [h * 360, s * 100, l * 100];
    };

    const hslToHex = (h, s, l) => {
      h = h / 360;
      s = s / 100;
      l = l / 100;

      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      const r = hue2rgb(p, q, h + 1/3);
      const g = hue2rgb(p, q, h);
      const b = hue2rgb(p, q, h - 1/3);

      const toHex = (c) => {
        const hex = Math.round(c * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      };

      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    };

    const [h, s, l] = hexToHsl(baseColor);

    return {
      50: hslToHex(h, s, Math.min(95, l + 40)),
      100: hslToHex(h, s, Math.min(90, l + 30)),
      200: hslToHex(h, s, Math.min(80, l + 20)),
      300: hslToHex(h, s, Math.min(70, l + 10)),
      400: hslToHex(h, s, Math.min(60, l + 5)),
      500: baseColor,
      600: hslToHex(h, s, Math.max(20, l - 10)),
      700: hslToHex(h, s, Math.max(15, l - 20)),
      800: hslToHex(h, s, Math.max(10, l - 30)),
      900: hslToHex(h, s, Math.max(5, l - 40)),
    };
  };

  const value = {
    companyColor,
    companyColors,
    isLoading,
    updateCompanyColor,
    loadCompanyTheme,
    getColorVariants
  };

  return (
    <CompanyThemeContext.Provider value={value}>
      {children}
    </CompanyThemeContext.Provider>
  );
};
