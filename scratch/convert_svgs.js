const fs = require('fs');
const path = require('path');

const dir = 'd:/personal-loan-app/personal-loan-app/src/assets/animations/illustration/3d';
const files = ['camera', 'location', 'message'];

files.forEach(file => {
  const svgPath = path.join(dir, `${file}.svg`);
  const webpPath = path.join(dir, `${file}.webp`);
  if (fs.existsSync(svgPath)) {
    const content = fs.readFileSync(svgPath, 'utf8');
    const match = content.match(/href=["']data:image\/webp;base64,([^"']+)["']/i);
    if (match && match[1]) {
      const base64Data = match[1];
      fs.writeFileSync(webpPath, Buffer.from(base64Data, 'base64'));
      console.log(`Successfully extracted ${file}.webp`);
    } else {
      console.log(`No webp base64 match for ${file}`);
    }
  } else {
    console.log(`${file}.svg does not exist`);
  }
});
