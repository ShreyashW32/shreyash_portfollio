// Set Current Year in Footer
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
- Education: Master of CS (AI & Data Science) @ University of Sydney (WAM-75)
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
