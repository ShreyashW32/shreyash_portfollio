// ========================================
// 3D Neural Core — rotating projected neuron globe
// (pure-canvas WebGL-free 3D; reacts to mouse, theme-aware)
// ========================================
(function () {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // --- themeable accent (updated live by the theme switcher) ---
  let accent = [0, 242, 254];
  const readAccent = () => {
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue('--accent-rgb').trim();
    const parts = raw.split(',').map((n) => parseInt(n, 10));
    if (parts.length === 3 && parts.every((n) => !isNaN(n))) accent = parts;
  };
  readAccent();
  window.addEventListener('accentchange', (e) => {
    if (e.detail && e.detail.rgb) accent = e.detail.rgb;
    else readAccent();
  });
  const rgba = (a) => `rgba(${accent[0]}, ${accent[1]}, ${accent[2]}, ${a})`;

  let width, height, dpr;
  let nodes = [];       // {x,y,z} world coords on/near a unit sphere
  let edges = [];       // [i, j]
  let stars = [];       // ambient depth field
  let signals = [];     // pulses travelling along edges
  const mouse = { x: -9999, y: -9999, nx: 0, ny: 0, active: false };

  // rotation state
  let spin = 0;
  let rotY = 0, rotX = 0, tRotY = 0, tRotX = 0;

  const isMobile = () => width < 768;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // Even point distribution on a sphere (fibonacci) + a few interior nodes
  function buildCore() {
    const surface = isMobile() ? 42 : 78;
    const interior = isMobile() ? 6 : 14;
    nodes = [];

    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < surface; i++) {
      const y = 1 - (i / (surface - 1)) * 2; // 1..-1
      const r = Math.sqrt(1 - y * y);
      const theta = golden * i;
      nodes.push({
        x: Math.cos(theta) * r,
        y: y,
        z: Math.sin(theta) * r,
        firing: 0
      });
    }
    for (let i = 0; i < interior; i++) {
      const rr = 0.3 + Math.random() * 0.5;
      const u = Math.random() * 2 - 1;
      const phi = Math.random() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      nodes.push({ x: Math.cos(phi) * s * rr, y: u * rr, z: Math.sin(phi) * s * rr, firing: 0 });
    }

    // connect each node to its k nearest neighbours → stable neural mesh
    edges = [];
    const seen = new Set();
    const k = 3;
    for (let i = 0; i < nodes.length; i++) {
      const dists = [];
      for (let j = 0; j < nodes.length; j++) {
        if (i === j) continue;
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dz = nodes[i].z - nodes[j].z;
        dists.push([dx * dx + dy * dy + dz * dz, j]);
      }
      dists.sort((a, b) => a[0] - b[0]);
      for (let n = 0; n < k; n++) {
        const j = dists[n][1];
        const key = i < j ? i + '-' + j : j + '-' + i;
        if (!seen.has(key)) { seen.add(key); edges.push([i, j]); }
      }
    }
  }

  function buildStars() {
    const count = isMobile() ? 60 : 130;
    stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random(),            // depth 0..1 for parallax
        r: Math.random() * 1.1 + 0.3,
        tw: Math.random() * Math.PI * 2 // twinkle phase
      });
    }
  }

  // core placement + size
  function coreGeom() {
    const cx = isMobile() ? width * 0.5 : width * 0.66;
    const cy = isMobile() ? height * 0.4 : height * 0.5;
    const screenR = Math.min(width, height) * (isMobile() ? 0.34 : 0.40);
    return { cx, cy, screenR, cam: 2.6 };
  }

  function project(p, g) {
    // rotate around Y then X
    const ay = spin + rotY;
    const cY = Math.cos(ay), sY = Math.sin(ay);
    const x1 = p.x * cY - p.z * sY;
    const z1 = p.x * sY + p.z * cY;
    const cX = Math.cos(rotX), sX = Math.sin(rotX);
    const y2 = p.y * cX - z1 * sX;
    const z2 = p.y * sX + z1 * cX;
    const scale = g.cam / (g.cam - z2);
    return {
      sx: g.cx + x1 * scale * g.screenR,
      sy: g.cy + y2 * scale * g.screenR,
      depth: (z2 + 1) / 2,   // 0 back .. 1 front
      scale
    };
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    spin += 0.0016;
    rotY += (tRotY - rotY) * 0.045;
    rotX += (tRotX - rotX) * 0.045;

    // --- ambient star depth field (subtle parallax) ---
    for (const s of stars) {
      const px = s.x + mouse.nx * (12 + s.z * 26);
      const py = s.y + mouse.ny * (12 + s.z * 26);
      const tw = 0.35 + (Math.sin(spin * 40 + s.tw) * 0.5 + 0.5) * 0.5;
      ctx.beginPath();
      ctx.arc(px, py, s.r, 0, Math.PI * 2);
      ctx.fillStyle = rgba((0.05 + s.z * 0.18) * tw);
      ctx.fill();
    }

    const g = coreGeom();
    const P = nodes.map((p) => project(p, g));

    // --- edges (behind nodes) ---
    for (const [i, j] of edges) {
      const a = P[i], b = P[j];
      const depth = (a.depth + b.depth) / 2;
      const fire = (nodes[i].firing + nodes[j].firing) * 0.35;
      ctx.beginPath();
      ctx.moveTo(a.sx, a.sy);
      ctx.lineTo(b.sx, b.sy);
      ctx.strokeStyle = rgba(Math.min(0.04 + depth * 0.12 + fire, 0.4));
      ctx.lineWidth = 0.4 + depth * 0.7;
      ctx.stroke();

      if ((nodes[i].firing > 0.25 || nodes[j].firing > 0.25) && Math.random() < 0.02) {
        const from = nodes[i].firing > nodes[j].firing ? i : j;
        signals.push({ a: from, b: from === i ? j : i, t: 0 });
      }
    }

    // --- signal pulses ---
    for (const sig of signals) {
      sig.t += 0.03;
      const a = P[sig.a], b = P[sig.b];
      const x = a.sx + (b.sx - a.sx) * sig.t;
      const y = a.sy + (b.sy - a.sy) * sig.t;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, 7);
      glow.addColorStop(0, rgba(0.5));
      glow.addColorStop(1, rgba(0));
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();
      if (sig.t >= 1) nodes[sig.b].firing = Math.min(nodes[sig.b].firing + 0.5, 1);
    }
    signals = signals.filter((s) => s.t < 1);

    // --- nodes (painter's algorithm: far → near) ---
    const order = P.map((p, i) => i).sort((a, b) => P[a].depth - P[b].depth);
    for (const i of order) {
      const p = P[i];
      const n = nodes[i];
      n.firing *= 0.94;

      // mouse proximity fires nearby nodes
      if (mouse.active) {
        const dx = p.sx - mouse.x, dy = p.sy - mouse.y;
        if (dx * dx + dy * dy < 130 * 130) n.firing = Math.min(n.firing + 0.06, 1);
      }

      const size = (0.8 + p.depth * 2.0) * p.scale + n.firing * 2.2;
      const alpha = 0.25 + p.depth * 0.5 + n.firing * 0.3;

      if (p.depth > 0.45 || n.firing > 0.15) {
        const gr = size * (2.6 + n.firing * 3);
        const glow = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, gr);
        glow.addColorStop(0, rgba((0.12 + n.firing * 0.35) * p.depth));
        glow.addColorStop(1, rgba(0));
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, gr, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(p.sx, p.sy, size, 0, Math.PI * 2);
      ctx.fillStyle = rgba(Math.min(alpha, 0.95));
      ctx.fill();
    }

    // keep the network alive with spontaneous firing
    if (Math.random() < 0.03) {
      nodes[Math.floor(Math.random() * nodes.length)].firing = 1;
    }

    requestAnimationFrame(animate);
  }

  // --- interaction ---
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.nx = e.clientX / width - 0.5;
    mouse.ny = e.clientY / height - 0.5;
    mouse.active = true;
    tRotY = mouse.nx * 0.7;
    tRotX = mouse.ny * 0.55;
  });
  window.addEventListener('mouseleave', () => {
    mouse.active = false;
    mouse.x = -9999; mouse.y = -9999;
    tRotY = 0; tRotX = 0;
  });

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => { resize(); buildCore(); buildStars(); }, 200);
  });

  resize();
  buildCore();
  buildStars();
  animate();
})();

// ========================================
// Ambient HUD Overlay
// ========================================
(function () {
  const hudX = document.getElementById('hud-x');
  const hudY = document.getElementById('hud-y');
  const hudScrollPct = document.getElementById('hud-scroll-pct');
  const hudProgressCircle = document.getElementById('hud-progress-circle');
  if (!hudX || !hudY || !hudScrollPct || !hudProgressCircle) return;

  const circumference = 2 * Math.PI * 18; // r=18

  // Mouse coordinate tracker
  window.addEventListener('mousemove', (e) => {
    const normX = (e.clientX / window.innerWidth).toFixed(4);
    const normY = (e.clientY / window.innerHeight).toFixed(4);
    hudX.textContent = normX;
    hudY.textContent = normY;
  });

  // Scroll progress tracker
  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;
    const pct = Math.round(progress * 100);

    hudScrollPct.textContent = pct + '%';
    hudProgressCircle.style.strokeDashoffset = circumference * (1 - progress);
  });
})();

// ========================================
// Set Current Year in Footer
// ========================================
const date = document.getElementById('date');
if (date) {
  date.textContent = new Date().getFullYear();
}

// Floating Glass Navbar Scroll Effect
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// Mobile Hamburger Menu Navigation Toggle
const hamburger = document.getElementById('hamburger');
const navList = document.getElementById('nav-list');
const navLinks = document.querySelectorAll('.nav-links');

const toggleMenu = () => {
  hamburger.classList.toggle('open');
  navList.classList.toggle('open');
  document.body.classList.toggle('no-scroll');
};

if (hamburger && navList) {
  hamburger.addEventListener('click', toggleMenu);
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (navList.classList.contains('open')) {
        toggleMenu();
      }
    });
  });
}

// Active Nav Links Observer on Scroll
const sections = document.querySelectorAll('section');
const navItems = document.querySelectorAll('.nav-links');

const observerOptions = {
  root: null,
  threshold: 0.25,
  rootMargin: '0px 0px -10% 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const activeId = entry.target.getAttribute('id');
      navItems.forEach(item => {
        if (item.getAttribute('href') === `#${activeId}`) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
    }
  });
}, observerOptions);

sections.forEach(section => observer.observe(section));

// Interactive AI Console / Terminal Simulation
const terminalOutput = document.getElementById('terminal-output');
const chips = document.querySelectorAll('.console-chip');

const queryResponses = {
  sys_status: `[SYSTEM STATUS]
- Name: Shreyash Wetal
- Focus: GenAI, LLM/RAG Systems & Computer Vision
- Current Role: AI Research Student @ University of Sydney (medical imaging)
- Previous: AI Engineer Team Lead @ The Modern Group · Prompt Engineer @ NVIDIA
- Education: Master of CS (AI & Data Science) @ USyd (WAM: 75)
- Bachelor: B.Tech in IT @ PCCOE (CGPA: 8.57/10)
- Standing: Active, ready for high-scale AI deployments.`,
  
  skills_list: `[TECHNICAL STACK]
- Programming: Python, C/C++, SQL, HTML/CSS
- Frameworks: TensorFlow, OpenCV, LangChain, Scikit-learn, NLTK, Pandas, Gensim
- Cloud/DB: GCP, Digital Ocean, Firebase, Twilio, SQL
- Robotic/CV: ROS, Gazebo, YOLOv8, QGIS, GDAL
- Certifications: TensorFlow Developer (DeepLearning.AI), Deep Learning Specialization, LangChain Apps, J.P. Morgan Quant Modelling`,

  exp_nvidia: `[ROLE LOG: NVIDIA]
- Title: Associate Prompt Engineer
- Location: Santa Clara, CA, USA (Remote)
- Tenure: Oct 2024 - Dec 2024
- Details: Engineered enterprise-grade prompt frameworks improving LLM response precision by 22%. Ran A/B tests across transformer models for accuracy, clarity, and consistency. Built automated prompt-evaluation pipelines to standardize output quality assessment and NLP benchmarking.`,

  project_eyedentify: `[CASE STUDY: EYEDENTIFY]
- Project: Blink-based Biometric Identification (AJCAI 2025 Paper)
- Core Innovation: Spatio-temporal blink classification templates.
- Features: Introduced Colour Outline Time Image (COTI) and Mean Intensity Time Image (MITI).
- Accuracy: MobileNetV2 model reached 99.04% on NTHU-DDD & 94.78% on UTA-RLDD datasets.`,

  project_uav: `[CASE STUDY: UAV SURVEILLANCE]
- Project: Urban UAV Object Tracking & Mapping
- Objective: Drone-based traffic monitoring & emergency anomaly detection.
- Architecture: YOLOv8 on UAV stream with flights simulated in Gazebo.
- Geospatial: Applied ORB feature extraction and GDAL geo-tagging to plot anomalies on interactive dashboards.`
};

let typingTimer;

const typeResponse = (text, terminalElement, cmdName = 'sys_status') => {
  const commandMap = {
    sys_status: 'cat sys_status.md',
    skills_list: 'cat skills_stack.md',
    exp_nvidia: 'cat nvidia_role.md',
    project_eyedentify: 'cat eyedentify_project.md',
    project_uav: 'cat uav_surveillance.md'
  };
  
  const mockCommand = commandMap[cmdName] || 'query_system';

  // Clear any active typing sequence
  clearInterval(typingTimer);
  
  // Set starting element
  terminalElement.innerHTML = `
    <div class="console-prompt-line">
      <span class="console-prompt-symbol">$</span>
      <span class="console-input-mock">${mockCommand}</span>
    </div>
    <div class="console-response" id="typing-content"></div>
  `;
  
  const responseDiv = document.getElementById('typing-content');
  let index = 0;
  
  // Type letters sequentially to simulate an LLM stream
  typingTimer = setInterval(() => {
    if (index < text.length) {
      responseDiv.textContent += text.charAt(index);
      index++;
      terminalElement.scrollTop = terminalElement.scrollHeight;
    } else {
      // Add typewriter cursor at the end
      responseDiv.innerHTML += '<span class="console-cursor"></span>';
      clearInterval(typingTimer);
    }
  }, 10); // Speed of streaming
};

if (chips && terminalOutput) {
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      // Manage active classes on chips
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      
      const cmd = chip.getAttribute('data-command');
      
      if (cmd === 'clear') {
        clearInterval(typingTimer);
        terminalOutput.innerHTML = `
          <div class="console-prompt-line">
            <span class="console-prompt-symbol">$</span>
            <span class="console-input-mock">clear</span>
          </div>
          <div class="console-response">Console cleared. Select a query option above. <span class="console-cursor"></span></div>
        `;
      } else {
        const textResponse = queryResponses[cmd];
        if (textResponse) {
          typeResponse(textResponse, terminalOutput, cmd);
        }
      }
    });
  });
  
  // Initialize with system status on load
  const initialText = queryResponses['sys_status'];
  if (initialText) {
    typeResponse(initialText, terminalOutput, 'sys_status');
  }
}

// Copy Email to Clipboard Trigger
const emailBox = document.getElementById('email-box');
const emailText = document.getElementById('email-text');
const copyIcon = document.getElementById('copy-icon');

if (emailBox && emailText && copyIcon) {
  emailBox.addEventListener('click', () => {
    const emailStr = emailBox.getAttribute('data-email');
    
    navigator.clipboard.writeText(emailStr).then(() => {
      // Feedback to user
      emailText.textContent = "Copied to Clipboard!";
      copyIcon.className = "bx bx-check-circle";
      copyIcon.style.color = "#10b981";
      
      setTimeout(() => {
        emailText.textContent = emailStr;
        copyIcon.className = "bx bx-copy";
        copyIcon.style.color = "";
      }, 2000);
    }).catch(err => {
      console.error("Failed to copy text: ", err);
    });
  });
}

// Scroll Reveal Intersection Observer
const revealElements = document.querySelectorAll('.reveal');

if (revealElements.length > 0) {
  const revealObserverOptions = {
    root: null,
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  };

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, revealObserverOptions);

  revealElements.forEach(element => revealObserver.observe(element));
}

// Local AI Chatbot Logic
const chatbotToggle = document.getElementById('chatbot-toggle-btn');
const chatbotContainer = document.getElementById('chatbot-container');
const chatbotClose = document.getElementById('chatbot-close-btn');
const chatbotMessages = document.getElementById('chatbot-messages');
const chatbotInput = document.getElementById('chatbot-input');
const chatbotSend = document.getElementById('chatbot-send-btn');
const chatbotSuggestions = document.querySelectorAll('#chatbot-suggestions .suggestion-chip');

// Toggle chat window
if (chatbotToggle && chatbotContainer && chatbotClose) {
  chatbotToggle.addEventListener('click', () => {
    chatbotContainer.classList.toggle('open');
    chatbotInput.focus();
  });

  chatbotClose.addEventListener('click', () => {
    chatbotContainer.classList.remove('open');
  });
}

// ========================================================================
// Shreyash-AI Chat Engine v2 — fuzzy local retrieval QA
// (typo-tolerant scoring · multi-intent · follow-up chips · "tell me more")
// ========================================================================

const CHAT_CV_URL = './assets/Shreyash_Wetal_CV.pdf';

// --- Knowledge base: label + match words/phrases + answer (+more, +follow) ---
const CHAT_KB = [
  {
    id: 'about', label: 'About Shreyash',
    words: ['shreyash', 'wetal', 'profile', 'introduce', 'introduction', 'summary', 'background', 'himself', 'overview', 'bio'],
    phrases: ['who is', 'about him', 'about shreyash'],
    answer: "Shreyash Wetal is a Sydney-based AI Engineer & researcher. Currently: Master of CS (AI & Data Science) student and AI Research Student at the University of Sydney, working on medical image analysis. Previously: AI Engineer & Team Lead at The Modern Group and Associate Prompt Engineer at NVIDIA. Specialties: GenAI, LLM/RAG systems, and computer vision — with 3 peer-reviewed publications.",
    more: "Beyond the titles: he published EyeDentify (99.04% blink biometrics, AJCAI 2025 Springer), won the FIAT/TATA Trusts scholarship 4 years running, reached the national top 20 in robotics, and built everything from drone surveillance to GenAI product-innovation frameworks. He likes turning research into things people actually use.",
    follow: ['His experience', 'His projects', 'How to contact him']
  },
  {
    id: 'skills', label: 'Skills',
    words: ['skill', 'skills', 'stack', 'tools', 'technologies', 'technology', 'framework', 'frameworks', 'libraries', 'expertise', 'proficient', 'competencies'],
    phrases: ['tech stack', 'what does he know', 'what can he do'],
    answer: "Shreyash's stack:\n• GenAI & LLMs: OpenAI API, RAG pipelines, prompt engineering, embeddings, vector DBs, LLM evaluation, transformers\n• Languages: Python, C/C++, SQL, HTML/CSS\n• AI/ML: TensorFlow, OpenCV, LangChain, Scikit-Learn, NLTK, Pandas, Gensim\n• Platforms: ROS, Gazebo, YOLOv8, Flask, Django, GCP, Firebase, REST APIs, CI/CD",
    more: "He also works with U-Net/DeepLabV3+ segmentation architectures (current USyd research), Excel dashboards and analytics reporting, QGIS/GDAL geospatial tooling, and Twilio/Digital Ocean integrations. Certifications: TensorFlow Developer (DeepLearning.AI), Deep Learning Specialization, LangChain Apps, JP Morgan Quant Modelling.",
    follow: ['GenAI skills', 'Certifications', 'His projects']
  },
  {
    id: 'genai', label: 'GenAI & LLM work',
    words: ['genai', 'llm', 'llms', 'rag', 'prompt', 'prompting', 'embeddings', 'chatgpt', 'gemini', 'openai', 'langchain', 'transformer', 'transformers', 'generative', 'agents'],
    phrases: ['vector database', 'generative ai', 'prompt engineering'],
    answer: "GenAI is Shreyash's core strength:\n• NVIDIA — enterprise prompt frameworks that improved LLM response precision by 22%, plus automated prompt-evaluation pipelines\n• The Modern Group — RAG systems with vector retrieval that lifted retrieval accuracy 30%\n• AI Product Innovation project — ChatGPT/Gemini ideation workflows with an idea-scoring framework\n• Stack: OpenAI API, LangChain, embeddings, vector DBs, LLM evaluation",
    follow: ['NVIDIA role', 'Modern Group role', 'AI Product Innovation project']
  },
  {
    id: 'mlcv', label: 'ML & Computer Vision',
    words: ['ml', 'machine', 'deep', 'vision', 'opencv', 'tensorflow', 'pytorch', 'cnn', 'cnns', 'yolo', 'yolov8', 'nlp', 'neural', 'segmentation', 'detection', 'classification'],
    phrases: ['machine learning', 'deep learning', 'computer vision', 'good at'],
    answer: "Yes — ML/CV is where Shreyash publishes and ships:\n• EyeDentify blink biometrics: 99.04% accuracy (AJCAI 2025, Springer)\n• Medical image segmentation research at USyd: Dice +12% with U-Net/DeepLabV3+\n• YOLOv8 drone surveillance (ICSC 2024, Springer)\n• CNN crop-disease and plant-identification systems (90%+ accuracy)",
    follow: ['EyeDentify', 'His research at USyd', 'Publications']
  },
  {
    id: 'experience', label: 'Experience',
    words: ['experience', 'work', 'worked', 'working', 'job', 'jobs', 'career', 'role', 'roles', 'company', 'companies', 'employment', 'employer', 'history'],
    phrases: ['work experience', 'where has he worked', 'work history'],
    answer: "Shreyash's experience:\n1. Research Student (AI), University of Sydney — Mar 2025–now: medical image analysis, Dice +12%, U-Net/DeepLabV3+ benchmarking\n2. AI Engineer & Team Lead, The Modern Group, Sydney — Jun–Dec 2025: RAG retrieval +30%, deployment cycles −40%, ETL for 100K+ records\n3. Associate Prompt Engineer, NVIDIA, Santa Clara — Oct–Dec 2024: LLM response precision +22%\n4. Team Automatons (ABU Robocon) — 2021–22: ROS, Arduino, image processing",
    more: "At Robocon he built and tested robots for the ABU Robocon competition — ROS, Arduino, sensor interfacing, and meticulous test plans. That robotics foundation later fed into his UAV surveillance research.",
    follow: ['USyd research', 'NVIDIA role', 'Modern Group role']
  },
  {
    id: 'usyd', label: 'USyd AI Research',
    words: ['research', 'researcher', 'medical', 'imaging', 'unet', 'deeplab', 'deeplabv3', 'dice', 'iou'],
    phrases: ['research student', 'medical image', 'current role', 'university research', 'usyd research', 'his research'],
    answer: "Since March 2025, Shreyash is a Research Student (AI) at the University of Sydney working on deep learning for medical image analysis: improved Dice score by 12% via preprocessing, augmentation and tuning; benchmarked U-Net vs DeepLabV3+; and built cross-validation/evaluation pipelines tracking IoU, F1, precision-recall, and ROC.",
    follow: ['Publications', 'His education', 'Experience overview']
  },
  {
    id: 'tmg', label: 'The Modern Group',
    words: ['modern', 'tmg'],
    phrases: ['modern group', 'team lead'],
    answer: "At The Modern Group (Sydney, Jun–Dec 2025), Shreyash was AI Engineer & Team Lead:\n• RAG pipelines with vector retrieval → retrieval accuracy +30%\n• Real-time inference APIs on Firebase/GCP → deployment cycle time −40%\n• AI decision-support workflows → contextual relevance +25%\n• ETL pipelines & analytics for 100K+ records",
    follow: ['NVIDIA role', 'USyd research', 'His skills']
  },
  {
    id: 'nvidia', label: 'NVIDIA',
    words: ['nvidia'],
    phrases: ['prompt engineer', 'santa clara'],
    answer: "At NVIDIA (Santa Clara, remote — Oct to Dec 2024), Shreyash was an Associate Prompt Engineer: engineered enterprise-grade prompt frameworks improving LLM response precision by 22%, ran A/B tests across transformer models for accuracy/clarity/consistency, and built automated prompt-evaluation pipelines for output quality assessment and NLP benchmarking.",
    follow: ['GenAI skills', 'Modern Group role', 'Experience overview']
  },
  {
    id: 'robotics', label: 'Robotics',
    words: ['robocon', 'robotics', 'robot', 'robots', 'arduino', 'automatons', 'robokidz'],
    answer: "Robotics roots: Shreyash was part of Team Automatons for ABU Robocon (2021–22) — ROS, Arduino, sensor interfacing and image processing. Earlier, he placed in the national Top 20 at the RoboKidz Soccer Bot Competition, representing India internationally.",
    follow: ['UAV surveillance', 'His achievements', 'Experience overview']
  },
  {
    id: 'projects', label: 'Projects',
    words: ['project', 'projects', 'built', 'build', 'portfolio', 'made', 'showcase'],
    phrases: ['case study', 'case studies', 'what has he built'],
    answer: "Shreyash's 6 flagship projects:\n1. AI Product Innovation & Consumer Insights — GenAI ideation + idea-scoring framework\n2. EyeDentify — 99.04% blink biometrics (AJCAI 2025)\n3. Urban UAV Surveillance — YOLOv8 drone monitoring (ICSC 2024)\n4. Medicinal Plant ID — SIH project for the Ayush Ministry\n5. Crop Disease Detection — 90%+ CNN pathology classifier\n6. Multi-Modal Emotion Recognition — audio + face + text",
    follow: ['EyeDentify', 'UAV surveillance', 'AI Product Innovation project']
  },
  {
    id: 'eyedentify', label: 'EyeDentify',
    words: ['eyedentify', 'blink', 'biometric', 'biometrics', 'coti', 'miti', 'mobilenet', 'mobilenetv2'],
    answer: "EyeDentify is Shreyash's flagship research: non-invasive biometric identification from blink patterns. He introduced two novel spatio-temporal templates — COTI (Colour Outline Time Image) and MITI (Mean Intensity Time Image) — reaching 99.04% accuracy on NTHU-DDD and 94.78% on UTA-RLDD with MobileNetV2. Published at AJCAI 2025 (Springer): https://link.springer.com/chapter/10.1007/978-981-95-4972-6_16",
    follow: ['Other publications', 'His projects', 'UAV surveillance']
  },
  {
    id: 'uav', label: 'UAV Surveillance',
    words: ['uav', 'drone', 'drones', 'surveillance', 'gazebo', 'orb', 'gdal', 'aerial'],
    answer: "The Urban UAV Surveillance project: an AI drone system for real-time traffic monitoring and emergency detection — YOLOv8 object detection on the UAV stream, flights simulated in Gazebo/ROS, ORB feature extraction with GDAL geo-tagging to plot anomalies on dashboards. Published at ICSC 2024 (Springer): https://link.springer.com/chapter/10.1007/978-981-96-7818-1_35",
    follow: ['EyeDentify', 'His projects', 'Publications']
  },
  {
    id: 'plants', label: 'Medicinal Plant ID',
    words: ['plant', 'plants', 'medicinal', 'ayush', 'sih', 'hackathon'],
    answer: "Medicinal Plant Identification — a Smart India Hackathon project for the Ayush Ministry: CNN + HOG + Random Forest models classify medicinal plants from photos, paired with a LangChain-powered chatbot that explains each plant's properties in real time. Code: https://github.com/ShreyashW32/Medicinal-Plant-Classification",
    follow: ['Crop disease detection', 'His projects', 'GenAI skills']
  },
  {
    id: 'crop', label: 'Crop Disease Detection',
    words: ['crop', 'leaf', 'disease', 'agriculture', 'farming', 'hog'],
    answer: "Crop Leaf Disease Detection: a CNN classifier fused with Random Forest over HOG-featured datasets, detecting crop leaf diseases at 90%+ accuracy for rapid field diagnostics. Code: https://github.com/ShreyashW32/plantleafdiseasedetection",
    follow: ['Medicinal plant ID', 'His projects', 'ML & CV expertise']
  },
  {
    id: 'emotion', label: 'Emotion Recognition',
    words: ['emotion', 'emotions', 'multimodal', 'sentiment', 'speech', 'facial'],
    answer: "Multi-Modal Emotion Recognition: combines vocal pitch (audio), facial expressions (vision), and text sentiment into one robust emotion detector for human-computer interaction. Code: https://github.com/ShreyashW32/Multimodel-emotion-recognition",
    follow: ['His projects', 'ML & CV expertise', 'Contact details']
  },
  {
    id: 'genai_project', label: 'AI Product Innovation',
    words: ['innovation', 'consumer', 'insights', 'ideation', 'persona', 'personas', 'concept', 'concepts', 'scoring'],
    phrases: ['product innovation', 'market research'],
    answer: "The AI Product Innovation & Consumer Insights framework: a GenAI workflow using ChatGPT/Gemini to generate product concepts, consumer personas, claims and market-research summaries — scored by an idea-evaluation framework (feasibility, consumer relevance, differentiation, evidence strength, commercial potential), with Python/Excel dashboards for decision-making.",
    follow: ['GenAI skills', 'His projects', 'Is he available for hire?']
  },
  {
    id: 'publications', label: 'Publications',
    words: ['publication', 'publications', 'paper', 'papers', 'published', 'springer', 'ajcai', 'icsc', 'ijsart', 'journal', 'conference', 'citation'],
    answer: "Shreyash has 3 peer-reviewed publications:\n1. EyeDentify (AJCAI 2025, Springer) — blink biometrics: https://link.springer.com/chapter/10.1007/978-981-95-4972-6_16\n2. Smart Drone Surveillance (ICSC 2024, Springer): https://link.springer.com/chapter/10.1007/978-981-96-7818-1_35\n3. Intelligent Auto Traffic Signal Controller (IJSART) — emergency vehicle prioritization",
    follow: ['EyeDentify', 'His research at USyd', 'His achievements']
  },
  {
    id: 'achievements', label: 'Achievements',
    words: ['achievement', 'achievements', 'award', 'awards', 'scholarship', 'fiat', 'tata', 'honor', 'honors', 'finalist', 'won', 'winner'],
    answer: "Highlights:\n• FIAT India / TATA Trusts Academic Excellence Scholarship (₹1L annually, 2020–2024)\n• Top 20 National Finalist — RoboKidz International Robotics Competition\n• 3 peer-reviewed publications (2× Springer)\n• Workshop Coordinator at SIAC Baramati under TATA Trusts",
    follow: ['Publications', 'His education', 'About Shreyash']
  },
  {
    id: 'education', label: 'Education',
    words: ['education', 'degree', 'degrees', 'university', 'usyd', 'college', 'pccoe', 'wam', 'cgpa', 'gpa', 'grades', 'masters', 'master', 'bachelor', 'bachelors', 'btech', 'study', 'studies', 'studying', 'qualification', 'qualifications'],
    phrases: ['university of sydney'],
    answer: "Education:\n• Master of Computer Science (AI & Data Science), University of Sydney — 2025–2027, WAM 75, plus a research assistantship in medical imaging\n• B.Tech in Information Technology, Pimpri Chinchwad College of Engineering, Pune — 2020–2024, CGPA 8.57/10",
    follow: ['USyd research', 'Certifications', 'His achievements']
  },
  {
    id: 'certs', label: 'Certifications',
    words: ['certification', 'certifications', 'certificate', 'certificates', 'certified', 'coursera', 'deeplearning', 'forage', 'jpmorgan'],
    answer: "Certifications:\n• TensorFlow Developer Professional Certificate (DeepLearning.AI)\n• Deep Learning Specialization\n• LangChain Application Development\n• Object Detection Web Apps (TensorFlow/OpenCV)\n• JP Morgan Quantitative Modelling (Forage)",
    follow: ['His skills', 'His education', 'His projects']
  },
  {
    id: 'contact', label: 'Contact',
    words: ['contact', 'email', 'mail', 'phone', 'number', 'reach', 'connect', 'linkedin', 'github', 'socials', 'call', 'message'],
    phrases: ['get in touch', 'reach out', 'talk to'],
    answer: "Reach Shreyash here:\n• Email: shreyash.wetal03@gmail.com\n• Phone: +61 0451 507 744 (Sydney, AEST)\n• LinkedIn: https://www.linkedin.com/in/shreyash-w-388bb4223/\n• GitHub: https://github.com/ShreyashW32",
    follow: [{ label: '⬇ Download CV (PDF)', act: () => window.open(CHAT_CV_URL, '_blank', 'noopener') }, 'Is he available for hire?'],
  },
  {
    id: 'resume', label: 'Résumé / CV',
    words: ['resume', 'cv', 'download', 'pdf'],
    phrases: ['his cv', 'his resume', 'curriculum vitae'],
    answer: "You can grab Shreyash's CV as a PDF here: https://shreyashw32.github.io/shreyash_portfollio/assets/Shreyash_Wetal_CV.pdf — or use the button below. Tip: pressing Ctrl+P on this site prints a clean résumé version of the whole page.",
    follow: [{ label: '⬇ Download CV (PDF)', act: () => window.open(CHAT_CV_URL, '_blank', 'noopener') }, 'Contact details', 'Is he available for hire?'],
  },
  {
    id: 'hire', label: 'Availability',
    words: ['hire', 'hiring', 'available', 'availability', 'opportunity', 'opportunities', 'recruit', 'recruiter', 'join', 'position', 'positions', 'vacancy', 'openings', 'freelance', 'intern', 'internship', 'collaborate', 'collaboration'],
    phrases: ['open to work', 'looking for work', 'good fit', 'why should'],
    answer: "Shreyash is open to AI/ML engineering roles, research collaborations, and internships — he's NVIDIA-alumni, has led an AI team in Sydney, published 3 papers, and ships production systems. Currently based in Sydney while completing his Master's at USyd. The fastest way to start the conversation: shreyash.wetal03@gmail.com",
    follow: [{ label: '⬇ Download CV (PDF)', act: () => window.open(CHAT_CV_URL, '_blank', 'noopener') }, 'Contact details', 'His experience'],
  },
  {
    id: 'logistics', label: 'Salary / visa / logistics',
    words: ['salary', 'visa', 'sponsorship', 'relocation', 'relocate', 'rate', 'rates', 'compensation', 'notice', 'remote', 'onsite', 'hybrid'],
    answer: "For specifics like salary expectations, work rights/visa status, notice period, or remote/on-site preferences, it's best to ask Shreyash directly — he responds quickly at shreyash.wetal03@gmail.com.",
    follow: ['Contact details', { label: '⬇ Download CV (PDF)', act: () => window.open(CHAT_CV_URL, '_blank', 'noopener') }],
  },
  {
    id: 'location', label: 'Location',
    words: ['location', 'located', 'based', 'live', 'lives', 'city', 'timezone', 'australia'],
    phrases: ['where is he', 'based in', 'come from'],
    answer: "Shreyash is based in Sydney, Australia (AEST timezone) while completing his Master's at the University of Sydney. He's originally from Pune, India, where he did his B.Tech at PCCOE.",
    follow: ['His education', 'Is he available for hire?', 'Contact details']
  },
  {
    id: 'website', label: 'This website',
    words: ['website'],
    phrases: ['this site', 'this website', 'who built', 'who made', 'site built', 'website built'],
    answer: "This site is hand-built with vanilla HTML/CSS/JS — no frameworks. The background is a 3D neural globe rendered on a raw canvas, there's a Ctrl+K command palette, a typeable terminal (try 'neofetch' in the hero console!), an adaptive Visitor Lens, four color themes, and a hardened Content-Security-Policy. Source: https://github.com/ShreyashW32/shreyash_portfollio",
    follow: ['His projects', 'His skills', 'About Shreyash']
  },
  {
    id: 'joke', label: 'Joke',
    words: ['joke', 'funny', 'laugh', 'humor'],
    answer: "Why did the neural network break up with the decision tree? Too many branches, not enough depth. 🤖\n\n(Shreyash's models have plenty of depth — 99.04% on EyeDentify.)",
    follow: ['His projects', 'About Shreyash']
  }
];

// --- tiny bounded Levenshtein for typo tolerance ---
const chatLev = (a, b) => {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > 2) return 3;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
};

// exact word = 3 pts, close typo = 2 pts, phrase hit = 6 pts
const chatFuzzy = (token, word) => {
  if (token === word) return 3;
  if (word.length >= 5 && token.length >= 4 && chatLev(token, word) <= (word.length >= 8 ? 2 : 1)) return 2;
  return 0;
};

const CHAT_STOP = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'do', 'does', 'did', 'of', 'in', 'at', 'on', 'to', 'for', 'me', 'my', 'i', 'you', 'your', 'his', 'her', 'their', 'what', 'whats', 'tell', 'about', 'can', 'could', 'how', 'who', 'whos', 'which', 'with', 'and', 'or', 'he', 'she', 'they', 'them', 'it', 'its', 'this', 'that', 'have', 'has', 'had', 'any', 'some', 'get', 'give', 'show', 'list', 'please', 'u', 'ur', 'im', 'am', 'be', 'been', 'so', 'but', 'if', 'then', 'there', 'here', 'from', 'by', 'as', 'more']);

let chatLastIntent = null;

const chatAnswer = (raw) => {
  const query = ' ' + raw.toLowerCase().replace(/[^a-z0-9\s+#./@-]/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
  const q = query.trim();
  const tokens = q.split(' ').filter((t) => t.length > 1 && !CHAT_STOP.has(t));

  // --- small talk ---
  if (/^(hi+|hello+|hey+|heya|yo|howdy|sup|g'?day|good (morning|afternoon|evening))\b/.test(q)) {
    return { text: "Hey! 👋 I'm Shreyash's AI assistant. Ask me anything about his skills, experience, research, projects, or how to reach him — typos welcome.", follow: ['His experience', 'His projects', 'Contact details'] };
  }
  if (/how are you|how'?s it going|hows it going/.test(q)) {
    return { text: "Running at full inference speed, thanks for asking! 🤖 What would you like to know about Shreyash?", follow: ['About Shreyash', 'His projects'] };
  }
  if (/\b(thanks|thank you|thankyou|thx|ty|cheers)\b/.test(q)) {
    return { text: "You're welcome! Anything else you'd like to know? If you'd rather talk to the human: shreyash.wetal03@gmail.com", follow: ['Contact details', { label: '⬇ Download CV (PDF)', act: () => window.open(CHAT_CV_URL, '_blank', 'noopener') }] };
  }
  if (/\b(bye|goodbye|see ya|see you|later|good night)\b/.test(q)) {
    return { text: "Goodbye! 👋 Thanks for stopping by — Shreyash is one email away if anything comes up: shreyash.wetal03@gmail.com", follow: [] };
  }
  if (/who are you|what are you|your name|are you (a |an )?(bot|ai|human|real|llm)/.test(q)) {
    return { text: "I'm Shreyash's on-site AI assistant — a fully local retrieval engine (no external API, your questions never leave this page). I know his CV inside out: skills, roles, research, projects, publications, and contact details.", follow: ['About Shreyash', 'What can you answer?'] };
  }
  if (/^(help|menu|options)$|what can (you|i) (do|ask|answer)|what do you know/.test(q)) {
    return { text: "I can answer questions about:\n• Skills & GenAI/LLM expertise\n• Experience (USyd research, The Modern Group, NVIDIA, Robocon)\n• All 6 projects & 3 publications\n• Education, certifications, achievements\n• Availability, contact info, and his CV\n\nAsk naturally — I handle typos and multi-part questions.", follow: ['His experience', 'His projects', 'Contact details'] };
  }

  // --- "tell me more" follow-up context ---
  if (/^(more|tell me more|more details|details|elaborate|go on|continue)\??$/.test(q) && chatLastIntent) {
    if (chatLastIntent.more) return { text: chatLastIntent.more, follow: chatLastIntent.follow };
    return { text: "That's the full picture I have on " + chatLastIntent.label.toLowerCase() + " — but try one of these:", follow: chatLastIntent.follow || ['His projects', 'His experience'] };
  }

  // --- retrieval scoring ---
  const scored = CHAT_KB.map((e) => {
    let s = 0;
    (e.phrases || []).forEach((p) => { if (q.includes(p)) s += 6; });
    (e.words || []).forEach((w) => {
      let best = 0;
      tokens.forEach((t) => { const f = chatFuzzy(t, w); if (f > best) best = f; });
      s += best;
    });
    return { e, s };
  }).sort((a, b) => b.s - a.s);

  if (scored[0] && scored[0].s >= 3) {
    chatLastIntent = scored[0].e;
    let text = scored[0].e.answer;
    // multi-intent: merge a strong second topic ("skills and contact?")
    if (scored[1] && scored[1].s >= 3 && /(\band\b|,|\+|also)/.test(q)) {
      text += '\n\n— and on ' + scored[1].e.label.toLowerCase() + ' —\n' + scored[1].e.answer;
    }
    return { text, follow: scored[0].e.follow };
  }

  // near-miss: single fuzzy hit → answer with a hedge
  if (scored[0] && scored[0].s === 2) {
    chatLastIntent = scored[0].e;
    return { text: 'I might be misreading, but I think you\'re asking about ' + scored[0].e.label.toLowerCase() + ':\n\n' + scored[0].e.answer, follow: scored[0].e.follow };
  }

  // true fallback
  return {
    text: "Hmm, that one's outside my training data 😅 — I know Shreyash's skills, experience, research, projects, publications, education, and contact info. For anything else, he's at shreyash.wetal03@gmail.com. Try one of these:",
    follow: ['His experience', 'His projects', 'Contact details', 'What can you answer?']
  };
};

// --- rendering: escape + linkify (emails/URLs clickable), typewriter, chips ---
const chatEscape = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const chatLinkify = (s) => chatEscape(s)
  .replace(/(https?:\/\/[^\s<)]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
  .replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '<a href="mailto:$1">$1</a>')
  .replace(/\n/g, '<br>');

const chatAppendUser = (text) => {
  const bubble = document.createElement('div');
  bubble.className = 'chat-message user-message';
  bubble.textContent = text;
  chatbotMessages.appendChild(bubble);
  chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
};

const chatRenderFollowups = (items) => {
  if (!items || !items.length) return;
  chatbotMessages.querySelectorAll('.followup-chips').forEach((el) => el.remove());
  const row = document.createElement('div');
  row.className = 'followup-chips';
  items.forEach((it) => {
    const label = typeof it === 'string' ? it : it.label;
    const btn = document.createElement('button');
    btn.className = 'suggestion-chip';
    btn.textContent = label;
    btn.addEventListener('click', () => {
      if (typeof it !== 'string' && it.act) { it.act(); return; }
      chatSend(label);
    });
    row.appendChild(btn);
  });
  chatbotMessages.appendChild(row);
  chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
};

const chatAppendBot = (text, follow) => {
  const bubble = document.createElement('div');
  bubble.className = 'chat-message bot-message';
  chatbotMessages.appendChild(bubble);

  const finish = () => {
    bubble.innerHTML = chatLinkify(text);
    chatRenderFollowups(follow);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
  };

  if (REDUCED_MOTION) { finish(); return; }

  let i = 0;
  const step = text.length > 500 ? 4 : text.length > 220 ? 2 : 1;
  const timer = setInterval(() => {
    if (i < text.length) {
      i += step;
      bubble.innerHTML = chatLinkify(text.slice(0, i)) + '<span class="console-cursor" style="width:5px; height:12px;"></span>';
      chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    } else {
      clearInterval(timer);
      finish();
    }
  }, 9);
};

// --- send pipeline ---
const chatSend = (queryText) => {
  const text = (queryText || '').trim();
  if (!text) return;

  chatAppendUser(text);

  // retire the initial suggestions panel + stale followups
  const suggestionsContainer = document.getElementById('chatbot-suggestions');
  if (suggestionsContainer) suggestionsContainer.remove();
  chatbotMessages.querySelectorAll('.followup-chips').forEach((el) => el.remove());

  setTimeout(() => {
    const { text: reply, follow } = chatAnswer(text);
    chatAppendBot(reply, follow);
  }, 350);
};

if (chatbotSend && chatbotInput) {
  chatbotSend.addEventListener('click', () => { chatSend(chatbotInput.value); chatbotInput.value = ''; });
  chatbotInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') { chatSend(chatbotInput.value); chatbotInput.value = ''; }
  });
}

// initial suggestion chips route through the same engine
if (chatbotSuggestions) {
  chatbotSuggestions.forEach((chip) => {
    chip.addEventListener('click', () => chatSend(chip.textContent.trim()));
  });
}

// ========================================================================
// CREATIVE UPGRADE LAYER
// Boot preloader · ⌘K command palette · text scramble · count-up ·
// custom cursor + magnetic · 3D tilt + spotlight cards
// ========================================================================

const REDUCED_MOTION =
  window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE_POINTER =
  window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// ------------------------------------------------------------------------
// 1. Boot Sequence Preloader
// ------------------------------------------------------------------------
(function () {
  const preloader = document.getElementById('preloader');
  if (!preloader) return;

  const terminal = document.getElementById('preloader-terminal');
  const barFill = document.getElementById('preloader-bar-fill');
  let dismissed = false;

  const dismiss = () => {
    if (dismissed) return;
    dismissed = true;
    preloader.classList.add('done');
    document.body.style.overflow = '';
    // Kick off the hero name decrypt once the curtain lifts
    window.dispatchEvent(new Event('portfolio:ready'));
    setTimeout(() => preloader.remove(), 800);
  };

  // Reduced motion or no terminal → skip the show
  if (REDUCED_MOTION || !terminal || !barFill) {
    dismiss();
    return;
  }

  document.body.style.overflow = 'hidden';

  const lines = [
    { t: 'booting neural interface', ok: 'OK' },
    { t: 'loading models · llm · rag · vision', ok: 'OK' },
    { t: 'mounting resume.db', ok: 'OK' },
    { t: 'calibrating synapses', ok: 'READY' }
  ];

  let li = 0;
  const renderLine = () => {
    if (dismissed) return;
    if (li >= lines.length) {
      barFill.style.width = '100%';
      setTimeout(dismiss, 420);
      return;
    }
    const line = document.createElement('div');
    line.className = 'preloader-line';
    line.innerHTML =
      `<span class="pl-dim">$</span> ${lines[li].t} ` +
      `<span class="pl-ok">[${lines[li].ok}]</span>`;
    terminal.appendChild(line);
    li++;
    barFill.style.width = Math.round((li / lines.length) * 100) + '%';
    setTimeout(renderLine, 360);
  };
  renderLine();

  // Skip on any interaction
  const skip = () => dismiss();
  window.addEventListener('keydown', skip, { once: true });
  preloader.addEventListener('click', skip, { once: true });
})();

// ------------------------------------------------------------------------
// 2. Text Scramble — decrypt the hero name on ready
// ------------------------------------------------------------------------
(function () {
  const el = document.querySelector('.hero-title');
  if (!el) return;

  const finalText = el.textContent;

  if (REDUCED_MOTION) return; // leave the name as-is

  const chars = '!<>-_\\/[]{}—=+*^?#01';
  let frame;

  const run = () => {
    const total = finalText.length;
    let frameCount = 0;
    const queue = [];
    for (let i = 0; i < total; i++) {
      const start = Math.floor(Math.random() * 20);
      const end = start + Math.floor(Math.random() * 30) + 15;
      queue.push({ char: finalText[i], start, end, rand: '' });
    }

    const update = () => {
      let output = '';
      let complete = 0;
      for (let i = 0; i < queue.length; i++) {
        const q = queue[i];
        if (frameCount >= q.end) {
          complete++;
          output += q.char;
        } else if (q.char === ' ') {
          output += ' ';
        } else {
          // Keep every slot filled with a flickering glyph (no layout shift)
          if (!q.rand || Math.random() < 0.28) {
            q.rand = chars[Math.floor(Math.random() * chars.length)];
          }
          output += `<span class="scramble-char">${q.rand}</span>`;
        }
      }
      el.innerHTML = output;
      if (complete === queue.length) {
        el.textContent = finalText;
        cancelAnimationFrame(frame);
        return;
      }
      frameCount++;
      frame = requestAnimationFrame(update);
    };
    update();
  };

  window.addEventListener('portfolio:ready', () => setTimeout(run, 180), { once: true });
})();

// ------------------------------------------------------------------------
// 3. Animated Count-Up for stats & impact metrics
// ------------------------------------------------------------------------
(function () {
  const targets = document.querySelectorAll('.stat-val, .impact-metric');
  if (!targets.length) return;

  const animateValue = (node) => {
    const raw = node.textContent.trim();
    const match = raw.match(/^(\D*)([\d.]+)(.*)$/);
    if (!match) return;
    const [, prefix, numStr, suffix] = match;
    const target = parseFloat(numStr);
    const decimals = (numStr.split('.')[1] || '').length;

    if (REDUCED_MOTION) {
      node.textContent = raw;
      return;
    }

    const duration = 1500;
    const startTime = performance.now();
    const step = (now) => {
      const p = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      const val = (target * eased).toFixed(decimals);
      node.textContent = prefix + val + suffix;
      if (p < 1) requestAnimationFrame(step);
      else node.textContent = raw;
    };
    requestAnimationFrame(step);
  };

  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateValue(entry.target);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  targets.forEach((t) => io.observe(t));
})();

// ------------------------------------------------------------------------
// 4. Command Palette (⌘K / Ctrl+K)
// ------------------------------------------------------------------------
(function () {
  const overlay = document.getElementById('cmdk-overlay');
  const input = document.getElementById('cmdk-input');
  const list = document.getElementById('cmdk-list');
  const trigger = document.getElementById('cmdk-trigger');
  if (!overlay || !input || !list) return;

  const go = (id) => () => {
    const target = document.getElementById(id);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const openLink = (url) => () => window.open(url, '_blank', 'noopener');

  const commands = [
    { group: 'Navigate', icon: 'bx-user', label: 'About', hint: 'overview', run: go('about') },
    { group: 'Navigate', icon: 'bx-briefcase', label: 'Experience', hint: 'career', run: go('experience') },
    { group: 'Navigate', icon: 'bx-line-chart', label: 'Engineering Impact', hint: 'metrics', run: go('impact') },
    { group: 'Navigate', icon: 'bx-chip', label: 'Skills', hint: 'stack', run: go('skills') },
    { group: 'Navigate', icon: 'bx-folder', label: 'Projects', hint: 'case studies', run: go('projects') },
    { group: 'Navigate', icon: 'bx-book-open', label: 'Publications & Awards', hint: 'research', run: go('publications') },
    { group: 'Navigate', icon: 'bx-envelope', label: 'Contact', hint: 'connect', run: go('contact') },
    { group: 'Actions', icon: 'bx-copy', label: 'Copy email address', hint: 'clipboard', run: () => {
        navigator.clipboard && navigator.clipboard.writeText('shreyash.wetal03@gmail.com');
        const box = document.getElementById('email-box');
        if (box) box.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } },
    { group: 'Actions', icon: 'bx-bot', label: 'Ask the AI assistant', hint: 'chatbot', run: () => {
        const c = document.getElementById('chatbot-container');
        const inp = document.getElementById('chatbot-input');
        if (c) { c.classList.add('open'); if (inp) inp.focus(); }
      } },
    { group: 'Actions', icon: 'bx-palette', label: 'Cycle color theme', hint: 'appearance', run: () => {
        if (window.__cycleTheme) window.__cycleTheme();
      } },
    { group: 'Actions', icon: 'bx-download', label: 'Download résumé (PDF)', hint: 'cv', run: () => window.open('./assets/Shreyash_Wetal_CV.pdf', '_blank', 'noopener') },
    { group: 'Actions', icon: 'bx-printer', label: 'Print this page', hint: 'ctrl+p', run: () => window.print() },
    { group: 'Lens', icon: 'bx-code-alt', label: 'View as Engineer', hint: 'adaptive mode', run: () => window.__setLens && window.__setLens('engineer') },
    { group: 'Lens', icon: 'bx-briefcase-alt-2', label: 'View as Recruiter', hint: 'adaptive mode', run: () => window.__setLens && window.__setLens('recruiter') },
    { group: 'Lens', icon: 'bx-book', label: 'View as Researcher', hint: 'adaptive mode', run: () => window.__setLens && window.__setLens('researcher') },
    { group: 'Links', icon: 'bxl-github', label: 'GitHub', hint: 'ShreyashW32', run: openLink('https://github.com/ShreyashW32') },
    { group: 'Links', icon: 'bxl-linkedin', label: 'LinkedIn', hint: 'profile', run: openLink('https://www.linkedin.com/in/shreyash-w-388bb4223/') },
    { group: 'Links', icon: 'bx-file', label: 'EyeDentify paper (AJCAI 2025)', hint: 'springer', run: openLink('https://link.springer.com/chapter/10.1007/978-981-95-4972-6_16') }
  ];

  let filtered = commands.slice();
  let activeIndex = 0;

  const render = () => {
    list.innerHTML = '';
    if (!filtered.length) {
      list.innerHTML = '<div class="cmdk-empty">No matching commands.</div>';
      return;
    }
    let lastGroup = null;
    let flatIndex = 0;
    filtered.forEach((cmd) => {
      if (cmd.group !== lastGroup) {
        const gl = document.createElement('li');
        gl.className = 'cmdk-group-label';
        gl.textContent = cmd.group;
        list.appendChild(gl);
        lastGroup = cmd.group;
      }
      const li = document.createElement('li');
      li.className = 'cmdk-item' + (flatIndex === activeIndex ? ' active' : '');
      li.dataset.index = flatIndex;
      li.innerHTML =
        `<i class='bx ${cmd.icon}'></i>` +
        `<span class="cmdk-item-label">${cmd.label}</span>` +
        `<span class="cmdk-item-hint">${cmd.hint}</span>`;
      li.addEventListener('click', () => execute(cmd));
      li.addEventListener('mousemove', () => {
        activeIndex = parseInt(li.dataset.index, 10);
        highlight();
      });
      list.appendChild(li);
      flatIndex++;
    });
  };

  const highlight = () => {
    list.querySelectorAll('.cmdk-item').forEach((el) => {
      const isActive = parseInt(el.dataset.index, 10) === activeIndex;
      el.classList.toggle('active', isActive);
      if (isActive) el.scrollIntoView({ block: 'nearest' });
    });
  };

  const filter = (q) => {
    const query = q.toLowerCase().trim();
    filtered = !query
      ? commands.slice()
      : commands.filter((c) =>
          (c.label + ' ' + c.hint + ' ' + c.group).toLowerCase().includes(query)
        );
    activeIndex = 0;
    render();
  };

  const open = () => {
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    input.value = '';
    filter('');
    setTimeout(() => input.focus(), 40);
  };
  const close = () => {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
  };
  const execute = (cmd) => {
    close();
    setTimeout(() => cmd.run(), 120);
  };

  if (trigger) trigger.addEventListener('click', open);

  input.addEventListener('input', (e) => filter(e.target.value));

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  document.addEventListener('keydown', (e) => {
    const isOpen = overlay.classList.contains('open');
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      isOpen ? close() : open();
      return;
    }
    if (!isOpen) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = Math.min(activeIndex + 1, filtered.length - 1);
      highlight();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
      highlight();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[activeIndex]) execute(filtered[activeIndex]);
    }
  });
})();

// ------------------------------------------------------------------------
// 5. Custom Cursor + Magnetic Elements  (desktop, fine-pointer only)
// ------------------------------------------------------------------------
(function () {
  if (!FINE_POINTER || REDUCED_MOTION) return;

  const dot = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  if (!dot || !ring) return;

  document.body.classList.add('custom-cursor-active');

  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let rx = mx, ry = my;

  window.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
  });

  const loop = () => {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
    requestAnimationFrame(loop);
  };
  loop();

  const hoverTargets = 'a, button, .console-chip, .skill-chip, .email-box, .project-card, [data-magnetic]';
  document.querySelectorAll(hoverTargets).forEach((el) => {
    el.addEventListener('mouseenter', () => ring.classList.add('hovering'));
    el.addEventListener('mouseleave', () => ring.classList.remove('hovering'));
  });

  window.addEventListener('mousedown', () => ring.classList.add('clicking'));
  window.addEventListener('mouseup', () => ring.classList.remove('clicking'));
  window.addEventListener('mouseleave', () => { dot.style.opacity = '0'; ring.style.opacity = '0'; });
  window.addEventListener('mouseenter', () => { dot.style.opacity = '1'; ring.style.opacity = '1'; });

  // Magnetic pull on prominent interactive elements
  const magnets = document.querySelectorAll(
    '.btn, .social-nav a, .cmdk-trigger, .chatbot-toggle-btn, .scroll-top'
  );
  magnets.forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const relX = e.clientX - (r.left + r.width / 2);
      const relY = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${relX * 0.25}px, ${relY * 0.35}px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });
})();

// ------------------------------------------------------------------------
// 6. 3D Tilt + Spotlight on cards
// ------------------------------------------------------------------------
(function () {
  if (!FINE_POINTER || REDUCED_MOTION) return;

  const cards = document.querySelectorAll(
    '.project-card, .impact-card, .stat-box, .skill-category'
  );

  cards.forEach((card) => {
    card.addEventListener('mouseenter', () => card.classList.add('is-tilting'));

    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;   // 0..1
      const py = (e.clientY - r.top) / r.height;   // 0..1
      const rotY = (px - 0.5) * 9;   // deg
      const rotX = (0.5 - py) * 9;   // deg
      card.style.transform =
        `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-6px)`;
      card.style.setProperty('--mx', px * 100 + '%');
      card.style.setProperty('--my', py * 100 + '%');
    });

    card.addEventListener('mouseleave', () => {
      card.classList.remove('is-tilting');
      card.style.transform = '';
      card.style.removeProperty('--mx');
      card.style.removeProperty('--my');
    });
  });
})();

// ------------------------------------------------------------------------
// 7. Theme Switcher — recolors the whole UI + 3D core, persisted
// ------------------------------------------------------------------------
(function () {
  const swatches = document.querySelectorAll('.theme-swatch');
  if (!swatches.length) return;

  const THEMES = {
    cyan:      { rgb: [0, 242, 254],  rgb2: [79, 172, 254] },
    synthwave: { rgb: [236, 72, 153], rgb2: [139, 92, 246] },
    matrix:    { rgb: [0, 230, 150],  rgb2: [74, 222, 128] },
    solar:     { rgb: [255, 176, 32], rgb2: [251, 146, 60] }
  };

  const root = document.documentElement;
  const order = Object.keys(THEMES);

  const apply = (name, save = true) => {
    const t = THEMES[name];
    if (!t) return false;
    root.style.setProperty('--accent-rgb', t.rgb.join(', '));
    root.style.setProperty('--accent-rgb-2', t.rgb2.join(', '));
    swatches.forEach((s) => s.classList.toggle('active', s.dataset.theme === name));
    window.dispatchEvent(new CustomEvent('accentchange', { detail: { rgb: t.rgb } }));
    if (save) { try { localStorage.setItem('portfolio-theme', name); } catch (e) {} }
    return true;
  };
  window.__setTheme = apply;

  swatches.forEach((s) => s.addEventListener('click', () => apply(s.dataset.theme)));

  let current = 'cyan';
  try { current = localStorage.getItem('portfolio-theme') || 'cyan'; } catch (e) {}
  if (!THEMES[current]) current = 'cyan';
  apply(current, false);

  // exposed so the ⌘K palette can cycle themes
  window.__cycleTheme = () => {
    const active = order.find((k) =>
      document.querySelector('.theme-swatch[data-theme="' + k + '"]').classList.contains('active')
    ) || 'cyan';
    apply(order[(order.indexOf(active) + 1) % order.length]);
  };
})();

// ------------------------------------------------------------------------
// 8. Real Terminal REPL — the hero console accepts typed commands
// ------------------------------------------------------------------------
(function () {
  const term = document.getElementById('terminal-output');
  const input = document.getElementById('console-input');
  if (!term || !input) return;

  const HELP = `AVAILABLE COMMANDS
 whoami      about Shreyash
 skills      tech stack
 projects    project index
 papers      publications
 nvidia      NVIDIA role log
 contact     how to reach me
 neofetch    system card
 theme <t>   cyan | synthwave | matrix | solar
 lens <l>    engineer | recruiter | researcher
 resume      open CV (PDF)
 print       print this page as a document
 clear       wipe terminal`;

  const PROJECTS = `[PROJECT INDEX]
 00 AI Product Innovation — GenAI ideation + insights
 01 EyeDentify — blink biometrics, 99.04% (AJCAI 2025)
 02 UAV Surveillance — YOLOv8 + ROS (ICSC 2024)
 03 Medicinal Plant ID — SIH, Ayush Ministry
 04 Crop Disease Detection — CNN+RF, 90%+
 05 Emotion Recognition — audio · vision · text
Type 'eyedentify' or 'uav' for a deep dive.`;

  const PAPERS = `[PUBLICATIONS]
 1. EyeDentify — AJCAI 2025 (Springer)
 2. Smart Drone Surveillance — ICSC 2024 (Springer)
 3. Auto Traffic Signal Controller — IJSART`;

  const CONTACT = `[CONTACT]
 email   : shreyash.wetal03@gmail.com
 phone   : +61 0451507744
 github  : github.com/ShreyashW32
 linkedin: linkedin.com/in/shreyash-w-388bb4223`;

  const NEOFETCH = `     ◉         shreyash@portfolio
   ◉─┼─◉       ─────────────────
  ◉  │  ◉      Role  : AI Engineer (Lead)
   ◉─┼─◉       Org   : Modern Group, SYD
     ◉         Edu   : MCS @ USyd
               Papers: 3 peer-reviewed
               Uptime: 2+ yrs in AI/ML`;

  const SUDO = `[sudo] password for recruiter: ••••••••
Access granted ✔
Deploying Shreyash to your team…
 ▸ status: OPEN TO OPPORTUNITIES
 ▸ email : shreyash.wetal03@gmail.com
Tip: type 'resume' for a printable CV.`;

  let typeTimer = null;
  let pendingDiv = null;
  let pendingText = '';

  // finish any in-flight typing instantly (new command arrived)
  const finishTyping = () => {
    if (typeTimer) { clearInterval(typeTimer); typeTimer = null; }
    if (pendingDiv) { pendingDiv.textContent = pendingText; pendingDiv = null; }
  };

  const echo = (cmd) => {
    finishTyping();
    // interrupt the chips' auto-typing animation too (like Ctrl+C)
    if (typeof typingTimer !== 'undefined') clearInterval(typingTimer);
    const line = document.createElement('div');
    line.className = 'console-prompt-line';
    line.innerHTML = `<span class="console-prompt-symbol">$</span><span class="console-input-mock"></span>`;
    line.querySelector('.console-input-mock').textContent = cmd;
    term.appendChild(line);
    term.scrollTop = term.scrollHeight;
  };

  const reply = (text, instant = false) => {
    const div = document.createElement('div');
    div.className = 'console-response';
    term.appendChild(div);
    if (instant || REDUCED_MOTION) {
      div.textContent = text;
      term.scrollTop = term.scrollHeight;
      return;
    }
    pendingDiv = div;
    pendingText = text;
    let i = 0;
    typeTimer = setInterval(() => {
      if (i < text.length) {
        div.textContent += text.charAt(i++);
        term.scrollTop = term.scrollHeight;
      } else {
        clearInterval(typeTimer);
        typeTimer = null;
        pendingDiv = null;
      }
    }, 6);
  };

  const respond = (raw) => {
    echo(raw);
    const parts = raw.toLowerCase().trim().split(/\s+/);
    const cmd = parts[0];
    const arg = parts.slice(1).join(' ');

    switch (cmd) {
      case 'help': case '?': reply(HELP, true); break;
      case 'whoami': case 'about': reply(queryResponses.sys_status); break;
      case 'skills': case 'stack': reply(queryResponses.skills_list); break;
      case 'nvidia': reply(queryResponses.exp_nvidia); break;
      case 'eyedentify': reply(queryResponses.project_eyedentify); break;
      case 'uav': case 'drone': reply(queryResponses.project_uav); break;
      case 'projects': case 'ls': reply(PROJECTS); break;
      case 'papers': case 'publications': case 'pubs': reply(PAPERS); break;
      case 'contact': case 'email': reply(CONTACT); break;
      case 'neofetch': reply(NEOFETCH, true); break;
      case 'theme':
        if (window.__setTheme && window.__setTheme(arg)) reply(`theme set → ${arg}`, true);
        else reply('usage: theme <cyan|synthwave|matrix|solar>', true);
        break;
      case 'lens': case 'view':
        if (window.__setLens && window.__setLens(arg)) reply(`lens set → ${arg} (hero + projects re-prioritized)`, true);
        else reply('usage: lens <engineer|recruiter|researcher>', true);
        break;
      case 'resume': case 'cv':
        reply('Opening Shreyash_Wetal_CV.pdf …', true);
        setTimeout(() => window.open('./assets/Shreyash_Wetal_CV.pdf', '_blank', 'noopener'), 350);
        break;
      case 'print':
        reply('Opening print dialog… choose "Save as PDF".', true);
        setTimeout(() => window.print(), 350);
        break;
      case 'sudo':
        reply(arg.indexOf('hire') === 0 ? SUDO : `sudo: ${arg || '<command>'}: permission denied`);
        break;
      case 'clear':
        finishTyping();
        term.innerHTML = '';
        reply('Console cleared. Type "help" for commands.', true);
        break;
      case '': break;
      default:
        reply(`command not found: ${cmd} — type 'help'`, true);
    }
  };

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const v = input.value.trim();
      if (v) respond(v);
      input.value = '';
    }
  });

  // clicking the terminal focuses the prompt
  term.addEventListener('click', () => input.focus());
})();

// ------------------------------------------------------------------------
// 9. Visitor Lens — the portfolio adapts to who's viewing it
// ------------------------------------------------------------------------
(function () {
  const btns = document.querySelectorAll('.lens-btn');
  if (!btns.length) return;

  const intro = document.querySelector('.hero-intro');
  const primaryBtn = document.querySelector('.hero-buttons .btn-primary');
  const secondaryBtn = document.querySelector('.hero-buttons .btn-secondary');
  const cards = Array.prototype.slice.call(
    document.querySelectorAll('.projects-grid .project-card')
  );
  // card order in DOM: 0 GenAI Innovation · 1 EyeDentify · 2 UAV · 3 Plants · 4 Crop · 5 Emotion

  const CV_PDF = './assets/Shreyash_Wetal_CV.pdf';

  const LENSES = {
    engineer: {
      intro: 'I design and ship AI systems end-to-end — <span class="highlight">LLM & RAG pipelines</span>, real-time <span class="highlight">computer vision</span>, and the production infrastructure that keeps them fast and reliable. Master\'s @ University of Sydney.',
      primary: { label: 'View Projects', href: '#projects' },
      secondary: { label: 'GitHub', href: 'https://github.com/ShreyashW32', blank: true },
      order: [2, 3, 4, 5, 0, 1],
      pick: '★ top pick · engineers'
    },
    recruiter: {
      intro: 'AI Engineer with <span class="highlight">NVIDIA experience</span>, 3 published papers, and a record of shipping <span class="highlight">production ML</span> — currently an AI researcher completing a Master\'s at the University of Sydney.',
      primary: { label: 'Download Résumé', href: CV_PDF, blank: true },
      secondary: { label: 'Get In Touch', href: '#contact' },
      order: [1, 0, 3, 2, 4, 5],
      pick: '★ top pick · recruiters'
    },
    researcher: {
      intro: 'My research spans <span class="highlight">medical image analysis</span>, non-invasive biometrics, and aerial vision — 3 peer-reviewed publications including <span class="highlight">AJCAI 2025 (Springer)</span>, introducing novel COTI & MITI spatio-temporal templates.',
      primary: { label: 'Read Publications', href: '#publications' },
      secondary: { label: 'EyeDentify Paper', href: 'https://link.springer.com/chapter/10.1007/978-981-95-4972-6_16', blank: true },
      order: [1, 2, 5, 4, 3, 0],
      pick: '★ top pick · researchers'
    }
  };

  const setBtn = (el, cfg, withIcon) => {
    if (!el) return;
    if (cfg.action) {
      el.setAttribute('href', '#');
      el.setAttribute('data-action', cfg.action);
      el.removeAttribute('target');
      el.removeAttribute('rel');
    } else {
      el.setAttribute('href', cfg.href);
      el.removeAttribute('data-action');
      if (cfg.blank) {
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener noreferrer');
      } else {
        el.removeAttribute('target');
        el.removeAttribute('rel');
      }
    }
    el.innerHTML = cfg.label + (withIcon ? " <i class='bx bx-right-arrow-alt'></i>" : '');
  };

  const apply = (name, save = true) => {
    const L = LENSES[name];
    if (!L) return false;
    document.body.setAttribute('data-lens', name);
    btns.forEach((b) => b.classList.toggle('active', b.dataset.lens === name));
    if (intro) intro.innerHTML = L.intro;
    setBtn(primaryBtn, L.primary, true);
    setBtn(secondaryBtn, L.secondary, false);

    // re-prioritize the project grid + move the "top pick" badge
    document.querySelectorAll('.lens-pick').forEach((el) => el.remove());
    L.order.forEach((cardIdx, pos) => {
      const card = cards[cardIdx];
      if (!card) return;
      card.style.order = pos;
      if (pos === 0) {
        const media = card.querySelector('.project-media');
        if (media) {
          const badge = document.createElement('span');
          badge.className = 'lens-pick';
          badge.textContent = L.pick;
          media.appendChild(badge);
        }
      }
    });

    if (save) { try { localStorage.setItem('portfolio-lens', name); } catch (e) {} }
    return true;
  };

  btns.forEach((b) => b.addEventListener('click', () => apply(b.dataset.lens)));
  window.__setLens = apply;

  // delegated print trigger (recruiter CTA, contact button)
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-action="print-resume"]');
    if (t) { e.preventDefault(); window.print(); }
  });

  let saved = 'engineer';
  try { saved = localStorage.getItem('portfolio-lens') || 'engineer'; } catch (e) {}
  if (!LENSES[saved]) saved = 'engineer';
  apply(saved, false);
})();

// ------------------------------------------------------------------------
// 10. Live Sydney clock in the hero tagline
// ------------------------------------------------------------------------
(function () {
  const el = document.getElementById('syd-time');
  if (!el) return;
  let fmt;
  try {
    fmt = new Intl.DateTimeFormat('en-AU', {
      timeZone: 'Australia/Sydney',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false, timeZoneName: 'short'
    });
  } catch (e) { return; }
  const tick = () => { el.textContent = '· ' + fmt.format(new Date()); };
  tick();
  setInterval(tick, 1000);
})();

// ------------------------------------------------------------------------
// 11. Tab-title wink when the visitor switches away
// ------------------------------------------------------------------------
(function () {
  const original = document.title;
  document.addEventListener('visibilitychange', () => {
    document.title = document.hidden ? '🧠 Model still training — come back!' : original;
  });
})();

// ------------------------------------------------------------------------
// 12. Motion pass: reading progress bar · timeline draw · chip stagger
// ------------------------------------------------------------------------
(function () {
  // reading progress bar
  const bar = document.getElementById('scroll-progress');
  if (bar) {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  if (REDUCED_MOTION) return;
  document.body.classList.add('anim-on');

  // per-chip stagger index for the cascade animation
  document.querySelectorAll('.skill-chips').forEach((wrap) => {
    wrap.querySelectorAll('.skill-chip').forEach((chip, i) => {
      chip.style.setProperty('--ci', i);
    });
  });

  // timeline spine draws when the section enters the viewport
  const timeline = document.querySelector('.timeline');
  if (timeline && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('drawn');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    io.observe(timeline);
  }
})();
