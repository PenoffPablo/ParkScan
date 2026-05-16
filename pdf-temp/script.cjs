const fs = require('fs');
const pdfParse = require('pdf-parse');
pdfParse(fs.readFileSync('../Sistema de Playa de Estacionamiento (1).pdf')).then(data => fs.writeFileSync('../pdf_content.txt', data.text)).catch(console.error);
