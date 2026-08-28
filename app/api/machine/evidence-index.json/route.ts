import { NextResponse } from 'next/server';
export const dynamic = 'force-static';
export function GET() {
 return NextResponse.json({
 artifacts: [
 {"name":"receipt.cose","url":"/proof-bundle/receipt.cose","type":"COSE_Sign1","algorithm":"EdDSA"},
 {"name":"proof.json","url":"/proof-bundle/proof.json","type":"merkle_inclusion_proof"},
 {"name":"checkpoint.json","url":"/proof-bundle/checkpoint.json","type":"merkle_checkpoint"},
 {"name":"public-key.pem","url":"/proof-bundle/public-key.pem","type":"Ed25519_public_key"},
 {"name":"veklom-verify.py","url":"/proof-bundle/veklom-verify.py","type":"verifier_script"}
 ],
 r2_bucket:"veklom-evidence",
 reconciliation_status:"PENDING"
 });
}
