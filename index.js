// Util: remover acentos para busca mais inteligente
function normalizeText(s) {
  return s
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

const listaEl = document.getElementById('listaInscritos');
const searchInput = document.getElementById('searchInput');
const categoriaSelect = document.getElementById('categoriaSelect');
const contadorEl = document.getElementById('contador');

let inscritos = [];      // { nome, categoria }
let filtrados = [];      // estado atual pós filtros

// Carrega o TXT (Nome|Categoria) da mesma pasta
async function carregarTXT() {
  const resp = await fetch('inscritos.txt');
  if (!resp.ok) {
    // Tenta caminho alternativo (alguns servidores exigem caminho relativo raiz)
    throw new Error('Não foi possível carregar inscritos.txt');
  }
  const texto = await resp.text();

  const linhas = texto
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const dados = [];
  for (const l of linhas) {
    const [nomeRaw, catRaw] = l.split('|');
    const nome = (nomeRaw ?? '').trim();
    const categoria = (catRaw ?? '').trim();
    if (nome) {
      dados.push({ nome, categoria });
    }
  }

  // Ordena alfabeticamente por nome (locale pt-BR para letras acentuadas)
  dados.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }));
  inscritos = dados;

  popularCategorias();
  aplicarFiltros();
}

// Preenche o select de categorias (únicas)
function popularCategorias() {
  const setCats = new Set();
  inscritos.forEach(p => {
    if (p.categoria) setCats.add(p.categoria);
  });

  const ordenadas = Array.from(setCats).sort((a,b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
  // Limpa e repõe
  categoriaSelect.innerHTML = '<option value="">Todas</option>';
  for (const c of ordenadas) {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    categoriaSelect.appendChild(opt);
  }
}

// Renderiza lista
function renderLista(items) {
  listaEl.innerHTML = '';
  if (!items.length) {
    const li = document.createElement('li');
    li.className = 'item';
    li.innerHTML = `<span class="nome">Nenhum inscrito encontrado.</span>`;
    listaEl.appendChild(li);
    contadorEl.textContent = '0';
    return;
  }

  const fragment = document.createDocumentFragment();
  items.forEach(p => {
    const li = document.createElement('li');
    li.className = 'item';
    li.innerHTML = `
      <span class="nome">${p.nome}</span>
      <span class="badge">${p.categoria || '—'}</span>
    `;
    fragment.appendChild(li);
  });

  listaEl.appendChild(fragment);
  contadorEl.textContent = String(items.length);
}

// Aplica busca + filtro de categoria
function aplicarFiltros() {
  const termo = normalizeText(searchInput.value || '');
  const cat = categoriaSelect.value || '';

  filtrados = inscritos.filter(p => {
    const matchNome = normalizeText(p.nome).includes(termo);
    const matchCat = !cat || p.categoria === cat;
    return matchNome && matchCat;
  });

  // Já estão alfabeticamente ordenados por nome; mantém
  renderLista(filtrados);
}

// Eventos
searchInput.addEventListener('input', aplicarFiltros);
categoriaSelect.addEventListener('change', aplicarFiltros);

// Start
carregarTXT();
