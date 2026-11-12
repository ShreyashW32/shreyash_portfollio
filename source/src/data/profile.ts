import mcp from "@/assets/mcp.webp";
import backyard from "@/assets/backyard.webp";
import eyedentify from "@/assets/eyedentify.webp";

const gh = "https://github.com/ShreyashW32";

export const links = {
  github: gh,
  linkedin: "https://www.linkedin.com/in/shreyash-w-388bb4223/",
  email: "shreyash.wetal03@gmail.com",
  phone: "+61 0451507744",
  // The static GitHub Pages build sets VITE_CV_URL; Lovable serves the CV from /public.
  cv: (import.meta.env["VITE_CV_URL"] as string | undefined) ?? "/Shreyash_Wetal_CV.pdf",
  eva: "https://heareva.com",
};

/** The main flagship: Eva, the AI phone agent. Facts match heareva.com and the Eva codebase. */
export const eva = {
  badge: "Voice AI // Product",
  meta: "Live at heareva.com · Designed, built and run solo",
  title: "Eva: AI Phone Agent for Australian Trades",
  desc: "An AI phone agent that works through a trade business's lead list in a natural Australian voice. She says she's an AI, sticks to the owner's script and facts, keeps to Australian calling hours and saves a callback for anyone who's keen. Every call leaves a recording, a transcript and a one-line summary.",
  metrics: [
    { v: "941", l: "Automated tests" },
    { v: "17", l: "Voices (8 Australian)" },
    { v: "3", l: "Records per call" },
    { v: "Mon-Sat", l: "AU calling hours" },
  ],
  layers: [
    { k: "Telephony", title: "Real-Time Phone Audio", desc: "Twilio Media Streams over WebSockets carry 8 kHz μ-law audio both ways, reached through a per-call public tunnel link.", tags: ["Twilio", "WebSockets", "μ-law"] },
    { k: "Dialogue", title: "Live Speech-to-Speech Conversation", desc: "A realtime speech model holds the conversation, with one reply budget per turn and per-turn timing to keep replies quick.", tags: ["OpenAI Realtime", "Latency budget"] },
    { k: "Voice", title: "Australian Voices", desc: "Cartesia Sonic with eight curated Australian voices and emotion control, or the model's native voices for the fastest replies.", tags: ["Cartesia Sonic", "Emotion control"] },
    { k: "Guardrails", title: "Script and Fact Guardrails", desc: "A reply guard, objection policy and action guard keep her to the owner's script and facts. She has no prices or promises of her own, and a no ends the call.", tags: ["Reply guard", "Objection policy"] },
    { k: "Compliance", title: "Calling Rules Built In", desc: "Australian telemarketing hours, national public holidays and a do-not-call list that always blocks. She never claims to be a person.", tags: ["AU calling hours", "Do-not-call"] },
    { k: "Call Repair", title: "Unclear Audio and Interruptions", desc: "Confidence-based repair lines when the caller's audio is unclear, and barge-in handling so people can talk over her naturally.", tags: ["Barge-in", "Confidence scoring"] },
    { k: "Records", title: "Records and Callbacks", desc: "A recording, transcript and one-line summary for every call, plus callbacks with an owner, a due time and a done mark, and a signed CRM webhook.", tags: ["FastAPI dashboard", "Signed webhook"] },
  ],
  stack: ["Python", "FastAPI", "Twilio", "OpenAI Realtime", "Cartesia", "WebSockets"],
  links: [{ label: "heareva.com", href: "https://heareva.com" }],
};

/** The three cards under Eva in Flagship Deployments. */
export const flagships = [
  { badge: "Agent Tooling // Open Source", title: "MCP Matchmaker", img: mcp,
    desc: "Discovery platform for Model Context Protocol servers that merges several registries into one searchable index.",
    points: ["Hybrid BM25 + vector search over tools", "8-point security scan per server", "Dependency-aware toolchains and one-paste client configs", "81 tests, pure Python stdlib"],
    tags: ["Python", "MCP", "Hybrid Search"],
    links: [{ label: "Source", href: `${gh}/mcp-matchmaker` }] },
  { badge: "Geospatial AI // Product", title: "AUS Backyard Intelligence", img: backyard,
    desc: "Map platform that ranks Australian homes for pool, fence, deck and landscaping work.",
    points: ["YOLO11 pool detection on satellite imagery", "OpenStreetMap data with state compliance rules", "QGIS 3D exports and honest confidence intervals"],
    tags: ["YOLO11", "GeoPandas", "MapLibre"],
    links: [{ label: "Source", href: `${gh}/aus-backyard-intelligence` }] },
  { badge: "Biometrics // AJCAI 2025", title: "EyeDentify: Blink Biometrics", img: eyedentify,
    desc: "Person identification from eye-blink patterns using novel spatio-temporal templates.",
    points: ["COTI and MITI blink templates", "99.04% accuracy with MobileNetV2", "Published at AJCAI 2025 (Springer)"],
    tags: ["MobileNetV2", "OpenCV", "TensorFlow"],
    links: [{ label: "Paper", href: "https://link.springer.com/chapter/10.1007/978-981-95-4972-6_16" }, { label: "Code", href: `${gh}/eyedentify-blink-biometrics` }] },
];

export const matrixFilters = [["all", "All Systems"], ["ai", "AI / ML"], ["vision", "Computer Vision"], ["research", "Research"], ["apps", "Apps & Tools"]] as const;

/** The Systems Matrix: every other public project. */
export const projects = [
  { cat: "research", tag: "Drones · ICSC 2024", title: "Urban UAV Surveillance",
    desc: "Real-time traffic monitoring and emergency detection with YOLOv8, Gazebo simulation and ORB geo-tagging.",
    stack: ["YOLOv8", "Gazebo", "ROS"], href: "https://link.springer.com/chapter/10.1007/978-981-96-7818-1_35" },
  { cat: "vision", tag: "Deepfake Detection", title: "Deepfake Video Detection",
    desc: "Django web app that classifies uploaded videos as real or deepfake with a GPU deep learning model.",
    stack: ["Django", "Deep learning", "GPU inference"], href: `${gh}/deepfake-video-detection` },
  { cat: "research", tag: "Image Forensics", title: "AI-Generated Image Detection",
    desc: "Detects AI-generated images with gradient-field PCA, PatchCraft heatmaps, spectral analysis and ViT + SVM fusion.",
    stack: ["ViT", "SVM", "Spectral analysis"], href: `${gh}/deepfake-image-detection` },
  { cat: "ai", tag: "Local Voice AI", title: "Jarvis: Offline Voice Assistant",
    desc: "Private voice assistant that runs fully on your computer, with memory, web lookups, Chrome control and MCP tools.",
    stack: ["Local LLM", "Speech", "MCP"], href: `${gh}/jarvis` },
  { cat: "vision", tag: "Smart India Hackathon", title: "Medicinal Plant Identification",
    desc: "CNN, HOG and Random Forest models classify medicinal plants from leaf images, plus a LangChain chatbot.",
    stack: ["CNN", "Random Forest", "LangChain"], href: `${gh}/medicinal-plant-classification` },
  { cat: "vision", tag: "Edge AI", title: "Crop Disease Detector",
    desc: "Browser-camera leaf disease classifier for 17 classes across 5 crops, served by FastAPI with TFLite models.",
    stack: ["FastAPI", "TensorFlow Lite", "Docker"], href: `${gh}/crop-disease-detector` },
  { cat: "ai", tag: "Multimodal", title: "Multimodal Emotion Recognition",
    desc: "Fuses vocal pitch, facial expression and text sentiment to give teachers feedback on virtual classes.",
    stack: ["CNN-LSTM", "Keras", "NLTK"], href: `${gh}/multimodal-emotion-recognition` },
  { cat: "ai", tag: "Health ML", title: "Symptom-Disease Prediction",
    desc: "Ensemble model that predicts 20 diseases from symptoms, with clinical rule adjustments and patient history.",
    stack: ["Ensembles", "Scikit-Learn"], href: `${gh}/symptom-disease-prediction` },
  { cat: "apps", tag: "Matching", title: "Student Roommate Matching",
    desc: "Flask app that matches student roommates by survey similarity while respecting gender preferences.",
    stack: ["Flask", "Similarity scoring"], href: "https://roommate-matching-usyd.vercel.app" },
  { cat: "apps", tag: "Learning", title: "Fieldnotes Learning Studio",
    desc: "Offline studio for Python, DSA, SQL, AI and data engineering with 114 practice problems that run in the browser.",
    stack: ["JavaScript", "In-browser runner", "Offline-first"], href: "https://shreyashw32.github.io/fieldnotes/" },
  { cat: "apps", tag: "Security", title: "Security Quiz Portal",
    desc: "Practice and mock-exam portal with 95 questions for a university security course, with explanations and stats.",
    stack: ["JavaScript", "Progress stats"], href: "https://shreyashw32.github.io/security-quiz/" },
];

export const experience = [
  { role: "Research Student (Artificial Intelligence)", org: "University of Sydney", place: "Sydney, NSW", date: "Mar 2025 - Present",
    points: ["Deep learning for medical image analysis, improving Dice score by 12%.", "Benchmarked U-Net and DeepLabV3+ for robustness and inference efficiency.", "Cross-validation pipelines tracking IoU, F1, precision-recall and ROC."] },
  { role: "AI Engineer (Team Lead)", org: "The Modern Group", place: "Sydney, NSW", date: "Jun 2025 - Dec 2025",
    points: ["LLM systems with RAG and vector retrieval, +30% retrieval accuracy.", "Real-time inference APIs on Firebase and GCP, −40% deployment time.", "ETL pipelines and analytics workflows for 100K+ records."] },
  { role: "Associate Prompt Engineer", org: "NVIDIA", place: "Santa Clara, CA (Remote)", date: "Oct 2024 - Dec 2024",
    points: ["Enterprise prompt frameworks improving LLM precision by 22%.", "A/B testing across transformer models.", "Automated prompt evaluation and NLP benchmarking pipelines."] },
  { role: "Team Member", org: "Team Automatons (Robocon)", place: "Pune, India", date: "Mar 2021 - Jan 2022",
    points: ["ABU Robocon: ROS, Arduino, sensor interfacing and image processing."] },
];

export const impact = [
  { v: "99.04%", l: "Blink biometric accuracy", d: "NTHU-DDD, MobileNetV2 + COTI/MITI. AJCAI 2025." },
  { v: "94.78%", l: "Unconstrained blink classification", d: "UTA-RLDD spatio-temporal approach." },
  { v: "90%+", l: "Crop disease detection", d: "CNN + Random Forest on HOG features." },
  { v: "₹1L", l: "FIAT Scholar Award", d: "TATA Trusts / FIAT India academic scholarship." },
  { v: "Top 20", l: "National robotics finalist", d: "RoboKidz Soccer Bot Competition." },
  { v: "3", l: "Published papers", d: "AJCAI 2025, ICSC 2024 (Springer), IJSART." },
];

export const publications = [
  { title: "EyeDentify: non-invasive person identification via blink patterns", venue: "AJCAI 2025 · Springer", href: "https://link.springer.com/chapter/10.1007/978-981-95-4972-6_16" },
  { title: "Integrating UAVs, AI Vision and IoT for Smart Drone Surveillance", venue: "ICSC 2024 · Springer", href: "https://link.springer.com/chapter/10.1007/978-981-96-7818-1_35" },
  { title: "Intelligent Auto Traffic Signal Controller", venue: "IJSART", href: "https://ijsart.com/Content/PDFDocuments/IJSARTV7I850543.pdf" },
];

export const skills = [
  { group: "GenAI & LLMs", items: ["OpenAI API", "Realtime Voice", "RAG Pipelines", "Prompt Engineering", "Embeddings", "Vector Databases", "LLM Evaluation", "Transformers"] },
  { group: "Languages", items: ["Python", "C/C++", "SQL", "TypeScript", "HTML & CSS"] },
  { group: "AI & Data", items: ["PyTorch", "TensorFlow", "OpenCV", "LangChain", "Scikit-Learn", "NLTK", "Pandas"] },
  { group: "Tools & Platforms", items: ["FastAPI", "Twilio", "ROS", "Gazebo", "YOLO", "Flask & Django", "GCP", "Firebase", "Docker", "Git"] },
];

export const certs = ["TensorFlow Developer Professional Certificate", "Deep Learning Specialization", "LangChain Application Development", "Object Detection Web Apps (TensorFlow/OpenCV)", "Quant Modelling (JP Morgan / Forage)"];
