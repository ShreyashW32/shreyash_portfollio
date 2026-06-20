// ========================================
// Canvas 2D Particle Background
// ========================================
(function () {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width, height;
  let particles = [];
  let mouse = { x: -1000, y: -1000 };
  const PARTICLE_COUNT_DESKTOP = 80;
  const PARTICLE_COUNT_MOBILE = 35;
  const CONNECTION_DISTANCE = 140;
  const MOUSE_RADIUS = 180;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  class Particle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = (Math.random() - 0.5) * 0.4;
      this.radius = Math.random() * 1.5 + 0.5;
      // Cyan-to-indigo palette
      const hue = 180 + Math.random() * 60; // 180 (cyan) to 240 (indigo)
      this.color = `hsla(${hue}, 80%, 65%, 0.6)`;
      this.lineColor = hue;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;

      // Clamp
      this.x = Math.max(0, Math.min(width, this.x));
      this.y = Math.max(0, Math.min(height, this.y));
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
    }
  }

  function init() {
    resize();
    particles = [];
    const count = width < 768 ? PARTICLE_COUNT_MOBILE : PARTICLE_COUNT_DESKTOP;
    for (let i = 0; i < count; i++) {
      particles.push(new Particle());
    }
  }

  function connectParticles() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONNECTION_DISTANCE) {
          const opacity = (1 - dist / CONNECTION_DISTANCE) * 0.15;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0, 242, 254, ${opacity})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }

      // Mouse connections
      const mdx = particles[i].x - mouse.x;
      const mdy = particles[i].y - mouse.y;
      const mDist = Math.sqrt(mdx * mdx + mdy * mdy);

      if (mDist < MOUSE_RADIUS) {
        const opacity = (1 - mDist / MOUSE_RADIUS) * 0.25;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.strokeStyle = `rgba(99, 102, 241, ${opacity})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    particles.forEach(p => {
      p.update();
      p.draw();
    });

    connectParticles();
    requestAnimationFrame(animate);
  }

  // Event listeners
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener('mouseleave', () => {
    mouse.x = -1000;
    mouse.y = -1000;
  });

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(init, 200);
  });

  init();
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

// Keyword matcher function
const getBotResponse = (input) => {
  const query = input.toLowerCase().trim();
  
  if (query.includes('who are you') || query.includes('what are you') || query.includes('your name') || query.includes('identity')) {
    return botResponses.assistant_identity;
  }
  if (query.includes('who is shreyash') || query.includes('about shreyash') || query.includes('tell me about shreyash') || query.includes('profile')) {
    return botResponses.who_is;
  }
  if (query.includes('hi') || query.includes('hello') || query.includes('hey') || query.includes('greet') || query.includes('welcome')) {
    return botResponses.greetings;
  }
  if (query.includes('good at ml') || query.includes('ml') || query.includes('machine learning') || query.includes('deep learning') || query.includes('computer vision') || query.includes('cv') || query.includes('nlp') || query.includes('ai') || query.includes('artificial intelligence') || query.includes('neural') || query.includes('tensorflow') || query.includes('opencv')) {
    return botResponses.ml_expertise;
  }
  if (query.includes('nvidia') || query.includes('prompt')) {
    return botResponses.nvidia;
  }
  if (query.includes('experience') || query.includes('work') || query.includes('job') || query.includes('modern group') || query.includes('role') || query.includes('career') || query.includes('team lead')) {
    return botResponses.experience;
  }
  if (query.includes('project') || query.includes('build') || query.includes('make') || query.includes('create') || query.includes('codebase') || query.includes('case study')) {
    return botResponses.projects_summary;
  }
  if (query.includes('publication') || query.includes('paper') || query.includes('research') || query.includes('eyedentify') || query.includes('journal') || query.includes('conference') || query.includes('smart cities') || query.includes('springer')) {
    return botResponses.publications;
  }
  if (query.includes('education') || query.includes('study') || query.includes('university') || query.includes('usyd') || query.includes('college') || query.includes('degree') || query.includes('wam') || query.includes('cgpa')) {
    return botResponses.education;
  }
  if (query.includes('contact') || query.includes('email') || query.includes('phone') || query.includes('hire') || query.includes('reach') || query.includes('fit') || query.includes('good candidate') || query.includes('qualifications')) {
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
