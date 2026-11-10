import mcp from "@/assets/mcp.webp";
import backyard from "@/assets/backyard.webp";
import eyedentify from "@/assets/eyedentify.webp";
import uav from "@/assets/uav.webp";
import plants from "@/assets/plants.jpg";
import crop from "@/assets/crop.jpg";
import emotion from "@/assets/emotion.jpg";

const gh = "https://github.com/ShreyashW32";

export const links = {
  github: gh,
  linkedin: "https://www.linkedin.com/in/shreyash-w-388bb4223/",
  email: "shreyash.wetal03@gmail.com",
  phone: "+61 0451507744",
  cv: "/Shreyash_Wetal_CV.pdf",
};

export const projects = [
  { cat: "llm", tag: "Agent tooling", title: "MCP Matchmaker", img: mcp, flagship: true,
    desc: "Discovery platform for Model Context Protocol servers. Merges several registries, ranks tools with hybrid BM25 + vector search, runs an 8-point security scan, resolves dependencies into toolchains and generates one-paste configs for Claude Desktop, Cursor and more.",
    stack: ["Python", "Hybrid Search", "MCP", "Security Scanning", "81 tests"],
    links: [{ label: "Source", href: `${gh}/mcp-matchmaker` }] },
  { cat: "vision", tag: "Geospatial AI", title: "AUS Backyard Intelligence", img: backyard, flagship: true,
    desc: "Map platform ranking Australian homes for pool, fence, deck and landscaping work. Combines OpenStreetMap with YOLO pool detection on satellite imagery, state compliance rules and QGIS 3D exports, with honest confidence intervals.",
    stack: ["YOLO11", "GeoPandas", "MapLibre", "QGIS", "Playwright"],
    links: [{ label: "Source", href: `${gh}/aus-backyard-intelligence` }] },
  { cat: "research", tag: "Biometrics · AJCAI 2025", title: "EyeDentify: Blink Biometrics", img: eyedentify,
    desc: "Person identification from blink patterns using novel COTI and MITI templates, reaching 99.04% accuracy with MobileNetV2.",
    stack: ["MobileNetV2", "OpenCV", "TensorFlow"],
    links: [{ label: "Paper", href: "https://link.springer.com/chapter/10.1007/978-981-95-4972-6_16" }, { label: "Code", href: `${gh}/eyedentify-blink-biometrics` }] },
  { cat: "research", tag: "Drones · ICSC 2024", title: "Urban UAV Surveillance", img: uav,
    desc: "Real-time traffic monitoring and emergency detection with YOLOv8, Gazebo simulation and ORB geo-tagging.",
    stack: ["YOLOv8", "Gazebo", "ROS", "GDAL"],
    links: [{ label: "Paper", href: "https://link.springer.com/chapter/10.1007/978-981-96-7818-1_35" }] },
  { cat: "vision", tag: "Smart India Hackathon", title: "Medicinal Plant Identification", img: plants,
    desc: "CNN, HOG and Random Forest models classify medicinal plants from leaves, plus a LangChain chatbot.",
    stack: ["CNN", "Random Forest", "LangChain", "Firebase"],
    links: [{ label: "Code", href: `${gh}/medicinal-plant-classification` }] },
  { cat: "vision", tag: "Edge AI", title: "Crop Disease Detector", img: crop,
    desc: "Browser-camera leaf disease classifier: 17 classes, served by FastAPI with float and int8 TFLite models.",
    stack: ["FastAPI", "TensorFlow Lite", "Docker"],
    links: [{ label: "Code", href: `${gh}/crop-disease-detector` }] },
  { cat: "llm", tag: "Multimodal", title: "Multimodal Emotion Recognition", img: emotion,
    desc: "Fuses vocal pitch, facial expression and text sentiment to give teachers feedback on virtual classes.",
    stack: ["CNN-LSTM", "Keras", "NLTK", "Flask"],
    links: [{ label: "Code", href: `${gh}/multimodal-emotion-recognition` }] },
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
  { group: "GenAI & LLMs", items: ["OpenAI API", "RAG Pipelines", "Prompt Engineering", "Embeddings", "Vector Databases", "LLM Evaluation", "Transformers"] },
  { group: "Languages", items: ["Python", "C/C++", "SQL", "HTML & CSS"] },
  { group: "AI & Data", items: ["TensorFlow", "OpenCV", "LangChain", "Scikit-Learn", "NLTK", "Pandas", "Gensim"] },
  { group: "Tools & Platforms", items: ["ROS", "Gazebo", "YOLOv8", "Flask & Django", "GCP", "Firebase", "REST APIs", "CI/CD", "Git"] },
];

export const certs = ["TensorFlow Developer Professional Certificate", "Deep Learning Specialization", "LangChain Application Development", "Object Detection Web Apps (TensorFlow/OpenCV)", "Quant Modelling (JP Morgan / Forage)"];
