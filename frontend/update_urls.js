const fs = require('fs');
const path = require('path');

function processDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        processDir(fullPath);
      }
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const changed = content.replace(/(['\"\`])http:\/\/localhost:5000([^\1]*?)\1/g, '`${process.env.NEXT_PUBLIC_API_URL || \'http://localhost:5000\'}$2`');
      
      if (content !== changed) {
        fs.writeFileSync(fullPath, changed, 'utf8');
        console.log('Updated', fullPath);
      }
    }
  }
}

processDir(path.resolve('./src'));
