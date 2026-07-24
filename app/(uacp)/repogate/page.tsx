'use client';

export default function RepoGatePage() {
  // Use environment variable for standalone host URL.
  // Default to a placeholder if not set to prevent crashing, but display a warning to the user.
  const repoGateUrl = process.env.NEXT_PUBLIC_REPOGATE_URL;

  if (!repoGateUrl) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white font-mono p-8">
        <div className="max-w-2xl text-center space-y-6">
          <h1 className="text-3xl font-bold text-red-500">Standalone Host Missing</h1>
          <p className="text-gray-400">
            The Repo Gate has been successfully isolated to a standalone host architecture.
          </p>
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded text-left mt-4 space-y-4">
            <h2 className="text-xl font-bold text-white mb-2">Next Steps:</h2>
            <ol className="list-decimal pl-5 space-y-2 text-gray-300">
              <li>The <code className="bg-black px-1.5 py-0.5 rounded text-green-400">repogate</code> repository is deployed as a standalone Vite project on your Hetzner Coolify node.</li>
              <li>Ensure the Coolify proxy routes its domain (e.g., <code>https://repogate.veklom.com</code>).</li>
              <li>Add <code className="bg-black px-1.5 py-0.5 rounded text-blue-400">NEXT_PUBLIC_REPOGATE_URL</code> as an environment variable in the Control Plane Coolify settings, pointing to the live URL.</li>
              <li>Force deploy the Control Plane container in Coolify to apply the env var.</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-black overflow-hidden relative">
      <iframe
        src={repoGateUrl}
        className="w-full h-full border-none absolute top-0 left-0"
        title="Veklom Repo Gate Standalone"
        allow="clipboard-write; clipboard-read"
      />
    </div>
  );
}
