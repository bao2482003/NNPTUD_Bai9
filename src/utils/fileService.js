async function uploadFileAndGetUrl(file) {
  const fs = require('fs');
  const path = require('path');
  const filename = Date.now() + '-' + file.originalname;
  const outPath = path.join(__dirname, '..', '..', 'public', 'uploads', filename);
  fs.writeFileSync(outPath, file.buffer);
  return `/uploads/${filename}`;
}

module.exports = { uploadFileAndGetUrl };