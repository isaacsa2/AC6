const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve tudo que estiver em /public (index.html, imagens, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Fallback: qualquer rota não encontrada cai pro index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`AC6C Calculator rodando em http://localhost:${PORT}`);
});
