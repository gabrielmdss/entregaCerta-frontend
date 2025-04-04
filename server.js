import dotenv from 'dotenv';
import path from 'path';
import express from 'express';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.SERVER_PORT || 8091;

const indexPath = path.join(__dirname, 'dist', 'entrega-certa', 'browser', 'index.csr.html');

app.use(express.static(path.join(__dirname, 'dist', 'entrega-certa', 'browser')));

// Rota fallback para SPA
app.get('*', (req, res) => {
  res.sendFile(indexPath);
});

console.log(`Verificando caminho para index.csr.html: ${indexPath}`);
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
