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
- Focus: AI/ML & Computer Vision Systems
- Current Role: AI Lead @ The Modern Group (Sydney, Australia)
- Education: Master of CS (AI & Data Science) @ University of Sydney (WAM-76)
- Bachelor: B.Tech in IT @ PCCOE (CGPA: 8.57/10)
- Standing: Active, ready for high-scale AI infrastructure deployments.`,
  
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
- Details: Developed and optimized AI-driven prompt engineering models for NLP. Enhanced LLM accuracy through data-driven tuning and reinforcement learning (RL) techniques. Researched prompt behavior to improve contextual understanding across diverse use cases.`,

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

// Chat responses mapping
const botResponses = {
  greetings: "Hello! I can answer questions about Shreyash's skills, experience, projects, education, and contact details. What would you like to know?",
  skills: "Shreyash's tech stack includes:\n• Languages: Python, C/C++, SQL, HTML/CSS\n• AI/ML: TensorFlow, OpenCV, LangChain, Scikit-Learn, NLTK, Pandas, Gensim\n• Platforms: ROS, Gazebo, YOLOv8, Flask, Django, GCP, Firebase\n• Certifications: TensorFlow Developer (DeepLearning.AI), Deep Learning Specialization",
  experience: "Shreyash is currently an AI Engineer & Team Lead at The Modern Group in Sydney, Australia. Formerly, they worked as an Associate Prompt Engineer at NVIDIA in Santa Clara, CA.",
  nvidia: "At NVIDIA, Shreyash was an Associate Prompt Engineer focusing on NLP. They developed prompt engineering models, tuned LLMs, and conducted reinforcement learning research to improve model outputs.",
  publications: "Shreyash has published 3 research papers:\n1. 'EyeDentify' (AJCAI 2025) - Blink Biometric Spatio-Temporal classification.\n2. 'Smart Drone Surveillance System' (ICSC 2024) - Drone anomaly mapping.\n3. 'Intelligent Auto Traffic Signal Controller' (IJSART) - Emergency vehicle signals.",
  education: "• Master of Computer Science (AI & Data Science) - University of Sydney (2025 - 2027) | WAM: 76\n• B.Tech in Information Technology - PCCOE, Pune (2020 - 2024) | CGPA: 8.57/10",
  contact: "You can reach Shreyash via:\n• Email: shreyash.wetal03@gmail.com\n• Phone: +61 0451507744 (Sydney, AU)\n• LinkedIn: linkedin.com/in/shreyash-w-388bb4223/\n• GitHub: github.com/ShreyashW32",
  ml_expertise: "Yes! Shreyash is highly proficient in Machine Learning, Deep Learning, and Computer Vision. They have published research papers in these domains (like EyeDentify blink biometrics), built industrial AI models (YOLOv8 UAV tracking), optimized LLMs at NVIDIA, and currently lead AI solutions at The Modern Group using TensorFlow, PyTorch, and RAG pipelines.",
  who_is: "Shreyash Wetal is a Sydney-based AI & Computer Vision Engineer. They are currently a Master's student at the University of Sydney and serve as an AI Engineer & Team Lead at The Modern Group, specializing in LLMs, RAG, and automated anomaly detection.",
  projects_summary: "Shreyash has built 5 major projects:\n1. EyeDentify (99.04% accurate blink biometrics)\n2. Smart Drone Surveillance (YOLOv8 city monitoring)\n3. Medicinal Plant Identification (Ayush SIH Chatbot)\n4. Crop Disease Detection (90%+ CNN pathology detection)\n5. Multi-Modal Emotion Recognition (audio/visual/text sentiment)",
  assistant_identity: "I am Shreyash's virtual AI assistant. I'm running locally on their portfolio website to help answer questions about their background, skills, projects, education, and career achievements!",
  hire_fit: "Absolutely. Shreyash has led AI engineering teams, worked at NVIDIA, published international papers, and holds a strong academic track record in Computer Science (Master's from USyd). They are fully equipped to drive AI engineering and machine learning solutions.",
  default: "I'm not completely sure about that. Try asking about 'skills', 'experience', 'NVIDIA', 'publications', 'education', or 'contact'!"
};

// Keyword matcher function — uses word-boundary checks to avoid false substring matches
const getBotResponse = (input) => {
  const query = input.toLowerCase().trim();
  
  // Helper: check if any keyword appears as a whole word (or phrase) in the query
  const hasWord = (...words) => words.some(w => {
    if (w.includes(' ')) return query.includes(w); // multi-word phrases use simple includes
    return new RegExp(`\\b${w}\\b`).test(query);
  });

  // Identity
  if (hasWord('who are you', 'what are you', 'your name', 'identity', 'assistant')) {
    return botResponses.assistant_identity;
  }
  // About Shreyash
  if (hasWord('who is shreyash', 'about shreyash', 'tell me about shreyash', 'tell me about him', 'profile', 'introduce')) {
    return botResponses.who_is;
  }
  // Greetings — use word boundaries so "shreyash" doesn't match "hi"
  if (hasWord('hi', 'hello', 'hey', 'greet', 'welcome', 'howdy', 'sup')) {
    return botResponses.greetings;
  }
  // Skills / tech stack — THIS WAS MISSING
  if (hasWord('skill', 'skills', 'tech stack', 'stack', 'tools', 'technologies', 'languages', 'framework', 'certification', 'certifications', 'proficient', 'knows', 'know')) {
    return botResponses.skills;
  }
  // ML / AI expertise — "good at X" questions
  if (hasWord('good at', 'machine learning', 'deep learning', 'computer vision', 'nlp', 'artificial intelligence', 'neural', 'tensorflow', 'opencv', 'pyspark', 'pytorch', 'ml', 'dl', 'llm', 'rag', 'langchain')) {
    return botResponses.ml_expertise;
  }
  // NVIDIA
  if (hasWord('nvidia', 'prompt engineer')) {
    return botResponses.nvidia;
  }
  // Experience
  if (hasWord('experience', 'work', 'job', 'modern group', 'role', 'career', 'team lead', 'company', 'employed', 'employment')) {
    return botResponses.experience;
  }
  // Projects
  if (hasWord('project', 'build', 'built', 'portfolio', 'case study', 'uav', 'drone', 'plant', 'crop', 'emotion', 'blink')) {
    return botResponses.projects_summary;
  }
  // Publications
  if (hasWord('publication', 'paper', 'research', 'eyedentify', 'journal', 'conference', 'springer', 'ajcai', 'published')) {
    return botResponses.publications;
  }
  // Education
  if (hasWord('education', 'study', 'studying', 'university', 'usyd', 'sydney', 'college', 'degree', 'wam', 'cgpa', 'master', 'bachelor', 'pccoe')) {
    return botResponses.education;
  }
  // Contact / Hire
  if (hasWord('contact', 'email', 'phone', 'hire', 'reach', 'linkedin', 'github', 'resume', 'qualifications', 'candidate')) {
    return botResponses.hire_fit;
  }
  
  return botResponses.default;
};

// Append message bubble to log
const appendMessage = (text, isUser = false) => {
  const messageBubble = document.createElement('div');
  messageBubble.classList.add('chat-message');
  messageBubble.classList.add(isUser ? 'user-message' : 'bot-message');
  
  if (isUser) {
    messageBubble.textContent = text;
    chatbotMessages.appendChild(messageBubble);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
  } else {
    // Typewriter effect for bot response
    chatbotMessages.appendChild(messageBubble);
    let index = 0;
    
    // Replace newlines with <br> for formatting
    const formattedText = text.replace(/\n/g, '<br>');
    messageBubble.innerHTML = '';
    
    // Simple streaming typist
    let currentHTML = '';
    let i = 0;
    const typingInterval = setInterval(() => {
      if (i < text.length) {
        if (text.charAt(i) === '\n') {
          currentHTML += '<br>';
        } else {
          currentHTML += text.charAt(i);
        }
        messageBubble.innerHTML = currentHTML + '<span class="console-cursor" style="width:5px; height:12px;"></span>';
        i++;
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
      } else {
        messageBubble.innerHTML = currentHTML; // remove cursor
        clearInterval(typingInterval);
      }
    }, 8);
  }
};

// Handle sending message
const handleChatSend = () => {
  const userText = chatbotInput.value.trim();
  if (!userText) return;
  
  // User bubble
  appendMessage(userText, true);
  chatbotInput.value = '';
  
  // Remove suggestions panel if any custom message is sent
  const suggestionsContainer = document.getElementById('chatbot-suggestions');
  if (suggestionsContainer) {
    suggestionsContainer.remove();
  }
  
  // Bot reply simulation
  setTimeout(() => {
    const reply = getBotResponse(userText);
    appendMessage(reply, false);
  }, 400);
};

if (chatbotSend && chatbotInput) {
  chatbotSend.addEventListener('click', handleChatSend);
  chatbotInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleChatSend();
    }
  });
}

// Staggered Suggestion click hooks
if (chatbotSuggestions) {
  chatbotSuggestions.forEach(chip => {
    chip.addEventListener('click', () => {
      const questionKey = chip.getAttribute('data-question');
      const questionText = chip.textContent;

      appendMessage(questionText, true);

      // Remove suggestions panel entirely when clicked
      const suggestionsContainer = document.getElementById('chatbot-suggestions');
      if (suggestionsContainer) {
        suggestionsContainer.remove();
      }

      setTimeout(() => {
        const replyText = botResponses[questionKey] || botResponses.default;
        appendMessage(replyText, false);
      }, 400);
    });
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
    if (!t) return;
    root.style.setProperty('--accent-rgb', t.rgb.join(', '));
    root.style.setProperty('--accent-rgb-2', t.rgb2.join(', '));
    swatches.forEach((s) => s.classList.toggle('active', s.dataset.theme === name));
    window.dispatchEvent(new CustomEvent('accentchange', { detail: { rgb: t.rgb } }));
    if (save) { try { localStorage.setItem('portfolio-theme', name); } catch (e) {} }
  };

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
