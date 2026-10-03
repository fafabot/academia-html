// ========================================
// 1 - DADOS DO APLICATIVO
// ========================================

let usuario = {
  nome: localStorage.getItem("academia_nome") || "Atleta",
  peso: Number(localStorage.getItem("academia_peso")) || 75,
  metaPeso: Number(localStorage.getItem("academia_meta")) || 70
};

let paginaAtual = "overview";

let treinos = [
  { nome: "Peito e Tríceps", duracao: "55 min", status: "Concluído" },
  { nome: "Costas e Bíceps", duracao: "50 min", status: "Planejado" },
  { nome: "Pernas", duracao: "60 min", status: "Planejado" }
];

let refeicoes = [
  { nome: "Café da manhã", calorias: 420, status: "Registrado" },
  { nome: "Almoço", calorias: 680, status: "Registrado" },
  { nome: "Jantar", calorias: 520, status: "Planejado" }
];

let pesos = [77, 76.4, 76.1, 75.8, 75.5, 75.2, 75];


// ========================================
// 2 - ELEMENTOS
// ========================================

let loginScreen = document.getElementById("login-screen");
let dashboard = document.getElementById("dashboard");
let pageContent = document.getElementById("page-content");
let loginForm = document.getElementById("login-form");
let demoLogin = document.getElementById("demo-login");
let logoutButton = document.getElementById("logout-button");


// ========================================
// 3 - LOGIN
// ========================================

function entrar() {
  loginScreen.classList.add("hidden");
  dashboard.classList.remove("hidden");

  document.getElementById("sidebar-name").textContent = usuario.nome;
  mostrarPagina("overview");
}

loginForm.addEventListener("submit", function(event) {
  event.preventDefault();

  let email = document.getElementById("email").value;

  if (email) {
    usuario.nome = email.split("@")[0];
    localStorage.setItem("academia_nome", usuario.nome);
    entrar();
  }
});

demoLogin.addEventListener("click", function() {
  usuario.nome = "Atleta";
  localStorage.setItem("academia_nome", usuario.nome);
  entrar();
});

logoutButton.addEventListener("click", function() {
  dashboard.classList.add("hidden");
  loginScreen.classList.remove("hidden");
});


// ========================================
// 4 - NAVEGAÇÃO
// ========================================

document.querySelectorAll("[data-page]").forEach(function(botao) {
  botao.addEventListener("click", function() {
    mostrarPagina(botao.dataset.page);
  });
});

function mostrarPagina(pagina) {
  paginaAtual = pagina;

  document.querySelectorAll(".nav-item[data-page]").forEach(function(item) {
    item.classList.remove("active");
  });

  document.querySelectorAll('[data-page="' + pagina + '"]').forEach(function(item) {
    item.classList.add("active");
  });

  if (pagina === "overview") mostrarVisaoGeral();
  if (pagina === "workouts") mostrarTreinos();
  if (pagina === "diet") mostrarAlimentacao();
  if (pagina === "evolution") mostrarEvolucao();
  if (pagina === "profile") mostrarPerfil();
  if (pagina === "aura") mostrarAura();
}


// ========================================
// 5 - VISÃO GERAL
// ========================================

function mostrarVisaoGeral() {
  pageContent.innerHTML = `
    <div class="page-heading">
      <h1>Olá, ${usuario.nome} 👋</h1>
      <p>Acompanhe seus treinos, alimentação e evolução.</p>
    </div>

    <div class="grid stats">
      <div class="card">
        <div class="stat-label">Peso atual</div>
        <div class="stat-value">${usuario.peso.toFixed(1)} <span class="stat-label">kg</span></div>
      </div>

      <div class="card">
        <div class="stat-label">Meta de peso</div>
        <div class="stat-value accent">${usuario.metaPeso.toFixed(1)} <span class="stat-label">kg</span></div>
      </div>

      <div class="card">
        <div class="stat-label">Treinos no mês</div>
        <div class="stat-value">12</div>
      </div>

      <div class="card">
        <div class="stat-label">Calorias médias</div>
        <div class="stat-value pink">1.620</div>
      </div>
    </div>

    <div class="grid two-columns">
      <div class="card">
        <h2>Evolução recente</h2>
        <p class="muted">Variação do peso nos últimos registros.</p>
        <div class="chart">
          ${pesos.map(function(peso) {
            let altura = Math.max(25, ((peso - 74) / 4) * 100);
            return '<div class="bar" title="' + peso + ' kg" style="height:' + altura + '%"></div>';
          }).join("")}
        </div>
      </div>

      <div class="card">
        <h2>Próximo treino</h2>
        <div class="list">
          <div class="list-row"><span>Costas e Bíceps</span><strong>50 min</strong></div>
          <div class="list-row"><span>Quarta-feira</span><span class="accent">18:00</span></div>
          <div class="list-row"><span>Status</span><span class="muted">Planejado</span></div>
        </div>
      </div>
    </div>

    <div class="grid two-columns">
      <div class="card">
        <h2>Alimentação de hoje</h2>
        <div class="list">
          ${refeicoes.map(function(refeicao) {
            return '<div class="list-row"><span>' + refeicao.nome + '</span><span>' + refeicao.calorias + ' kcal</span></div>';
          }).join("")}
        </div>
      </div>

      <div class="card">
        <h2>Assistente Aura</h2>
        <p class="muted">Precisa de ajuda com treino ou alimentação?</p>
        <button class="action-button" onclick="mostrarPagina('aura')">Abrir Aura</button>
      </div>
    </div>
  `;
}


// ========================================
// 6 - TREINOS
// ========================================

function mostrarTreinos() {
  pageContent.innerHTML = `
    <div class="page-heading">
      <h1>Treinos</h1>
      <p>Organize seus exercícios e acompanhe sua rotina.</p>
    </div>

    <div class="grid two-columns">
      <div class="card">
        <h2>Meus treinos</h2>
        <div class="list">
          ${treinos.map(function(treino) {
            return '<div class="list-row"><div><strong>' + treino.nome + '</strong><div class="muted">' + treino.duracao + '</div></div><span class="accent">' + treino.status + '</span></div>';
          }).join("")}
        </div>
      </div>

      <div class="card">
        <h2>Resumo</h2>
        <div class="stat-value">12</div>
        <p class="muted">treinos realizados este mês</p>
        <div class="progress"><div style="width: 80%"></div></div>
      </div>
    </div>
  `;
}


// ========================================
// 7 - ALIMENTAÇÃO
// ========================================

function mostrarAlimentacao() {
  pageContent.innerHTML = `
    <div class="page-heading">
      <h1>Alimentação</h1>
      <p>Acompanhe suas refeições e consumo diário.</p>
    </div>

    <div class="grid stats">
      <div class="card"><div class="stat-label">Calorias</div><div class="stat-value">1.620</div></div>
      <div class="card"><div class="stat-label">Proteínas</div><div class="stat-value accent">128 g</div></div>
      <div class="card"><div class="stat-label">Carboidratos</div><div class="stat-value">174 g</div></div>
      <div class="card"><div class="stat-label">Gorduras</div><div class="stat-value pink">48 g</div></div>
    </div>

    <div class="card" style="margin-top:15px">
      <h2>Refeições</h2>
      <div class="list">
        ${refeicoes.map(function(refeicao) {
          return '<div class="list-row"><span><strong>' + refeicao.nome + '</strong></span><span>' + refeicao.calorias + ' kcal</span></div>';
        }).join("")}
      </div>
    </div>
  `;
}


// ========================================
// 8 - EVOLUÇÃO
// ========================================

function mostrarEvolucao() {
  pageContent.innerHTML = `
    <div class="page-heading">
      <h1>Evolução</h1>
      <p>Acompanhe sua mudança de peso.</p>
    </div>

    <div class="grid stats">
      <div class="card"><div class="stat-label">Peso atual</div><div class="stat-value">${usuario.peso.toFixed(1)} kg</div></div>
      <div class="card"><div class="stat-label">Meta</div><div class="stat-value accent">${usuario.metaPeso.toFixed(1)} kg</div></div>
      <div class="card"><div class="stat-label">Primeiro registro</div><div class="stat-value">${pesos[0].toFixed(1)} kg</div></div>
      <div class="card"><div class="stat-label">Variação</div><div class="stat-value pink">${(pesos[pesos.length - 1] - pesos[0]).toFixed(1)} kg</div></div>
    </div>

    <div class="card" style="margin-top:15px">
      <h2>Histórico de peso</h2>
      <div class="chart">
        ${pesos.map(function(peso) {
          let altura = Math.max(25, ((peso - 74) / 4) * 100);
          return '<div class="bar" title="' + peso + ' kg" style="height:' + altura + '%"></div>';
        }).join("")}
      </div>
    </div>

    <div class="card" style="margin-top:15px">
      <h2>Adicionar peso</h2>
      <div class="grid two-columns">
        <input id="novo-peso" class="form-input" type="number" step="0.1" placeholder="Ex.: 74.8">
        <button class="primary-button" onclick="adicionarPeso()">Salvar peso</button>
      </div>
    </div>
  `;
}

function adicionarPeso() {
  let input = document.getElementById("novo-peso");
  let peso = Number(input.value);

  if (!peso) {
    alert("Digite um peso válido.");
    return;
  }

  usuario.peso = peso;
  pesos.push(peso);

  localStorage.setItem("academia_peso", peso);
  mostrarEvolucao();
}


// ========================================
// 9 - PERFIL
// ========================================

function mostrarPerfil() {
  pageContent.innerHTML = `
    <div class="page-heading">
      <h1>Perfil</h1>
      <p>Atualize suas informações e metas.</p>
    </div>

    <div class="card">
      <div class="form-group">
        <label>Nome</label>
        <input id="perfil-nome" class="form-input" value="${usuario.nome}">
      </div>

      <div class="form-group">
        <label>Peso atual</label>
        <input id="perfil-peso" class="form-input" type="number" step="0.1" value="${usuario.peso}">
      </div>

      <div class="form-group">
        <label>Meta de peso</label>
        <input id="perfil-meta" class="form-input" type="number" step="0.1" value="${usuario.metaPeso}">
      </div>

      <button class="primary-button" onclick="salvarPerfil()">Salvar alterações</button>
    </div>
  `;
}

function salvarPerfil() {
  usuario.nome = document.getElementById("perfil-nome").value || "Atleta";
  usuario.peso = Number(document.getElementById("perfil-peso").value) || usuario.peso;
  usuario.metaPeso = Number(document.getElementById("perfil-meta").value) || usuario.metaPeso;

  localStorage.setItem("academia_nome", usuario.nome);
  localStorage.setItem("academia_peso", usuario.peso);
  localStorage.setItem("academia_meta", usuario.metaPeso);

  document.getElementById("sidebar-name").textContent = usuario.nome;

  alert("Perfil salvo!");
  mostrarPerfil();
}


// ========================================
// 10 - AURA
// ========================================

function mostrarAura() {
  pageContent.innerHTML = `
    <div class="page-heading">
      <h1>Aura</h1>
      <p>Sua assistente virtual para treino e alimentação.</p>
    </div>

    <div class="card chat-box">
      <div id="chat-messages" class="chat-messages">
        <div class="message aura">
          Olá! Eu sou a Aura. Posso ajudar com dúvidas sobre seus treinos e alimentação.
        </div>
      </div>

      <form id="chat-form" class="chat-form">
        <input id="chat-input" class="form-input" placeholder="Digite sua mensagem..." required>
        <button class="action-button" type="submit">Enviar</button>
      </form>
    </div>
  `;

  document.getElementById("chat-form").addEventListener("submit", function(event) {
    event.preventDefault();

    let input = document.getElementById("chat-input");
    let mensagens = document.getElementById("chat-messages");
    let texto = input.value.trim();

    if (!texto) return;

    mensagens.innerHTML += '<div class="message user">' + escaparHtml(texto) + '</div>';

    setTimeout(function() {
      mensagens.innerHTML += '<div class="message aura">Entendi! Posso te ajudar a organizar essa parte da sua rotina. A integração real com a IA será adicionada nesta versão HTML.</div>';
      mensagens.scrollTop = mensagens.scrollHeight;
    }, 500);

    input.value = "";
  });
}


// ========================================
// 11 - SEGURANÇA PARA TEXTO DIGITADO
// ========================================

function escaparHtml(texto) {
  return texto
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


// ========================================
// 12 - INÍCIO
// ========================================

document.getElementById("mobile-menu").addEventListener("click", function() {
  alert("No celular, use a navegação da versão completa em uma próxima etapa.");
});