export const GOOGLE_FONTS = [
  { label: 'Inter', value: 'Inter', weights: '400;500;600;700' },
  { label: 'Poppins', value: 'Poppins', weights: '400;500;600;700' },
  { label: 'Playfair Display', value: 'Playfair Display', weights: '400;500;600;700' },
  { label: 'Karla', value: 'Karla', weights: '400;500;600;700' },
  { label: 'Roboto', value: 'Roboto', weights: '400;500;700' },
  { label: 'Lato', value: 'Lato', weights: '400;700' },
  { label: 'Open Sans', value: 'Open Sans', weights: '400;600;700' },
  { label: 'Montserrat', value: 'Montserrat', weights: '400;500;600;700' },
  { label: 'Raleway', value: 'Raleway', weights: '400;500;600;700' },
  { label: 'Source Sans Pro', value: 'Source Sans Pro', weights: '400;600;700' },
  { label: 'Oswald', value: 'Oswald', weights: '400;500;600;700' },
  { label: 'Merriweather', value: 'Merriweather', weights: '400;700' },
  { label: 'Nunito', value: 'Nunito', weights: '400;600;700' },
  { label: 'PT Sans', value: 'PT Sans', weights: '400;700' },
  { label: 'Quicksand', value: 'Quicksand', weights: '400;500;600;700' },
  { label: 'Ubuntu', value: 'Ubuntu', weights: '400;500;700' },
  { label: 'Work Sans', value: 'Work Sans', weights: '400;500;600;700' },
  { label: 'Fira Sans', value: 'Fira Sans', weights: '400;500;600;700' },
  { label: 'Crimson Text', value: 'Crimson Text', weights: '400;600;700' },
  { label: 'Abril Fatface', value: 'Abril Fatface', weights: '400' },
  { label: 'Josefin Sans', value: 'Josefin Sans', weights: '400;600;700' },
  { label: 'Bebas Neue', value: 'Bebas Neue', weights: '400' },
  { label: 'Libre Baskerville', value: 'Libre Baskerville', weights: '400;700' },
  { label: 'Cormorant', value: 'Cormorant', weights: '400;500;600;700' },
  { label: 'DM Sans', value: 'DM Sans', weights: '400;500;700' },
  { label: 'Noto Sans', value: 'Noto Sans', weights: '400;500;600;700' },
  { label: 'Space Grotesk', value: 'Space Grotesk', weights: '400;500;600;700' },
  { label: 'Manrope', value: 'Manrope', weights: '400;500;600;700' }
];

export const FONT_OPTIONS = GOOGLE_FONTS.map(f => f.value);

export function loadGoogleFont(fontFamily: string) {
  const font = GOOGLE_FONTS.find(f => f.value === fontFamily);
  if (!font) return;

  const fontName = font.value.replace(/ /g, '+');
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@${font.weights}&display=swap`;
  
  // Remove existing font link for this font family
  const existingLink = document.querySelector(`link[href*="${fontName}"]`);
  if (existingLink) {
    existingLink.remove();
  }
  
  document.head.appendChild(link);
}
