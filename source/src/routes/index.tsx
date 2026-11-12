import { createFileRoute } from "@tanstack/react-router";
import { Home } from "@/components/home";
import { links } from "@/data/profile";

// The public address. Share previews and the canonical link point here wherever the site is hosted.
const SITE = "https://shreyashw32.github.io/shreyash_portfollio/";

const personLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Shreyash Wetal",
  url: SITE,
  image: `${SITE}shreyash_portrait.jpg`,
  jobTitle: "AI & Computer Vision Engineer",
  description: "AI engineer in Sydney building LLM, RAG and computer vision systems.",
  address: { "@type": "PostalAddress", addressLocality: "Sydney", addressRegion: "NSW", addressCountry: "AU" },
  affiliation: { "@type": "CollegeOrUniversity", name: "University of Sydney" },
  knowsAbout: ["Large language models", "Retrieval-augmented generation", "Computer vision", "Deep learning"],
  sameAs: [links.github, links.linkedin],
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Shreyash Wetal | AI & Computer Vision Engineer" },
      { name: "description", content: "AI engineer in Sydney building LLM, RAG and computer vision systems. Ex-NVIDIA prompt engineer, USyd researcher, 3 published papers." },
      { property: "og:title", content: "Shreyash Wetal | AI & Computer Vision Engineer" },
      { property: "og:description", content: "LLMs, RAG pipelines and real-time computer vision, from research to production." },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Shreyash Wetal" },
      { property: "og:locale", content: "en_AU" },
      { property: "og:url", content: SITE },
      { property: "og:image", content: `${SITE}og-image.jpg` },
      { property: "og:image:type", content: "image/jpeg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Shreyash Wetal, AI and Computer Vision Engineer in Sydney" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Shreyash Wetal | AI & Computer Vision Engineer" },
      { name: "twitter:description", content: "LLMs, RAG pipelines and real-time computer vision, from research to production." },
      { name: "twitter:image", content: `${SITE}og-image.jpg` },
      { name: "twitter:image:alt", content: "Shreyash Wetal, AI and Computer Vision Engineer in Sydney" },
    ],
    links: [{ rel: "canonical", href: SITE }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(personLd) }],
  }),
  component: Home,
});
