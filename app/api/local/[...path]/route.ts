import { NextRequest, NextResponse } from 'next/server';
import { checkOllamaHealth, executeCAPIInvocation } from '../../../../server/capi-engine';
import { compileAbideBlueprint } from '../../../../server/abide-planner';
import { INITIAL_SKILLS_REGISTRY, scanSkillSecurity } from '../../../../server/repogate-scanner';
import { generateX402Offer, listActiveLeases, evictLease } from '../../../../server/x402-engine';
import { CAPIInvocationRequest, HarnessProvider, SkillSpec, SystemMode } from '../../../../types';

interface CapiRequestBody {
  skillId?: string;
  harness?: HarnessProvider;
  parameters?: Record<string, unknown>;
  humanRequester?: string;
  mode?: SystemMode;
  customModel?: string;
  ollamaEndpoint?: string;
  containsPii?: boolean;
  quebecLaw25Compliance?: boolean;
  x402Token?: string;
}

interface OfferRequestBody {
  skillId?: string;
  basePrice?: number;
  concurrentAgents?: number;
  resourceLoad?: number;
}

interface IntakeRequestBody {
  skillCodeOrManifest?: string;
  name?: string;
  description?: string;
  category?: SkillSpec['category'];
  author?: string;
}

interface LeaseEvictionRequestBody {
  leaseId?: string;
}

let skillsRegistry = [...INITIAL_SKILLS_REGISTRY];

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unexpected local control-plane failure';
}

export async function GET(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path: pathParts } = await context.params;
  const fullPath = pathParts.join('/');

  if (fullPath === 'ollama/status') {
    const url = new URL(req.url);
    const endpoint = url.searchParams.get('endpoint') || process.env.OLLAMA_URL || 'http://167.233.202.195:11434';
    const status = await checkOllamaHealth(endpoint);
    return NextResponse.json(status);
  }

  if (fullPath === 'x402/leases') {
    return NextResponse.json(listActiveLeases());
  }

  if (fullPath === 'skills') {
    return NextResponse.json(skillsRegistry);
  }

  return NextResponse.json({ error: 'Not Found' }, { status: 404 });
}

export async function POST(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path: pathParts } = await context.params;
  const fullPath = pathParts.join('/');

  if (fullPath === 'capi/invoke') {
    try {
      const body = (await req.json()) as CapiRequestBody;
      const { skillId, harness, parameters, humanRequester, mode, customModel, ollamaEndpoint, containsPii, quebecLaw25Compliance, x402Token } = body;
      if (!skillId || !harness) {
        return NextResponse.json({ error: 'Missing required fields: skillId, harness' }, { status: 400 });
      }

      const request: CAPIInvocationRequest = {
        skillId,
        harness,
        parameters: parameters || {},
        humanRequester: humanRequester || 'reprewindai@gmail.com',
        mode: mode || 'production',
        customModel,
        ollamaEndpoint,
        containsPii,
        quebecLaw25Compliance,
        x402Token
      };
      return NextResponse.json(await executeCAPIInvocation(request));
    } catch (error: unknown) {
      console.error('[cAPI Error]', error);
      return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
    }
  }

  if (fullPath === 'x402/offer') {
    const body = (await req.json()) as OfferRequestBody;
    if (!body.skillId) {
      return NextResponse.json({ error: 'Missing required field: skillId' }, { status: 400 });
    }

    const offer = generateX402Offer(body.skillId, body.basePrice, body.concurrentAgents, body.resourceLoad);
    return NextResponse.json(offer, { status: 402 });
  }

  if (fullPath === 'x402/evict') {
    const body = (await req.json()) as LeaseEvictionRequestBody;
    if (!body.leaseId) {
      return NextResponse.json({ error: 'Missing required field: leaseId' }, { status: 400 });
    }
    const evicted = evictLease(body.leaseId);
    return NextResponse.json({
      success: evicted,
      leaseId: body.leaseId,
      message: evicted ? 'Lease evicted successfully' : 'Lease not found'
    });
  }

  if (fullPath === 'abide/plan') {
    try {
      const body = (await req.json()) as { rawIntent?: string };
      if (!body.rawIntent) {
        return NextResponse.json({ error: 'Missing required field: rawIntent' }, { status: 400 });
      }
      return NextResponse.json(await compileAbideBlueprint(body.rawIntent));
    } catch (error: unknown) {
      return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
    }
  }

  if (fullPath === 'skills/intake') {
    try {
      const body = (await req.json()) as IntakeRequestBody;
      if (!body.skillCodeOrManifest || !body.name) {
        return NextResponse.json({ error: 'Missing required skillCodeOrManifest or name' }, { status: 400 });
      }

      const skillId = `skill-${body.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`;
      const securityScan = scanSkillSecurity(body.skillCodeOrManifest, skillId);

      if (!securityScan.passed) {
        return NextResponse.json({
          success: false,
          securityScan,
          error: 'RepoGate Security Scan Rejected Skill due to AST threat'
        }, { status: 422 });
      }

      const newSkill: SkillSpec = {
        id: skillId,
        name: body.name,
        version: '1.0.0',
        description: body.description || 'User-imported ECC skill specification',
        category: body.category || 'code-gen',
        author: body.author || 'Community Contributor',
        hash: securityScan.repoGateSignature,
        signature: securityScan.repoGateSignature,
        provenanceSigner: 'ed25519:repogate_scan_verified',
        permissions: ['read:workspace'],
        parameters: [{
          name: 'inputData',
          type: 'string',
          description: 'Default skill payload input',
          required: true
        }],
        eucCompatible: true,
        eccCompatible: true,
        reputationScore: 92,
        codeSnippet: body.skillCodeOrManifest,
        updatedAt: new Date().toISOString()
      };
      skillsRegistry.unshift(newSkill);
      return NextResponse.json({ success: true, securityScan, skill: newSkill });
    } catch (error: unknown) {
      return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
    }
  }

  if (fullPath === 'registry/refresh') {
    const startTime = Date.now();
    const scanResults = skillsRegistry.map((skill) => {
      const codeToScan = skill.codeSnippet || skill.description;
      const scan = scanSkillSecurity(codeToScan, skill.id);
      return {
        skillId: skill.id,
        name: skill.name,
        passed: scan.passed,
        threatLevel: scan.threatLevel,
        eccCompatible: skill.eccCompatible
      };
    });
    const totalSkills = skillsRegistry.length;
    const verifiedSkills = scanResults.filter((scan) => scan.passed).length;

    return NextResponse.json({
      success: true,
      refreshedAt: new Date().toISOString(),
      executionDurationMs: Date.now() - startTime,
      totalCapabilitiesCount: totalSkills,
      verifiedCapabilitiesCount: verifiedSkills,
      skillsRegistry,
      scanAuditSummary: scanResults
    });
  }

  return NextResponse.json({ error: 'Not Found' }, { status: 404 });
}
