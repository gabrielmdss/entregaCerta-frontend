import dotenv from 'dotenv';
dotenv.config();
const path = require('path');
const express = require('express');
const app = express();

app.use(express.static(path.join(__dirname, 'dist', 'entrega-certa', 'browser')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'entrega-certa','browser', 'index.csr.html'));
});

const PORT = process.env.SERVER_PORT || 8091;
const indexPath = path.join(__dirname, 'dist', 'entrega-certa','browser', 'index.csr.html');
console.log(`Verificando caminho para index.html: ${indexPath}`);
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
