import fs from 'fs';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';

const dataBuffer = fs.readFileSync('Sistema de Playa de Estacionamiento.pdf');

pdfParse(dataBuffer).then(function(data) {
    console.log(data.text);
}).catch(function(error){
    console.error(error);
});
