import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create public directory if it doesn't exist
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Icon sizes to generate
const iconSizes = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 152, name: 'apple-touch-icon-152x152.png' },
  { size: 167, name: 'apple-touch-icon-167x167.png' },
  { size: 180, name: 'apple-touch-icon-180x180.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 512, name: 'icon-512x512.png' }
];

// Default apple touch icon (180x180)
const appleTouchIcon = { size: 180, name: 'apple-touch-icon.png' };

async function generateIcons() {
  const svgPath = path.join(publicDir, 'icon.svg');
  
  if (!fs.existsSync(svgPath)) {
    console.error('icon.svg not found in public directory');
    return;
  }

  try {
    // Generate all icon sizes
    for (const icon of [...iconSizes, appleTouchIcon]) {
      await sharp(svgPath)
        .resize(icon.size, icon.size)
        .png()
        .toFile(path.join(publicDir, icon.name));
      
      console.log(`Generated ${icon.name} (${icon.size}x${icon.size})`);
    }

    // Generate favicon.ico (16x16)
    await sharp(svgPath)
      .resize(16, 16)
      .png()
      .toFile(path.join(publicDir, 'favicon.ico'));

    // Generate safari pinned tab icon (monochrome SVG)
    const safariIcon = `<svg width="16" height="16" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M256 16C256 16 156 156 156 156L256 256L356 156C356 156 256 16 256 16Z" fill="black"/>
      <text x="256" y="380" text-anchor="middle" fill="black" font-family="Arial, sans-serif" font-size="32" font-weight="bold">DR</text>
    </svg>`;
    
    fs.writeFileSync(path.join(publicDir, 'safari-pinned-tab.svg'), safariIcon);

    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons();