# AffiliateOS v2.0 - Agent Architecture

## Core Agents

### 1. Research Agent
**Purpose:** Scrapes the web and performs SERP analysis using Google Search Grounding to extract entities, topic clusters, LSI keywords, and competitor gaps.
**Trigger:** Start of campaign pipeline.
**Output:** Semantic intelligence JSON payload representing the 'truth' of the keyword.

### 2. SEO Writer & Copy-Monetizer Agent
**Purpose:** Drafts high-conversion, SEO-optimized pillar and cluster content based on research payload. Automatically identifies insertion contexts to place relevant affiliate links.
**Trigger:** After research phase.
**Output:** Structured markdown and raw HTML for web publishing.

### 3. Pinterest Swarm Agent
**Purpose:** Extrapolates engaging 'pin concepts' from the generated text, focusing on psychographic triggers (e.g., curiosity gaps, listicles). Writes 5-10 pin descriptions.
**Trigger:** After article draft completion.
**Output:** JSON schema of pin concepts, metadata, and optimized descriptions.

### 4. Image Generation Agent
**Purpose:** Converts the abstract wireframe concepts from the Pinterest Swarm engine into vivid prompts, rendering high-CTR imagery via the Imagen API.
**Trigger:** Triggered sequentially for each pin concept.
**Output:** Public CDN URLs for image assets.

### 5. Programmatic SEO Cluster Engine (Planned)
**Purpose:** Expand a single semantic node into an entire topical map of 20+ interconnecting articles (Pillar, Review, Comparsion).

### 6. Revenue Intelligence & Telemetry Agent
**Purpose:** Observes user interactions (Clicks, conversions) via postbacks, matches them to the origin Campaign Job ID, and computes EPC, CTR, ROI. Identifies top performing clusters and formats.
**Insights Generation:** Nightly cron jobs execute the Agent to identify statistically significant outliers and recommend adjustments.
