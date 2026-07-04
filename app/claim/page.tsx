'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
const Card = ({children, className}: any) => <div className={`border rounded-lg p-4 bg-zinc-900 ${className}`}>{children}</div>;
const CardHeader = ({children, className}: any) => <div className={`mb-4 ${className}`}>{children}</div>;
const CardTitle = ({children, className}: any) => <h3 className={`text-xl font-bold ${className}`}>{children}</h3>;
const CardDescription = ({children, className}: any) => <p className={`text-sm text-zinc-400 ${className}`}>{children}</p>;
const CardContent = ({children, className}: any) => <div className={className}>{children}</div>;
const Button = ({children, className, ...props}: any) => <button className={`px-4 py-2 rounded-md font-medium flex items-center justify-center ${className}`} {...props}>{children}</button>;
const Input = (props: any) => <input className={`border rounded-md px-3 py-2 w-full text-white bg-zinc-950 ${props.className}`} {...props} />;
const Alert = ({children, className}: any) => <div className={`p-4 rounded-md border ${className}`}>{children}</div>;
const AlertTitle = ({children, className}: any) => <h4 className={`font-bold mb-1 ${className}`}>{children}</h4>;
const AlertDescription = ({children, className}: any) => <div className={`text-sm ${className}`}>{children}</div>;
const Label = ({children, className, ...props}: any) => <label className={`block text-sm font-medium ${className}`} {...props}>{children}</label>;
const useToast = () => ({ toast: (props: any) => console.log(props.title + ": " + props.description) });
import { Loader2, ShieldCheck, Search, Copy, CheckCircle2 } from 'lucide-react';

export default function ClaimProviderPage() {
  const [apiDid, setApiDid] = useState('');
  const [domain, setDomain] = useState('');
  const [claimId, setClaimId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [status, setStatus] = useState<'idle' | 'pending' | 'verified' | 'failed'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  
  const { toast } = useToast();

  const handleGenerateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiDid || !domain) return;
    
    setLoading(true);
    setErrorMsg('');
    try {
      // Create claim via our backend API
      const res = await api.post('/claims/request', {
        api_did: apiDid,
        domain_name: domain
      });
      
      setClaimId(res.claim_id);
      setStatus('pending');
      toast({
        title: 'Challenge Generated',
        description: 'Please add the DNS TXT record to verify ownership.',
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate claim challenge');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!claimId) return;
    
    setVerifying(true);
    setErrorMsg('');
    try {
      const res = await api.post(`/claims/verify/${claimId}`);
      if (res.verified) {
        setStatus('verified');
        toast({
          title: 'Verification Successful',
          description: 'You are now the certified owner of this API.',
        });
      } else {
        setStatus('failed');
        setErrorMsg('DNS record not found or mismatched. Propagation may take a few minutes.');
      }
    } catch (err: any) {
      setStatus('failed');
      setErrorMsg(err.message || 'Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Copied to clipboard',
    });
  };

  return (
    <div className="min-h-screen bg-black text-zinc-300 p-8 flex justify-center">
      <div className="max-w-2xl w-full space-y-8">
        
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
            <ShieldCheck className="text-orange-500 h-8 w-8" />
            VNP Provider Claim
          </h1>
          <p className="text-zinc-500 mt-2">
            Verify ownership of your API to unlock the provider dashboard and authoritative VNP Badges.
          </p>
        </div>

        {status === 'idle' && (
          <Card className="bg-zinc-900 border-zinc-800 text-white">
            <CardHeader>
              <CardTitle>Initiate Ownership Claim</CardTitle>
              <CardDescription>Enter your API's DID and the domain you control to generate a verification challenge.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerateClaim} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="apiDid">API DID</Label>
                  <Input 
                    id="apiDid" 
                    placeholder="did:vnp:api:..." 
                    value={apiDid} 
                    onChange={(e) => setApiDid(e.target.value)}
                    className="bg-zinc-950 border-zinc-800"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="domain">Provider Domain</Label>
                  <Input 
                    id="domain" 
                    placeholder="example.com" 
                    value={domain} 
                    onChange={(e) => setDomain(e.target.value)}
                    className="bg-zinc-950 border-zinc-800"
                    required
                  />
                  <p className="text-xs text-zinc-500">We will check this domain for a specific TXT record.</p>
                </div>

                {errorMsg && (
                  <Alert variant="destructive" className="bg-zinc-950 border-red-900">
                    <AlertDescription>{errorMsg}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                  Generate Challenge
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {(status === 'pending' || status === 'failed') && (
          <Card className="bg-zinc-900 border-zinc-800 text-white">
            <CardHeader>
              <CardTitle>DNS Verification Required</CardTitle>
              <CardDescription>Add the following TXT record to your domain's DNS settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="space-y-4">
                <div>
                  <Label className="text-zinc-400">Host / Name</Label>
                  <div className="flex mt-1">
                    <code className="flex-1 p-2 bg-zinc-950 border border-zinc-800 rounded-l text-sm font-mono overflow-x-auto">
                      _vnp-claim.{claimId}.{domain}
                    </code>
                    <Button variant="outline" className="rounded-l-none border-l-0 border-zinc-800 bg-zinc-900 hover:bg-zinc-800" onClick={() => copyToClipboard(`_vnp-claim.${claimId}.${domain}`)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-zinc-400">Record Type</Label>
                  <div className="mt-1 p-2 bg-zinc-950 border border-zinc-800 rounded text-sm font-mono inline-block">
                    TXT
                  </div>
                </div>

                <div>
                  <Label className="text-zinc-400">Value</Label>
                  <div className="flex mt-1">
                    <code className="flex-1 p-2 bg-zinc-950 border border-zinc-800 rounded-l text-sm font-mono overflow-x-auto">
                      vnp-verification={claimId}
                    </code>
                    <Button variant="outline" className="rounded-l-none border-l-0 border-zinc-800 bg-zinc-900 hover:bg-zinc-800" onClick={() => copyToClipboard(`vnp-verification=${claimId}`)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {errorMsg && (
                <Alert variant="destructive" className="bg-zinc-950 border-red-900 text-red-400">
                  <AlertDescription>{errorMsg}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-4 pt-4 border-t border-zinc-800">
                <Button variant="outline" onClick={() => setStatus('idle')} className="bg-transparent border-zinc-700 text-zinc-300">
                  Cancel
                </Button>
                <Button onClick={handleVerify} className="flex-1 bg-green-600 hover:bg-green-700" disabled={verifying}>
                  {verifying ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                  Verify DNS Record
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {status === 'verified' && (
          <Card className="bg-zinc-900 border-zinc-800 text-white text-center py-8">
            <CardContent className="space-y-6">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
              <div>
                <h2 className="text-2xl font-bold mb-2">Ownership Verified</h2>
                <p className="text-zinc-400">
                  Domain <span className="font-mono text-white">{domain}</span> has been successfully linked to <span className="font-mono text-white">{apiDid}</span>.
                </p>
              </div>
              <Button onClick={() => window.location.href = `/provider/${apiDid}`} className="bg-orange-600 hover:bg-orange-700 mt-4">
                Go to Provider Dashboard
              </Button>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
