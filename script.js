import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  sendPasswordResetEmail,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app-check.js";
import {
  getAI,
  getGenerativeModel,
  GoogleAIBackend
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-ai.js";

// ========================================
// 1 - CONFIGURAÇÃO DO FIREBASE
// ========================================

let firebaseConfig = {
  apiKey: "AIzaSyCww4Tnkn-PbM_F-YQlqAMjHNeIQX9klDI",
  authDomain: "academia-aura.firebaseapp.com",
  projectId: "academia-aura",
  storageBucket: "academia-aura.firebasestorage.app",
  messagingSenderId: "267073767631",
  appId: "1:267073767631:web:3940160d54309bb1a00fba"
};

let app = initializeApp(firebaseConfig);
let auth = getAuth(app);
let db = getFirestore(app);

let recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "";

if (recaptchaSiteKey) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true
    });
  } catch (error) {
    console.warn("App Check não foi inicializado.", error);
  }
}

// ========================================
// 2 - DADOS DO APLICATIVO
// ========================================

let usuario = null;
let perfil = null;
let paginaAtual = "overview";
let periodo = 14;
let dados = {
  pesos: [],
  treinos: [],
  refeicoes: [],
  alimentos: [],
  exercicios: []
};
let treinoAtual = [];
let abaTreino = "registrar";
let abaAlimentacao = "refeicoes";
let auraChat = null;
let auraImagem = null;
let auraPreviewUrl = "";

// ========================================
// 3 - ELEMENTOS
// ========================================

let loginScreen = document.getElementById("login-screen");
let loadingScreen = document.getElementById("loading-screen");
let dashboard = document.getElementById("dashboard");
let pageContent = document.getElementById("page-content");
let loginForm = document.getElementById("login-form");
let signupForm = document.getElementById("signup-form");
let authMessage = document.getElementById("auth-message");

// ========================================
// 4 - AUTENTICAÇÃO
// ========================================

function mensagemErroFirebase(code) {
  let mensagens = {
    "auth/email-already-in-use": "Este e-mail já está cadastrado.",
    "auth/invalid-email": "O e-mail informado é inválido.",
    "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/user-not-found": "E-mail ou senha incorretos.",
    "auth/wrong-password": "E-mail ou senha incorretos.",
    "auth/too-many-requests": "Muitas tentativas. Aguarde um pouco.",
    "auth/network-request-failed": "Falha de conexão. Verifique a internet.",
    "auth/api-key-not-valid": "A configuração do Firebase está inválida."
  };
  return mensagens[code] || "Não foi possível concluir a operação. Tente novamente.";
}

loginForm.addEventListener("submit", async function(event) {
  event.preventDefault();
  authMessage.textContent = "";
  let email = document.getElementById("login-email").value.trim();
  let senha = document.getElementById("login-password").value;

  try {
    mostrarCarregando(true);
    await signInWithEmailAndPassword(auth, email, senha);
  } catch (error) {
    mostrarCarregando(false);
    authMessage.textContent = mensagemErroFirebase(error.code);
  }
});

signupForm.addEventListener("submit", async function(event) {
  event.preventDefault();
  authMessage.textContent = "";

  let nome = document.getElementById("signup-name").value.trim();
  let email = document.getElementById("signup-email").value.trim();
  let senha = document.getElementById("signup-password").value;
  let peso = Number(document.getElementById("signup-weight").value);
  let altura = Number(document.getElementById("signup-height").value);

  try {
    mostrarCarregando(true);
    let credencial = await createUserWithEmailAndPassword(auth, email, senha);
    if (nome) await updateProfile(credencial.user, { displayName: nome });

    let novoPerfil = {
      uid: credencial.user.uid,
      email: email,
      displayName: nome || "Atleta Aura",
      targetWeight: Math.max(1, peso - 5),
      dailyCalorieGoal: 2200,
      currentWeight: peso,
      height: altura,
      activityLevel: "moderate",
      themePreference: "dark",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(doc(db, "users", credencial.user.uid), novoPerfil);
  } catch (error) {
    mostrarCarregando(false);
    authMessage.textContent = mensagemErroFirebase(error.code);
  }
});

document.getElementById("forgot-password").addEventListener("click", async function() {
  let email = document.getElementById("login-email").value.trim();
  if (!email) {
    authMessage.textContent = "Digite seu e-mail primeiro.";
    return;
  }
  try {
    await sendPasswordResetEmail(auth, email);
    authMessage.style.color = "var(--green)";
    authMessage.textContent = "E-mail de recuperação enviado.";
  } catch (error) {
    authMessage.style.color = "var(--red)";
    authMessage.textContent = mensagemErroFirebase(error.code);
  }
});

document.getElementById("demo-login").addEventListener("click", async function() {
  try {
    mostrarCarregando(true);
    let credencial = await signInAnonymously(auth);
    let ref = doc(db, "users", credencial.user.uid);
    let snap = await getDoc(ref);

    if (!snap.exists()) {
      let demo = {
        uid: credencial.user.uid,
        email: "demo@aura.com",
        displayName: "Alex Silva (Atleta)",
        targetWeight: 78,
        dailyCalorieGoal: 2450,
        currentWeight: 82.4,
        height: 178,
        activityLevel: "moderate",
        themePreference: "dark",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await setDoc(ref, demo);
      await criarDadosDemo(credencial.user.uid);
    }
  } catch (error) {
    mostrarCarregando(false);
    authMessage.textContent = "O modo demonstração precisa permitir login anônimo no Firebase.";
  }
});

document.getElementById("logout-button").addEventListener("click", async function() {
  await signOut(auth);
});

onAuthStateChanged(auth, async function(user) {
  if (!user) {
    usuario = null;
    perfil = null;
    dashboard.classList.add("hidden");
    loadingScreen.classList.add("hidden");
    loginScreen.classList.remove("hidden");
    return;
  }

  usuario = user;
  mostrarCarregando(true);

  try {
    await carregarPerfil();
    await carregarTodosDados();
    abrirDashboard();
  } catch (error) {
    console.error(error);
    mostrarToast("Não foi possível carregar todos os dados.");
    abrirDashboard();
  }
});

function mostrarCarregando(valor) {
  if (valor) {
    loginScreen.classList.add("hidden");
    dashboard.classList.add("hidden");
    loadingScreen.classList.remove("hidden");
  } else {
    loadingScreen.classList.add("hidden");
  }
}

function abrirDashboard() {
  loginScreen.classList.add("hidden");
  loadingScreen.classList.add("hidden");
  dashboard.classList.remove("hidden");
  document.getElementById("aura-launcher").classList.remove("hidden");
  atualizarUsuarioNaTela();
  mostrarPagina(paginaAtual);
}

async function carregarPerfil() {
  let ref = doc(db, "users", usuario.uid);
  let snap = await getDoc(ref);

  if (snap.exists()) {
    perfil = snap.data();
  } else {
    perfil = {
      uid: usuario.uid,
      email: usuario.email || "demo@aura.com",
      displayName: usuario.displayName || "Atleta Aura",
      targetWeight: 70,
      dailyCalorieGoal: 2200,
      currentWeight: 75,
      height: 175,
      activityLevel: "moderate",
      themePreference: "dark",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await setDoc(ref, perfil);
  }

  aplicarTema();
}

async function carregarTodosDados() {
  dados.pesos = await buscarColecao("weightHistory", "date", "asc");
  dados.treinos = await buscarColecao("workouts", "date", "desc");
  dados.refeicoes = await buscarColecao("meals", "date", "desc");
  dados.alimentos = await buscarColecao("foods", "name", "asc");
  dados.exercicios = await buscarColecao("exercises", "name", "asc");

  if (dados.exercicios.length === 0) {
    let padroes = exerciciosPadrao();
    for (let item of padroes) {
      await addDoc(collection(db, "users", usuario.uid, "exercises"), {
        ...item,
        userId: usuario.uid,
        createdAt: new Date().toISOString()
      });
    }
    dados.exercicios = await buscarColecao("exercises", "name", "asc");
  }

  if (dados.alimentos.length === 0) {
    let padroes = alimentosPadrao();
    for (let item of padroes) {
      await addDoc(collection(db, "users", usuario.uid, "foods"), {
        ...item,
        userId: usuario.uid,
        createdAt: new Date().toISOString()
      });
    }
    dados.alimentos = await buscarColecao("foods", "name", "asc");
  }
}

async function buscarColecao(nome, campo, ordem) {
  try {
    let ref = collection(db, "users", usuario.uid, nome);
    let consulta = query(ref, orderBy(campo, ordem));
    let snap = await getDocs(consulta);
    return snap.docs.map(function(item) {
      return { id: item.id, ...item.data() };
    });
  } catch (error) {
    console.warn("Erro ao buscar", nome, error);
    return [];
  }
}

function atualizarUsuarioNaTela() {
  let nome = perfil?.displayName || usuario?.displayName || "Atleta";
  document.getElementById("sidebar-name").textContent = nome;
  document.getElementById("sidebar-email").textContent = usuario?.email || "Conta demonstração";
  document.getElementById("sidebar-avatar").textContent = nome.charAt(0).toUpperCase();
}

function aplicarTema() {
  document.body.classList.toggle("light", perfil?.themePreference === "light");
}

// ========================================
// 5 - NAVEGAÇÃO
// ========================================

document.querySelectorAll("[data-page]").forEach(function(botao) {
  botao.addEventListener("click", function() {
    mostrarPagina(botao.dataset.page);
    document.getElementById("mobile-nav").classList.add("hidden");
  });
});

document.getElementById("mobile-menu").addEventListener("click", function() {
  let menu = document.getElementById("mobile-nav");
  menu.classList.toggle("hidden");
  if (!menu.classList.contains("hidden")) {
    menu.innerHTML = ["overview","workouts","diet","evolution","profile"].map(function(pagina) {
      let nomes = {overview:"Visão geral",workouts:"Treinos",diet:"Alimentação",evolution:"Evolução",profile:"Perfil"};
      return '<button class="nav-item" data-page="' + pagina + '">' + nomes[pagina] + '</button>';
    }).join("");
    menu.querySelectorAll("[data-page]").forEach(function(item) {
      item.addEventListener("click", function() {
        mostrarPagina(item.dataset.page);
        menu.classList.add("hidden");
      });
    });
  }
});

document.getElementById("theme-button").addEventListener("click", async function() {
  if (!perfil) return;
  perfil.themePreference = perfil.themePreference === "dark" ? "light" : "dark";
  aplicarTema();
  await updateDoc(doc(db, "users", usuario.uid), {
    themePreference: perfil.themePreference,
    updatedAt: new Date().toISOString()
  });
});

document.getElementById("aura-button").addEventListener("click", abrirAura);
document.getElementById("aura-launcher").addEventListener("click", abrirAura);
document.getElementById("aura-close").addEventListener("click", fecharAura);

function mostrarPagina(pagina) {
  paginaAtual = pagina;
  document.querySelectorAll(".nav-item[data-page]").forEach(function(item) {
    item.classList.toggle("active", item.dataset.page === pagina);
  });

  let nomes = {
    overview: "Visão geral",
    workouts: "Treinos",
    diet: "Alimentação",
    evolution: "Evolução",
    profile: "Perfil"
  };
  document.getElementById("topbar-title").textContent = nomes[pagina] || "Academia Aura";

  if (pagina === "overview") mostrarVisaoGeral();
  if (pagina === "workouts") mostrarTreinos();
  if (pagina === "diet") mostrarAlimentacao();
  if (pagina === "evolution") mostrarEvolucao();
  if (pagina === "profile") mostrarPerfil();
}

// ========================================
// 6 - VISÃO GERAL
// ========================================

function mostrarVisaoGeral() {
  let dias = gerarDias(periodo);
  let integrados = montarDadosIntegrados(dias);
  let volume = integrados.reduce((s,d) => s + d.volume, 0);
  let sessoes = integrados.reduce((s,d) => s + d.treinos, 0);
  let diasComida = integrados.filter(d => d.calorias > 0);
  let mediaCalorias = diasComida.length ? Math.round(diasComida.reduce((s,d)=>s+d.calorias,0)/diasComida.length) : perfil.dailyCalorieGoal;
  let saldo = diasComida.length ? Math.round(diasComida.reduce((s,d)=>s+d.saldo,0)/diasComida.length) : 0;
  let pontosPeso = integrados.filter(d => d.peso);
  let variacao = pontosPeso.length > 1 ? Number((pontosPeso[pontosPeso.length-1].peso - pontosPeso[0].peso).toFixed(1)) : 0;
  let insight = gerarInsight(mediaCalorias, perfil.dailyCalorieGoal, volume, sessoes, variacao, saldo);
  let progressoMeta = perfil.targetWeight > 0 ? Math.max(0, Math.min(100, 100 - Math.abs((perfil.currentWeight - perfil.targetWeight) / Math.max(perfil.currentWeight,1) * 100))) : 0;
  let ultimosTreinos = dados.treinos.slice(0,4);

  pageContent.innerHTML = `
    <div class="page-heading">
      <div><div class="eyebrow-green">Visão Geral de Desempenho Físico</div><h1>Painel de Insights Integrado</h1><p>Cruzamento entre treino, alimentação e composição corporal.</p></div>
      <div class="range-buttons">
        <button class="${periodo===7?"active":""}" data-range="7">7 dias</button>
        <button class="${periodo===14?"active":""}" data-range="14">14 dias</button>
        <button class="${periodo===30?"active":""}" data-range="30">30 dias</button>
      </div>
    </div>

    <div class="hero">
      <span class="badge">✦ Diagnóstico do ciclo atual</span>
      <h2>${insight.headline}</h2>
      <p>${insight.diagnosis}</p>
      <div class="recommendations">${insight.recommendations.map(r => '<div class="recommendation">✓ '+r+'</div>').join("")}</div>
    </div>

    <div class="grid stats">
      <div class="card kpi-click" data-go="workouts"><div class="kpi-top"><span>Volume de treino</span><span class="kpi-icon green">▣</span></div><div class="stat-value">${formatarNumero(volume)} <small>kg</small></div><p class="card-subtitle">${sessoes} sessão(ões) nos últimos ${periodo} dias</p></div>
      <div class="card kpi-click" data-go="diet"><div class="kpi-top"><span>Média de ingestão</span><span class="kpi-icon orange">🔥</span></div><div class="stat-value">${formatarNumero(mediaCalorias)} <small>kcal/dia</small></div><p class="card-subtitle">Meta: ${formatarNumero(perfil.dailyCalorieGoal)} kcal</p></div>
      <div class="card kpi-click" data-go="diet"><div class="kpi-top"><span>Balanço médio</span><span class="kpi-icon cyan">◈</span></div><div class="stat-value ${saldo<0?"green":saldo>0?"orange":""}">${saldo>0?"+":""}${formatarNumero(saldo)} <small>kcal/dia</small></div><p class="card-subtitle">${saldo < -100 ? "Déficit estimado" : saldo > 100 ? "Superávit estimado" : "Próximo da manutenção"}</p></div>
      <div class="card kpi-click" data-go="profile"><div class="kpi-top"><span>Variação de peso</span><span class="kpi-icon purple">⚖</span></div><div class="stat-value ${variacao<0?"green":variacao>0?"orange":""}">${variacao>0?"+":""}${variacao.toFixed(1)} <small>kg</small></div><p class="card-subtitle">${variacao<0?"Redução no período":variacao>0?"Aumento no período":"Peso estável"}</p></div>
    </div>

    <div class="grid two-columns">
      <section class="card">
        <h2>Cruzamento diário</h2>
        <p class="card-subtitle">Consumo calórico e volume de treino nos últimos ${periodo} dias.</p>
        <div class="chart-box"><div class="chart">${criarBarras(integrados)}</div></div>
        <div class="chart-legend"><span><i class="legend-dot" style="background:var(--green)"></i>Volume relativo</span><span><i class="legend-dot" style="background:var(--orange)"></i>Consumo</span></div>
      </section>
      <section class="card">
        <h2>Meta de peso</h2>
        <p class="card-subtitle">Peso atual x objetivo definido no perfil.</p>
        <div class="stat-value">${Number(perfil.currentWeight || 0).toFixed(1)} <small>kg</small></div>
        <div class="progress"><div style="width:${progressoMeta}%"></div></div>
        <div class="goal-line"><span>Atual</span><strong>${Number(perfil.targetWeight || 0).toFixed(1)} kg</strong></div>
        <div class="goal-line"><span>Objetivo</span><span>${Math.abs(Number(perfil.currentWeight||0)-Number(perfil.targetWeight||0)).toFixed(1)} kg de diferença</span></div>
        <div style="margin-top:22px"><h3>Últimos treinos</h3><div class="list">${ultimosTreinos.length ? ultimosTreinos.map(t=>'<div class="list-row"><div><strong>'+esc(t.title)+'</strong><div class="muted">'+formatarData(t.date)+'</div></div><span class="green">'+formatarNumero(t.totalVolume||0)+' kg</span></div>').join("") : '<div class="empty">Nenhum treino registrado.</div>'}</div></div>
      </section>
    </div>
  `;

  pageContent.querySelectorAll("[data-range]").forEach(function(btn){btn.addEventListener("click",function(){periodo=Number(btn.dataset.range);mostrarVisaoGeral()})});
  pageContent.querySelectorAll("[data-go]").forEach(function(btn){btn.addEventListener("click",function(){mostrarPagina(btn.dataset.go)})});
}

// ========================================
// 7 - TREINOS
// ========================================

function mostrarTreinos() {
  let tabs = `
    <div class="tabs">
      <button class="tab-button ${abaTreino==="registrar"?"active":""}" data-worktab="registrar">Registrar treino</button>
      <button class="tab-button ${abaTreino==="historico"?"active":""}" data-worktab="historico">Histórico</button>
      <button class="tab-button ${abaTreino==="analise"?"active":""}" data-worktab="analise">Análise</button>
      <button class="tab-button ${abaTreino==="exercicios"?"active":""}" data-worktab="exercicios">Exercícios</button>
    </div>`;

  let conteudo = "";
  if (abaTreino === "registrar") conteudo = telaRegistrarTreino();
  if (abaTreino === "historico") conteudo = telaHistoricoTreino();
  if (abaTreino === "analise") conteudo = telaAnaliseTreino();
  if (abaTreino === "exercicios") conteudo = telaExercicios();

  pageContent.innerHTML = '<div class="page-heading"><div><div class="eyebrow-green">Treinamento</div><h1>Treinos</h1><p>Registre sessões, cargas, séries e progressão.</p></div></div>'+tabs+conteudo;
  pageContent.querySelectorAll("[data-worktab]").forEach(function(btn){btn.addEventListener("click",function(){abaTreino=btn.dataset.worktab;mostrarTreinos()})});
  configurarTelaTreino();
}

function telaRegistrarTreino() {
  return `
    <div class="grid two-columns">
      <section class="card">
        <h2>Nova sessão</h2><p class="card-subtitle">Os cálculos de volume e calorias são feitos antes de salvar.</p>
        <form id="workout-form">
          <div class="form-group"><label>Título do treino</label><input id="workout-title" class="form-input" value="Treino A - Superiores / Peito & Tríceps" required></div>
          <div class="form-grid-2">
            <div><label>Data</label><input id="workout-date" class="form-input" type="date" value="${hoje()}" max="${hoje()}" required></div>
            <div><label>Duração (min)</label><input id="workout-duration" class="form-input" type="number" min="1" value="60" required></div>
          </div>
          <div class="form-group"><label>Adicionar exercício</label><select id="exercise-select" class="select-input"><option value="">Selecione...</option>${dados.exercicios.map(e=>'<option value="'+e.id+'">'+esc(e.name)+' — '+e.category+'</option>').join("")}</select></div>
          <div id="session-exercises">${renderizarTreinoAtual()}</div>
          <div class="form-group"><label>Observações</label><textarea id="workout-notes" class="textarea-input" placeholder="Ex.: aumentei a carga mantendo a técnica."></textarea></div>
          <div class="info-box">Volume atual: <strong id="current-volume">${formatarNumero(calcularVolume(treinoAtual))} kg</strong> · Calorias estimadas: <strong id="current-calories">${calcularCaloriasTreino(Number(document.getElementById("workout-duration")?.value||60),treinoAtual)} kcal</strong></div>
          <p id="workout-message" class="form-message"></p>
          <button class="primary-button" type="submit">Salvar sessão</button>
        </form>
      </section>
      <section class="card">
        <h2>Resumo da sessão</h2>
        <div class="grid three-columns">
          <div><div class="stat-label">Volume</div><div id="summary-volume" class="stat-value green">${formatarNumero(calcularVolume(treinoAtual))}</div><p class="card-subtitle">kg</p></div>
          <div><div class="stat-label">Exercícios</div><div class="stat-value">${treinoAtual.length}</div><p class="card-subtitle">atividades</p></div>
          <div><div class="stat-label">Peso</div><div class="stat-value">${Number(perfil.currentWeight||75).toFixed(1)}</div><p class="card-subtitle">kg corporal</p></div>
        </div>
        <div style="margin-top:20px"><h3>Como funciona</h3><p class="card-subtitle">Cada série concluída soma carga × repetições. O sistema compara o volume com sessões anteriores para indicar evolução, estabilidade ou regressão.</p></div>
      </section>
    </div>`;
}

function renderizarTreinoAtual() {
  if (!treinoAtual.length) return '<div class="empty">Adicione pelo menos um exercício acima.</div>';
  return treinoAtual.map(function(ex,index) {
    if (ex.isCardio) {
      return '<div class="exercise-editor"><div class="exercise-header"><strong>'+esc(ex.exerciseName)+'</strong><button class="small-button danger-button" data-remove-ex="'+index+'">Excluir</button></div><div class="form-grid-3"><div><label>Minutos</label><input class="form-input cardio-minutes" data-ex="'+index+'" type="number" min="1" value="'+ex.cardioMinutes+'"></div><div><label>Distância (km)</label><input class="form-input cardio-distance" data-ex="'+index+'" type="number" min="0" step="0.1" value="'+(ex.cardioDistanceKm||0)+'"></div><div><label>Intensidade</label><select class="select-input cardio-intensity" data-ex="'+index+'"><option '+(ex.cardioIntensity==="low"?"selected":"")+' value="low">Baixa</option><option '+(ex.cardioIntensity==="moderate"?"selected":"")+' value="moderate">Moderada</option><option '+(ex.cardioIntensity==="high"?"selected":"")+' value="high">Alta</option></select></div></div></div>';
    }
    return '<div class="exercise-editor"><div class="exercise-header"><strong>'+esc(ex.exerciseName)+'</strong><button class="small-button danger-button" data-remove-ex="'+index+'">Excluir</button></div><table class="sets-table"><thead><tr><th>Série</th><th>Reps</th><th>Carga</th><th></th></tr></thead><tbody>'+ex.sets.map(function(s,setIndex){return '<tr><td>'+s.setNumber+'</td><td><input class="set-reps" data-ex="'+index+'" data-set="'+setIndex+'" type="number" min="1" value="'+s.reps+'"></td><td><input class="set-weight" data-ex="'+index+'" data-set="'+setIndex+'" type="number" min="0" step="0.5" value="'+s.weight+'"></td><td><button class="small-button danger-button" data-remove-set="'+index+'" data-set="'+setIndex+'">×</button></td></tr>'}).join("")+'</tbody></table><button class="small-button" data-add-set="'+index+'" style="margin-top:9px">+ Adicionar série</button></div>';
  }).join("");
}

function configurarTelaTreino() {
  let select=document.getElementById("exercise-select");
  if(select) select.addEventListener("change",function(){if(!select.value)return;let found=dados.exercicios.find(e=>e.id===select.value);if(!found)return;treinoAtual.push(criarExercicioSessao(found));select.value="";mostrarTreinos()});
  pageContent.querySelectorAll("[data-remove-ex]").forEach(btn=>btn.addEventListener("click",function(){treinoAtual.splice(Number(btn.dataset.removeEx),1);mostrarTreinos()}));
  pageContent.querySelectorAll("[data-add-set]").forEach(btn=>btn.addEventListener("click",function(){let i=Number(btn.dataset.addSet);let sets=treinoAtual[i].sets;let last=sets[sets.length-1]||{reps:10,weight:50};sets.push({setNumber:sets.length+1,reps:last.reps,weight:last.weight,completed:true});mostrarTreinos()}));
  pageContent.querySelectorAll("[data-remove-set]").forEach(btn=>btn.addEventListener("click",function(){let i=Number(btn.dataset.removeSet),s=Number(btn.dataset.set);treinoAtual[i].sets.splice(s,1);treinoAtual[i].sets.forEach((x,n)=>x.setNumber=n+1);mostrarTreinos()}));
  pageContent.querySelectorAll(".set-reps").forEach(input=>input.addEventListener("change",function(){treinoAtual[Number(input.dataset.ex)].sets[Number(input.dataset.set)].reps=Number(input.value);mostrarTreinos()}));
  pageContent.querySelectorAll(".set-weight").forEach(input=>input.addEventListener("change",function(){treinoAtual[Number(input.dataset.ex)].sets[Number(input.dataset.set)].weight=Number(input.value);mostrarTreinos()}));
  pageContent.querySelectorAll(".cardio-minutes").forEach(input=>input.addEventListener("change",function(){treinoAtual[Number(input.dataset.ex)].cardioMinutes=Number(input.value);mostrarTreinos()}));
  pageContent.querySelectorAll(".cardio-distance").forEach(input=>input.addEventListener("change",function(){treinoAtual[Number(input.dataset.ex)].cardioDistanceKm=Number(input.value);mostrarTreinos()}));
  pageContent.querySelectorAll(".cardio-intensity").forEach(input=>input.addEventListener("change",function(){treinoAtual[Number(input.dataset.ex)].cardioIntensity=input.value;mostrarTreinos()}));

  let form=document.getElementById("workout-form");
  if(form) form.addEventListener("submit",salvarTreino);
}

async function salvarTreino(event) {
  event.preventDefault();
  let msg=document.getElementById("workout-message");
  let titulo=document.getElementById("workout-title").value.trim();
  let data=document.getElementById("workout-date").value;
  let duracao=Number(document.getElementById("workout-duration").value);

  if(!titulo||!data||duracao<=0||!treinoAtual.length){msg.textContent="Preencha os dados e adicione pelo menos um exercício.";return}
  let volume=calcularVolume(treinoAtual);
  let calorias=calcularCaloriasTreino(duracao,treinoAtual);
  let anterior=dados.treinos.find(t=>t.title?.toLowerCase()===titulo.toLowerCase());
  let progresso=avaliarProgressao(volume,anterior?.totalVolume);

  try{
    await addDoc(collection(db,"users",usuario.uid,"workouts"),{
      userId:usuario.uid,title:titulo,date:data,durationMinutes:duracao,exercises:treinoAtual,
      totalVolume:volume,estimatedCaloriesBurned:calorias,progressionStatus:progresso.status,progressionDiffPercent:progresso.diffPercent,
      notes:document.getElementById("workout-notes").value.trim()||undefined,createdAt:new Date().toISOString()
    });
    await carregarTodosDados();treinoAtual=[];mostrarToast("Treino registrado com sucesso!");mostrarTreinos();
  }catch(error){console.error(error);msg.textContent="Não foi possível salvar o treino."}
}

function telaHistoricoTreino(){
  return '<section class="card"><h2>Histórico de sessões</h2><p class="card-subtitle">Registros salvos no Firestore.</p><div style="margin-top:10px">'+(dados.treinos.length?dados.treinos.map(t=>'<div class="history-item"><div><div class="history-title">'+esc(t.title)+'</div><div class="history-meta">'+formatarData(t.date)+' · '+t.durationMinutes+' min · '+formatarNumero(t.totalVolume||0)+' kg · '+(t.estimatedCaloriesBurned||0)+' kcal</div></div><div style="display:flex;gap:7px;align-items:center"><span class="status-pill">'+(t.progressionStatus||"registrado")+'</span><button class="small-button danger-button" data-delete-workout="'+t.id+'">Excluir</button></div></div>').join(""):'<div class="empty">Nenhum treino registrado ainda.</div>')+'</div></section>';
}

function telaAnaliseTreino(){
  let volume=dados.treinos.reduce((s,t)=>s+(t.totalVolume||0),0);
  let calorias=dados.treinos.reduce((s,t)=>s+(t.estimatedCaloriesBurned||0),0);
  let media=dados.treinos.length?Math.round(volume/dados.treinos.length):0;
  let evoluindo=dados.treinos.filter(t=>t.progressionStatus==="evoluindo").length;
  return '<div class="grid stats"><div class="card"><div class="stat-label">Volume total</div><div class="stat-value green">'+formatarNumero(volume)+' <small>kg</small></div></div><div class="card"><div class="stat-label">Sessões</div><div class="stat-value">'+dados.treinos.length+'</div></div><div class="card"><div class="stat-label">Média por sessão</div><div class="stat-value">'+formatarNumero(media)+' <small>kg</small></div></div><div class="card"><div class="stat-label">Em evolução</div><div class="stat-value purple">'+evoluindo+'</div></div></div><div class="grid two-columns" style="margin-top:16px"><section class="card"><h2>Volume por sessão</h2><div class="chart-box"><div class="chart">'+criarBarras(dados.treinos.slice().reverse().map(t=>({date:t.date,volume:t.totalVolume||0})))+'</div></div></section><section class="card"><h2>Gasto estimado</h2><div class="stat-value orange">'+formatarNumero(calorias)+' <small>kcal</small></div><p class="card-subtitle" style="margin-top:8px">Estimativa baseada em duração, peso corporal e atividades registradas.</p></section></div>';
}

function telaExercicios(){
  return '<div class="grid two-columns"><section class="card"><h2>Biblioteca de exercícios</h2><div class="food-grid">'+dados.exercicios.map(e=>'<div class="food-card"><strong>'+esc(e.name)+'</strong><p>'+e.category+' · '+e.equipment+'</p><div class="macro-row"><span class="macro">'+(e.defaultRestSeconds||60)+'s descanso</span><button class="small-button danger-button" data-delete-exercise="'+e.id+'">Excluir</button></div></div>').join("")+'</div></section><section class="card"><h2>Novo exercício</h2><form id="exercise-form"><div class="form-group"><label>Nome</label><input id="new-exercise-name" class="form-input" required></div><div class="form-grid-2"><div><label>Categoria</label><select id="new-exercise-category" class="select-input"><option value="chest">Peito</option><option value="back">Costas</option><option value="legs">Pernas</option><option value="shoulders">Ombros</option><option value="arms">Braços</option><option value="core">Core</option><option value="cardio">Cardio</option></select></div><div><label>Equipamento</label><select id="new-exercise-equipment" class="select-input"><option value="barbell">Barra</option><option value="dumbbell">Halteres</option><option value="machine">Máquina</option><option value="cable">Polia</option><option value="bodyweight">Peso corporal</option><option value="cardio_machine">Cardio</option><option value="other">Outro</option></select></div></div><label>Descanso padrão (segundos)</label><input id="new-exercise-rest" class="form-input" type="number" value="60" min="0"><button class="primary-button" type="submit">Cadastrar exercício</button></form></section></div>';
}

function criarExercicioSessao(e){
  let cardio=e.category==="cardio";
  return {exerciseId:e.id||"",exerciseName:e.name,category:e.category,isCardio:cardio,sets:cardio?[]:[{setNumber:1,reps:10,weight:60,completed:true},{setNumber:2,reps:10,weight:60,completed:true},{setNumber:3,reps:8,weight:65,completed:true}],cardioMinutes:cardio?20:undefined,cardioIntensity:cardio?"moderate":undefined,cardioDistanceKm:cardio?2.5:undefined};
}

document.addEventListener("click",async function(event){
  let workoutButton=event.target.closest("[data-delete-workout]");
  if(workoutButton){await deleteDoc(doc(db,"users",usuario.uid,"workouts",workoutButton.dataset.deleteWorkout));await carregarTodosDados();mostrarTreinos()}
  let exButton=event.target.closest("[data-delete-exercise]");
  if(exButton){await deleteDoc(doc(db,"users",usuario.uid,"exercises",exButton.dataset.deleteExercise));await carregarTodosDados();mostrarTreinos()}
});

document.addEventListener("submit",async function(event){
  if(event.target.id!=="exercise-form")return;
  event.preventDefault();
  let nome=document.getElementById("new-exercise-name").value.trim();
  if(!nome)return;
  await addDoc(collection(db,"users",usuario.uid,"exercises"),{userId:usuario.uid,name:nome,category:document.getElementById("new-exercise-category").value,equipment:document.getElementById("new-exercise-equipment").value,defaultRestSeconds:Number(document.getElementById("new-exercise-rest").value)||60,createdAt:new Date().toISOString()});
  await carregarTodosDados();mostrarTreinos();mostrarToast("Exercício cadastrado.");
});

// ========================================
// 8 - ALIMENTAÇÃO
// ========================================

function mostrarAlimentacao(){
  let hojeRefeicoes=dados.refeicoes.filter(r=>r.date===hoje());
  let calorias=hojeRefeicoes.reduce((s,r)=>s+(r.totalCalories||0),0);
  let proteina=hojeRefeicoes.reduce((s,r)=>s+(r.totalProtein||0),0);
  let carbo=hojeRefeicoes.reduce((s,r)=>s+(r.totalCarbs||0),0);
  let gordura=hojeRefeicoes.reduce((s,r)=>s+(r.totalFat||0),0);
  let tabs='<div class="tabs"><button class="tab-button '+(abaAlimentacao==="refeicoes"?"active":"")+'" data-diettab="refeicoes">Refeições</button><button class="tab-button '+(abaAlimentacao==="alimentos"?"active":"")+'" data-diettab="alimentos">Alimentos</button><button class="tab-button '+(abaAlimentacao==="nova"?"active":"")+'" data-diettab="nova">Registrar refeição</button></div>';
  let conteudo=abaAlimentacao==="refeicoes"?telaRefeicoes(hojeRefeicoes,calorias,proteina,carbo,gordura):abaAlimentacao==="alimentos"?telaAlimentos():telaNovaRefeicao();
  pageContent.innerHTML='<div class="page-heading"><div><div class="eyebrow-green">Nutrição</div><h1>Alimentação</h1><p>Controle de calorias e macronutrientes ao longo do dia.</p></div></div>'+tabs+conteudo;
  pageContent.querySelectorAll("[data-diettab]").forEach(btn=>btn.addEventListener("click",function(){abaAlimentacao=btn.dataset.diettab;mostrarAlimentacao()}));
  configurarAlimentacao();
}

function telaRefeicoes(lista,calorias,proteina,carbo,gordura){
  let percentual=perfil.dailyCalorieGoal?Math.min(100,calorias/perfil.dailyCalorieGoal*100):0;
  return '<div class="grid stats"><div class="card"><div class="stat-label">Calorias hoje</div><div class="stat-value orange">'+formatarNumero(calorias)+' <small>kcal</small></div><div class="progress"><div style="width:'+percentual+'%;background:var(--orange)"></div></div></div><div class="card"><div class="stat-label">Proteínas</div><div class="stat-value green">'+formatarNumero(proteina)+' <small>g</small></div></div><div class="card"><div class="stat-label">Carboidratos</div><div class="stat-value cyan">'+formatarNumero(carbo)+' <small>g</small></div></div><div class="card"><div class="stat-label">Gorduras</div><div class="stat-value purple">'+formatarNumero(gordura)+' <small>g</small></div></div></div><div class="grid two-columns"><section class="card"><h2>Refeições de hoje</h2><div class="list">'+(lista.length?lista.map(r=>'<div class="history-item"><div><div class="history-title">'+nomeRefeicao(r.mealType)+'</div><div class="history-meta">'+r.items?.length||0+' item(ns) · '+formatarNumero(r.totalProtein||0)+'g proteína · '+formatarNumero(r.totalCarbs||0)+'g carbo</div></div><div style="display:flex;align-items:center;gap:8px"><strong class="orange">'+formatarNumero(r.totalCalories||0)+' kcal</strong><button class="small-button danger-button" data-delete-meal="'+r.id+'">Excluir</button></div></div>').join(""):'<div class="empty">Nenhuma refeição registrada hoje.</div>')+'</div></section><section class="card"><h2>Meta diária</h2><div class="stat-value">'+formatarNumero(perfil.dailyCalorieGoal)+' <small>kcal</small></div><p class="card-subtitle" style="margin-top:6px">'+formatarNumero(Math.max(0,perfil.dailyCalorieGoal-calorias))+' kcal restantes na meta.</p><button class="primary-button" data-diettab="nova">Registrar refeição</button></section></div>';
}

function telaAlimentos(){
  return '<div class="grid two-columns"><section class="card"><h2>Alimentos cadastrados</h2><div class="food-grid">'+dados.alimentos.map(f=>'<div class="food-card"><strong>'+esc(f.name)+'</strong><p>'+f.servingSize+' '+f.servingUnit+' · '+f.calories+' kcal</p><div class="macro-row"><span class="macro">P '+f.protein+'g</span><span class="macro">C '+f.carbs+'g</span><span class="macro">G '+f.fat+'g</span><button class="small-button danger-button" data-delete-food="'+f.id+'">Excluir</button></div></div>').join("")+'</div></section><section class="card"><h2>Novo alimento</h2><form id="food-form"><div class="form-group"><label>Nome</label><input id="food-name" class="form-input" required></div><div class="form-grid-2"><div><label>Porção</label><input id="food-serving" class="form-input" type="number" step="0.1" value="100"></div><div><label>Unidade</label><select id="food-unit" class="select-input"><option value="g">g</option><option value="ml">ml</option><option value="unidade">unidade</option></select></div></div><div class="form-grid-4"><div><label>Kcal</label><input id="food-calories" class="form-input" type="number" value="100"></div><div><label>Proteína</label><input id="food-protein" class="form-input" type="number" step="0.1" value="10"></div><div><label>Carbo</label><input id="food-carbs" class="form-input" type="number" step="0.1" value="10"></div><div><label>Gordura</label><input id="food-fat" class="form-input" type="number" step="0.1" value="3"></div></div><button class="primary-button" type="submit">Cadastrar alimento</button></form></section></div>';
}

function telaNovaRefeicao(){
  return '<section class="card"><h2>Registrar refeição</h2><p class="card-subtitle">Escolha os alimentos, informe as quantidades e salve a refeição.</p><form id="meal-form"><div class="form-grid-2"><div><label>Data</label><input id="meal-date" class="form-input" type="date" value="'+hoje()+'" max="'+hoje()+'"></div><div><label>Tipo</label><select id="meal-type" class="select-input"><option value="cafe_da_manha">Café da manhã</option><option value="almoco">Almoço</option><option value="lanche">Lanche</option><option value="jantar">Jantar</option><option value="ceia">Ceia</option></select></div></div><div class="form-group"><label>Alimento</label><select id="meal-food" class="select-input"><option value="">Selecione...</option>'+dados.alimentos.map(f=>'<option value="'+f.id+'">'+esc(f.name)+' — '+f.calories+' kcal/'+f.servingSize+f.servingUnit+'</option>').join("")+'</select></div><div id="meal-items"></div><button type="button" class="small-button" id="add-meal-item">+ Adicionar alimento</button><div id="meal-total" class="info-box" style="margin-top:15px">Total: 0 kcal · P 0g · C 0g · G 0g</div><button class="primary-button" type="submit">Salvar refeição</button></form></section>';
}

let itensRefeicao=[];
function configurarAlimentacao(){
  pageContent.querySelectorAll("[data-delete-meal]").forEach(btn=>btn.addEventListener("click",async function(){await deleteDoc(doc(db,"users",usuario.uid,"meals",btn.dataset.deleteMeal));await carregarTodosDados();mostrarAlimentacao()}));
  pageContent.querySelectorAll("[data-delete-food]").forEach(btn=>btn.addEventListener("click",async function(){await deleteDoc(doc(db,"users",usuario.uid,"foods",btn.dataset.deleteFood));await carregarTodosDados();mostrarAlimentacao()}));
  let foodForm=document.getElementById("food-form");
  if(foodForm)foodForm.addEventListener("submit",async function(e){e.preventDefault();await addDoc(collection(db,"users",usuario.uid,"foods"),{userId:usuario.uid,name:document.getElementById("food-name").value.trim(),servingSize:Number(document.getElementById("food-serving").value),servingUnit:document.getElementById("food-unit").value,calories:Number(document.getElementById("food-calories").value),protein:Number(document.getElementById("food-protein").value),carbs:Number(document.getElementById("food-carbs").value),fat:Number(document.getElementById("food-fat").value),createdAt:new Date().toISOString()});await carregarTodosDados();mostrarAlimentacao();mostrarToast("Alimento cadastrado.")});
  let mealForm=document.getElementById("meal-form");
  if(mealForm){itensRefeicao=[];mealForm.addEventListener("submit",salvarRefeicao);document.getElementById("add-meal-item").addEventListener("click",function(){let id=document.getElementById("meal-food").value;if(!id){mostrarToast("Selecione um alimento.");return}let f=dados.alimentos.find(x=>x.id===id);if(!f)return;itensRefeicao.push({...f,quantity:f.servingSize});renderizarItensRefeicao()});}
}
function renderizarItensRefeicao(){
  let box=document.getElementById("meal-items");if(!box)return;
  box.innerHTML=itensRefeicao.map((f,i)=>'<div class="list-row"><div><strong>'+esc(f.name)+'</strong><div class="muted">'+f.calories+' kcal por '+f.servingSize+f.servingUnit+'</div></div><div style="display:flex;gap:7px;align-items:center"><input class="form-input meal-quantity" data-index="'+i+'" type="number" min="0.1" step="0.1" value="'+f.quantity+'" style="width:90px"><button type="button" class="small-button danger-button" data-remove-meal-item="'+i+'">×</button></div></div>').join("");
  box.querySelectorAll(".meal-quantity").forEach(input=>input.addEventListener("change",function(){itensRefeicao[Number(input.dataset.index)].quantity=Number(input.value);renderizarItensRefeicao()}));
  box.querySelectorAll("[data-remove-meal-item]").forEach(btn=>btn.addEventListener("click",function(){itensRefeicao.splice(Number(btn.dataset.removeMealItem),1);renderizarItensRefeicao()}));
  let total=itensRefeicao.reduce((a,f)=>{let fator=f.quantity/f.servingSize;a.k+=f.calories*fator;a.p+=f.protein*fator;a.c+=f.carbs*fator;a.g+=f.fat*fator;return a},{k:0,p:0,c:0,g:0});
  document.getElementById("meal-total").textContent="Total: "+formatarNumero(total.k)+" kcal · P "+formatarNumero(total.p)+"g · C "+formatarNumero(total.c)+"g · G "+formatarNumero(total.g)+"g";
}
async function salvarRefeicao(e){
  e.preventDefault();if(!itensRefeicao.length){mostrarToast("Adicione pelo menos um alimento.");return}
  let total=itensRefeicao.reduce((a,f)=>{let fator=f.quantity/f.servingSize;a.k+=f.calories*fator;a.p+=f.protein*fator;a.c+=f.carbs*fator;a.g+=f.fat*fator;return a},{k:0,p:0,c:0,g:0});
  let items=itensRefeicao.map(f=>{let fator=f.quantity/f.servingSize;return{foodId:f.id,name:f.name,quantity:f.quantity,calories:Math.round(f.calories*fator),protein:Number((f.protein*fator).toFixed(1)),carbs:Number((f.carbs*fator).toFixed(1)),fat:Number((f.fat*fator).toFixed(1))}});
  await addDoc(collection(db,"users",usuario.uid,"meals"),{userId:usuario.uid,date:document.getElementById("meal-date").value,mealType:document.getElementById("meal-type").value,items,totalCalories:Math.round(total.k),totalProtein:Number(total.p.toFixed(1)),totalCarbs:Number(total.c.toFixed(1)),totalFat:Number(total.g.toFixed(1)),createdAt:new Date().toISOString()});
  await carregarTodosDados();itensRefeicao=[];abaAlimentacao="refeicoes";mostrarAlimentacao();mostrarToast("Refeição registrada.");
}

// ========================================
// 9 - EVOLUÇÃO
// ========================================

function mostrarEvolucao(){
  let ordenados=dados.pesos.slice().sort((a,b)=>a.date.localeCompare(b.date));
  let ultimo=ordenados[ordenados.length-1]?.weight||perfil.currentWeight;
  let anterior=ordenados[ordenados.length-2]?.weight;
  let variacao=anterior!==undefined?ultimo-anterior:0;
  let primeiro=ordenados[0]?.weight;
  pageContent.innerHTML='<div class="page-heading"><div><div class="eyebrow-green">Composição corporal</div><h1>Evolução</h1><p>Pequenas medições mostram tendências que o dia a dia esconde.</p></div></div><div class="grid stats"><div class="card"><div class="stat-label">Peso mais recente</div><div class="stat-value">'+(ultimo?ultimo.toFixed(1):"—")+' <small>kg</small></div><p class="card-subtitle">Última medição</p></div><div class="card"><div class="stat-label">Meta</div><div class="stat-value cyan">'+Number(perfil.targetWeight||0).toFixed(1)+' <small>kg</small></div><p class="card-subtitle">Definida no perfil</p></div><div class="card"><div class="stat-label">Variação</div><div class="stat-value '+(variacao<0?"green":variacao>0?"orange":"")+'">'+(variacao>0?"+":"")+variacao.toFixed(1)+' <small>kg</small></div><p class="card-subtitle">Duas últimas medições</p></div><div class="card"><div class="stat-label">Registros</div><div class="stat-value purple">'+ordenados.length+'</div><p class="card-subtitle">Pesagens salvas</p></div></div><div class="grid two-columns" style="margin-top:16px"><section class="card"><h2>Peso corporal</h2><p class="card-subtitle">Histórico visual das medições.</p><div class="chart-box"><div class="chart">'+criarBarras(ordenados.map(x=>({date:x.date,volume:x.weight})))+'</div></div></section><section class="card"><h2>Registrar peso</h2><form id="weight-form"><div class="form-group"><label>Peso (kg)</label><input id="new-weight" class="form-input" type="number" min="1" step="0.1" placeholder="Ex.: 82.1" required></div><div class="form-group"><label>Data</label><input id="new-weight-date" class="form-input" type="date" max="'+hoje()+'" value="'+hoje()+'" required></div><div class="form-group"><label>Observação</label><input id="new-weight-note" class="form-input" placeholder="Ex.: pesagem em jejum"></div><button class="primary-button" type="submit">Salvar medição</button></form></section></div><section class="card" style="margin-top:16px"><h2>Histórico de peso</h2><div class="list">'+(ordenados.length?ordenados.slice().reverse().map(w=>'<div class="history-item"><div><strong>'+formatarData(w.date)+'</strong><div class="history-meta">'+esc(w.notes||"Registro de peso")+'</div></div><div style="display:flex;align-items:center;gap:9px"><strong class="cyan">'+Number(w.weight).toFixed(1)+' kg</strong><button class="small-button danger-button" data-delete-weight="'+w.id+'">Excluir</button></div></div>').join(""):'<div class="empty">Nenhuma pesagem registrada.</div>')+'</div></section>';
  let form=document.getElementById("weight-form");form.addEventListener("submit",async function(e){e.preventDefault();let peso=Number(document.getElementById("new-weight").value);if(peso<=0)return;await addDoc(collection(db,"users",usuario.uid,"weightHistory"),{userId:usuario.uid,date:document.getElementById("new-weight-date").value,weight:peso,notes:document.getElementById("new-weight-note").value.trim()||undefined,createdAt:new Date().toISOString()});await updateDoc(doc(db,"users",usuario.uid),{currentWeight:peso,updatedAt:new Date().toISOString()});perfil.currentWeight=peso;await carregarTodosDados();mostrarEvolucao();mostrarToast("Pesagem registrada.")});
}

// ========================================
// 10 - PERFIL
// ========================================

function mostrarPerfil(){
  pageContent.innerHTML='<div class="page-heading"><div><div class="eyebrow-green">Configurações pessoais</div><h1>Perfil</h1><p>Atualize seus dados, objetivo e preferências.</p></div></div><div class="grid two-columns"><section class="card"><div class="profile-head"><div class="profile-avatar-large">'+esc((perfil.displayName||"A").charAt(0).toUpperCase())+'</div><div><h2>'+esc(perfil.displayName||"Atleta Aura")+'</h2><p>'+esc(perfil.email||usuario.email||"")+'</p></div></div><form id="profile-form"><div class="form-group"><label>Nome</label><input id="profile-name" class="form-input" value="'+esc(perfil.displayName||"")+'"></div><div class="form-grid-2"><div><label>Peso atual (kg)</label><input id="profile-weight" class="form-input" type="number" min="1" step="0.1" value="'+Number(perfil.currentWeight||0)+'"></div><div><label>Meta de peso (kg)</label><input id="profile-target" class="form-input" type="number" min="1" step="0.1" value="'+Number(perfil.targetWeight||0)+'"></div></div><div class="form-grid-2"><div><label>Altura (cm)</label><input id="profile-height" class="form-input" type="number" min="50" max="250" value="'+Number(perfil.height||0)+'"></div><div><label>Meta calórica diária</label><input id="profile-calories" class="form-input" type="number" min="500" value="'+Number(perfil.dailyCalorieGoal||2200)+'"></div></div><div class="form-group"><label>Nível de atividade</label><select id="profile-activity" class="select-input"><option value="sedentary">Sedentário</option><option value="light">Leve</option><option value="moderate">Moderado</option><option value="very_active">Muito ativo</option><option value="extra_active">Extremamente ativo</option></select></div><button class="primary-button" type="submit">Salvar configurações</button></form></section><section class="card"><h2>Resumo metabólico</h2><div class="grid three-columns"><div><div class="stat-label">IMC aproximado</div><div class="stat-value">'+calcularIMC()+'</div></div><div><div class="stat-label">TDEE estimado</div><div class="stat-value green">'+calcularTDEE()+'</div><p class="card-subtitle">kcal/dia</p></div><div><div class="stat-label">Diferença para meta</div><div class="stat-value cyan">'+Math.abs(Number(perfil.currentWeight||0)-Number(perfil.targetWeight||0)).toFixed(1)+'</div><p class="card-subtitle">kg</p></div></div><div class="info-box" style="margin-top:20px">As estimativas são referências para acompanhamento e não substituem avaliação profissional.</div></section></div>';
  document.getElementById("profile-activity").value=perfil.activityLevel||"moderate";
  document.getElementById("profile-form").addEventListener("submit",salvarPerfil);
}
async function salvarPerfil(e){
  e.preventDefault();
  let atual={displayName:document.getElementById("profile-name").value.trim()||"Atleta Aura",currentWeight:Number(document.getElementById("profile-weight").value),targetWeight:Number(document.getElementById("profile-target").value),height:Number(document.getElementById("profile-height").value),dailyCalorieGoal:Number(document.getElementById("profile-calories").value),activityLevel:document.getElementById("profile-activity").value,updatedAt:new Date().toISOString()};
  await updateDoc(doc(db,"users",usuario.uid),atual);
  await updateProfile(usuario,{displayName:atual.displayName});
  perfil={...perfil,...atual};atualizarUsuarioNaTela();mostrarPerfil();mostrarToast("Perfil atualizado.");
}

// ========================================
// 11 - AURA COM GEMINI
// ========================================

function abrirAura(){
  document.getElementById("aura-panel").classList.remove("hidden");
  document.getElementById("aura-launcher").classList.add("hidden");
  if(!document.getElementById("aura-messages").children.length){
    adicionarMensagemAura("bot","Olá! Eu sou a Aura ✦. Posso ajudar com treino e alimentação ou analisar uma foto do seu prato.");
  }
  document.getElementById("aura-input").focus();
}
function fecharAura(){document.getElementById("aura-panel").classList.add("hidden");document.getElementById("aura-launcher").classList.remove("hidden")}
document.getElementById("aura-photo").addEventListener("click",function(){document.getElementById("aura-file").click()});
document.getElementById("aura-file").addEventListener("change",function(e){let file=e.target.files?.[0];if(!file)return;if(!file.type.startsWith("image/")){adicionarMensagemAura("bot","Selecione uma imagem válida.");return}if(file.size>10*1024*1024){adicionarMensagemAura("bot","A imagem precisa ter no máximo 10 MB.");return}auraImagem=file;auraPreviewUrl=URL.createObjectURL(file);document.getElementById("aura-preview").classList.remove("hidden");document.getElementById("aura-preview").innerHTML='<img src="'+auraPreviewUrl+'" alt="Prévia">';});
document.getElementById("aura-send").addEventListener("click",enviarAura);
document.getElementById("aura-input").addEventListener("keydown",function(e){if(e.key==="Enter"){e.preventDefault();enviarAura()}});

async function enviarAura(){
  let input=document.getElementById("aura-input");
  let texto=input.value.trim();
  if(!texto&&!auraImagem)return;
  let imagem=auraImagem;
  let preview=auraPreviewUrl;
  input.value="";
  auraImagem=null;
  document.getElementById("aura-file").value="";
  document.getElementById("aura-preview").classList.add("hidden");
  adicionarMensagemAura("user",imagem?(texto||"Analise este prato para mim."):texto,preview);
  adicionarMensagemAura("bot","Analisando...");
  let carregando=document.getElementById("aura-messages").lastElementChild;
  try{
    if(!auraChat){
      let ai=getAI(app,{backend:new GoogleAIBackend()});
      let model=getGenerativeModel(ai,{
        model:"gemini-3.8-flash",
        systemInstruction:{role:"model",parts:[{text:"Você é a Aura, assistente virtual da Academia Aura. Responda em português do Brasil, de forma simples, amigável e objetiva. Ajude com dúvidas sobre alimentação, exercícios, hábitos e uso da Academia Aura. Não substitua médico, nutricionista ou outro profissional de saúde. Quando analisar uma foto de comida, identifique apenas os alimentos visíveis, estime porções quando houver indícios visuais e estime calorias, proteínas, carboidratos e gorduras. Deixe claro que são estimativas e que uma foto não permite medir exatamente o peso. Se não conseguir identificar algo, diga isso em vez de inventar."}]},
        generationConfig:{temperature:.4,maxOutputTokens:700}
      });
      auraChat=model.startChat();
    }
    let resposta;
    if(imagem){
      let base64=await arquivoParaBase64(imagem);
      let prompt=texto||"Analise esta foto de comida. Identifique os alimentos visíveis e faça uma estimativa de calorias e macronutrientes. Organize por alimento e mostre um total estimado.";
      let result=await auraChat.sendMessage([prompt,{inlineData:{data:base64,mimeType:imagem.type}}]);
      resposta=result.response.text();
    }else{
      let result=await auraChat.sendMessage(texto);
      resposta=result.response.text();
    }
    carregando.remove();
    adicionarMensagemAura("bot",resposta);
  }catch(error){
    console.error("Aura:",error);
    carregando.remove();
    adicionarMensagemAura("bot","Não consegui falar com a IA agora. Verifique se o Gemini e o App Check estão habilitados no Firebase e tente novamente.");
  }
}
function arquivoParaBase64(file){return new Promise(function(resolve,reject){let reader=new FileReader();reader.onloadend=function(){let result=reader.result;if(typeof result!=="string")reject(new Error("imagem"));else resolve(result.split(",")[1])};reader.onerror=reject;reader.readAsDataURL(file)})}
function adicionarMensagemAura(tipo,texto,imagem){
  let box=document.getElementById("aura-messages");let div=document.createElement("div");div.className="aura-message "+tipo;
  if(imagem){let img=document.createElement("img");img.src=imagem;img.alt="Imagem enviada";div.appendChild(img)}
  div.appendChild(document.createTextNode(texto));box.appendChild(div);box.scrollTop=box.scrollHeight;
}

// ========================================
// 12 - FUNÇÕES DE CÁLCULO
// ========================================

function calcularVolume(exercicios){return exercicios.reduce((total,ex)=>ex.isCardio?total:total+ex.sets.reduce((s,set)=>s+(set.completed&&set.weight>0&&set.reps>0?set.weight*set.reps:0),0),0)}
function calcularCaloriasTreino(minutos,pesoExercicios){let peso=Number(perfil?.currentWeight)||75;let cardioMin=0,cardioCal=0;for(let ex of pesoExercicios){if(ex.isCardio&&ex.cardioMinutes>0){cardioMin+=ex.cardioMinutes;let met=ex.cardioIntensity==="high"?10:ex.cardioIntensity==="moderate"?7:4.5;cardioCal+=(met*3.5*peso/200)*ex.cardioMinutes}}let resistencia=Math.max(0,minutos-cardioMin);return Math.round(cardioCal+(5.5*3.5*peso/200)*resistencia)}
function avaliarProgressao(atual,anterior){if(!anterior)return{status:"estagnado",diffPercent:0};let diff=(atual-anterior)/anterior*100;diff=Math.round(diff*10)/10;return{status:diff>=2?"evoluindo":diff<=-2?"regredindo":"estagnado",diffPercent:diff}}
function calcularIMC(){let peso=Number(perfil?.currentWeight)||0,altura=(Number(perfil?.height)||0)/100;return altura>0?(peso/(altura*altura)).toFixed(1):"—"}
function calcularTDEE(){let peso=Number(perfil?.currentWeight)||75,altura=Number(perfil?.height)||175,bmr=Math.round(10*peso+6.25*altura-5*28+5);let mult={sedentary:1.2,light:1.375,moderate:1.55,very_active:1.725,extra_active:1.9}[perfil?.activityLevel]||1.4;return formatarNumero(Math.round(bmr*mult))}
function gerarDias(qtd){let lista=[];let hojeData=new Date();for(let i=qtd-1;i>=0;i--){let d=new Date(hojeData);d.setDate(hojeData.getDate()-i);lista.push(d.toISOString().split("T")[0])}return lista}
function montarDadosIntegrados(dias){let tdee=calcularTDEENumero();return dias.map(function(data){let pesos=dados.pesos.filter(x=>x.date===data),treinos=dados.treinos.filter(x=>x.date===data),ref=dados.refeicoes.filter(x=>x.date===data);let calorias=ref.reduce((s,x)=>s+(x.totalCalories||0),0),gasto=treinos.reduce((s,x)=>s+(x.estimatedCaloriesBurned||0),0),volume=treinos.reduce((s,x)=>s+(x.totalVolume||0),0);return{date:data,peso:pesos.length?pesos[pesos.length-1].weight:undefined,calorias,gasto,volume,treinos:treinos.length,saldo:calorias?calorias-(tdee+gasto):0}})}
function calcularTDEENumero(){let peso=Number(perfil?.currentWeight)||75,altura=Number(perfil?.height)||175,bmr=Math.round(10*peso+6.25*altura-5*28+5);let mult={sedentary:1.2,light:1.375,moderate:1.55,very_active:1.725,extra_active:1.9}[perfil?.activityLevel]||1.4;return Math.round(bmr*mult)}
function gerarInsight(media,meta,volume,sessoes,delta,saldo){if(saldo<-150&&delta<-.3&&volume>0)return{headline:"Definição e preservação de massa magra",diagnosis:"Os registros mostram déficit calórico estimado junto de estímulo de treino e redução de peso no período.",recommendations:["Mantenha proteína adequada ao seu objetivo.","Priorize boa execução e manutenção das cargas.","Registre sono e recuperação para interpretar melhor a evolução."]};if(saldo>150&&delta>.3&&volume>0)return{headline:"Período de ganho com estímulo de treino",diagnosis:"Há balanço calórico positivo estimado, ganho de peso e sessões registradas no período.",recommendations:["Acompanhe a progressão das cargas.","Observe a evolução do peso junto de outras medidas.","Distribua bem refeições e recuperação."]};if(saldo<-150&&delta>=-.3&&volume>5000)return{headline:"Peso estável com déficit estimado",diagnosis:"O peso variou pouco apesar do balanço energético estimado. Oscilações de água e outros fatores podem influenciar a balança.",recommendations:["Compare médias de peso em vez de um único dia.","Mantenha hidratação e consistência.","Observe medidas e fotos além do peso."]};if(sessoes===0&&saldo>150)return{headline:"Atenção ao balanço energético",diagnosis:"Há consumo acima do gasto estimado sem sessões de treino registradas no período.",recommendations:["Registre sua atividade para melhorar a leitura dos dados.","Ajuste o planejamento alimentar conforme seu objetivo."]};return{headline:"Equilíbrio e consistência",diagnosis:"Os registros atuais não apontam uma mudança extrema. A consistência dos registros ajuda a tornar as análises mais úteis.",recommendations:["Continue registrando treinos e refeições.","Acompanhe tendências semanais.","Atualize seu objetivo quando necessário."]}}
function criarBarras(lista){if(!lista.length)return'<div class="empty">Sem dados suficientes para o gráfico.</div>';let valores=lista.map(x=>Number(x.volume||x.calorias||0));let max=Math.max(...valores,1);return lista.map(function(x,i){let v=Number(x.volume||x.calorias||0);let h=Math.max(5,v/max*92);return'<div class="bar" style="height:'+h+'%" title="'+v+'"><span>'+formatarDataCurta(x.date||"")+'</span></div>'}).join("")}
function formatarNumero(n){return Number(n||0).toLocaleString("pt-BR",{maximumFractionDigits:0})}
function formatarData(data){if(!data)return"—";let partes=data.split("-");return partes.length===3?partes[2]+"/"+partes[1]+"/"+partes[0]:data}
function formatarDataCurta(data){if(!data)return"";let p=data.split("-");return p.length===3?p[2]+"/"+p[1]:""}
function hoje(){return new Date().toISOString().split("T")[0]}
function esc(texto){return String(texto??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}
function nomeRefeicao(tipo){return{cafe_da_manha:"Café da manhã",almoco:"Almoço",lanche:"Lanche",jantar:"Jantar",ceia:"Ceia"}[tipo]||tipo}
function mostrarToast(texto){let antigo=document.querySelector(".toast");if(antigo)antigo.remove();let div=document.createElement("div");div.className="toast";div.textContent=texto;document.body.appendChild(div);setTimeout(()=>div.remove(),3000)}

// ========================================
// 13 - DADOS PADRÃO
// ========================================

function exerciciosPadrao(){return[
{name:"Supino Reto com Barra",category:"chest",equipment:"barbell",defaultRestSeconds:90,notes:"Peito, deltoide anterior e tríceps"},
{name:"Supino Inclinado com Halteres",category:"chest",equipment:"dumbbell",defaultRestSeconds:90},
{name:"Crucifixo na Polia",category:"chest",equipment:"cable",defaultRestSeconds:60},
{name:"Puxada Alta (Lat Pulldown)",category:"back",equipment:"cable",defaultRestSeconds:90},
{name:"Remada Curvada com Barra",category:"back",equipment:"barbell",defaultRestSeconds:90},
{name:"Agachamento Livre",category:"legs",equipment:"barbell",defaultRestSeconds:120},
{name:"Leg Press 45º",category:"legs",equipment:"machine",defaultRestSeconds:90},
{name:"Cadeira Extensora",category:"legs",equipment:"machine",defaultRestSeconds:60},
{name:"Desenvolvimento Militar com Barra",category:"shoulders",equipment:"barbell",defaultRestSeconds:90},
{name:"Elevação Lateral com Halteres",category:"shoulders",equipment:"dumbbell",defaultRestSeconds:60},
{name:"Rosca Direta com Barra W",category:"arms",equipment:"barbell",defaultRestSeconds:60},
{name:"Tríceps Polia Corda",category:"arms",equipment:"cable",defaultRestSeconds:60},
{name:"Prancha Abdominal",category:"core",equipment:"bodyweight",defaultRestSeconds:60},
{name:"Esteira Corrida Intervalada",category:"cardio",equipment:"cardio_machine",defaultRestSeconds:0},
{name:"Bike Ergométrica",category:"cardio",equipment:"cardio_machine",defaultRestSeconds:0}
]}
function alimentosPadrao(){return[
{name:"Peito de Frango Grelhado",servingSize:100,servingUnit:"g",calories:165,protein:31,carbs:0,fat:3.6},
{name:"Arroz Branco Cozido",servingSize:100,servingUnit:"g",calories:130,protein:2.7,carbs:28.2,fat:.3},
{name:"Ovo Cozido",servingSize:1,servingUnit:"unidade",calories:74,protein:6.3,carbs:.4,fat:5},
{name:"Aveia em Flocos",servingSize:30,servingUnit:"g",calories:106,protein:4.2,carbs:17,fat:2.2},
{name:"Whey Protein",servingSize:30,servingUnit:"g",calories:120,protein:24,carbs:3,fat:1.5},
{name:"Banana Prata",servingSize:1,servingUnit:"unidade",calories:89,protein:1.1,carbs:22.8,fat:.3},
{name:"Pasta de Amendoim",servingSize:15,servingUnit:"g",calories:90,protein:4,carbs:3,fat:7.5},
{name:"Batata Doce Cozida",servingSize:100,servingUnit:"g",calories:86,protein:1.6,carbs:20.1,fat:.1},
{name:"Azeite de Oliva",servingSize:10,servingUnit:"ml",calories:88,protein:0,carbs:0,fat:10},
{name:"Patinho Moído Grelhado",servingSize:100,servingUnit:"g",calories:219,protein:35.9,carbs:0,fat:7.3}
]}

// ========================================
// 14 - DADOS DE DEMONSTRAÇÃO
// ========================================

async function criarDadosDemo(uid) {
  let hojeDemo = "2026-10-02";
  let pesosDemo = [
    {date:"2026-09-08",weight:83.5,notes:"Início do ciclo"},
    {date:"2026-09-15",weight:83.0,notes:"Primeira semana consistente"},
    {date:"2026-09-22",weight:82.7,notes:"Boa definição muscular"},
    {date:"2026-09-29",weight:82.4,notes:"Pesagem semanal em jejum"},
    {date:"2026-10-02",weight:82.1,notes:"Meta de recomposição avançando"}
  ];
  for (let item of pesosDemo) {
    await addDoc(collection(db,"users",uid,"weightHistory"),{userId:uid,...item,createdAt:new Date().toISOString()});
  }

  let treinosDemo = [
    {title:"Treino A - Peitoral, Ombros e Tríceps",date:"2026-09-27",durationMinutes:65,totalVolume:7420,estimatedCaloriesBurned:430,progressionStatus:"evoluindo",progressionDiffPercent:4.8,notes:"Subi 2kg no supino reto mantendo boa técnica.",exercises:[{exerciseId:"demo1",exerciseName:"Supino Reto com Barra",category:"chest",isCardio:false,sets:[{setNumber:1,reps:10,weight:80,completed:true},{setNumber:2,reps:8,weight:84,completed:true},{setNumber:3,reps:8,weight:84,completed:true}]}]},
    {title:"Treino B - Dorsais, Trapézio e Bíceps",date:"2026-09-29",durationMinutes:60,totalVolume:8250,estimatedCaloriesBurned:410,progressionStatus:"evoluindo",progressionDiffPercent:3.2,notes:"Execução cadenciada na remada.",exercises:[{exerciseId:"demo2",exerciseName:"Puxada Alta (Lat Pulldown)",category:"back",isCardio:false,sets:[{setNumber:1,reps:12,weight:65,completed:true},{setNumber:2,reps:10,weight:70,completed:true},{setNumber:3,reps:8,weight:75,completed:true}]}]},
    {title:"Treino C - Membros Inferiores e Cardio",date:"2026-10-01",durationMinutes:75,totalVolume:9800,estimatedCaloriesBurned:580,progressionStatus:"evoluindo",progressionDiffPercent:5.1,notes:"Agachamento com amplitude completa + 20min esteira.",exercises:[{exerciseId:"demo3",exerciseName:"Agachamento Livre",category:"legs",isCardio:false,sets:[{setNumber:1,reps:10,weight:100,completed:true},{setNumber:2,reps:8,weight:110,completed:true},{setNumber:3,reps:6,weight:120,completed:true}]},{exerciseId:"demo4",exerciseName:"Esteira Corrida Intervalada",category:"cardio",isCardio:true,sets:[],cardioMinutes:20,cardioIntensity:"high",cardioDistanceKm:3.2}]}
  ];
  for (let treino of treinosDemo) await addDoc(collection(db,"users",uid,"workouts"),{userId:uid,...treino,createdAt:new Date().toISOString()});

  let refeicoesDemo = [
    {date:hojeDemo,mealType:"cafe_da_manha",totalCalories:480,totalProtein:32,totalCarbs:58,totalFat:12,items:[{foodId:"f_aveia",name:"Aveia em Flocos",quantity:45,calories:159,protein:6.3,carbs:25.5,fat:3.3},{foodId:"f_whey",name:"Whey Protein",quantity:30,calories:120,protein:24,carbs:3,fat:1.5},{foodId:"f_banana",name:"Banana Prata",quantity:1,calories:89,protein:1.1,carbs:22.8,fat:.3}]},
    {date:hojeDemo,mealType:"almoco",totalCalories:690,totalProtein:55,totalCarbs:72,totalFat:16,items:[{foodId:"f_frango",name:"Peito de Frango Grelhado",quantity:160,calories:264,protein:49.6,carbs:0,fat:5.7},{foodId:"f_arroz",name:"Arroz Branco Cozido",quantity:220,calories:286,protein:5.9,carbs:62,fat:.7}]},
    {date:hojeDemo,mealType:"jantar",totalCalories:620,totalProtein:48,totalCarbs:65,totalFat:14,items:[{foodId:"f_patinho",name:"Patinho Moído Grelhado",quantity:140,calories:306,protein:50.2,carbs:0,fat:10.2},{foodId:"f_batata",name:"Batata Doce Cozida",quantity:250,calories:215,protein:4,carbs:50.2,fat:.2}]}
  ];
  for (let refeicao of refeicoesDemo) await addDoc(collection(db,"users",uid,"meals"),{userId:uid,...refeicao,createdAt:new Date().toISOString()});
}

// ========================================
// 15 - TEMA DE LOGIN
// ========================================

document.getElementById("login-tab").addEventListener("click",function(){document.getElementById("login-tab").classList.add("active");document.getElementById("signup-tab").classList.remove("active");loginForm.classList.remove("hidden");signupForm.classList.add("hidden");authMessage.textContent=""});
document.getElementById("signup-tab").addEventListener("click",function(){document.getElementById("signup-tab").classList.add("active");document.getElementById("login-tab").classList.remove("active");signupForm.classList.remove("hidden");loginForm.classList.add("hidden");authMessage.textContent=""});
