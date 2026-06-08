const Anthropic = require('@anthropic-ai/sdk');

const CATEGORIES = [
  { id: 'supermercado', label: '🛒 Supermercado', keywords: ['supermercado', 'mercado', 'feira', 'hortifruti', 'açougue', 'padaria', 'mercearia'] },
  { id: 'combustivel', label: '⛽ Gasolina / Combustível', keywords: ['gasolina', 'combustível', 'posto', 'etanol', 'diesel', 'abasteci', 'abastecimento'] },
  { id: 'farmacia', label: '💊 Farmácia', keywords: ['farmácia', 'remédio', 'medicamento', 'drogaria', 'droga', 'manipulação'] },
  { id: 'restaurante', label: '🍽️ Restaurante / Delivery', keywords: ['restaurante', 'lanchonete', 'pizza', 'hamburguer', 'ifood', 'delivery', 'almoço', 'jantar', 'lanche', 'comida', 'sushi', 'japonês', 'churrasco', 'bar'] },
  { id: 'casa', label: '🏠 Casa', keywords: ['aluguel', 'condomínio', 'iptu', 'manutenção', 'reforma', 'pintura', 'encanador', 'eletricista', 'faxina', 'limpeza'] },
  { id: 'contas', label: '💡 Contas', keywords: ['luz', 'água', 'internet', 'telefone', 'celular', 'tv', 'streaming', 'netflix', 'spotify', 'conta', 'boleto'] },
  { id: 'vestuario', label: '👕 Vestuário', keywords: ['roupa', 'calçado', 'tênis', 'sapato', 'camisa', 'calça', 'vestido', 'loja', 'renner', 'riachuelo', 'c&a'] },
  { id: 'saude', label: '🏥 Saúde', keywords: ['plano', 'consulta', 'médico', 'exame', 'dentista', 'fisioterapia', 'hospital', 'clínica', 'academia', 'psicólogo'] },
  { id: 'educacao', label: '🎓 Educação', keywords: ['escola', 'faculdade', 'curso', 'livro', 'material', 'mensalidade', 'universidade', 'aula', 'inglês'] },
  { id: 'lazer', label: '🎬 Lazer / Entretenimento', keywords: ['cinema', 'teatro', 'show', 'passeio', 'viagem', 'hotel', 'parque', 'jogo', 'ingresso'] },
  { id: 'carro', label: '🚗 Carro', keywords: ['carro', 'ipva', 'seguro do carro', 'revisão', 'pneu', 'funilaria', 'mecânico', 'mecanica', 'borracharia', 'multa', 'estacionamento', 'lavagem', 'lava jato', 'troca de óleo', 'peça', 'autopeça'] },
  { id: 'estetica', label: '💅 Estética Pessoal', keywords: ['cabelo', 'salão', 'barbearia', 'cabeleireiro', 'manicure', 'pedicure', 'unhas', 'estética', 'spa', 'sobrancelha', 'depilação', 'maquiagem', 'perfume', 'cosmético'] },
  { id: 'pets', label: '🐾 Pets', keywords: ['pet', 'ração', 'veterinário', 'veterin', 'dog', 'gato', 'cachorro', 'banho e tosa', 'tosa', 'petshop', 'pet shop', 'remédio animal', 'vacina animal'] },
  { id: 'receita_jotape', label: '💰 Receita JOTAPE', keywords: [] },
  { id: 'receita_carol', label: '💰 Receita Carol', keywords: [] },
  { id: 'outros', label: '📦 Outros', keywords: [] },
];

function detectByKeywords(description) {
  const lower = description.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  for (const cat of CATEGORIES) {
    for (const kw of cat.keywords) {
      const kwNorm = kw.normalize('NFD').replace(/[̀-ͯ]/g, '');
      if (lower.includes(kwNorm)) return cat;
    }
  }
  return null;
}

async function detectByAI(description) {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  try {
    const client = new Anthropic();
    const categoryList = CATEGORIES.map(c => `${c.id}: ${c.label}`).join('\n');

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 50,
      messages: [
        {
          role: 'user',
          content: `Classifique a seguinte descrição de transação financeira em UMA das categorias abaixo. Responda APENAS com o ID da categoria, sem explicação.\n\nDescrição: "${description}"\n\nCategorias:\n${categoryList}`,
        },
      ],
    });

    const categoryId = message.content[0].text.trim().toLowerCase();
    return CATEGORIES.find(c => c.id === categoryId) || null;
  } catch (e) {
    console.error('Erro ao classificar com IA:', e.message);
    return null;
  }
}

async function detectCategory(description, type, person) {
  if (type === 'receita') {
    return person === 'Carol' ? CATEGORIES.find(c => c.id === 'receita_carol') : CATEGORIES.find(c => c.id === 'receita_jotape');
  }

  const byKeyword = detectByKeywords(description);
  if (byKeyword) return byKeyword;

  const byAI = await detectByAI(description);
  if (byAI) return byAI;

  return CATEGORIES.find(c => c.id === 'outros');
}

module.exports = { detectCategory, CATEGORIES };
