const loadedFonts = new Set<string>();

export function loadGoogleFont(fontName: string): Promise<boolean> {
  if (!fontName) return Promise.resolve(false);

  // System/Standard fonts skip Google API load
  const systemFonts = [
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Courier New',
    'Georgia',
    'Verdana',
    'Impact',
    'Trebuchet MS',
    'Comic Sans MS',
    'sans-serif',
    'serif',
    'monospace',
  ];
  if (systemFonts.includes(fontName)) return Promise.resolve(true);

  if (!loadedFonts.has(fontName)) {
    try {
      const formattedFont = fontName.replace(/\s+/g, '+');
      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css2?family=${formattedFont}:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,300;1,400;1,700;1,900&display=swap`;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
      loadedFonts.add(fontName);
    } catch (err) {
      console.warn(`Failed to load Google Font: ${fontName}`, err);
    }
  }

  if ('fonts' in document) {
    return document.fonts
      .load(`16px "${fontName}"`)
      .then(() => {
        window.dispatchEvent(new CustomEvent('neo1-font-loaded', { detail: fontName }));
        return true;
      })
      .catch(() => {
        window.dispatchEvent(new CustomEvent('neo1-font-loaded', { detail: fontName }));
        return false;
      });
  }

  window.dispatchEvent(new CustomEvent('neo1-font-loaded', { detail: fontName }));
  return Promise.resolve(true);
}

