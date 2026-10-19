export interface BlogPost {
  slug: string;
  title: string;
  subtitle: string;
  excerpt: string;
  publishedAt: string;
  readingTimeMinutes: number;
  category: "Continuity Framework" | "M2M Economy" | "System Design" | "Governance";
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  keyTakeaway: string;
  law0Alignment: string;
  content: string[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "why-not-to-fear-the-machine",
    title: "Why Not to Fear the Machine: Turning AI from an Ambient Threat into Governed Consequence",
    subtitle: "How the Continuity Framework bridges generations: welcoming young innovators and reassuring legacy stewards by eliminating the 'blank check'.",
    excerpt: "Fear of AI is not fear of computation; it is fear of uncontrolled, unaccountable consequence. When machines operate under mathematical boundaries, single-use leases, and verifiable physical evidence, fear evaporates into productive mastery.",
    publishedAt: "2026-10-19",
    readingTimeMinutes: 6,
    category: "Continuity Framework",
    author: {
      name: "The Veklom Lab",
      role: "Continuity Systems Architecture",
      avatar: "/brand/avatar-lab.png"
    },
    keyTakeaway: "A machine can know what to do and still not be allowed to do it. When authority is separated from computational possession, AI becomes as safe and predictable as a municipal power grid.",
    law0Alignment: "Law 0: Computational Possession ≠ Consequence Authority (ΔC = 0 until explicit cryptographic lease is validated at the physical sink).",
    content: [
      "There is a palpable tension dividing generations today when looking at autonomous artificial intelligence. To the younger generation, models are an exhilarating, boundless canvas of creation—an awakening to what is possible when humans and machines co-create. But to the older generation—the engineers, executives, and public servants who built our critical infrastructure—AI looks like an ambient, unaccountable risk: a rogue script capable of silently wiring away millions of dollars, deleting production databases, or generating fake compliance reports in seconds.",
      "Both generations are looking at the exact same reality, but through different lenses. The older generation is not afraid of intelligence; they are terrified of consequence without accountability. They know that in every human enterprise, authority is earned, bounded, and audited.",
      "This is where the Continuity Framework changes everything. Veklom does not try to 'align' AI through prompt whispering or probabilistic hope. Instead, it introduces a physical, non-negotiable law at the execution sink:",
      "Computational Possession does not imply Consequence Authority.",
      "An LLM or autonomous agent may write an email, formulate a Python pipeline, or generate an architectural blueprint. That is purely computational possession. But until an explicit, single-use capability lease is signed by a human steward or policy governor, the machine's ability to mutate physical reality is clamped to ΔC = 0.",
      "When you separate the brain from the hands, you don't cripple the machine—you unleash it. Enterprise organizations can allow agents to run thousands of speculative simulations, plan graphs, and code drafts in complete peace of mind, knowing that nothing can touch a database, a bank balance, or an external API without an unforgeable cryptographic permit.",
      "This rejuvenates legacy software. Instead of ripping out 30-year-old COBOL or core SQL databases for $300M migration projects, organizations place Veklom's Consequence Firewall in front of them. The legacy system gains modern agentic power without sacrificing the bedrock safety that keeps society running.",
      "The future is not something to run away from. It is something to dial in with mathematical certainty."
    ]
  },
  {
    slug: "the-12-governed-computes",
    title: "The 12 Governed Computes: From Capability to Consequence in the Machine-to-Machine Economy",
    subtitle: "A deep dive into the 12 bedrock contracts that enable autonomous agents to transact, compute, and collaborate safely.",
    excerpt: "The emerging machine-to-machine (M2M) economy cannot rely on human credit cards or ambient cloud keys. It requires 12 governed computes that turn speculative agent plans into verifiable real-world value.",
    publishedAt: "2026-10-18",
    readingTimeMinutes: 7,
    category: "M2M Economy",
    author: {
      name: "Autonomous Continuity Lab",
      role: "M2M Infrastructure Research",
      avatar: "/brand/avatar-lab.png"
    },
    keyTakeaway: "Every transaction in the M2M economy requires five phases: discovery, mounting, authority minting, execution, and dual-state receipt preservation.",
    law0Alignment: "Transport Failure ≠ Authority Expansion. Network drops halt pipelines at OUTCOME_UNCERTAIN without double-execution.",
    content: [
      "When machines trade with machines, who is liable when a message drops? If an AI purchases GPU hours from an autonomous cluster, how does the seller verify that the payment is settled before rendering compute, without stalling the pipeline for minutes?",
      "In Veklom, this is solved not by another centralized SaaS platform, but by the 12 Governed Computes:",
      "1. RepoGate Scan: Governed code inspection verifying evidence readiness before deployment.\n2. Build Blueprint: Multi-tier intent compiler turning natural language into verified plan graphs.\n3. Security Audit: Continuous policy evaluation catching privilege escalation in real time.\n4. API Discovery: Beacon-driven capability search without assuming discovery confers authority.\n5. MCP Publish: Preparing tools and skills for governed Model Context Protocol registries.\n6. Capability Mount: Binding adapters, harnesses, and schemas into an isolated sandbox.\n7. Blueprint Workspace: Visualizing the execution DAG and stage latencies before execution.\n8. Harness Adapter: Sandboxed boundary translating abstract operations into low-level calls.\n9. Evidence Vault: Immutable PGL event anchoring with SHA-256 hash chains.\n10. Settlement Engine: Native x402 micropayments enforcing zero unpaid compute units.\n11. Tracker: Continuous causal drift detection comparing intent to physical readback.\n12. Private Cloud: Computeless placement placing governed workloads beside physical data.",
      "Together, these 12 computes form the operating system for the autonomous economy. They allow autonomous agents from different companies, clouds, and countries to collaborate without trust—because trust is replaced by cryptographic proof."
    ]
  },
  {
    slug: "death-of-the-blank-check-auditing",
    title: "The Death of the Blank Check: Why Post-Mortem Audits Are Obsolete and How Dual-Track Evidence Wins",
    subtitle: "Moving beyond 500-page SOC2 PDF theater into real-time, human-understandable and machine-reproducible GraphQL audit receipts.",
    excerpt: "90% of compliance audits examine logs months after the damage was done. The new EU AI Act and ISO 42001 demand real-time gatekeeping and mathematical dual-state receipts.",
    publishedAt: "2026-10-17",
    readingTimeMinutes: 5,
    category: "Governance",
    author: {
      name: "Governance & Evidence Working Group",
      role: "Veklom Compliance Standards",
      avatar: "/brand/avatar-lab.png"
    },
    keyTakeaway: "An audit trail is worthless if humans cannot understand what happened or machines cannot verify the proof. Dual-track evidence satisfies both.",
    law0Alignment: "Sink-level defense-in-depth: Every consequence records state_before, state_after, and proof_hash. On rejection, ΔC = 0.",
    content: [
      "For twenty years, enterprise software compliance has been governed by 'post-mortem audit theater'. An engineer exports thousands of JSON logs into a zip file, an external accounting firm samples twelve rows, and a static SOC2 Type II PDF is stamped. Six months later, a leaked credential or rogue script causes an uninspected data breach.",
      "With autonomous AI agents executing thousands of actions per minute, post-mortem audits are completely dead. If an agent executes an unauthorized trade or alters a healthcare record, finding out three months later during a quarterly audit is unacceptable.",
      "Veklom enforces the Dual-Track Evidence Protocol:",
      "Track 1: Human-Understandable Packet. An executive, judge, or auditor can open the Evidence Vault and immediately see four plain-English answers: What was promised? Who approved? What was delivered? What changed?",
      "Track 2: Machine-Side GraphQL Engine. An automated compliance bot, regulatory crawler, or WebMCP agent can submit a single GraphQL query to `/api/graphql` and mathematically verify the cryptographic signature, the monotonic epoch progression, and the dual-state consequence hash.",
      "This is how Veklom aligns with the world's strictest regulatory standards—including EU AI Act Articles 12, 14, and 72, ISO/IEC 42001, and the NIST AI RMF—not as an afterthought, but as the foundational architecture of every API call."
    ]
  }
];
