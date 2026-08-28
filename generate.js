const fs = require('fs');
const path = require('path');

const pages = [
  { path: 'docs', title: 'Documentation', desc: 'Product setup and integration documentation.', content: `<p>Veklom’s public demo may show backend demo-harness behavior unless explicitly marked canonical-evidence-backed.</p><h3>GitHub App Installation</h3><p>Guide to installing...</p>` },
  { path: 'support', title: 'Support', desc: 'Support contact page for GitHub review and customers.', content: `<p>For product, installation, account, Marketplace, or GitHub App support, contact <a href="mailto:support@veklom.com">support@veklom.com</a>. For suspected security issues, credential exposure, webhook abuse, or vulnerability reports, contact <a href="mailto:security@veklom.com">security@veklom.com</a>.</p>` },
  { path: 'privacy', title: 'Privacy Policy', desc: 'Privacy notice.', content: `<p>Veklom does not require storing full source code contents by default.</p>` },
  { path: 'terms', title: 'Terms of Service', desc: 'Terms of Service users agree to.', content: `<p>GitHub OAuth, Device Flow, installation access, or repository access does not by itself authorize consequence-bearing actions. Repository writes, workflow dispatches, deployments, and other consequential operations remain subject to Veklom governance, policy, tenant authority, and evidence controls.</p>` },
  { path: 'security', title: 'Security Policy', desc: 'Security policy.', content: `<p>Do not submit secrets, private keys, access tokens, refresh tokens, installation tokens, or production credentials in public issues, screenshots, chats, or pull requests.</p>` },
  { path: 'status', title: 'System Status', desc: 'Operational status.', content: `<p>This page is manually maintained unless otherwise stated.</p>` },
  { path: 'acceptable-use', title: 'Acceptable Use Policy', desc: 'User conduct and prohibited uses.', content: `<p>No illegal activity, no credential theft, no malware...</p>` },
  { path: 'cookies', title: 'Cookie Policy', desc: 'Cookie/session notice.', content: `<p>We use essential cookies including the veklom_session HTTP-only cookie and GitHub OAuth state cookies.</p>` },
  { path: 'dpa', title: 'Data Processing Addendum', desc: 'Data Processing Addendum for enterprise/global buyers.', content: `<p>Standard controller/processor roles...</p>` },
  { path: 'subprocessors', title: 'Subprocessors', desc: 'List of authorized third-party service providers.', content: `<p>Veklom engages the following subprocessors. We do not invent vendors or share data unnecessarily.</p><ul><li>GitHub - OAuth, Device Flow, App installation</li><li>Cloudflare - DNS, edge routing</li></ul>` },
];

pages.forEach(p => {
  const dir = path.join(__dirname, 'app', p.path);
  fs.mkdirSync(dir, { recursive: true });
  
  const fileContent = `
import { PageHeader } from "@/components/ui/SharedUI";

export const metadata = { title: \`${p.title} | Veklom\` };

export default function Page() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16 w-full">
      <PageHeader title="${p.title}" description="${p.desc}" />
      <div className="prose prose-invert max-w-none text-theme-inkDim mt-8 [&>h3]:text-theme-ink [&>h3]:mb-2 [&>h3]:mt-8 [&>p]:mb-4" dangerouslySetInnerHTML={{ __html: \`${p.content}\` }} />
    </div>
  );
}
  `.trim();
  fs.writeFileSync(path.join(dir, 'page.tsx'), fileContent);
});

console.log("Pages generated successfully.");
