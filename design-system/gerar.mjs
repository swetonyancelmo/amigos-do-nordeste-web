/*
 * Gera a vitrine do padrão de design em `design-system/site/`.
 *
 *   pnpm design-system
 *
 * A página NÃO redescreve o CSS à mão: ela lê `src/app/globals.css`,
 * `src/app/componentes.css` e o módulo do login, e injeta esse CSS de verdade
 * dentro de iframes. Cada demonstração é o componente real rodando, e os hex
 * das amostras de cor são extraídos do `:root`. Documentação que se escreve
 * sozinha não tem como divergir do código — que é o problema de toda
 * biblioteca de componentes escrita em Markdown.
 *
 * Saída:
 *   site/index.html       página inteira (é esta que vira Artifact)
 *   site/cards/*.html     um card por seção, para o Claude Design
 */

import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..');
const SAIDA = join(AQUI, 'site');

const ler = (...p) => readFileSync(join(RAIZ, ...p), 'utf8');
const base64 = (...p) => readFileSync(join(RAIZ, ...p)).toString('base64');

/* ------------------------------------------------------------- CSS do app */

const cssTokens = ler('src', 'app', 'globals.css').replace(/@import[^;]+;/g, '');
const cssComponentes = ler('src', 'app', 'componentes.css');

/* CSS Module: no arquivo os nomes são locais e `:global(.x)` marca o que
   escapa do módulo. Dentro do iframe não há compilador, então as classes
   valem como estão escritas e o `:global()` só precisa sair da frente. */
const cssLogin = ler('src', 'app', 'login', 'login.module.css').replace(
  /:global\(([^)]*)\)/g,
  '$1',
);

const FONTE_MARCA = base64('design-system', 'nunito-latin.woff2');
const LOGO = base64('design-system', 'logo-240.jpg');

/*
 * Dimensões lidas do próprio JPEG, no marcador SOF. Escrever largura e altura
 * à mão aqui é como o `Marca` errou a proporção do logo na primeira versão:
 * o número decora o atributo e ninguém confere. Lido do arquivo, não erra.
 */
function dimensoesJpeg(...caminho) {
  const b = readFileSync(join(RAIZ, ...caminho));
  for (let i = 2; i < b.length - 9; ) {
    if (b[i] !== 0xff) { i++; continue; }
    const marcador = b[i + 1];
    // SOF0..SOF15, tirando DHT (C4), JPG (C8) e DAC (CC), que não são frames.
    if (marcador >= 0xc0 && marcador <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marcador)) {
      return { altura: b.readUInt16BE(i + 5), largura: b.readUInt16BE(i + 7) };
    }
    i += 2 + b.readUInt16BE(i + 2);
  }
  throw new Error(`não achei o marcador SOF em ${caminho.join('/')}`);
}

const LOGO_DIM = dimensoesJpeg('design-system', 'logo-240.jpg');
const alturaLogo = (largura) => Math.round((largura * LOGO_DIM.altura) / LOGO_DIM.largura);

const cssFonte = `
@font-face {
  font-family: "Nunito";
  font-style: normal;
  font-weight: 700 800;
  font-display: block;
  src: url(data:font/woff2;base64,${FONTE_MARCA}) format("woff2");
}
:root { --fonte-nunito: "Nunito"; }
`;

/* --------------------------------------------------------------- Palco */

/*
 * Cada demonstração roda dentro de um iframe com o CSS do app inteiro. É a
 * única forma honesta de mostrar o componente: sem reescrever seletor, sem
 * prefixar classe, sem risco de o CSS da documentação vazar para dentro da
 * demonstração ou vice-versa. O que aparece no palco é o que a usuária vê.
 */
let contadorPalco = 0;

function palco(corpo, { fonte = false, fundo = 'var(--superficie)', altura = 0 } = {}) {
  const id = `palco-${++contadorPalco}`;
  const doc = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<style>${cssTokens}${fonte ? cssFonte : ''}${cssComponentes}
html,body{background:${fundo};padding:0;margin:0}
body{padding:24px}
</style></head><body>${corpo}</body></html>`;

  return `<iframe class="palco" id="${id}" title="Demonstração" loading="lazy"
    ${altura ? `style="height:${altura}px"` : ''}
    srcdoc="${doc.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"></iframe>`;
}

/* ------------------------------------------------------- Tokens do :root */

/* Lê os hex direto do globals.css: a amostra de cor nunca mente. */
function lerTokens() {
  const bloco = cssTokens.match(/:root\s*\{([\s\S]*?)\n\}/);
  const mapa = new Map();
  for (const [, nome, valor] of bloco[1].matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
    mapa.set(nome, valor.trim());
  }
  return mapa;
}

const TOKENS = lerTokens();
const cor = (n) => TOKENS.get(n);

const GRUPOS_DE_COR = [
  {
    titulo: 'Marca',
    nota: 'Saíram do logo. São as únicas cores com carga de identidade — use com parcimônia e nunca duas em disputa no mesmo bloco.',
    itens: [
      ['laranja', 'Raios do sol e tipografia do logo. É a cor de ação: botão principal, foco, link.'],
      ['laranja-escuro', 'Só para o hover do laranja.'],
      ['ambar', 'Gradiente do sol. Aparece no token --sol, quase nunca sozinha.'],
      ['verde', 'Cacto. Marca explicação do sistema, não sucesso.'],
      ['verde-escuro', 'Texto sobre --verde-claro, onde o verde puro não teria contraste.'],
      ['amarelo', 'Abelha. A ponta mais clara do --sol. Não use como fundo de texto.'],
    ],
  },
  {
    titulo: 'Superfícies',
    nota: 'O fundo é papel cor de areia, não cinza. É o que separa este sistema de qualquer painel administrativo.',
    itens: [
      ['pagina', 'Fundo da aplicação.'],
      ['superficie', 'Cartão, campo, painel de conteúdo.'],
      ['laranja-claro', 'Anel de foco do campo.'],
      ['verde-claro', 'Fundo do bloco de explicação.'],
      ['ambar-claro', 'Painel de identidade do login.'],
    ],
  },
  {
    titulo: 'Texto e linha',
    nota: 'Marrom quente, não preto. Preto puro sobre papel cor de areia vibra e cansa em jornada longa de digitação.',
    itens: [
      ['texto-forte', 'Corpo, título, rótulo de campo.'],
      ['texto-medio', 'Texto de apoio e legenda.'],
      ['texto-suave', 'Placeholder e campo desabilitado. Não use em texto que precisa ser lido.'],
      ['linha', 'Divisória e borda de cartão.'],
      ['linha-forte', 'Borda de campo, que precisa ser vista.'],
    ],
  },
  {
    titulo: 'Estado',
    nota: 'Uma cor só de erro. Não existe cor de "sucesso": quando algo dá certo o sistema navega, não pinta de verde.',
    itens: [
      ['erro', 'Texto e borda de erro.'],
      ['erro-claro', 'Fundo do bloco de erro.'],
    ],
  },
];

/* ------------------------------------------------------------------- Sol */

/* Mesmo desenho do componente Sol.tsx — 12 pontas, estrela alternando raio
   externo e interno. Repetido aqui porque a vitrine é HTML puro. */
function solSvg(className = '') {
  const RAIOS = 12;
  const pontos = Array.from({ length: RAIOS * 2 }, (_, i) => {
    const a = (Math.PI * i) / RAIOS - Math.PI / 2;
    const r = i % 2 === 0 ? 50 : 32;
    return `${(50 + r * Math.cos(a)).toFixed(2)},${(50 + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');

  return `<svg class="${className}" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
    <defs><radialGradient id="sol-miolo" cx="38%" cy="30%" r="78%">
      <stop offset="0%" stop-color="var(--amarelo)"/>
      <stop offset="55%" stop-color="var(--ambar)"/>
      <stop offset="100%" stop-color="var(--laranja)"/>
    </radialGradient></defs>
    <polygon points="${pontos}" fill="var(--laranja)"/>
    <circle cx="50" cy="50" r="30" fill="url(#sol-miolo)"/>
  </svg>`;
}

/* ------------------------------------------------------- Demonstrações */

const marcaHtml = (placa) => `
<div class="marca">
  <div class="marca__moldura ${placa ? 'marca__moldura--placa' : ''}">
    <img class="marca__logo" src="data:image/jpeg;base64,${LOGO}"
         alt="Associação Amigos do Nordeste" width="168" height="${alturaLogo(168)}">
  </div>
  <p class="marca__linha">Cadastro das famílias atendidas pela associação</p>
</div>`;

const DEMO_CAMPO = `
<div style="display:flex;flex-direction:column;gap:20px;max-width:380px">
  <div class="campo">
    <label class="campo__rotulo" for="d1">E-mail</label>
    <input class="campo__entrada" id="d1" value="associacao@amigosdone.org.br">
  </div>
  <div class="campo">
    <label class="campo__rotulo" for="d2">Comunidade</label>
    <input class="campo__entrada" id="d2" placeholder="Herdade de Baixo">
    <span class="campo__ajuda">A linha nova herda esta comunidade.</span>
  </div>
  <div class="campo">
    <label class="campo__rotulo" for="d3">Nome da responsável</label>
    <input class="campo__entrada" id="d3" aria-invalid="true" value="">
    <span class="campo__ajuda campo__ajuda--erro">Informe o nome de quem responde pela família.</span>
  </div>
  <div class="campo">
    <label class="campo__rotulo" for="d4">Município</label>
    <input class="campo__entrada" id="d4" value="Ibimirim" disabled>
  </div>
</div>`;

const DEMO_BOTAO = `
<div style="display:flex;flex-direction:column;gap:20px;max-width:380px">
  <div style="display:flex;gap:12px;flex-wrap:wrap">
    <button class="botao botao--primario">Salvar e abrir a próxima</button>
    <button class="botao botao--secundario">Cancelar</button>
  </div>
  <div style="display:flex;gap:12px;flex-wrap:wrap">
    <button class="botao botao--primario" disabled>Salvando…</button>
    <button class="botao botao--secundario" disabled>Cancelar</button>
  </div>
  <button class="botao botao--primario botao--largo">Entrar</button>
</div>`;

const DEMO_AVISO = `
<div style="display:flex;flex-direction:column;gap:16px;max-width:420px">
  <div class="aviso">
    <p class="aviso__titulo">Um ponto por comunidade</p>
    <p class="aviso__texto">O mapa marca comunidades, não famílias. O tamanho do ponto acompanha quantas famílias são atendidas ali.</p>
  </div>
  <div class="aviso aviso--erro" role="alert">
    <p class="aviso__titulo">Não deu para salvar</p>
    <p class="aviso__texto">A comunidade precisa estar preenchida antes de salvar a família.</p>
  </div>
  <p class="texto-apoio">Texto de apoio solto, para quando o recado não merece um bloco inteiro.</p>
</div>`;

const DEMO_LOGIN = `
<style>${cssLogin}
/* O palco é mais estreito que 900 px, então a media query do módulo não
   dispara e a tela cairia no empilhamento de celular — que é justamente onde
   a composição em duas colunas some. Aqui ela é forçada, porque o que esta
   demonstração precisa mostrar é a divisão. */
.tela{min-height:auto;grid-template-columns:1.05fr 1fr}
.identidade{padding:48px 32px}
.acesso{padding:48px 32px;border-left:1px solid var(--linha)}
.sol{bottom:-16%;width:46%}
</style>
<main class="tela">
  <section class="identidade">
    ${solSvg('sol')}
    <div class="conteudoIdentidade">
      <div class="marca">
        <div class="marca__moldura marca__moldura--placa">
          <img class="marca__logo" src="data:image/jpeg;base64,${LOGO}"
               alt="Associação Amigos do Nordeste" width="208" height="${alturaLogo(208)}">
        </div>
        <p class="marca__linha">Cadastro das famílias atendidas pela associação</p>
      </div>
      <p class="lugar">Sertão do Moxotó · Pernambuco</p>
    </div>
  </section>
  <section class="acesso">
    <form class="formulario" onsubmit="return false">
      <h1 class="titulo">Entrar</h1>
      <div class="campos">
        <div class="campo">
          <label class="campo__rotulo" for="L1">E-mail</label>
          <input class="campo__entrada" id="L1" type="email" value="associacao@amigosdone.org.br">
        </div>
        <div class="campo">
          <label class="campo__rotulo" for="L2">Senha</label>
          <!-- Sem value: campo de senha preenchido, mesmo com string inventada,
               é achado de scanner de segredo (e, de fato, a tela real também
               abre com a senha vazia). -->
          <input class="campo__entrada" id="L2" type="password">
        </div>
      </div>
      <button class="botao botao--primario botao--largo">Entrar</button>
    </form>
  </section>
</main>`;

/* A versão antiga, reconstruída com os mesmos `style` inline que ela tinha.
   Está aqui como argumento, não como nostalgia: é o que a equipe produz
   quando não existe uma camada de componentes para reusar. */
const DEMO_LOGIN_ANTES = `
<div style="background:var(--pagina);padding:40px;display:grid;place-items:center">
  <form style="width:100%;max-width:380px;background:var(--superficie);border:1px solid var(--linha);border-radius:10px;padding:28px;display:flex;flex-direction:column;gap:16px;box-shadow:var(--sombra)" onsubmit="return false">
    <div>
      <h1 style="margin:0;font-size:20px;color:var(--laranja)">Amigos do Nordeste</h1>
      <p style="margin:4px 0 0;color:var(--texto-medio);font-size:14px">Cadastro de famílias</p>
    </div>
    <label style="display:flex;flex-direction:column;gap:6px">
      <span style="font-size:12px;color:var(--texto-medio)">E-mail</span>
      <input style="padding:10px 12px;border-radius:8px;border:1px solid var(--linha);font-size:14px;font-family:inherit">
    </label>
    <label style="display:flex;flex-direction:column;gap:6px">
      <span style="font-size:12px;color:var(--texto-medio)">Senha</span>
      <input type="password" style="padding:10px 12px;border-radius:8px;border:1px solid var(--linha);font-size:14px;font-family:inherit">
    </label>
    <button style="padding:11px 16px;border-radius:8px;border:none;cursor:pointer;background:var(--laranja);color:#fff;font-weight:600;font-size:14px">Entrar</button>
  </form>
</div>`;

/* ----------------------------------------------------------- Blocos HTML */

const escapar = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const codigo = (jsx) => `<pre class="codigo"><code>${escapar(jsx.trim())}</code></pre>`;

function amostrasDeCor() {
  return GRUPOS_DE_COR.map(
    (g) => `
    <div class="grupo-cor">
      <h3>${g.titulo}</h3>
      <p class="nota">${g.nota}</p>
      <ul class="cores">
        ${g.itens
          .map(
            ([nome, uso]) => `
          <li>
            <span class="amostra" style="background:${cor(nome)}"></span>
            <div>
              <code>--${nome}</code>
              <span class="hex">${cor(nome)}</span>
              <p>${uso}</p>
            </div>
          </li>`,
          )
          .join('')}
      </ul>
    </div>`,
  ).join('');
}

function escalaDeTipo() {
  const escala = [
    ['t-marca', 'Assinatura', 'Amigos do Nordeste'],
    ['t-titulo', 'Título de tela', 'Necessidades da comunidade'],
    ['t-medio', 'Entrada de formulário', 'Herdade de Baixo'],
    ['t-base', 'Corpo', 'A busca é pelo nome da responsável.'],
    ['t-apoio', 'Apoio', 'A linha nova herda esta comunidade.'],
    ['t-micro', 'Etiqueta', 'NÃO EXISTE “CRIAR CONTA” AQUI'],
  ];

  return `<ul class="tipos">${escala
    .map(
      ([token, papel, exemplo]) => `
      <li>
        <div class="tipo-meta"><code>--${token}</code><span>${papel}</span></div>
        <p class="tipo-exemplo" style="font-size:${cor(token)}">${exemplo}</p>
      </li>`,
    )
    .join('')}</ul>`;
}

function escalaDeEspaco() {
  const passos = ['e-1', 'e-2', 'e-3', 'e-4', 'e-5', 'e-6', 'e-7', 'e-8'];
  return `<ul class="espacos">${passos
    .map(
      (t) => `<li>
        <span class="barra" style="width:${cor(t)}"></span>
        <code>--${t}</code><span class="hex">${cor(t)}</span>
      </li>`,
    )
    .join('')}</ul>`;
}

/* ---------------------------------------------------------------- Seções */

const SECOES = [
  {
    id: 'regras',
    titulo: 'As três regras',
    html: `
      <p class="chamada">Este sistema atende uma associação que cadastra famílias no Sertão do Moxotó.
      Quem digita é uma pessoa só, em computador antigo e internet ruim. As regras abaixo existem
      por causa disso, não por gosto.</p>
      <ol class="regras">
        <li>
          <h3>Cor só por token</h3>
          <p>Nenhum componente escreve hex. Sempre <code>var(--laranja)</code>, nunca <code>#e54314</code>.
          As cores saíram do logo da associação e mudam juntas quando mudarem.</p>
        </li>
        <li>
          <h3>Classe de componente antes de <code>style</code></h3>
          <p>Monte a tela com as classes de <code>componentes.css</code>. <code>style</code> inline
          só para layout de uma tela só — e, mesmo assim, prefira um CSS Module.
          Foi o <code>style</code> espalhado que deixou a primeira tela de login sem cara nenhuma.</p>
        </li>
        <li>
          <h3>Campo grande, foco visível</h3>
          <p>46&nbsp;px de altura e 17&nbsp;px de fonte nos campos, e foco sempre visível.
          O cadastro é digitado no teclado de ponta a ponta; campo pequeno erra o toque
          e foco invisível perde a pessoa no meio do formulário.</p>
        </li>
      </ol>`,
  },
  {
    id: 'cores',
    titulo: 'Cores',
    html: amostrasDeCor(),
  },
  {
    id: 'tipografia',
    titulo: 'Tipografia',
    html: `
      <p class="nota">Duas famílias. <strong>Nunito</strong> (700/800) em título e assinatura, porque é
      o que chega perto do wordmark do logo no que é livre. <strong>system-ui</strong> no corpo e nos
      campos, porque carrega na hora e não dá salto de layout na internet da associação.
      Nada de uma terceira família.</p>
      ${escalaDeTipo()}`,
  },
  {
    id: 'espacamento',
    titulo: 'Espaçamento e forma',
    html: `
      <p class="nota">Múltiplos de 4, sem exceção. Se um espaço parece precisar de 13&nbsp;px,
      o problema é outro.</p>
      ${escalaDeEspaco()}
      <div class="formas">
        <div><span class="forma" style="border-radius:${cor('raio-p')}"></span><code>--raio-p</code><span class="hex">${cor('raio-p')}</span><p>Etiqueta, chip.</p></div>
        <div><span class="forma" style="border-radius:${cor('raio')}"></span><code>--raio</code><span class="hex">${cor('raio')}</span><p>Campo, botão, aviso.</p></div>
        <div><span class="forma" style="border-radius:${cor('raio-g')}"></span><code>--raio-g</code><span class="hex">${cor('raio-g')}</span><p>Cartão, placa da marca.</p></div>
        <div><span class="forma sombra"></span><code>--sombra</code><p>Cartão e placa. A sombra alta fica para diálogo.</p></div>
      </div>
      <div class="sol-demo">
        ${solSvg('')}
        <div>
          <code>--sol</code>
          <p>O único gradiente da identidade, e o motivo dos raios como forma solta.
          Serve de marca d'água e de faixa — nunca como fundo de texto.
          <strong>Não é a logo</strong>: a logo é o arquivo da associação, com cacto e abelha,
          e não se recorta nem se recolore.</p>
        </div>
      </div>`,
  },
  {
    id: 'marca',
    titulo: 'Marca',
    demo: palco(marcaHtml(false), { fonte: true, altura: 300 }),
    html: `
      <p class="nota">O componente <code>Marca</code> mostra o arquivo oficial, que já traz o nome.
      Por isso ele <strong>não</strong> escreve “Amigos do Nordeste” em texto ao lado: o nome já está
      na imagem, e repetir dá leitura dobrada no leitor de tela.</p>
      <div class="atencao">
        <h4>O arquivo é JPEG, de fundo branco opaco</h4>
        <p>Sobre qualquer fundo que não seja branco ele aparece como um retângulo branco.
        Para isso existe a prop <code>placa</code>, que transforma esse retângulo numa placa
        arredondada de propósito. Se a associação mandar um PNG ou SVG com fundo transparente,
        troque o arquivo e a <code>placa</code> vira opcional de fato.</p>
      </div>`,
    depois: palco(
      `<div style="background:var(--ambar-claro);padding:32px;border-radius:12px">${marcaHtml(true)}</div>`,
      { fonte: true, altura: 380 },
    ),
    depoisLegenda: 'Com <code>placa</code>, sobre <code>--ambar-claro</code>.',
    codigo: `<Marca largura={208} placa linha="Cadastro das famílias atendidas pela associação" />`,
  },
  {
    id: 'campo',
    titulo: 'Campo',
    demo: palco(DEMO_CAMPO, { altura: 460 }),
    html: `
      <p class="nota">Use sempre o componente, nunca <code>&lt;label&gt;</code> + <code>&lt;input&gt;</code>
      montados na mão: aqui o <code>id</code>, o <code>aria-describedby</code> e o estado inválido já vêm
      ligados. É isso que faz o leitor de tela anunciar o erro junto do campo, em vez de largar a
      mensagem solta no fim do formulário.</p>
      <p class="nota">Acima, de cima para baixo: normal, com texto de ajuda, inválido e desabilitado.</p>`,
    codigo: `<Campo
  rotulo="Nome da responsável"
  value={nome}
  onChange={(e) => setNome(e.target.value)}
  erro={erros.nome}
  ajuda="Como a associação conhece a família."
/>`,
  },
  {
    id: 'botao',
    titulo: 'Botão',
    demo: palco(DEMO_BOTAO, { altura: 260 }),
    html: `
      <p class="nota">Duas variantes, e elas são de propósito, não de aparência:
      <code>primario</code> para a ação principal — <strong>uma por tela</strong> —
      e <code>secundario</code> para o resto. Se uma tela parece precisar de dois botões
      primários, ela tem duas telas dentro.</p>`,
    codigo: `<Botao type="submit" largo disabled={enviando}>
  {enviando ? 'Entrando…' : 'Entrar'}
</Botao>`,
  },
  {
    id: 'aviso',
    titulo: 'Aviso',
    demo: palco(DEMO_AVISO, { altura: 330 }),
    html: `
      <p class="nota">O verde do cacto marca <strong>regra do sistema</strong>; o vermelho marca
      <strong>algo que falhou agora</strong>. O tom <code>erro</code> já sai com
      <code>role="alert"</code>, então o leitor de tela anuncia sem precisar mover o foco.</p>
      <p class="nota">Serve para explicar uma decisão <strong>no lugar onde a pessoa esbarra
      nela</strong> — o mapa que marca comunidade e não família, a linha nova que já vem com a
      comunidade preenchida. Regra que surpreende na hora vira chamado; regra explicada ali
      não vira.</p>
      <p class="nota">O contrário também vale: o que a pessoa já sabe não merece um bloco.
      A tela de login teve um aviso de “não existe criar conta” e ele saiu — quem usa o sistema
      é uma pessoa só, que não precisa da explicação todo dia.</p>`,
    codigo: `<Aviso titulo="Um ponto por comunidade">
  O mapa marca comunidades, não famílias. O tamanho do
  ponto acompanha quantas famílias são atendidas ali.
</Aviso>`,
  },
  {
    id: 'login',
    titulo: 'A tela de login',
    html: `
      <p class="nota">O cartão branco no meio da tela cinza é o que qualquer sistema faz, e não
      dizia nada sobre esta associação. A tela agora é dividida: à esquerda o lugar — a marca sobre
      o papel cor de areia, com o sol nascendo do canto; à direita o trabalho. No celular a
      identidade vira uma faixa de topo, porque a pessoa abriu o sistema para entrar, não para
      ver o logo.</p>`,
    comparacao: {
      antes: palco(DEMO_LOGIN_ANTES, { fundo: 'var(--pagina)', altura: 380 }),
      depois: palco(DEMO_LOGIN, { fonte: true, altura: 620 }),
    },
  },
];

/* ------------------------------------------------------------- CSS da doc */

/*
 * Neutros puxados para o quente, na direção do laranja da marca — cinza puro
 * ao lado desta paleta parece descuido. Os tokens da doc levam prefixo --doc-
 * para nunca colidirem com os do produto, que ficam disponíveis nas amostras.
 */
const CSS_DOC = `
${cssFonte}

/*
 * Os tokens do produto, reemitidos a partir do que foi lido do globals.css.
 * A doc precisa deles para o desenho do sol, a borda do bloco de atenção e as
 * etiquetas — mas não do reset nem do "html, body" do app, que brigariam com
 * o layout da página. Por isso só o :root vem, não o arquivo inteiro.
 */
:root {
${[...TOKENS].map(([nome, valor]) => `  --${nome}: ${valor};`).join('\n')}
}

:root {
  --doc-fundo: #fbf8f4;
  --doc-superficie: #ffffff;
  --doc-texto: #221c18;
  --doc-suave: #6f655c;
  --doc-linha: #e7ded4;
  --doc-linha-forte: #d5c8ba;
  --doc-acento: #c93a11;
  --doc-codigo-fundo: #f4ede5;
  --doc-sombra: 0 1px 2px rgb(31 27 24 / 5%), 0 12px 32px -18px rgb(31 27 24 / 22%);
}

@media (prefers-color-scheme: dark) {
  :root {
    --doc-fundo: #191411;
    --doc-superficie: #221b17;
    --doc-texto: #f2ebe4;
    --doc-suave: #a89b8e;
    --doc-linha: #362c25;
    --doc-linha-forte: #4a3d33;
    --doc-acento: #f49924;
    --doc-codigo-fundo: #2b221c;
    --doc-sombra: 0 1px 2px rgb(0 0 0 / 30%), 0 12px 32px -18px rgb(0 0 0 / 60%);
  }
}

:root[data-tema="dark"] {
  --doc-fundo: #191411;
  --doc-superficie: #221b17;
  --doc-texto: #f2ebe4;
  --doc-suave: #a89b8e;
  --doc-linha: #362c25;
  --doc-linha-forte: #4a3d33;
  --doc-acento: #f49924;
  --doc-codigo-fundo: #2b221c;
  --doc-sombra: 0 1px 2px rgb(0 0 0 / 30%), 0 12px 32px -18px rgb(0 0 0 / 60%);
}

:root[data-tema="light"] {
  --doc-fundo: #fbf8f4;
  --doc-superficie: #ffffff;
  --doc-texto: #221c18;
  --doc-suave: #6f655c;
  --doc-linha: #e7ded4;
  --doc-linha-forte: #d5c8ba;
  --doc-acento: #c93a11;
  --doc-codigo-fundo: #f4ede5;
  --doc-sombra: 0 1px 2px rgb(31 27 24 / 5%), 0 12px 32px -18px rgb(31 27 24 / 22%);
}

* { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--doc-fundo);
  color: var(--doc-texto);
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

code, .hex, pre {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
}

.envelope {
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 24px 96px;
}

/* -------------------------------------------------------------- cabeçalho */

.cabecalho {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 28px;
  padding: 56px 0 40px;
  border-bottom: 2px solid var(--doc-texto);
}

.cabecalho img {
  width: 104px;
  height: auto;
  border-radius: 12px;
  background: #fff;
  padding: 8px;
}

.cabecalho h1 {
  margin: 0;
  font-family: "Nunito", system-ui, sans-serif;
  font-weight: 800;
  font-size: clamp(2rem, 5vw, 3rem);
  line-height: 1.05;
  letter-spacing: -0.02em;
  text-wrap: balance;
}

.cabecalho p {
  margin: 8px 0 0;
  max-width: 58ch;
  color: var(--doc-suave);
}

.selo-gerado {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 6px 12px;
  border: 1px solid var(--doc-linha-forte);
  border-radius: 999px;
  font-size: 0.8125rem;
  color: var(--doc-suave);
}

.selo-gerado::before {
  content: "";
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--verde);
}

/* ------------------------------------------------------------------ corpo */

.corpo {
  display: grid;
  grid-template-columns: 1fr;
  gap: 48px;
  padding-top: 48px;
}

@media (min-width: 1000px) {
  .corpo {
    grid-template-columns: 190px 1fr;
    gap: 64px;
  }

  .indice {
    position: sticky;
    top: 32px;
    align-self: start;
  }
}

.indice ol {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  font-size: 0.9375rem;
}

@media (min-width: 1000px) {
  .indice ol { flex-direction: column; }
}

.indice a {
  color: var(--doc-suave);
  text-decoration: none;
  border-bottom: 1px solid transparent;
}

.indice a:hover,
.indice a:focus-visible {
  color: var(--doc-acento);
  border-bottom-color: currentColor;
}

.secao + .secao { margin-top: 72px; }

.secao > h2 {
  margin: 0 0 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--doc-linha);
  font-family: "Nunito", system-ui, sans-serif;
  font-weight: 800;
  font-size: 1.75rem;
  letter-spacing: -0.015em;
}

.secao h3 {
  margin: 0 0 6px;
  font-family: "Nunito", system-ui, sans-serif;
  font-weight: 700;
  font-size: 1.125rem;
}

.chamada {
  max-width: 62ch;
  font-size: 1.0625rem;
}

.nota {
  max-width: 66ch;
  color: var(--doc-suave);
}

.secao p { margin: 0 0 14px; }

.secao code {
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--doc-codigo-fundo);
  font-size: 0.875em;
}

/* ----------------------------------------------------------------- regras */

.regras {
  counter-reset: r;
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 4px;
}

.regras li {
  counter-increment: r;
  display: grid;
  grid-template-columns: 44px 1fr;
  gap: 16px;
  padding: 20px 0;
  border-top: 1px solid var(--doc-linha);
}

.regras li::before {
  content: counter(r);
  grid-column: 1;
  grid-row: 1;
  font-family: "Nunito", system-ui, sans-serif;
  font-weight: 800;
  font-size: 1.5rem;
  color: var(--doc-acento);
  line-height: 1.2;
}

/* h3 e p são irmãos diretos do li: sem prender os dois na coluna 2, o
   parágrafo cai na coluna do número e vira uma tira de 44 px. */
.regras li > h3,
.regras li > p { grid-column: 2; }

.regras p { margin: 0; color: var(--doc-suave); max-width: 62ch; }

/* ------------------------------------------------------------------ cores */

.grupo-cor + .grupo-cor { margin-top: 36px; }

.cores {
  list-style: none;
  margin: 16px 0 0;
  padding: 0;
  display: grid;
  gap: 2px;
}

.cores li {
  display: grid;
  grid-template-columns: 52px 1fr;
  gap: 16px;
  align-items: start;
  padding: 12px 0;
  border-top: 1px solid var(--doc-linha);
}

.amostra {
  width: 52px;
  height: 52px;
  border-radius: 8px;
  border: 1px solid var(--doc-linha-forte);
}

.cores .hex,
.espacos .hex,
.formas .hex {
  margin-left: 10px;
  font-size: 0.8125rem;
  color: var(--doc-suave);
}

/* Só o hex fica em caixa alta. Em px, "48PX" parece grito. */
.cores .hex { text-transform: uppercase; }

.cores p { margin: 4px 0 0; color: var(--doc-suave); font-size: 0.9375rem; max-width: 60ch; }

/* ------------------------------------------------------------- tipografia */

.tipos, .espacos {
  list-style: none;
  margin: 24px 0 0;
  padding: 0;
}

.tipos li {
  padding: 16px 0;
  border-top: 1px solid var(--doc-linha);
}

.tipo-meta {
  display: flex;
  align-items: baseline;
  gap: 12px;
  font-size: 0.8125rem;
  color: var(--doc-suave);
}

.tipo-exemplo {
  margin: 8px 0 0 !important;
  font-family: "Nunito", system-ui, sans-serif;
  font-weight: 700;
  line-height: 1.25;
}

/* ------------------------------------------------------------- espaçamento */

.espacos li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 7px 0;
}

.barra {
  height: 14px;
  border-radius: 3px;
  background: var(--doc-acento);
  flex: 0 0 auto;
}

.formas {
  display: flex;
  flex-wrap: wrap;
  gap: 28px;
  margin-top: 32px;
}

.forma {
  display: block;
  width: 76px;
  height: 76px;
  margin-bottom: 10px;
  background: var(--doc-codigo-fundo);
  border: 1px solid var(--doc-linha-forte);
}

.forma.sombra {
  border-radius: 10px;
  background: var(--doc-superficie);
  box-shadow: var(--doc-sombra);
}

.formas p { margin: 4px 0 0; font-size: 0.875rem; color: var(--doc-suave); max-width: 22ch; }

.sol-demo {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-top: 40px;
  padding-top: 28px;
  border-top: 1px solid var(--doc-linha);
}

.sol-demo svg { width: 92px; height: 92px; flex: 0 0 auto; }
.sol-demo p { margin: 6px 0 0; color: var(--doc-suave); font-size: 0.9375rem; max-width: 58ch; }

/* ------------------------------------------------------------------ palco */

/*
 * Os componentes são demonstrados dentro de iframes com o CSS real do app.
 * O produto não tem tema escuro, então o palco fica claro nos dois temas da
 * documentação — mostrar o componente invertido seria mentira.
 */
.palco {
  display: block;
  width: 100%;
  height: 300px;
  border: 1px solid var(--doc-linha-forte);
  border-radius: 12px;
  background: #fff;
  color-scheme: light;
}

.legenda-palco {
  margin: 8px 0 0 !important;
  font-size: 0.8125rem;
  color: var(--doc-suave);
}

.palco-bloqueado {
  margin: 0 !important;
  padding: 20px;
  border: 1px dashed var(--doc-linha-forte);
  border-radius: 12px;
  font-size: 0.9375rem;
  color: var(--doc-suave);
}

.codigo {
  margin: 20px 0 0;
  padding: 16px 18px;
  overflow-x: auto;
  background: var(--doc-codigo-fundo);
  border: 1px solid var(--doc-linha);
  border-radius: 10px;
  font-size: 0.875rem;
  line-height: 1.55;
}

.codigo code { background: none; padding: 0; font-size: inherit; }

.atencao {
  margin: 24px 0;
  padding: 16px 18px;
  border-left: 3px solid var(--ambar);
  border-radius: 0 8px 8px 0;
  background: var(--doc-codigo-fundo);
}

.atencao h4 {
  margin: 0 0 6px;
  font-family: "Nunito", system-ui, sans-serif;
  font-size: 0.9375rem;
  font-weight: 800;
}

.atencao p { margin: 0; font-size: 0.9375rem; color: var(--doc-suave); max-width: 64ch; }

/* ------------------------------------------------------------- comparação */

/* Empilhada, não lado a lado: em duas colunas cada palco fica estreito demais
   e a tela de login cai no layout de celular, escondendo a divisão que é o
   ponto da mudança. */
.comparacao {
  display: grid;
  gap: 40px;
  margin-top: 24px;
}

.comparacao h3 {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.etiqueta {
  padding: 3px 10px;
  border-radius: 999px;
  font-family: system-ui, sans-serif;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.etiqueta--antes { background: var(--doc-codigo-fundo); color: var(--doc-suave); }
.etiqueta--depois { background: var(--verde-claro); color: var(--verde-escuro); }

/* --------------------------------------------------------------- rodapé */

.rodape-doc {
  margin-top: 88px;
  padding-top: 24px;
  border-top: 1px solid var(--doc-linha);
  font-size: 0.9375rem;
  color: var(--doc-suave);
}

.rodape-doc p { margin: 0 0 8px; max-width: 66ch; }

a { color: var(--doc-acento); }

:focus-visible {
  outline: 2px solid var(--doc-acento);
  outline-offset: 3px;
  border-radius: 3px;
}

@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
`;

/*
 * Ajusta a altura de cada palco ao conteúdo, para não sobrar nem faltar.
 *
 * E, se o palco não renderizar — um visualizador com Content-Security-Policy
 * restritiva pode barrar iframe com srcdoc —, troca o quadro vazio por um
 * recado. Caixa branca vazia numa documentação de design parece componente
 * quebrado; melhor dizer o que houve e para onde ir.
 */
const JS_DOC = `
function corpoDo(f) {
  try {
    var d = f.contentDocument;
    return d && d.body && d.body.children.length ? d : null;
  } catch (e) {
    return null;
  }
}

function ajustar(f) {
  var d = corpoDo(f);
  if (d) f.style.height = Math.ceil(d.documentElement.scrollHeight) + 'px';
}

function ajustarTodos() {
  document.querySelectorAll('iframe.palco').forEach(function (f) {
    ajustar(f);
    f.addEventListener('load', function () { ajustar(f); });
  });
}

function conferirBloqueio() {
  document.querySelectorAll('iframe.palco').forEach(function (f) {
    if (corpoDo(f)) return;
    var aviso = document.createElement('p');
    aviso.className = 'palco-bloqueado';
    aviso.textContent =
      'Esta demonstração roda num iframe e o visualizador atual bloqueou. ' +
      'Rode "pnpm design-system" e abra design-system/site/index.html direto no navegador.';
    f.replaceWith(aviso);
  });
}

document.addEventListener('DOMContentLoaded', ajustarTodos);
window.addEventListener('load', function () {
  ajustarTodos();
  setTimeout(ajustarTodos, 400);
  setTimeout(conferirBloqueio, 2500);
});
window.addEventListener('resize', ajustarTodos);
`;

/* ------------------------------------------------------------- Montagem */

function secaoHtml(s) {
  const partes = [`<section class="secao" id="${s.id}"><h2>${s.titulo}</h2>`];
  if (s.html) partes.push(s.html);
  if (s.demo) partes.push(s.demo);
  if (s.depois) {
    partes.push(s.depois);
    if (s.depoisLegenda) partes.push(`<p class="legenda-palco">${s.depoisLegenda}</p>`);
  }
  if (s.codigo) partes.push(codigo(s.codigo));
  if (s.comparacao) {
    partes.push(`<div class="comparacao">
      <div>
        <h3><span class="etiqueta etiqueta--antes">Antes</span></h3>
        ${s.comparacao.antes}
        <p class="legenda-palco">Tudo em <code>style</code> inline, rótulo de 12&nbsp;px cinza,
        campo de 38&nbsp;px. A única cor da associação era o título, e o resto serviria para
        qualquer sistema de qualquer lugar.</p>
      </div>
      <div>
        <h3><span class="etiqueta etiqueta--depois">Depois</span></h3>
        ${s.comparacao.depois}
        <p class="legenda-palco">Componentes e tokens, e a identidade com lugar próprio.
        Composição de desktop — abaixo de 900&nbsp;px a identidade vira uma faixa de topo
        e o formulário sobe.</p>
      </div>
    </div>`);
  }
  partes.push('</section>');
  return partes.join('\n');
}

const indice = SECOES.map((s) => `<li><a href="#${s.id}">${s.titulo}</a></li>`).join('');

const pagina = `<title>Padrão de design · Cadastro de Famílias</title>
<style>${CSS_DOC}</style>

<div class="envelope">
  <header class="cabecalho">
    <img src="data:image/jpeg;base64,${LOGO}" alt="Associação Amigos do Nordeste">
    <div>
      <h1>Padrão de design</h1>
      <p>Cadastro de famílias da Associação Amigos do Nordeste — Sertão do Moxotó, Pernambuco.
      O que uma tela nova deve reusar, e por quê.</p>
      <span class="selo-gerado">Gerado de <code>src/app/globals.css</code> e <code>componentes.css</code></span>
    </div>
  </header>

  <div class="corpo">
    <nav class="indice" aria-label="Seções"><ol>${indice}</ol></nav>
    <main>
      ${SECOES.map(secaoHtml).join('\n')}
      <footer class="rodape-doc">
        <p>Cada demonstração acima é o componente real: a página injeta
        <code>globals.css</code> e <code>componentes.css</code> direto do <code>src/</code>
        dentro de um iframe. Se o CSS mudar e esta página não for regerada, ela não fica
        desatualizada — ela para de bater com o repositório, e é para isso que serve
        <code>pnpm design-system</code>.</p>
        <p>O produto não tem tema escuro. Os palcos ficam claros nos dois temas desta
        documentação de propósito.</p>
      </footer>
    </main>
  </div>
</div>

<script>${JS_DOC}</script>
`;

/* --------------------------------------------------------------- Cards */

/* Um arquivo por seção para o Claude Design. A primeira linha é o marcador
   @dsCard, que é como o painel monta o índice de cards. */
const CARDS = [
  ['fundamentos', 'Fundamentos', 'Cores, tipografia, espaçamento e forma', ['regras', 'cores', 'tipografia', 'espacamento']],
  ['marca', 'Marca', 'Assinatura da associação e a regra da placa', ['marca']],
  ['formulario', 'Formulário', 'Campo em quatro estados e as duas variantes de botão', ['campo', 'botao']],
  ['avisos', 'Avisos', 'Explicação em verde, erro em vermelho', ['aviso']],
  ['login', 'Tela de login', 'Antes e depois do padrão', ['login']],
];

function cardHtml(nome, subtitulo, ids) {
  const corpo = SECOES.filter((s) => ids.includes(s.id)).map(secaoHtml).join('\n');
  return `<!-- @dsCard group="Cadastro de Famílias" -->
<title>${nome} · Padrão de design</title>
<style>${CSS_DOC}</style>
<div class="envelope">
  <header class="cabecalho">
    <img src="data:image/jpeg;base64,${LOGO}" alt="Associação Amigos do Nordeste">
    <div><h1>${nome}</h1><p>${subtitulo}</p></div>
  </header>
  <div class="corpo"><main>${corpo}</main></div>
</div>
<script>${JS_DOC}</script>
`;
}

/* ---------------------------------------------------------------- Escrita */

rmSync(SAIDA, { recursive: true, force: true });
mkdirSync(join(SAIDA, 'cards'), { recursive: true });

writeFileSync(join(SAIDA, 'index.html'), pagina);
for (const [arquivo, nome, subtitulo, ids] of CARDS) {
  writeFileSync(join(SAIDA, 'cards', `${arquivo}.html`), cardHtml(nome, subtitulo, ids));
}

const kb = (s) => `${(Buffer.byteLength(s) / 1024).toFixed(0)} kB`;
console.log(`site/index.html            ${kb(pagina)}`);
for (const [arquivo, nome, subtitulo, ids] of CARDS) {
  console.log(`site/cards/${arquivo}.html`.padEnd(27), kb(cardHtml(nome, subtitulo, ids)));
}
console.log(`\n${TOKENS.size} tokens lidos do :root.`);
