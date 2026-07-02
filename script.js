"use strict";

/* ============================================================ helpers */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const store = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, val) { try { localStorage.setItem(key, val); } catch { /* private mode */ } },
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

const docEl = document.documentElement;

/* ================================================== i18n (PT / EN) */
let LANG = store.get("lang") === "en" ? "en" : "pt";
const L = (pt, en) => (LANG === "en" ? en : pt);

const langToggle = $("#langToggle");
const langLabel = $("#langLabel");

function applyLang(lang) {
  LANG = lang === "en" ? "en" : "pt";
  const en = LANG === "en";
  docEl.lang = en ? "en" : "pt-BR";

  $$("[data-en]").forEach((el) => {
    if (el.dataset.pt === undefined) el.dataset.pt = el.innerHTML;
    el.innerHTML = en ? el.dataset.en : el.dataset.pt;
  });
  $$("[data-en-aria]").forEach((el) => {
    if (el.dataset.ptAria === undefined) el.dataset.ptAria = el.getAttribute("aria-label") || "";
    el.setAttribute("aria-label", en ? el.dataset.enAria : el.dataset.ptAria);
  });
  $$("[data-en-tip]").forEach((el) => {
    if (el.dataset.ptTip === undefined) el.dataset.ptTip = el.getAttribute("data-tip") || "";
    el.setAttribute("data-tip", en ? el.dataset.enTip : el.dataset.ptTip);
  });

  if (langLabel) langLabel.textContent = en ? "PT" : "EN";
  if (langToggle) langToggle.setAttribute("aria-label", en ? "Mudar idioma para português" : "Switch language to English");
}
function toggleLang() {
  const next = LANG === "en" ? "pt" : "en";
  applyLang(next);
  store.set("lang", next);
}
langToggle?.addEventListener("click", toggleLang);

/* ============================================================== accent theme */
const themeToggle = $("#themeToggle");
function applyAccent(accent) {
  if (accent === "amber") docEl.setAttribute("data-accent", "amber");
  else docEl.removeAttribute("data-accent");
}
applyAccent(store.get("accent") === "amber" ? "amber" : "green");
themeToggle?.addEventListener("click", () => {
  const next = docEl.getAttribute("data-accent") === "amber" ? "green" : "amber";
  applyAccent(next);
  store.set("accent", next);
});

/* ===================================================== ambient HUD */
const hudClock = $("#hudClock");
const hudRes = $("#hudRes");
const hudLoad = $("#hudLoad");
const hudPing = $("#hudPing");

function tickClock() {
  if (!hudClock) return;
  const n = new Date();
  const p = (x) => String(x).padStart(2, "0");
  hudClock.textContent = `${p(n.getHours())}:${p(n.getMinutes())}:${p(n.getSeconds())}`;
}
tickClock();
setInterval(tickClock, 1000);

function updateRes() { if (hudRes) hudRes.textContent = `${window.innerWidth}x${window.innerHeight}`; }
updateRes();
window.addEventListener("resize", updateRes);

function reportLoad() {
  if (!hudLoad) return;
  const nav = performance.getEntriesByType?.("navigation")?.[0];
  const ms = nav && nav.loadEventEnd > 0 ? nav.loadEventEnd : performance.now();
  hudLoad.textContent = `Load: ${(Math.max(1, ms) / 1000).toFixed(2)}s`;
}
window.addEventListener("load", () => setTimeout(reportLoad, 0));

async function measurePing() {
  const t0 = performance.now();
  try {
    await fetch(`${window.location.href}${window.location.search ? "&" : "?"}_p=${Math.round(t0)}`, { method: "HEAD", cache: "no-store" });
    return Math.round(performance.now() - t0);
  } catch { return null; }
}
let simBase = 26;
async function pingLoop() {
  if (!hudPing) return;
  let ms = await measurePing();
  if (ms === null || ms < 1) {
    simBase += Math.round((Math.sin(performance.now() / 4000) * 6) + (Math.random() * 4 - 2));
    simBase = Math.min(60, Math.max(16, simBase));
    ms = simBase;
  }
  hudPing.textContent = `${ms}ms`;
  setTimeout(pingLoop, 3000);
}
pingLoop();

/* ================================================= cursor spotlight */
if (!prefersReduced) {
  let raf = null, el = null, x = 0, y = 0;
  document.addEventListener("pointermove", (e) => {
    const target = e.target.closest?.(".spot");
    if (!target) return;
    const r = target.getBoundingClientRect();
    el = target; x = e.clientX - r.left; y = e.clientY - r.top;
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = null;
      if (el) { el.style.setProperty("--mx", `${x}px`); el.style.setProperty("--my", `${y}px`); }
    });
  }, { passive: true });
}

/* ==================================================== scroll reveal */
const revealTargets = $$("[data-reveal]");
if (!prefersReduced && "IntersectionObserver" in window && revealTargets.length) {
  revealTargets.forEach((node) => node.classList.add("reveal"));
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add("is-in"); obs.unobserve(entry.target); }
    });
  }, { rootMargin: "0px 0px -10% 0px", threshold: 0.08 });
  revealTargets.forEach((node) => io.observe(node));
}

/* ======================================================= scroll spy */
const navLinks = $$(".nav a");
const sectionFor = new Map();
navLinks.forEach((link) => {
  const id = link.getAttribute("href")?.slice(1);
  const sec = id && document.getElementById(id);
  if (sec) sectionFor.set(sec, link);
});
if ("IntersectionObserver" in window && sectionFor.size) {
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((l) => l.classList.remove("is-active"));
      sectionFor.get(entry.target)?.classList.add("is-active");
    });
  }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
  sectionFor.forEach((_, sec) => spy.observe(sec));
}

/* =============================================================== man modal (PT/EN) */
const manuals = {
  eks: {
    title: "EKS-PLATFORM-INFRA(1)",
    pt: `
      <h3>Nome</h3><p><strong>eks-platform-infra</strong>: infraestrutura base de EKS na AWS provisionada com Terraform.</p>
      <h3>Sinopse</h3><pre>terraform init &amp;&amp; terraform plan
terraform apply
git push  ->  GitHub Actions  ->  OIDC AssumeRole  ->  AWS</pre>
      <h3>Problema</h3><p>Subir um ambiente EKS reprodutível com <strong>state remoto</strong>, CI seguro e observabilidade, sem chave estática da AWS no GitHub.</p>
      <h3>Arquitetura</h3><pre>Pull Request
   -> GitHub Actions (OIDC, sem secret estático)
   -> Terraform plan / apply
   -> S3 (state) + DynamoDB (lock)
   -> VPC + EKS + managed node group
   -> kube-prometheus-stack (Prometheus + Grafana)</pre>
      <h3>Decisões</h3><ul>
        <li>State remoto em S3 com lock no DynamoDB para evitar corrupção de estado.</li>
        <li>Autenticação via OIDC em vez de access key estática no CI.</li>
        <li>Managed node group para reduzir operação manual.</li>
        <li>Gates: <strong>fmt</strong>, <strong>validate</strong>, <strong>TFLint</strong> e <strong>Trivy</strong> antes do apply.</li>
      </ul>
      <h3>O que faltou / tradeoffs</h3><ul>
        <li>Cluster single-region: simples e barato, sem DR cross-region ainda.</li>
        <li>Sem service mesh, escolha consciente para blast radius pequeno.</li>
        <li>Próximos passos: OPA/Conftest, autoscaling de nós e backup do state.</li>
      </ul>`,
    en: `
      <h3>Name</h3><p><strong>eks-platform-infra</strong>: EKS baseline on AWS, provisioned with Terraform.</p>
      <h3>Synopsis</h3><pre>terraform init &amp;&amp; terraform plan
terraform apply
git push  ->  GitHub Actions  ->  OIDC AssumeRole  ->  AWS</pre>
      <h3>Problem</h3><p>Spin up a reproducible EKS environment with <strong>remote state</strong>, secure CI and observability, with no static AWS key stored in GitHub.</p>
      <h3>Architecture</h3><pre>Pull Request
   -> GitHub Actions (OIDC, no static secret)
   -> Terraform plan / apply
   -> S3 (state) + DynamoDB (lock)
   -> VPC + EKS + managed node group
   -> kube-prometheus-stack (Prometheus + Grafana)</pre>
      <h3>Decisions</h3><ul>
        <li>Remote state in S3 with DynamoDB lock to avoid state corruption.</li>
        <li>OIDC auth instead of a static AWS access key in CI.</li>
        <li>Managed node group to reduce manual data-plane ops.</li>
        <li>Gates: <strong>fmt</strong>, <strong>validate</strong>, <strong>TFLint</strong> and <strong>Trivy</strong> before apply.</li>
      </ul>
      <h3>What's missing / tradeoffs</h3><ul>
        <li>Single-region cluster: simple and cheap, but no cross-region DR yet.</li>
        <li>No service mesh, a conscious choice to keep the blast radius small.</li>
        <li>Next: OPA/Conftest policies, node autoscaling and versioned state backup.</li>
      </ul>`,
  },
  finops: {
    title: "FINANCIAL-OPS-PLATFORM(1)",
    pt: `
      <h3>Nome</h3><p><strong>financial-ops-platform</strong>: sustentação, automação e observabilidade de uma operação crítica no setor financeiro regulado.</p>
      <h3>Escopo</h3><pre>500+ usuários atendidos        SLA &gt; 98%
cloud híbrida: AWS + Azure      virtualização: VMware vSphere
SO: Linux RHEL + Windows Server identidade: AD + Entra ID
acesso: IAM / RBAC / least privilege</pre>
      <h3>Problema</h3><p>Manter uma operação regulada estável, rastreável e segura enquanto cresce em usuários, clouds e identidades, reduzindo MTTR.</p>
      <h3>Decisões</h3><ul>
        <li>Automação de rotinas e backups com Ansible, PowerShell e Bash.</li>
        <li>Observabilidade proativa com Zabbix e Grafana para reduzir MTTR.</li>
        <li>Governança de identidade e acesso com AD, Entra ID, IAM e RBAC.</li>
        <li>Hardening e DevSecOps em Linux RHEL e Windows Server.</li>
      </ul>
      <h3>O que faltou / tradeoffs</h3><ul>
        <li>Ambiente híbrido herdado: parte do legado ainda exige operação manual.</li>
        <li>Observabilidade focada em infra, tracing distribuído fica como evolução.</li>
        <li>Próximos passos: SLOs formais e pipelines de hardening contínuo.</li>
      </ul>`,
    en: `
      <h3>Name</h3><p><strong>financial-ops-platform</strong>: sustaining, automation and observability of a critical operation in the regulated financial sector.</p>
      <h3>Scope</h3><pre>500+ users served              SLA &gt; 98%
hybrid cloud: AWS + Azure      virtualization: VMware vSphere
OS: Linux RHEL + Windows Srv   identity: AD + Entra ID
access: IAM / RBAC / least privilege</pre>
      <h3>Problem</h3><p>Keep a regulated operation stable, traceable and secure as it grows in users, clouds and identities, reducing MTTR.</p>
      <h3>Decisions</h3><ul>
        <li>Routine and backup automation with Ansible, PowerShell and Bash.</li>
        <li>Proactive observability with Zabbix and Grafana to cut MTTR.</li>
        <li>Identity and access governance with AD, Entra ID, IAM and RBAC.</li>
        <li>Hardening and DevSecOps on Linux RHEL and Windows Server.</li>
      </ul>
      <h3>What's missing / tradeoffs</h3><ul>
        <li>Legacy hybrid environment: part of it still needs controlled manual ops.</li>
        <li>Infra-focused observability, distributed tracing is a next step.</li>
        <li>Next: formal SLOs and continuous hardening pipelines.</li>
      </ul>`,
  },
};

const modal = $("#manModal");
const manTitle = $("#manTitle");
const manBody = $("#manBody");
const manClose = $("#manClose");
let lastFocused = null;

function trapModalFocus(container, e) {
  if (e.key !== "Tab" || !container) return;
  const focusable = $$('button, a[href], input, [tabindex]:not([tabindex="-1"])', container)
    .filter((el) => !el.hasAttribute("disabled") && el.offsetParent !== null);
  if (!focusable.length) return;
  const first = focusable[0], last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

function openMan(key) {
  const m = manuals[key];
  if (!m || !modal) return;
  lastFocused = document.activeElement;
  manTitle.textContent = m.title;
  manBody.innerHTML = LANG === "en" ? m.en : m.pt;
  modal.hidden = false;
  document.body.style.overflow = "hidden";
  manClose.focus();
}
function closeMan() {
  if (!modal || modal.hidden) return;
  modal.hidden = true;
  document.body.style.overflow = "";
  if (lastFocused instanceof HTMLElement) lastFocused.focus();
}
$$("[data-man]").forEach((btn) => btn.addEventListener("click", () => openMan(btn.dataset.man)));
manClose?.addEventListener("click", closeMan);
$$("#manModal [data-close]").forEach((el) => el.addEventListener("click", closeMan));
modal?.addEventListener("keydown", (e) => trapModalFocus(modal, e));

/* ================================================= resume download modal */
const CV_FILES = Object.freeze({
  pt: { href: "assets/Patrick_Ferreira-DevOps.pdf?v=2", download: "Patrick-Ferreira-DevOps.pdf" },
  en: { href: "assets/Patrick_Ferreira-DevOps-EN.pdf?v=2", download: "Patrick-Ferreira-DevOps-EN.pdf" },
});
const cvModal = $("#cvModal");
const cvClose = $("#cvClose");
let cvLastFocused = null;

function openCvModal() {
  if (!cvModal) return;
  if (modal && !modal.hidden) closeMan();
  cvLastFocused = document.activeElement;
  cvModal.hidden = false;
  document.body.style.overflow = "hidden";
  cvClose?.focus();
}
function closeCvModal() {
  if (!cvModal || cvModal.hidden) return;
  cvModal.hidden = true;
  document.body.style.overflow = "";
  if (cvLastFocused instanceof HTMLElement) cvLastFocused.focus();
}
document.addEventListener("click", (e) => {
  const trigger = e.target.closest?.("[data-cv-open]");
  if (!trigger) return;
  e.preventDefault();
  openCvModal();
});
cvClose?.addEventListener("click", closeCvModal);
$$("#cvModal [data-cv-close]").forEach((el) => el.addEventListener("click", closeCvModal));
$$("#cvModal [data-cv-download]").forEach((link) => {
  const file = CV_FILES[link.dataset.cvDownload];
  if (file) {
    link.setAttribute("href", file.href);
    link.setAttribute("download", file.download);
  }
  link.addEventListener("click", () => setTimeout(closeCvModal, 120));
});
cvModal?.addEventListener("keydown", (e) => trapModalFocus(cvModal, e));

/* ========================================================= copy email */
const EMAIL = ["trickkkz", "outlook.com"].join("@"); // assembled at runtime (anti-harvest)
const copyBtn = $("#copyEmail");
$$(".js-mail").forEach((el) => { el.setAttribute("href", "mailto:" + EMAIL); }); // build mailto, kept out of HTML
let copyTimer = null;
async function copyEmail() {
  let ok = false;
  try { await navigator.clipboard.writeText(EMAIL); ok = true; }
  catch {
    try {
      const tmp = document.createElement("textarea");
      tmp.value = EMAIL; tmp.setAttribute("readonly", "");
      tmp.style.position = "absolute"; tmp.style.left = "-9999px";
      document.body.appendChild(tmp); tmp.select();
      ok = document.execCommand("copy"); document.body.removeChild(tmp);
    } catch { ok = false; }
  }
  if (copyBtn) {
    copyBtn.classList.toggle("is-ok", ok);
    copyBtn.setAttribute("data-tip", ok ? L("copiado ✓", "copied ✓") : EMAIL);
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => {
      copyBtn.classList.remove("is-ok");
      copyBtn.setAttribute("data-tip", L("copiar email", "copy email"));
    }, 2200);
  }
  return ok;
}
copyBtn?.addEventListener("click", copyEmail);

/* ====================================================== interactive tty */
const termOut = $("#termOut");
const termForm = $("#termForm");
const termInput = $("#termInput");
const history = [];
let histIdx = -1;

function termPrint(html) {
  if (!termOut) return;
  const p = document.createElement("p");
  p.innerHTML = html;
  termOut.appendChild(p);
  termOut.scrollTop = termOut.scrollHeight;
}
function termPromptEcho(cmd) {
  termPrint(`<span class="term-prompt">guest@portfolio</span><span class="term-path">:~$</span> ${escapeHtml(cmd)}`);
}

const GH = "https://github.com/trickera";
const LI = "https://www.linkedin.com/in/patrick-ferreira-949117212";

const commands = {
  help() {
    return [
      `<span class="term-dim">${L("comandos · info:", "commands · info:")}</span>`,
      '<span class="term-key">whoami</span>  <span class="term-key">about</span>  <span class="term-key">stack</span>  <span class="term-key">xp</span>  <span class="term-key">projects</span>  <span class="term-key">certs</span>  <span class="term-key">neofetch</span>',
      `<span class="term-dim">${L("links & ações:", "links & actions:")}</span>`,
      '<span class="term-key">github</span>  <span class="term-key">cv</span>  <span class="term-key">contact</span>  <span class="term-key">email</span>  <span class="term-key">lang</span>  <span class="term-key">theme</span>',
      `<span class="term-dim">${L("navegação:", "navigation:")}</span> <span class="term-key">goto</span> &lt;${L("seção", "section")}&gt; · <span class="term-key">man</span> &lt;${L("projeto", "project")}&gt;`,
      `<span class="term-dim">extras:</span> <span class="term-key">banner</span>  <span class="term-key">motd</span>  <span class="term-key">ping</span>  <span class="term-key">history</span>  <span class="term-key">echo</span>  <span class="term-key">clear</span>`,
    ];
  },
  about() {
    return [
      L("8+ anos em TI: suporte → infra → cloud → DevOps.", "8+ years in IT: support → infra → cloud → DevOps."),
      L("Foco em confiabilidade, segurança, observabilidade, IaC e CI/CD.", "Focused on reliability, security, observability, IaC and CI/CD."),
      `<span class="term-dim">${L("seção completa:", "full section:")}</span> <span class="term-key">goto about</span>`,
    ];
  },
  certs() {
    return [
      '<span class="term-ok">[✓]</span> DevOps &amp; Site Reliability Engineering <span class="term-dim">· Linux Foundation</span>',
      '<span class="term-ok">[✓]</span> Cybersecurity Essentials <span class="term-dim">· Linux Foundation</span>',
      `<span class="term-ok">[✓]</span> GitHub Actions: ${L("Automação de Workflows", "Workflow Automation")} <span class="term-dim">· GitHub / Microsoft</span>`,
      '<span class="term-ok">[✓]</span> Cisco Network Basics <span class="term-dim">· Cisco</span>',
      `<span class="term-dim">${L("formação:", "education:")}</span> ${L("Ciência da Computação · UniRitter · formado 2026", "Computer Science · UniRitter · graduate 2026")}`,
    ];
  },
  social() {
    return [
      `<span class="term-key">github</span>   <a href="${GH}" target="_blank" rel="noopener noreferrer">github.com/trickera</a>`,
      `<span class="term-key">linkedin</span> <a href="${LI}" target="_blank" rel="noopener noreferrer">/in/patrick-ferreira-949117212</a>`,
      `<span class="term-key">email</span>    <a href="mailto:${EMAIL}">${EMAIL}</a>`,
    ];
  },
  email() {
    copyEmail();
    return [`<span class="term-ok">${EMAIL}</span> <span class="term-dim">${L("copiado ✓", "copied ✓")}</span>`];
  },
  lang() {
    toggleLang();
    return [`<span class="term-dim">${L("idioma:", "language:")}</span> <span class="term-amber">${LANG.toUpperCase()}</span>`];
  },
  en() { applyLang("en"); store.set("lang", "en"); return ['<span class="term-amber">EN</span> active']; },
  pt() { applyLang("pt"); store.set("lang", "pt"); return ['<span class="term-amber">PT</span> ativo']; },
  theme() {
    const next = docEl.getAttribute("data-accent") === "amber" ? "green" : "amber";
    applyAccent(next); store.set("accent", next);
    return [`<span class="term-dim">${L("acento:", "accent:")}</span> <span class="term-amber">${next}</span>`];
  },
  banner() {
    return [
      '<span class="term-ok">┌─[ trickkz@portfolio ]──────────────────────────┐</span>',
      '<span class="term-ok">│</span>  DevOps &amp; Cloud Engineer · Porto Alegre, BR    <span class="term-ok">│</span>',
      '<span class="term-ok">│</span>  8+ yrs · 98%+ SLA · 500+ users · open_to_work   <span class="term-ok">│</span>',
      '<span class="term-ok">└─────────────────────────────────────────────────┘</span>',
    ];
  },
  motd() {
    return [
      `<span class="term-dim">message of the day:</span>`,
      L('"Confiabilidade não é sorte, é automação, observabilidade e runbooks."',
        '"Reliability isn\'t luck, it\'s automation, observability and runbooks."'),
    ];
  },
  ping() {
    const v = hudPing ? hudPing.textContent.replace("ping ", "") : "online";
    return [`PING patrick.sh: <span class="term-ok">${escapeHtml(v)}</span> · status <span class="term-ok">operational</span> · uptime 98%+`];
  },
  coffee() {
    return ['<span class="term-amber">( (</span>', '<span class="term-amber"> ) )</span>', `<span class="term-amber">|‾‾|</span> ${L("café carregado. deploy com calma.", "coffee loaded. deploy calmly.")} ☕`];
  },
  history() {
    if (!history.length) return [`<span class="term-dim">${L("histórico vazio.", "empty history.")}</span>`];
    return history.map((h, i) => `<span class="term-dim">${String(i + 1).padStart(3, " ")}</span>  ${escapeHtml(h)}`);
  },
  sudo() { return ['<span class="term-err">guest is not in the sudoers file. This incident will be reported.</span>']; },
  vim() { return [L('pra sair do vim: Esc, :q! e reze. (aqui é só <span class="term-key">clear</span>)', 'to exit vim: Esc, :q! and pray. (here just <span class="term-key">clear</span>)')]; },
  whoami() { return ["Patrick Ferreira", '<span class="term-dim">DevOps &amp; Cloud Engineer · Porto Alegre, BR · open_to_work</span>']; },
  ls() { return ['<span class="term-key">about/  stack/  xp/  projects/  certs/  contact/</span>']; },
  stack() {
    return [
      '<span class="term-amber">[cloud]</span>         AWS · Azure · GCP',
      '<span class="term-amber">[iac/ci-cd]</span>     Terraform · Ansible · GitHub Actions · GitLab CI/CD · ArgoCD · Helm',
      '<span class="term-amber">[observability]</span> Datadog · Grafana · Prometheus · ELK · Zabbix · OTel',
      '<span class="term-amber">[security]</span>      KMS · IAM · RBAC · Hardening · DevSecOps',
      '<span class="term-amber">[ai-ops]</span>        Claude · Claude Code · Codex · Copilot · Cursor · MCP',
      '<span class="term-amber">[systems]</span>       Linux/RHEL · Windows Server · VMware · AD · Python · Bash · PowerShell',
    ];
  },
  xp() {
    return [
      `<span class="term-ok">boostingmarket.com</span>  <span class="term-dim">dez 2024 - abr 2026 · ${L("Analista DevOps · remoto", "DevOps Analyst · remote")}</span>`,
      L("EKS/K8s · HPA p/ 10k+ users · deploy 45→&lt;10min · MTTR -40%", "EKS/K8s · HPA for 10k+ users · deploy 45→&lt;10min · MTTR -40%"),
      `<span class="term-ok">ecossistema-xp</span>  <span class="term-dim">mai 2022 - jul 2024 · 500+ users · 98%+ SLA</span>`,
    ];
  },
  experience() { return this.xp(); },
  projects() {
    return [
      `<span class="term-ok">eks-platform-infra</span>      Terraform · AWS EKS · OIDC · Prometheus/Grafana  <a href="${GH}/eks-platform-infra" target="_blank" rel="noopener noreferrer">[repo]</a>`,
      `<span class="term-ok">financial-ops-platform</span>  case · ${L("sustentação financeira", "financial sustaining")} · Zabbix  <span class="term-dim">[man]</span>`,
      `<span class="term-ok">trickera/profile</span>        README · <a href="${GH}" target="_blank" rel="noopener noreferrer">[repo]</a>`,
    ];
  },
  github() { window.open(GH, "_blank", "noopener"); return [`${L("abrindo", "opening")} <a href="${GH}" target="_blank" rel="noopener noreferrer">github.com/trickera</a> …`]; },
  cv() { openCvModal(); return [`<span class="term-dim">${L("seletor de currículo aberto:", "résumé selector opened:")}</span> <span class="term-key">PT</span> / <span class="term-key">EN</span>`]; },
  curriculo() { return this.cv(); },
  contact() {
    return [
      `email:    <a href="mailto:${EMAIL}">${EMAIL}</a>`,
      `linkedin: <a href="${LI}" target="_blank" rel="noopener noreferrer">/in/patrick-ferreira-949117212</a>`,
      `github:   <a href="${GH}" target="_blank" rel="noopener noreferrer">github.com/trickera</a>`,
    ];
  },
  neofetch() {
    return [
      '<span class="term-ok">trickkz@portfolio</span>',
      '<span class="term-dim">-----------------</span>',
      '<span class="term-key">role</span>     DevOps &amp; Cloud Engineer',
      '<span class="term-key">os</span>       Linux · Windows Server · VMware',
      '<span class="term-key">cloud</span>    AWS · Azure · GCP',
      `<span class="term-key">uptime</span>   ${L("8+ anos em TI", "8+ years in IT")}`,
      '<span class="term-key">sla</span>      98%+ · users 500+',
      '<span class="term-key">status</span>   open_to_work',
    ];
  },
  uptime() { return [`up <span class="term-ok">${L("8+ anos", "8+ years")}</span>, 500+ users, load average: <span class="term-ok">reliable</span>`]; },
  date() { return [`<span class="term-dim">${escapeHtml(new Date().toString())}</span>`]; },
};

const SECTION_ALIASES = {
  home: "top", top: "top", about: "about", sobre: "about", stack: "stack", skills: "stack",
  xp: "xp", experiencia: "xp", experience: "xp", projects: "projects", projetos: "projects",
  certs: "certs", certificacoes: "certs", contact: "contact", contato: "contact", terminal: "main",
};
function gotoSection(arg) {
  const key = (arg || "").toLowerCase().replace(/[^a-z]/g, "");
  const id = SECTION_ALIASES[key];
  const el = id && document.getElementById(id);
  if (!el) { termPrint(`<span class="term-err">${L("seção desconhecida:", "unknown section:")}</span> ${escapeHtml(arg || "")}`); return; }
  el.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
  termPrint(`<span class="term-dim">→ ${L("indo para", "going to")}</span> <span class="term-key">${id}</span>`);
}
function manCmd(arg) {
  const key = (arg || "").toLowerCase();
  if (key.includes("eks")) { openMan("eks"); termPrint('<span class="term-dim">→</span> <span class="term-key">EKS-PLATFORM-INFRA(1)</span>'); return; }
  if (key.includes("fin")) { openMan("finops"); termPrint('<span class="term-dim">→</span> <span class="term-key">FINANCIAL-OPS-PLATFORM(1)</span>'); return; }
  termPrint('<span class="term-dim">man:</span> <span class="term-key">man eks</span> · <span class="term-key">man finops</span>');
}
function catCmd(arg) {
  const key = (arg || "").toLowerCase();
  if (key.includes("about")) { commands.about().forEach(termPrint); return; }
  if (key.includes("career") || key.includes("experience") || key.includes("xp")) { commands.xp().forEach(termPrint); return; }
  if (key.includes("cert")) { commands.certs().forEach(termPrint); return; }
  termPrint(`<span class="term-err">cat: ${escapeHtml(arg || "")}: ${L("arquivo não encontrado", "file not found")}</span>`);
}
function runCommand(raw) {
  const trimmed = (raw || "").trim();
  if (!trimmed) return;
  termPromptEcho(trimmed);
  const parts = trimmed.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const arg = parts.slice(1).join(" ");
  if (cmd === "clear") { termOut.innerHTML = ""; return; }
  if (cmd === "echo") { termPrint(escapeHtml(arg)); return; }
  if (cmd === "goto" || cmd === "cd" || cmd === "open") { gotoSection(arg); return; }
  if (cmd === "man") { manCmd(arg); return; }
  if (cmd === "cat") { catCmd(arg); return; }
  const fn = commands[cmd];
  if (!fn) { termPrint(`<span class="term-err">${L("comando não encontrado:", "command not found:")} ${escapeHtml(cmd)}</span> · <span class="term-key">help</span>`); return; }
  fn.call(commands).forEach(termPrint);
}
function submitCurrent(value) {
  const raw = value ?? termInput.value;
  if (raw.trim()) { history.push(raw.trim()); histIdx = history.length; }
  termInput.value = "";
  runCommand(raw);
}
termForm?.addEventListener("submit", (e) => { e.preventDefault(); submitCurrent(); });
termInput?.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp") { if (!history.length) return; e.preventDefault(); histIdx = Math.max(0, histIdx - 1); termInput.value = history[histIdx] ?? ""; }
  else if (e.key === "ArrowDown") { if (!history.length) return; e.preventDefault(); histIdx = Math.min(history.length, histIdx + 1); termInput.value = history[histIdx] ?? ""; }
});
$$("[data-cmd]").forEach((btn) => btn.addEventListener("click", () => { submitCurrent(btn.dataset.cmd); termInput?.focus(); }));

/* boot sequence */
function bootLines() {
  return [
    '<span class="term-prompt">guest@portfolio</span><span class="term-path">:~$</span> ./boot.sh',
    '<span class="term-ok">[ OK ]</span> mount /profile <span class="term-dim">… done</span>',
    '<span class="term-ok">[ OK ]</span> load stack modules <span class="term-dim">… done</span>',
    '<span class="term-ok">[ OK ]</span> observability online <span class="term-dim">· SLA 98%+</span>',
    '<span class="term-ok">[ OK ]</span> status: <span class="term-amber">open_to_work</span>',
    `<span class="term-dim">${L("digite", "type")}</span> <span class="term-key">help</span> <span class="term-dim">+ enter</span>`,
  ];
}
function boot() {
  if (!termOut) return;
  const lines = bootLines();
  if (prefersReduced) { lines.forEach(termPrint); return; }
  let i = 0;
  const step = () => { if (i >= lines.length) return; termPrint(lines[i]); i += 1; setTimeout(step, 230); };
  step();
}

/* ================================================= global keybindings */
const isTyping = () => {
  const el = document.activeElement;
  return el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
};
document.addEventListener("keydown", (e) => {
  const modalOpen = modal && !modal.hidden;
  const cvOpen = cvModal && !cvModal.hidden;
  if (e.key === "Escape") { closeCvModal(); closeMan(); return; }
  if (cvOpen) { if (e.key.toLowerCase() === "q") { e.preventDefault(); closeCvModal(); } return; }
  if (modalOpen) { if (e.key.toLowerCase() === "q") { e.preventDefault(); closeMan(); } return; }
  if (isTyping() || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === "/") { e.preventDefault(); termInput?.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "center" }); termInput?.focus(); }
  else if (e.key.toLowerCase() === "t") { themeToggle?.click(); }
  else if (e.key.toLowerCase() === "g") { window.open(GH, "_blank", "noopener"); }
});

/* ===================================================== init */
applyLang(LANG);
boot();
