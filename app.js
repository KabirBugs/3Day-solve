const APP = document.getElementById('app');
const STORAGE_KEY = '3daysolve-local-state-v1';
const COMMISSION_RATE = 0.15;

// Paste the deployed Google Apps Script Web App URL here after setup.
// Example format: https://script.google.com/macros/s/DEPLOYMENT_ID/exec
const GOOGLE_SHEETS_ENDPOINT = '';

// Official Google Forms supplied for 3DaySolve. These links open the form for a respondent;
// direct submission from this site's own fields requires verified entry IDs or a server endpoint.
const GOOGLE_FORMS = {
  student: 'https://docs.google.com/forms/d/e/1FAIpQLSdaYgZV9_dd4vRu2PXxukbTJzuIKRpMOwU_OJn3E60JmhjPRQ/viewform?usp=header',
  business: 'https://docs.google.com/forms/d/e/1FAIpQLSeB9lJLHsL0udD2y4oCAxVy4RrccHxyl9LrE_eFgzbDWWshyA/viewform?usp=header',
  project: 'https://docs.google.com/forms/d/e/1FAIpQLSfp-2xUAAZV36sZFaPM5vPZYYiNQPJsPQd-Ye1gIX_Z0Mys9A/viewform?usp=header',
  application: '',
  contact: 'https://docs.google.com/forms/d/e/1FAIpQLSdClmPgj7u6TUqhUWLEEzGl7jjuroS4_VG1wRbnIkCGc5z9gg/viewform?usp=header',
  feedback: 'https://docs.google.com/forms/d/e/1FAIpQLSd4-2wsEd_41gaT_5u9HlpjGbiV7n0Jc7Xj2RD68Slh4ghitQ/viewform?usp=header',
  newsletter: 'https://docs.google.com/forms/d/e/1FAIpQLSc3eAyYl9Ab_NU545b_Yq-wDl5u9GrBnEbr8UhIQhpkzXPE3A/viewform?usp=header'
};

const categories = [
  ['Excel & Spreadsheets', '▦'], ['Data Analytics', '◒'], ['Power BI & Dashboards', '▥'], ['Digital Marketing', '✦'],
  ['Social Media Marketing', '⌁'], ['Graphic Design', '◈'], ['Presentation Design', '▤'], ['Financial Analysis', '₹'],
  ['Business Research', '⌕'], ['Content Writing', '✎'], ['Website Development', '</>'], ['Python & Automation', '⌘'],
  ['Sales & Lead Generation', '↗'], ['Other Business Tasks', '＋']
];

const initialProjects = [
  { id: '3DS-1042', title: 'Clean and visualize a retail sales sheet', category: 'Excel & Spreadsheets', description: 'Turn a messy monthly sales workbook into a clean, leadership-ready dashboard with clear trends.', skills: 'Excel, Pivot Tables, Charts', deliverables: 'Clean workbook, summary dashboard, and a short walkthrough.', budget: 1800, duration: '2–3 days', deadline: 'Nov 06, 2026', posted: 'Oct 24, 2026', status: 'Open', business: 'Northstar Retail' },
  { id: '3DS-1038', title: 'Build a launch-ready Instagram content kit', category: 'Social Media Marketing', description: 'Create a practical 10-post content kit for a new sustainable home brand entering the Indian market.', skills: 'Content, Canva, Social Strategy', deliverables: 'Content calendar, captions, and editable visual templates.', budget: 2500, duration: '3 days', deadline: 'Nov 09, 2026', posted: 'Oct 23, 2026', status: 'Open', business: 'Kindred Home' },
  { id: '3DS-1031', title: 'Research competitors for a B2B SaaS idea', category: 'Business Research', description: 'Map five competing products, their pricing, positioning, and strongest acquisition channels.', skills: 'Research, Synthesis, Slides', deliverables: 'Competitive matrix and a 10-slide decision brief.', budget: 3200, duration: '2 days', deadline: 'Nov 03, 2026', posted: 'Oct 21, 2026', status: 'Open', business: 'Orbit Labs' },
  { id: '3DS-1026', title: 'Automate a weekly lead report', category: 'Python & Automation', description: 'Create a lightweight script that combines CSV exports and produces a weekly lead summary.', skills: 'Python, CSV, Documentation', deliverables: 'Reusable script, setup notes, and sample output.', budget: 4500, duration: '3 days', deadline: 'Nov 01, 2026', posted: 'Oct 19, 2026', status: 'Open', business: 'Bridgepoint Media' },
  { id: '3DS-1019', title: 'Refresh a pitch deck for investor conversations', category: 'Presentation Design', description: 'Simplify a 16-slide deck so the story is sharper, more credible, and easier to present.', skills: 'Storytelling, Slides, Design', deliverables: 'Refined deck and one-page narrative outline.', budget: 2200, duration: '2 days', deadline: 'Oct 31, 2026', posted: 'Oct 16, 2026', status: 'Open', business: 'Mango Mobility' },
  { id: '3DS-1007', title: 'Analyze customer feedback themes', category: 'Data Analytics', description: 'Find the most common themes in a small customer feedback dataset and recommend next steps.', skills: 'Sheets, Analysis, Writing', deliverables: 'Theme summary, charts, and recommendations.', budget: 1500, duration: '1–2 days', deadline: 'Oct 29, 2026', posted: 'Oct 13, 2026', status: 'Open', business: 'Everyday Goods' }
];

const seedState = { students: [], businesses: [], projects: initialProjects, applications: [], contacts: [], feedback: [], newsletter: [], saved: [], currentUser: null };
let state = loadState();

function loadState() {
  try { return { ...seedState, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; } catch { return { ...seedState }; }
}
function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function commission(value) { return Math.round(Number(value || 0) * COMMISSION_RATE); }
function remaining(value) { return Math.round(Number(value || 0) * (1 - COMMISSION_RATE)); }
function money(value) { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0); }
function esc(value = '') { return String(value).replace(/[&<>'"]/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[ch])); }
function link(href, label, classes = 'button') { return `<a class="${classes}" href="${href}">${label}</a>`; }
function pageShell(title, subtitle, content) { return `<section class="page-hero"><div class="shell"><span class="eyebrow">3DaySolve platform</span><h1>${title}</h1><p>${subtitle}</p></div></section><section class="section"><div class="shell">${content}</div></section>`; }
function notify(message, type = 'success') { const region = document.getElementById('toast-region'); const item = document.createElement('div'); item.className = `toast ${type}`; item.textContent = message; region.appendChild(item); setTimeout(() => item.remove(), 4200); }
function scrollTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }

const THEME_KEY = '3daysolve-theme';

function setTheme(theme) {
  const next = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.theme = next;
  localStorage.setItem(THEME_KEY, next);
  const toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.setAttribute('aria-pressed', String(next === 'dark'));
    toggle.setAttribute('aria-label', next === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    toggle.innerHTML = `<span class="theme-icon">${next === 'dark' ? '☀' : '☾'}</span><span class="theme-label">${next === 'dark' ? 'Light mode' : 'Dark mode'}</span>`;
  }
}

function solverAnswer(question) {
  const q = question.toLowerCase();
  if (/commission|15%|fee|platform/.test(q)) return '3DaySolve calculates a platform commission of exactly 15% of the completed project value. For a ₹2,000 project, that calculation is ₹300 and the remaining amount before other fees is ₹1,700. This prototype does not process or collect payments.';
  if (/payment|payout|pay|money|earn/.test(q)) return 'Payments and payouts are not connected in this prototype. Students can see project budgets, while businesses can see the 15% calculation. A verified payment provider must be configured before money is collected.';
  if (/post|business|project|problem|brief/.test(q)) return 'Businesses can register, then choose “Post a Project”. Add a clear title, detailed problem, required skills, deliverables, duration, deadline, budget, and contact preference. A project reference is created after saving.';
  if (/apply|student|application|opportun/.test(q)) return 'Students can create a profile, browse Explore Projects, open a project, and choose “Apply for this project”. Include relevant skills, a short proposal, estimated completion time, and a portfolio link.';
  if (/privacy|data|form|stored|storage|security/.test(q)) return GOOGLE_SHEETS_ENDPOINT ? 'This prototype keeps a local copy for its current dashboard behaviour and sends submission records to the configured Google Sheets Apps Script endpoint. The sheet is a prototype data store, not a secure authentication system.' : 'In this browser prototype, form data is stored locally in your browser under the 3daysolve-local-state-v1 key. Configure the Google Apps Script endpoint in app.js to send submission copies to a central Google Sheet.';
  if (/how.*work|workflow|process|steps/.test(q)) return 'The workflow is: a business posts a focused problem, students discover matching projects, one student is selected to complete the work, and the business reviews the result.';
  if (/category|skill|excel|analytics|design|coding|marketing/.test(q)) return 'Use the Categories section to filter projects by area such as Excel, Data Analytics, Digital Marketing, Graphic Design, Presentations, Finance, Research, Web Development, Python, and more.';
  if (/contact|help|support|feedback/.test(q)) return GOOGLE_SHEETS_ENDPOINT ? 'Use Contact for questions and Feedback to share your experience. Their records are kept locally for this prototype and sent to the configured Google Sheets endpoint.' : 'Use Contact for questions and Feedback to share your experience. These forms currently save locally in the browser; configure the Google Apps Script endpoint to send copies to Google Sheets.';
  return 'I can help with project tasks, applications, payments, the 15% commission, privacy, forms, categories, and the platform workflow. Try asking: “How is the commission calculated?”';
}

function addSolverMessage(text, type = 'bot') {
  const messages = document.getElementById('solver-bot-messages');
  if (!messages) return;
  const bubble = document.createElement('div');
  bubble.className = type === 'user' ? 'user-message' : 'bot-message';
  bubble.textContent = text;
  messages.appendChild(bubble);
  messages.scrollTop = messages.scrollHeight;
}

function setSolverOpen(isOpen) {
  const panel = document.getElementById('solver-bot');
  const launcher = document.getElementById('solver-bot-launcher');
  if (!panel) return;
  panel.classList.toggle('is-open', isOpen);
  panel.setAttribute('aria-hidden', String(!isOpen));
  if (launcher) launcher.setAttribute('aria-expanded', String(isOpen));
  if (isOpen) window.setTimeout(() => document.getElementById('solver-bot-input')?.focus(), 180);
}

function bindEnhancements() {
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle && !themeToggle.dataset.bound) {
    themeToggle.dataset.bound = 'true';
    themeToggle.addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
  }
  const launcher = document.getElementById('solver-bot-launcher');
  const topTrigger = document.getElementById('solver-top-trigger');
  const close = document.getElementById('solver-bot-close');
  if (launcher && !launcher.dataset.bound) { launcher.dataset.bound = 'true'; launcher.addEventListener('click', () => setSolverOpen(true)); }
  if (topTrigger && !topTrigger.dataset.bound) { topTrigger.dataset.bound = 'true'; topTrigger.addEventListener('click', () => setSolverOpen(true)); }
  if (close && !close.dataset.bound) { close.dataset.bound = 'true'; close.addEventListener('click', () => setSolverOpen(false)); }
  const form = document.getElementById('solver-bot-form');
  if (form && !form.dataset.bound) {
    form.dataset.bound = 'true';
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const input = document.getElementById('solver-bot-input');
      const question = input?.value.trim();
      if (!question) return;
      addSolverMessage(question, 'user');
      input.value = '';
      window.setTimeout(() => addSolverMessage(solverAnswer(question)), 260);
    });
  }
  document.querySelectorAll('[data-solver-question]').forEach(button => {
    if (button.dataset.bound) return;
    button.dataset.bound = 'true';
    button.addEventListener('click', () => {
      const question = button.dataset.solverQuestion;
      setSolverOpen(true);
      addSolverMessage(question, 'user');
      window.setTimeout(() => addSolverMessage(solverAnswer(question)), 220);
    });
  });
}

function projectCard(project) {
  return `<article class="card project-card reveal"><div class="tag-row"><span class="tag">${esc(project.category)}</span><span class="tag blue">${esc(project.status)}</span></div><div><h3>${esc(project.title)}</h3><p>${esc(project.description)}</p></div><div class="project-meta"><div><span class="meta-label">Budget</span><span class="meta-value">${money(project.budget)}</span></div><div><span class="meta-label">Duration</span><span class="meta-value">${esc(project.duration)}</span></div><div><span class="meta-label">Deadline</span><span class="meta-value">${esc(project.deadline)}</span></div><div><span class="meta-label">Ref</span><span class="meta-value">${esc(project.id)}</span></div></div><div class="project-footer"><span class="meta-label">Posted ${esc(project.posted)}</span><a href="#project/${encodeURIComponent(project.id)}" class="button button-small button-ghost">View Details <span>↗</span></a></div></article>`;
}

function homePage() {
  const hasRealStats = state.students.length || state.businesses.length;
  const stats = hasRealStats ? [state.students.length, state.projects.filter(p => p.status === 'Open').length, state.businesses.length, state.projects.filter(p => p.status === 'Completed').length] : null;
  return `<section class="hero" id="home"><div class="shell hero-grid"><div class="hero-copy-wrap reveal"><span class="eyebrow">A better way to make progress</span><h1>Small Problems.<br /><em>Big Opportunities.</em></h1><p class="hero-copy">Connect with skilled students who can help your business solve real problems in just one to three days.</p><div class="hero-actions">${link('#post-project', 'Post a Problem <span>↗</span>', 'button button-lime')}${link('#student-register', 'Join as a Student', 'button button-ghost')}</div></div><div class="hero-art reveal"><div class="orbit"></div><div class="orbit two"></div><div class="floating-card card-main"><div class="mini-label"><span>Live project</span><span class="tag lime">Open</span></div><div class="mini-title">Retail sales dashboard</div><div class="mini-line"></div><div class="mini-line short"></div><div class="mini-line lime"></div><div class="avatar-row"><span class="avatar">AS</span><span class="avatar">RK</span><span class="avatar">+4</span></div></div><div class="floating-card card-side"><div class="mini-label"><span>Student profile</span><span>98%</span></div><div class="mini-title">Aarav Sharma</div><div class="mini-line lime"></div><p style="color:#c2d2c9;font-size:.8rem;margin:12px 0 0">Excel · Power BI · Research</p></div></div></div></section>
  <section class="section"><div class="shell">${stats ? `<div class="stats-grid reveal">${[['Registered students', stats[0]],['Open projects',stats[1]],['Registered businesses',stats[2]],['Completed projects',stats[3]]].map(([label,value])=>`<div class="stat"><strong>${value}</strong><span>${label}</span></div>`).join('')}</div>` : `<div class="split-panel mint reveal"><span class="eyebrow">The marketplace is taking shape</span><h2>Built for the first useful step.</h2><p>3DaySolve is ready for its first students and businesses. Create a profile or post a focused problem to start building the network.</p><div class="action-row">${link('#student-register','Create a student profile','button button-small')}${link('#business-register','Register a business','button button-small button-ghost')}</div></div>`}</div></section>
  <section class="section section-dark" id="how-it-works"><div class="shell"><div class="section-heading"><h2>One clear path from problem to progress.</h2><p>Focused scope, fast collaboration, and practical outcomes — without the usual project fog.</p></div><div class="process-grid">${[['01','Post a problem','A business shares a specific, clearly defined task.'],['02','Find the right fit','Students discover projects that match their skills.'],['03','Make it happen','A selected student completes the work in one to three days.'],['04','Review the result','The business reviews the deliverable and marks it complete.']].map(([num,title,text])=>`<div class="process-step reveal"><div class="step-number">${num}</div><h3>${title}</h3><p>${text}</p></div>`).join('')}</div><div class="flow-diagram reveal"><div class="flow-block"><span class="flow-kicker">BUSINESS</span><strong>Problem brief</strong><small>Clear scope + deadline</small></div><span class="flow-arrow">→</span><div class="flow-block flow-accent"><span class="flow-kicker">MATCH</span><strong>Student fit</strong><small>Skills + portfolio</small></div><span class="flow-arrow">→</span><div class="flow-block flow-blue"><span class="flow-kicker">DELIVER</span><strong>Useful outcome</strong><small>Review + complete</small></div></div></div></section>
  <section class="section" id="categories"><div class="shell"><div class="section-heading"><h2>Whatever the task, find a way forward.</h2><p>Explore the areas where students bring practical skills and fresh perspective.</p></div><div class="category-grid">${categories.map(([name,icon])=>`<a class="category reveal" href="#explore?category=${encodeURIComponent(name)}"><span>${icon} &nbsp;${name}</span><span>↗</span></a>`).join('')}</div></div></section>
  <section class="section section-mint" id="explore"><div class="shell"><div class="section-heading"><h2>Open projects, ready for momentum.</h2><p>Browse real opportunities from the 3DaySolve project board.</p><a href="#explore" class="button button-small button-ghost">Explore all projects <span>↗</span></a></div><div class="project-grid">${state.projects.slice(0,3).map(projectCard).join('')}</div></div></section>
  <section class="section" id="students"><div class="shell split-callout"><div class="split-panel dark reveal"><span class="eyebrow">For students</span><h2>Turn your skills into real experience.</h2><p>Build the kind of portfolio that shows what you can do — not just what you studied.</p><ul class="benefit-list">${['Practical experience','Portfolio development','Income opportunities','Professional networking','Real business exposure','Career development'].map(x=>`<li>${x}</li>`).join('')}</ul><div class="action-row">${link('#student-register','Join as a student <span>↗</span>','button button-lime')}</div></div><div class="split-panel mint reveal" id="businesses"><span class="eyebrow">For businesses</span><h2>Get focused help without the heavy lift.</h2><p>Post a well-defined challenge and meet motivated students ready to deliver a useful outcome.</p><ul class="benefit-list">${['Access to student talent','Affordable project support','Clear deliverables','Flexible deadlines','Easy submission','Simple applicant review'].map(x=>`<li>${x}</li>`).join('')}</ul><div class="action-row">${link('#post-project','Post your first problem <span>↗</span>','button button-small')}</div></div></div></section>
  <section class="cta" id="get-started"><div class="shell"><div class="section-heading"><h2>One focused problem can open a bigger door.</h2><div class="action-row">${link('#student-register','Start as a Student <span>↗</span>','button')}${link('#post-project','Post Your First Problem <span>↗</span>','button button-ghost')}</div></div></div></section>`;
}

function formField(name, label, type = 'text', options = {}) {
  const { required = false, full = false, placeholder = '', value = '', pattern = '', rows = 0 } = options;
  const requiredMark = required ? ' <span aria-hidden="true">*</span>' : '';
  const input = rows ? `<textarea id="${name}" name="${name}" placeholder="${placeholder}" ${required?'required':''}>${esc(value)}</textarea>` : type === 'select' ? `<select id="${name}" name="${name}" ${required?'required':''}><option value="">Select an option</option>${(options.values||[]).map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('')}</select>` : `<input id="${name}" name="${name}" type="${type}" value="${esc(value)}" placeholder="${placeholder}" ${required?'required':''} ${pattern?`pattern="${pattern}"`:''}/>`;
  return `<div class="field ${full?'full':''}"><label for="${name}">${label}${requiredMark}</label>${input}<span class="error" data-error-for="${name}"></span></div>`;
}

function registrationPage(role) {
  const student = role === 'student';
  const title = student ? 'Your next project starts with a profile.' : 'Give your next problem a better path forward.';
  const subtitle = student ? 'Tell businesses what you can do, what you want to learn, and where you want to grow.' : 'Join a marketplace built for clearly defined work, practical outcomes, and fast collaboration.';
  const fields = student ? [
    formField('fullName','Full name','text',{required:true,placeholder:'e.g. Aarav Sharma'}), formField('email','Email address','email',{required:true,placeholder:'you@example.com'}), formField('phone','Mobile number','tel',{required:true,placeholder:'+91 98765 43210'}), formField('city','City','text',{required:true,placeholder:'Bengaluru'}), formField('state','State','text',{required:true,placeholder:'Karnataka'}), formField('college','College or university','text',{required:true,placeholder:'Your institution'}), formField('course','Course or degree','text',{required:true,placeholder:'BBA, B.Tech, MBA...'}), formField('studyYear','Current year of study','select',{required:true,values:['First year','Second year','Third year','Final year','Postgraduate','Recently graduated']}), formField('graduationYear','Expected graduation year','number',{required:true,placeholder:'2027'}), formField('skills','Primary skills','text',{required:true,placeholder:'Excel, Canva, Python...'}), formField('additionalSkills','Additional skills','text',{placeholder:'Anything else you bring'}), formField('interests','Areas of interest','text',{required:true,placeholder:'Research, marketing, startups...'}), formField('introduction','Short introduction','text',{required:true,full:true,placeholder:'A few lines about your strengths and goals.',rows:4}), formField('experience','Previous project experience','text',{full:true,placeholder:'Share a project, internship, or class assignment.',rows:3}), formField('portfolio','Portfolio URL','url',{placeholder:'https://...'}), formField('linkedin','LinkedIn profile URL','url',{placeholder:'https://linkedin.com/in/...'}), formField('github','GitHub URL','url',{placeholder:'https://github.com/...'}), formField('duration','Preferred project duration','select',{required:true,values:['1 day','2 days','3 days']}), formField('availability','Availability','select',{required:true,values:['Weekdays','Weekends','Flexible']}), formField('arrangement','Preferred working arrangement','select',{required:true,values:['Remote','Hybrid','Flexible']})
  ] : [formField('businessName','Business or organization name','text',{required:true,placeholder:'Your business'}), formField('contactName','Contact person full name','text',{required:true,placeholder:'Your name'}), formField('email','Business email','email',{required:true,placeholder:'hello@business.com'}), formField('phone','Mobile number','tel',{required:true,placeholder:'+91 98765 43210'}), formField('city','City','text',{required:true,placeholder:'Mumbai'}), formField('state','State','text',{required:true,placeholder:'Maharashtra'}), formField('website','Business website','url',{placeholder:'https://...'}), formField('industry','Industry','text',{required:true,placeholder:'Retail, SaaS, D2C...'}), formField('size','Business size','select',{required:true,values:['Solo / founder-led','2–10 people','11–50 people','51–200 people','200+ people']}), formField('assistance','Type of assistance required','text',{required:true,placeholder:'Research, design, analytics...'}), formField('contactMethod','Preferred contact method','select',{required:true,values:['Email','Phone','WhatsApp']}), formField('description','Short business description','text',{required:true,full:true,placeholder:'Tell us what your business is building.',rows:4})];
  return pageShell(student ? 'Build a profile with proof behind it.' : 'Meet the extra pair of hands your business needs.', subtitle, `<div class="form-shell"><aside class="form-aside"><span class="eyebrow">${student?'Student registration':'Business registration'}</span><h2>${student?'Bring your skills to the right problem.':'Bring a well-defined problem to the right student.'}</h2><p>${student?'Your profile helps you discover focused opportunities that fit your skills, interests, and availability.':'A clear brief leads to better applications. Start with the context, outcome, and timeline.'}</p><div class="card"><strong>Good to know</strong><p style="margin:10px 0 0">We only send non-sensitive registration details to the configured Google Form. Passwords and authentication secrets never leave the platform.</p></div></aside><div class="form-card"><h2>${student?'Create your student profile':'Create your business profile'}</h2><p>Required fields are marked with an asterisk.</p><form id="${student?'student':'business'}-form" data-form-type="${student?'student':'business'}"><div class="form-grid">${fields.join('')}<div class="field full"><label class="checkbox"><input name="consent" type="checkbox" required /> <span>I agree to the <a href="#terms">Terms and Conditions</a> and consent to the <a href="#privacy">Privacy Policy</a>.</span></label><span class="error" data-error-for="consent"></span></div></div><div class="form-submit"><span class="form-note">You can update your details from your dashboard.</span><button class="button button-lime" type="submit">${student?'Create student profile':'Create business profile'} <span>↗</span></button></div></form></div></div>`);
}

function projectForm() {
  return pageShell('Post a problem. Get useful momentum.', 'Share a specific business challenge and invite skilled students to help solve it in one to three days.', `<div class="form-shell"><aside class="form-aside"><span class="eyebrow">Project submission</span><h2>Clarity is your competitive edge.</h2><p>The best projects have a defined outcome, a realistic deadline, and enough context for a student to make a confident proposal.</p><div class="card"><strong>Commission model</strong><p style="margin:10px 0 0">3DaySolve calculates a platform commission of <strong>15%</strong> of the completed project value. This is a calculation, not a payment collection.</p><div class="project-meta" style="margin-top:18px"><div><span class="meta-label">Example value</span><span class="meta-value">₹2,000</span></div><div><span class="meta-label">Commission (15%)</span><span class="meta-value">₹300</span></div></div></div></aside><div class="form-card"><h2>Project details</h2><p>Your project will be assigned a unique reference after it is saved.</p><form id="project-form" data-form-type="project"><div class="form-grid">${formField('contactName','Contact person name','text',{required:true,placeholder:'Your name'})}${formField('email','Business email','email',{required:true,placeholder:'hello@business.com'})}${formField('phone','Mobile number','tel',{required:true,placeholder:'+91 98765 43210'})}${formField('businessName','Business name','text',{required:true,placeholder:'Your business'})}${formField('location','Business location','text',{required:true,placeholder:'City, State'})}${formField('title','Project title','text',{required:true,placeholder:'e.g. Clean our monthly sales workbook'})}${formField('category','Project category','select',{required:true,values:categories.map(x=>x[0])})}${formField('duration','Project duration','select',{required:true,values:['1 day','2 days','3 days']})}${formField('description','Detailed problem description','text',{required:true,full:true,placeholder:'What needs to be solved? Include useful context.',rows:5})}${formField('skills','Required skills','text',{required:true,full:true,placeholder:'Excel, research, Canva...'})}${formField('deliverables','Expected deliverables','text',{required:true,full:true,placeholder:'What should be handed over at the end?',rows:3})}${formField('deadline','Project deadline','date',{required:true})}${formField('budget','Budget in Indian Rupees','number',{required:true,placeholder:'2000'})}${formField('contactMethod','Preferred contact method','select',{required:true,values:['Email','Phone','WhatsApp']})}${formField('links','Optional reference links','url',{full:true,placeholder:'https://...'})}<div class="field full"><label class="checkbox"><input name="consent" type="checkbox" required /> <span>I confirm that this project brief is accurate and agree to the relevant <a href="#terms">Terms and Conditions</a>.</span></label><span class="error" data-error-for="consent"></span></div></div><div class="form-submit"><span class="form-note">Your project becomes visible after it is saved successfully.</span><button class="button button-lime" type="submit">Submit project <span>↗</span></button></div></form></div></div>`);
}

function explorePage() {
  return pageShell('Find a focused problem worth solving.', 'Search real project briefs, filter by skill area, and apply when you see a strong fit.', `<div class="toolbar"><input id="project-search" type="search" placeholder="Search projects, skills, or businesses" aria-label="Search projects" /><select id="project-category" aria-label="Filter by category"><option value="">All categories</option>${categories.map(x=>`<option>${x[0]}</option>`).join('')}</select><select id="project-sort" aria-label="Sort projects"><option value="newest">Newest</option><option value="budget-high">Budget: high to low</option><option value="deadline">Deadline</option></select></div><div id="project-results" class="project-grid"></div>`);
}

function projectDetails(id) {
  const project = state.projects.find(p => p.id === id);
  if (!project) return pageShell('Project not found.', 'This project reference may be invalid, expired, or no longer available.', `<div class="empty-state"><h2>Let’s get you back on track.</h2><p>Browse the current project board to find another focused opportunity.</p>${link('#explore','Back to projects','button button-lime')}</div>`);
  const saved = state.saved.includes(project.id);
  return pageShell('Project details', 'Review the brief, expectations, and timeline before you apply.', `<div class="detail-card"><div><div class="tag-row"><span class="tag">${esc(project.category)}</span><span class="tag blue">${esc(project.status)}</span></div><h1>${esc(project.title)}</h1><p class="detail-copy">${esc(project.description)}</p><h3>Required skills</h3><p class="detail-copy">${esc(project.skills)}</p><h3>Expected deliverables</h3><p class="detail-copy">${esc(project.deliverables)}</p><div class="action-row">${link(`#apply/${encodeURIComponent(project.id)}`,'Apply for this project <span>↗</span>','button button-lime')}<button class="button button-ghost" data-save-project="${esc(project.id)}">${saved?'Saved':'Save project'} <span>♡</span></button><button class="button button-ghost" data-share-project="${esc(project.id)}">Share project <span>↗</span></button></div></div><aside class="detail-aside"><div class="detail-stat"><strong>${money(project.budget)}</strong><span>Project value</span></div><div class="detail-stat"><strong>${money(commission(project.budget))}</strong><span>Platform commission (15%)</span></div><div class="detail-stat"><strong>${money(remaining(project.budget))}</strong><span>Remaining amount before other fees (85%)</span></div><div class="detail-stat"><strong>${esc(project.duration)}</strong><span>Expected duration</span></div><div class="detail-stat"><strong>${esc(project.deadline)}</strong><span>Deadline</span></div><div class="detail-stat"><strong>${esc(project.business)}</strong><span>Business</span></div><div class="detail-stat"><strong>${esc(project.id)}</strong><span>Project reference</span></div></aside></div>`);
}

function applyPage(id) {
  const project = state.projects.find(p => p.id === id);
  if (!project) return projectDetails(id);
  const student = state.currentUser?.role === 'student' ? state.students.find(s => s.email === state.currentUser.email) : null;
  return pageShell(`Apply to ${esc(project.title)}`, `Show the business why your skills and approach are a strong fit for this ${esc(project.duration)} project.`, `<div class="form-shell"><aside class="form-aside"><span class="eyebrow">${esc(project.id)}</span><h2>${esc(project.title)}</h2><p>${esc(project.description)}</p><div class="card"><strong>Before you apply</strong><p style="margin:10px 0 0">Review the scope, timeline, and deliverables. Applications are visible only to the relevant business and authorized administrators.</p></div></aside><div class="form-card"><h2>Project application</h2><p>Applications are saved to this browser demo until a production backend is connected.</p><form id="application-form" data-form-type="application" data-project-id="${esc(project.id)}"><div class="form-grid">${formField('studentName','Student name','text',{required:true,value:student?.fullName || '',placeholder:'Your name'})}${formField('email','Student email','email',{required:true,value:student?.email || '',placeholder:'you@example.com'})}${formField('skills','Relevant skills','text',{required:true,placeholder:'Skills that match this brief'})}${formField('time','Estimated completion time','select',{required:true,values:['1 day','2 days','3 days']})}${formField('proposal','Short proposal','text',{required:true,full:true,placeholder:'How would you approach this project?',rows:5})}${formField('portfolio','Relevant portfolio link','url',{placeholder:'https://...'})}${formField('message','Optional message to the business','text',{full:true,placeholder:'Anything else they should know?',rows:3})}</div><div class="form-submit"><span class="form-note">Never share passwords or account secrets here.</span><button class="button button-lime" type="submit">Submit application <span>↗</span></button></div></form></div></div>`);
}

function contactPage(kind = 'contact') {
  const feedback = kind === 'feedback';
  return pageShell(feedback ? 'Help us make the platform better.' : 'Let’s talk about what you need.', feedback ? 'Every useful suggestion helps us make focused work easier for students and businesses.' : 'Questions, ideas, partnership opportunities, or something that did not go as planned? Send a note.', `<div class="form-shell"><aside class="form-aside"><span class="eyebrow">${feedback?'Feedback':'Contact us'}</span><h2>${feedback?'Your experience is part of the product.':'A small team, a direct line.'}</h2><p>Tell us what you are trying to do and we will route your message to the right place.</p></aside><div class="form-card"><h2>${feedback?'Share feedback':'Send a message'}</h2><form id="${feedback?'feedback':'contact'}-form" data-form-type="${feedback?'feedback':'contact'}"><div class="form-grid">${formField('name','Full name','text',{required:!feedback,placeholder:'Your name'})}${formField('email','Email address','email',{required:!feedback,placeholder:'you@example.com'})}${feedback?formField('userType','User type','select',{required:true,values:['Student','Business','Other']}):formField('userType','User type','select',{required:true,values:['Student','Business','Other']})}${feedback?formField('overall','Overall experience rating','select',{required:true,values:['5 — Excellent','4 — Good','3 — Okay','2 — Needs work','1 — Poor']}):formField('category','Inquiry category','select',{required:true,values:['General question','Partnership','Account help','Report an issue','Other']})}${feedback?formField('ease','Ease-of-use rating','select',{required:true,values:['5 — Very easy','4 — Easy','3 — Neutral','2 — Difficult','1 — Very difficult']}):formField('subject','Subject','text',{required:true,placeholder:'How can we help?'})}${feedback?formField('useful','Most useful feature','text',{placeholder:'What helped most?' }):formField('message','Message','text',{required:true,full:true,placeholder:'Write your message...',rows:5})}${feedback?formField('improvements','Suggested improvements','text',{full:true,placeholder:'What should we improve?',rows:4}):''}${feedback?formField('comments','Additional comments','text',{full:true,placeholder:'Anything else?',rows:3}):''}<div class="field full"><label class="checkbox"><input name="consent" type="checkbox" required /> <span>I consent to being contacted about this message.</span></label><span class="error" data-error-for="consent"></span></div></div><div class="form-submit"><span class="form-note">We will never sell your contact details.</span><button class="button button-lime" type="submit">${feedback?'Send feedback':'Send message'} <span>↗</span></button></div></form></div></div>`);
}

function newsletterForm() { return `<form id="newsletter-form" data-form-type="newsletter" class="newsletter-form"><div class="field"><label for="newsletterEmail">Get useful updates</label><div style="display:flex;gap:8px"><input id="newsletterEmail" name="email" type="email" required placeholder="you@example.com" /><button class="button button-lime button-small" type="submit">Subscribe</button></div><span class="error" data-error-for="email"></span></div></form>`; }

function dashboard(role) {
  const isStudent = role === 'student';
  const user = state.currentUser;
  const profile = isStudent ? state.students.find(s=>s.email===user?.email) : state.businesses.find(b=>b.email===user?.email);
  const projects = isStudent ? state.projects.slice(0,4) : state.projects.filter(p=>p.business===profile?.businessName).slice(0,4);
  return pageShell(isStudent ? `Welcome back, ${esc(profile?.fullName?.split(' ')[0] || 'student')}.` : `Welcome back, ${esc(profile?.businessName || 'business')}.`, isStudent ? 'Find a focused opportunity that helps you build your next proof point.' : 'Keep your project briefs clear, your applicants aligned, and your momentum moving.', `<div class="dashboard-stat-grid"><div class="dash-stat"><strong>${isStudent?state.applications.filter(a=>a.email===user?.email).length:projects.length}</strong><span>${isStudent?'Applications submitted':'Projects posted'}</span></div><div class="dash-stat"><strong>${isStudent?state.saved.length:state.applications.filter(a=>a.business===profile?.businessName).length}</strong><span>${isStudent?'Saved projects':'Applications received'}</span></div><div class="dash-stat"><strong>${isStudent?state.projects.filter(p=>p.status==='Completed').length:state.projects.filter(p=>p.business===profile?.businessName&&p.status==='Completed').length}</strong><span>Completed projects</span></div><div class="dash-stat"><strong>${isStudent?'72%':'15%'}</strong><span>${isStudent?'Profile completion':'Platform commission'}</span></div></div><div class="dashboard-columns"><div class="card"><div class="section-heading" style="margin-bottom:20px"><h3>${isStudent?'Recommended projects':'My projects'}</h3>${link(isStudent?'#explore':'#post-project',isStudent?'Browse all':'Post a project','button button-small button-ghost')}</div><div class="list">${projects.length?projects.map(p=>`<div class="list-item"><div><strong>${esc(p.title)}</strong><small>${esc(p.category)} · ${money(p.budget)}</small></div><span class="status ${p.status==='Completed'?'accepted':''}">${esc(p.status)}</span></div>`).join(''):'<p>No projects yet. Your next step starts here.</p>'}</div></div><div class="card"><h3>${isStudent?'Your next steps':'Commission snapshot'}</h3>${isStudent?`<div class="list"><div class="list-item"><div><strong>Complete your profile</strong><small>Add portfolio links and interests.</small></div><span>72%</span></div><div class="list-item"><div><strong>Save a project</strong><small>Keep strong fits in one place.</small></div><span>♡</span></div><div class="list-item"><div><strong>Apply with context</strong><small>Share a clear proposal.</small></div><span>↗</span></div></div>`:`<div class="detail-stat"><strong>15%</strong><span>Platform commission rate</span></div><div class="detail-stat"><strong>₹300</strong><span>Example commission on ₹2,000 completed value</span></div><p style="color:var(--muted);font-size:.8rem;margin-top:20px">This is a calculated commission only. No payment is processed or collected in this prototype.</p>`}</div></div>`);
}

function adminPage() {
  const open = state.projects.filter(p => p.status === 'Open').length;
  return pageShell('Admin overview.', 'A local review surface for the records created in this prototype.', `<div class="dashboard-stat-grid"><div class="dash-stat"><strong>${state.students.length}</strong><span>Students</span></div><div class="dash-stat"><strong>${state.businesses.length}</strong><span>Businesses</span></div><div class="dash-stat"><strong>${state.projects.length}</strong><span>Projects</span></div><div class="dash-stat"><strong>${open}</strong><span>Open projects</span></div></div><div class="dashboard-columns"><div class="card"><h3>Recent projects</h3><div class="list">${state.projects.slice(0,6).map(p=>`<div class="list-item"><div><strong>${esc(p.title)}</strong><small>${esc(p.id)} · ${money(p.budget)}</small></div><span class="status">${esc(p.status)}</span></div>`).join('')}</div></div><div class="card"><h3>External delivery readiness</h3><p style="color:var(--muted)">Google Forms destinations are intentionally not connected until real form URLs and verified field mappings are supplied.</p><div class="detail-stat"><strong>7</strong><span>Destinations expected</span></div><div class="detail-stat"><strong>0</strong><span>Verified deliveries</span></div><div class="detail-stat"><strong>Pending configuration</strong><span>Delivery status</span></div></div></div>`);
}

function legalPage(type) {
  if (type === 'commission') return pageShell('A clear commission model.', 'The platform commission is calculated consistently at exactly 15% of the completed project value.', `<div class="legal"><h2>How the calculation works</h2><p>Platform commission = completed project value × 0.15. Remaining amount before other fees = completed project value × 0.85. The calculation is centralized in the application and is not accepted from the browser.</p><table><thead><tr><th>Project value</th><th>Platform commission (15%)</th><th>Remaining amount (85%)</th></tr></thead><tbody>${[[500,75,425],[1000,150,850],[2000,300,1700],[5000,750,4250],[10000,1500,8500]].map(x=>`<tr><td>${money(x[0])}</td><td>${money(x[1])}</td><td>${money(x[2])}</td></tr>`).join('')}</tbody></table><h2>Important distinction</h2><p>A calculated commission is not the same as a fee actually collected. 3DaySolve does not claim to process payments or payouts unless a verified payment infrastructure is connected.</p></div>`);
  const title = type === 'privacy' ? 'Privacy, in plain language.' : type === 'terms' ? 'Terms for focused collaboration.' : 'Why 3DaySolve exists.';
  const content = type === 'privacy' ? `<h2>What we collect</h2><p>We collect the information you choose to submit when you create a profile, post a project, apply, contact us, subscribe, or share feedback. We use it to operate the requested workflow and improve the platform.</p><h2>External form destinations</h2><p>When configured, non-sensitive form fields may be sent to the relevant Google Forms or Google Apps Script destination. Passwords, authentication tokens, and other account secrets must never be sent there.</p><h2>Your choices</h2><p>You can request a correction or deletion of your submitted information by contacting the platform team. This prototype stores local records in your browser; production deployments must connect a real database and define retention controls.</p>` : type === 'terms' ? `<h2>Projects and applications</h2><p>Businesses are responsible for accurate project briefs, budgets, and deliverables. Students are responsible for truthful profiles, respectful communication, and work they submit.</p><h2>Access and moderation</h2><p>Project visibility, application access, and moderation should be enforced server-side in a production deployment. This front-end prototype demonstrates the intended flows and local state only.</p><h2>Payments</h2><p>Payment processing and payouts are not simulated or claimed. The 15% commission shown on the platform is a calculation, not proof that money was collected.</p>` : `<h2>A marketplace for useful first steps</h2><p>3DaySolve helps businesses turn small, clearly defined problems into practical opportunities for students. The goal is not to replace a full-time team — it is to help a business make progress and a student build proof.</p><h2>Built around clarity</h2><p>Short timelines work best when the problem, expected outcome, and definition of done are clear. Every part of the product is designed around that idea.</p><h2>Real feedback matters</h2><p>Testimonials and platform statistics will be shown once genuine feedback and verified database records exist. We do not invent either.</p>`;
  return pageShell(title, type === 'privacy' ? 'The information you share should be handled with care and clear expectations.' : type === 'terms' ? 'A practical foundation for students and businesses working together.' : 'One problem. One student. Three days.', `<div class="legal">${content}</div>`);
}

function signInPage() { return pageShell('Sign in to keep moving.', 'Use a profile you created on this device to explore the dashboard experience.', `<div class="form-shell"><aside class="form-aside"><span class="eyebrow">Sign in</span><h2>Your work, in one place.</h2><p>Production authentication needs a configured identity service. This prototype lets you continue with a locally saved profile.</p></aside><div class="form-card"><h2>Choose a profile</h2><form id="signin-form" data-form-type="signin"><div class="form-grid"><div class="field full"><label for="signinEmail">Email address</label><input id="signinEmail" name="email" type="email" required placeholder="you@example.com" /><span class="error" data-error-for="email"></span></div></div><div class="form-submit"><span class="form-note">No passwords are requested in this prototype.</span><button class="button button-lime" type="submit">Continue <span>↗</span></button></div></form><div class="action-row"><a class="button button-small button-ghost" href="#student-register">Create student profile</a><a class="button button-small button-ghost" href="#business-register">Create business profile</a></div></div></div>`); }

function route() {
  const raw = (location.hash || '#home').slice(1);
  const [path, query] = raw.split('?');
  const params = new URLSearchParams(query || '');
  const homeSectionRoutes = new Set(['how-it-works', 'categories', 'students', 'businesses', 'get-started']);
  const homeSection = homeSectionRoutes.has(path) ? path : '';
  if (path === 'home' || !path || homeSection) APP.innerHTML = homePage();
  else if (path === 'explore') APP.innerHTML = explorePage();
  else if (path === 'student-register') APP.innerHTML = registrationPage('student');
  else if (path === 'business-register') APP.innerHTML = registrationPage('business');
  else if (path === 'post-project') APP.innerHTML = projectForm();
  else if (path.startsWith('project/')) APP.innerHTML = projectDetails(decodeURIComponent(path.split('/')[1]));
  else if (path.startsWith('apply/')) APP.innerHTML = applyPage(decodeURIComponent(path.split('/')[1]));
  else if (path === 'contact') APP.innerHTML = contactPage('contact');
  else if (path === 'feedback') APP.innerHTML = contactPage('feedback');
  else if (path === 'student-dashboard') APP.innerHTML = dashboard('student');
  else if (path === 'business-dashboard') APP.innerHTML = dashboard('business');
  else if (path === 'admin') APP.innerHTML = adminPage();
  else if (path === 'signin') APP.innerHTML = signInPage();
  else if (['about','privacy','terms','commission'].includes(path)) APP.innerHTML = legalPage(path);
  else APP.innerHTML = pageShell('Page not found.', 'That route does not exist yet.', `<div class="empty-state"><p>Try the project board or return home.</p>${link('#home','Go home','button button-lime')}</div>`);
  if (path === 'explore') renderProjects(params.get('category') || '');
  window.setTimeout(() => {
    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
    if (homeSection) document.getElementById(homeSection)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 0);
  bindForms();
  bindEnhancements();
  scrollTop();
}

const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); } }), { threshold: .12 });

function renderProjects(initialCategory = '') {
  const results = document.getElementById('project-results'); if (!results) return;
  const search = document.getElementById('project-search'); const category = document.getElementById('project-category'); const sort = document.getElementById('project-sort');
  if (initialCategory) category.value = initialCategory;
  const update = () => { let list = state.projects.filter(p => p.status === 'Open'); const q = search.value.toLowerCase().trim(); if (q) list = list.filter(p => `${p.title} ${p.description} ${p.category} ${p.skills} ${p.business}`.toLowerCase().includes(q)); if (category.value) list = list.filter(p => p.category === category.value); if (sort.value === 'budget-high') list.sort((a,b)=>b.budget-a.budget); if (sort.value === 'deadline') list.sort((a,b)=>a.deadline.localeCompare(b.deadline)); results.innerHTML = list.length ? list.map(projectCard).join('') : `<div class="empty-state" style="grid-column:1/-1"><h2>No matching projects yet.</h2><p>Try a different search or category. New focused problems will appear here as businesses post them.</p>${link('#post-project','Post a problem instead','button button-small')}</div>`; document.querySelectorAll('.reveal').forEach(el=>revealObserver.observe(el)); };
  [search,category,sort].forEach(el=>el.addEventListener('input', update)); update();
}

function validate(form) {
  let valid = true; form.querySelectorAll('[required]').forEach(input => { const empty = input.type === 'checkbox' ? !input.checked : !input.value.trim(); const badEmail = input.type === 'email' && input.value && !/^\S+@\S+\.\S+$/.test(input.value); const badUrl = input.type === 'url' && input.value && !/^https?:\/\//i.test(input.value); const badPhone = input.type === 'tel' && input.value && !/^[+\d][\d\s().-]{7,}$/.test(input.value); const invalid = empty || badEmail || badUrl || badPhone; input.setAttribute('aria-invalid', invalid ? 'true' : 'false'); const error = form.querySelector(`[data-error-for="${input.name}"]`); if (error) error.textContent = invalid ? (empty ? 'This field is required.' : 'Please enter a valid value.') : ''; if (invalid) valid = false; }); return valid;
}
function formData(form) { return Object.fromEntries(new FormData(form).entries()); }
function ref(prefix) { return `${prefix}-${Date.now().toString(36).slice(-6).toUpperCase()}`; }

async function sendToGoogleSheets(type, record) {
  if (!GOOGLE_SHEETS_ENDPOINT) return { configured: false };
  try {
    // text/plain is a CORS-simple content type; Apps Script receives JSON in e.postData.contents.
    // no-cors makes the response opaque, so the browser cannot verify the sheet write.
    await fetch(GOOGLE_SHEETS_ENDPOINT, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify({ type, record })
    });
    notify('Submission sent to the Sheets endpoint. Check the spreadsheet to confirm the first test.', 'success');
    return { configured: true, sent: true };
  } catch (error) {
    console.error('Google Sheets submission failed:', error);
    notify('Could not reach Google Sheets. The record is still saved in this browser; check the Apps Script URL and deployment.', 'error');
    return { configured: true, sent: false };
  }
}

function addGoogleFormsOption(form) {
  if (form.dataset.googleFormOptionAdded === 'true') return;
  const type = form.dataset.formType;
  const url = GOOGLE_FORMS[type];
  const option = document.createElement('div');
  option.className = 'google-form-option';
  if (url) {
    const labels = {
      student: 'Open student registration Google Form',
      business: 'Open business registration Google Form',
      project: 'Open project submission Google Form',
      contact: 'Open contact Google Form',
      feedback: 'Open feedback Google Form',
      newsletter: 'Open newsletter Google Form'
    };
    option.innerHTML = `<p><strong>Prefer Google Forms?</strong> ${GOOGLE_SHEETS_ENDPOINT ? 'You can submit here; this form is configured to send a copy to your connected Google Sheet. ' : 'This form is not connected to central storage until the Apps Script URL is configured. '}Open the official Google Form if you prefer to submit there separately; it will ask you to enter your details again.</p><a class="button button-small button-google-form" href="${url}" target="_blank" rel="noopener noreferrer">${labels[type] || 'Open official Google Form'} <span aria-hidden="true">↗</span></a>`;
  } else if (type === 'application') {
    option.innerHTML = '<p><strong>Google Forms application link not provided.</strong> Applications currently stay in this browser demo and are not sent to Google Forms.</p>';
  } else {
    return;
  }
  form.insertAdjacentElement('afterend', option);
  form.dataset.googleFormOptionAdded = 'true';
}

function bindForms() {
  document.querySelectorAll('form[data-form-type]').forEach(form => { addGoogleFormsOption(form); form.addEventListener('submit', e => { e.preventDefault(); if (!validate(form)) { notify('Please review the highlighted fields.', 'error'); return; } const data = formData(form); const type = form.dataset.formType; const button = form.querySelector('button[type="submit"]'); if (button) { button.disabled = true; button.innerHTML = 'Saving…'; }
    if (type === 'student') { const record = { ...data, id: ref('STU'), createdAt: new Date().toISOString() }; state.students.push(record); state.currentUser = { role:'student', email:data.email }; persist(); void sendToGoogleSheets('student', record); notify(GOOGLE_SHEETS_ENDPOINT ? 'Student profile saved on this device; sending a copy to Google Sheets.' : 'Student profile saved on this device. Connect Apps Script for central storage.'); setTimeout(()=>location.hash='#student-dashboard',500); }
    else if (type === 'business') { const record = { ...data, id: ref('BIZ'), createdAt: new Date().toISOString() }; state.businesses.push(record); state.currentUser = { role:'business', email:data.email }; persist(); void sendToGoogleSheets('business', record); notify(GOOGLE_SHEETS_ENDPOINT ? 'Business profile saved on this device; sending a copy to Google Sheets.' : 'Business profile saved on this device. Connect Apps Script for central storage.'); setTimeout(()=>location.hash='#business-dashboard',500); }
    else if (type === 'project') { const project = { id:ref('3DS'), title:data.title, category:data.category, description:data.description, skills:data.skills, deliverables:data.deliverables, budget:Number(data.budget), duration:data.duration, deadline:data.deadline, posted:new Date().toLocaleDateString('en-US',{month:'short',day:'2-digit',year:'numeric'}), status:'Open', business:data.businessName, email:data.email }; state.projects.unshift(project); persist(); void sendToGoogleSheets('project', project); notify(GOOGLE_SHEETS_ENDPOINT ? `Project ${project.id} saved on this device; sending a copy to Google Sheets.` : `Project ${project.id} saved on this device. Connect Apps Script for central storage.`, 'success'); setTimeout(()=>location.hash=`#project/${project.id}`,500); }
    else if (type === 'application') { const id = form.dataset.projectId; const duplicate = state.applications.some(a => a.projectId === id && a.email.toLowerCase() === data.email.toLowerCase()); if (duplicate) { notify('You have already applied to this project.', 'error'); if(button){button.disabled=false;button.innerHTML='Submit application <span>↗</span>';} return; } const record = { ...data, projectId:id, applicationId:ref('APP'), status:'Submitted', createdAt:new Date().toISOString() }; state.applications.push(record); persist(); void sendToGoogleSheets('application', record); notify(GOOGLE_SHEETS_ENDPOINT ? `Application ${record.applicationId} saved locally; sending a copy to Google Sheets.` : `Application ${record.applicationId} saved on this device. Connect Apps Script for central storage.`); setTimeout(()=>location.hash='#student-dashboard',500); }
    else if (type === 'contact' || type === 'feedback') { const destination = type === 'contact' ? state.contacts : state.feedback; const record = { ...data, reference:ref(type === 'contact'?'MSG':'FDB'), createdAt:new Date().toISOString() }; destination.push(record); persist(); void sendToGoogleSheets(type, record); notify(GOOGLE_SHEETS_ENDPOINT ? `Thanks — your ${type === 'contact'?'message':'feedback'} was saved locally; sending a copy to Google Sheets.` : `Thanks — your ${type === 'contact'?'message':'feedback'} was saved on this device. Connect Apps Script for central storage.`); form.reset(); }
    else if (type === 'newsletter') { if (state.newsletter.some(item=>item.email.toLowerCase()===data.email.toLowerCase())) notify('That email is already subscribed.', 'error'); else { const record = { ...data, reference:ref('SUB'), createdAt:new Date().toISOString() }; state.newsletter.push(record); persist(); void sendToGoogleSheets('newsletter', record); notify(GOOGLE_SHEETS_ENDPOINT ? 'You are on the list; sending a copy to Google Sheets.' : 'You are on the list on this device. Connect Apps Script for central storage.'); form.reset(); } }
    else if (type === 'signin') { const foundStudent=state.students.find(s=>s.email.toLowerCase()===data.email.toLowerCase()); const foundBusiness=state.businesses.find(b=>b.email.toLowerCase()===data.email.toLowerCase()); if(foundStudent){state.currentUser={role:'student',email:foundStudent.email};persist();void sendToGoogleSheets('signin',{email:foundStudent.email,role:'student',createdAt:new Date().toISOString()});location.hash='#student-dashboard';} else if(foundBusiness){state.currentUser={role:'business',email:foundBusiness.email};persist();void sendToGoogleSheets('signin',{email:foundBusiness.email,role:'business',createdAt:new Date().toISOString()});location.hash='#business-dashboard';} else notify('No saved profile found for that email.', 'error'); }
  }); });
  document.querySelectorAll('[data-save-project]').forEach(button => button.addEventListener('click', () => { const id=button.dataset.saveProject; state.saved = state.saved.includes(id) ? state.saved.filter(x=>x!==id) : [...state.saved,id]; persist(); void sendToGoogleSheets('savedProject',{projectId:id,saved:state.saved.includes(id),email:state.currentUser?.email || '',createdAt:new Date().toISOString()}); button.innerHTML = `${state.saved.includes(id)?'Saved':'Save project'} <span>♡</span>`; notify(state.saved.includes(id)?'Project saved.':'Project removed from saved projects.'); }));
  document.querySelectorAll('[data-share-project]').forEach(button => button.addEventListener('click', async () => { const url=location.href; try { await navigator.clipboard.writeText(url); notify('Project link copied to your clipboard.'); } catch { notify('Copy the project URL from your browser to share it.'); } }));
}

setTheme(localStorage.getItem(THEME_KEY) || 'light');
document.getElementById('footer-year').textContent = new Date().getFullYear();
document.getElementById('newsletter-mount').innerHTML = newsletterForm();
document.getElementById('mobile-menu-button').addEventListener('click', () => { const nav=document.getElementById('site-nav'); const open=nav.classList.toggle('is-open'); document.body.classList.toggle('is-menu-open',open); document.getElementById('mobile-menu-button').setAttribute('aria-expanded',String(open)); });
document.getElementById('site-nav').addEventListener('click', e => { if(e.target.closest('a')) { document.getElementById('site-nav').classList.remove('is-open'); document.body.classList.remove('is-menu-open'); } });
window.addEventListener('hashchange', route);
window.addEventListener('load', () => { setTimeout(() => document.getElementById('page-loader').classList.add('is-hidden'), 450); route(); bindEnhancements(); });
