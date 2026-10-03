# Academia Aura — HTML + CSS + JavaScript

Esta é a migração da Academia Aura do React/TypeScript para uma estrutura mais simples:

- HTML
- CSS
- JavaScript
- Firebase
- Firebase App Check
- Firebase AI Logic / Gemini
- Firestore
- Firebase Authentication

## O que já foi migrado

- Login com e-mail e senha
- Cadastro de usuário
- Recuperação de senha
- Modo demonstração com login anônimo
- Perfil salvo no Firestore
- Tema claro/escuro
- Visão geral com KPIs e diagnóstico integrado
- Períodos de 7, 14 e 30 dias
- Treinos com exercícios, séries, carga, cardio, volume e calorias
- Histórico de treinos
- Análise de volume
- Biblioteca de exercícios
- Alimentação com refeições e macronutrientes
- Cadastro de alimentos
- Histórico de refeições
- Evolução de peso
- Gráfico visual e histórico de pesagens
- Perfil com TDEE/IMC estimados
- Aura com Gemini real
- Análise de foto de alimentos pela Aura
- App Check com reCAPTCHA Enterprise
- Deploy automático no GitHub Pages

## Estrutura

`index.html` → telas e estrutura HTML  
`style.css` → visual, responsividade e componentes  
`script.js` → Firebase, navegação, Firestore, cálculos e Aura  
`vite.config.js` → build para GitHub Pages  
`.github/workflows/deploy.yml` → publicação automática

## Firebase

A chave reCAPTCHA Enterprise é lida durante o build por:

`VITE_RECAPTCHA_SITE_KEY`

Ela deve existir nos Secrets do GitHub Actions do repositório.

O App Check é inicializado antes do uso dos serviços Firebase. A documentação oficial do Firebase recomenda esse fluxo para reCAPTCHA Enterprise.

## Observação

O projeto continua sem React e sem TypeScript. A lógica foi reescrita em JavaScript para ficar mais próxima do formato que você já conhece.

O repositório React original continua separado em `fafabot/Academia---Hackathon`.
