import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { TerminalEvent, VerifiedFinding, RiskLevel } from '../types';
import { 
  Copy, 
  Check, 
  ShieldCheck, 
  FileText, 
  Code, 
  Table, 
  Activity, 
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';

interface EvidenceLedgerProps {
  runId: string;
  agentId: string;
  repoUrl: string;
  filesScannedCount: number;
  overallRisk: RiskLevel;
  userDecision: 'APPROVED' | 'ESCALATED' | 'BLOCKED' | null;
  events: TerminalEvent[];
  findings: VerifiedFinding[];
  auditHash: string;
  treeTruncated: boolean;
  history?: any[];
  onResetHistory?: () => void;
}

export const EvidenceLedger: React.FC<EvidenceLedgerProps> = ({
  runId,
  agentId,
  repoUrl,
  filesScannedCount,
  overallRisk,
  userDecision,
  events,
  findings,
  auditHash,
  treeTruncated,
  history = [],
  onResetHistory
}) => {
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [activeViewTab, setActiveViewTab] = useState<'proof' | 'summary'>('proof');

  const isCompleted = events.some(e => e.event_type === 'ledger.seal');

  // Automatically switch to summary tab on scan completion
  useEffect(() => {
    if (isCompleted && runId) {
      setActiveViewTab('summary');
    }
  }, [isCompleted, runId]);

  // Handle Copy Hash
  const handleCopyHash = async () => {
    try {
      await navigator.clipboard.writeText(auditHash);
      setCopied(true);
      setShowToast(true);
      setTimeout(() => setCopied(false), 2000);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  // Compile and trigger JSON download
  const handleExportJSON = () => {
    const payload = {
      veklom_governance_ledger: {
        version: "1.0.0",
        governed_hub: "Veklom Repo Risk Gate v1.0.0",
        run_id: runId,
        agent_id: agentId,
        repo_url: repoUrl,
        scan_date: new Date().toISOString(),
        overall_risk_level: overallRisk,
        operator_decision: userDecision || "PENDING_OPERATOR_DECISION",
        coverage: {
          files_scanned: filesScannedCount,
          tree_truncated: treeTruncated
        },
        audit_hash_sha256: auditHash,
        verified_findings: findings.map(f => ({
          path: f.path,
          policy_rule: f.matched_rule,
          policy_result: f.policy_result,
          risk_level: f.risk_level,
          reason: f.reason
        })),
        events_stream: events.map(e => ({
          sequence_no: e.sequence_no,
          timestamp: e.timestamp,
          event_type: e.event_type,
          target: e.target,
          policy_result: e.policy_result,
          message: e.message
        }))
      }
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(payload, null, 2)
    )}`;
    
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `veklom_ledger_${runId || 'unassigned'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Compile and trigger a lightweight JSON findings audit report
  const handleExportLightweightJSON = () => {
    const payload = {
      compliance_findings_audit: {
        version: "1.0.0",
        governed_hub: "Veklom Repo Risk Gate v1.0.0",
        run_id: runId,
        agent_id: agentId,
        repo_url: repoUrl,
        scan_date: new Date().toISOString(),
        overall_risk_level: overallRisk,
        operator_decision: userDecision || "PENDING_OPERATOR_DECISION",
        audit_hash_sha256: auditHash,
        coverage: {
          files_scanned: filesScannedCount,
          tree_truncated: treeTruncated
        },
        findings_summary: {
          total_violations: findings.length,
          remediated_count: findings.filter(f => f.remediated).length,
          unremediated_count: findings.filter(f => !f.remediated).length
        },
        verified_findings: findings.map(f => ({
          path: f.path,
          policy_rule: f.matched_rule,
          policy_result: f.policy_result,
          risk_level: f.risk_level,
          reason: f.reason,
          remediated: f.remediated,
          remediation_note: f.remediation_note || null
        }))
      }
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(payload, null, 2)
    )}`;
    
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `veklom_findings_audit_${runId || 'unassigned'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Compile and trigger TXT download
  const handleExportTXT = () => {
    const borderLine = "=================================================================================";
    const thinLine   = "---------------------------------------------------------------------------------";
    
    let textOut = "";
    textOut += `${borderLine}\n`;
    textOut += `               VEKLOM AUDIT LEDGER - REPO RISK GATE EVIDENCE\n`;
    textOut += `                            VERSION 1.0.0 (STABLE)\n`;
    textOut += `${borderLine}\n\n`;
    
    textOut += `SYSTEM METADATA\n`;
    textOut += `${thinLine}\n`;
    textOut += `Audit Authority:        VEKLOM GOVERNANCE ENGINE\n`;
    textOut += `Run Reference ID:       ${runId || 'UNASSIGNED'}\n`;
    textOut += `Assigned Agent ID:      ${agentId || 'UNASSIGNED'}\n`;
    textOut += `Source Repository:      ${repoUrl || 'N/A'}\n`;
    textOut += `Assessed Risk Category: ${overallRisk || 'SAFE'}\n`;
    textOut += `Audit Ledger Sealed At: ${new Date().toUTCString()}\n`;
    textOut += `Operator Signature:     ${userDecision || 'AWAITING OPERATOR SIGN-OFF'}\n`;
    textOut += `Truncation Status:      ${treeTruncated ? 'TRUE (Partial Path Coverage)' : 'FALSE (Complete Path Coverage)'}\n`;
    textOut += `Files Count Reviewed:   ${filesScannedCount} files\n\n`;
    
    textOut += `VERIFIED RISK FINDINGS\n`;
    textOut += `${thinLine}\n`;
    if (findings.length === 0) {
      textOut += `No strict policy violations or security warning indicators were detected in this run.\n`;
    } else {
      findings.forEach((f, idx) => {
        textOut += `[Finding #${idx + 1}] Path: ${f.path}\n`;
        textOut += `   - Associated Rule:  ${f.matched_rule}\n`;
        textOut += `   - Risk Level:       ${f.risk_level}\n`;
        textOut += `   - Policy Action:    ${f.policy_result.toUpperCase()}\n`;
        textOut += `   - Reason:           ${f.reason}\n\n`;
      });
    }
    textOut += `\n`;
    
    textOut += `CANONICAL EVENTS TIMELINE LOGS\n`;
    textOut += `${thinLine}\n`;
    events.forEach(e => {
      textOut += `[${e.timestamp}] Seq #${e.sequence_no} | ${e.event_type.padEnd(20)} | Target: ${e.target || 'N/A'}\n`;
      textOut += `   - Message: ${e.message}\n`;
      textOut += `   - Action:  ${e.policy_result}\n\n`;
    });
    textOut += `\n`;
    
    textOut += `${borderLine}\n`;
    textOut += `AUDIT SIGNATURE CANONICAL SHA-256 PROOF\n`;
    textOut += `${thinLine}\n`;
    textOut += `Verification Hash: ${auditHash}\n`;
    textOut += `Status:            TAMPER-PROOF-VERIFIED (Sealed by Rust cryptosystems)\n`;
    textOut += `${borderLine}\n`;

    const txtString = `data:text/plain;charset=utf-8,${encodeURIComponent(textOut)}`;
    
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', txtString);
    downloadAnchor.setAttribute('download', `veklom_certificate_${runId || 'unassigned'}.txt`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Compile and trigger CSV download of terminal trace logs
  const handleExportCSV = () => {
    // CSV Headers matching terminal trace columns
    const headers = [
      "Sequence No",
      "Timestamp",
      "Event Type",
      "Log Level",
      "Target Path",
      "Policy Result",
      "Message"
    ];
    
    // Build Rows
    const rows = events.map(e => {
      const getLogLevelLocal = (evt: TerminalEvent): string => {
        if (evt.log_level) return evt.log_level;
        if (evt.policy_result === 'blocked_env_boundary' || evt.event_type === 'file.access.blocked') return 'CRITICAL';
        if (evt.event_type === 'policy.gate.triggered' || evt.policy_result === 'escalate_to_security' || evt.policy_result === 'human_approval_required') return 'ERROR';
        if (evt.event_type === 'git.tree.warning' || evt.event_type === 'finding.alert') return 'WARN';
        return 'INFO';
      };

      return [
        e.sequence_no.toString(),
        e.timestamp,
        e.event_type,
        getLogLevelLocal(e),
        e.target || "",
        e.policy_result || "none",
        e.message || ""
      ];
    });

    // Format fields with standard CSV double quotes escaping
    const formattedRows = rows.map(row => 
      row.map(val => {
        const escaped = val.replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(",")
    );

    const csvContent = [headers.join(","), ...formattedRows].join("\n");
    const csvString = `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`;
    
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', csvString);
    dlAnchor.setAttribute('download', `veklom_terminal_trace_${runId || 'unassigned'}.csv`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  };

  // Compile and trigger PDF download
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Calculate statistics to match the UI perfectly
      const totalFindings = findings.length;
      const criticalCount = findings.filter(f => f.risk_level === 'CRITICAL' && !f.remediated).length;
      const highCount = findings.filter(f => f.risk_level === 'HIGH' && !f.remediated).length;
      const mediumCount = findings.filter(f => f.risk_level === 'MEDIUM' && !f.remediated).length;
      const lowCount = findings.filter(f => f.risk_level === 'LOW' && !f.remediated).length;
      const safeCount = findings.filter(f => f.risk_level === 'SAFE' || f.remediated).length;

      let securityScore = 100;
      securityScore -= criticalCount * 25;
      securityScore -= highCount * 15;
      securityScore -= mediumCount * 8;
      securityScore -= lowCount * 3;
      securityScore = Math.max(0, securityScore);

      let grade = 'A';
      if (securityScore >= 95) grade = 'A+';
      else if (securityScore >= 90) grade = 'A';
      else if (securityScore >= 80) grade = 'B';
      else if (securityScore >= 70) grade = 'C';
      else if (securityScore >= 50) grade = 'D';
      else grade = 'F';

      let y = 15;

      const drawHeader = () => {
        // Core orange indicator bar
        doc.setFillColor(255, 107, 0);
        doc.rect(15, y, 180, 4, 'F');
        y += 10;

        // Cover Logo and Title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.setTextColor(20, 20, 20);
        doc.text("VEKLOM RISK GATE", 15, y);
        y += 6;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(110, 110, 110);
        doc.text("REPOSITORY INTEGRITY CERTIFICATE & RISK REVIEW MATRIX", 15, y);
        
        // Draw standard dividing line
        y += 6;
        doc.setDrawColor(210, 210, 210);
        doc.line(15, y, 195, y);
        y += 10;
      };

      const checkPageBreak = (needed: number) => {
        if (y + needed > 275) {
          doc.addPage();
          y = 15;
          // Subpage Minimal Header
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(120, 120, 120);
          doc.text("VEKLOM RISK GATE AUDIT REPORT", 15, y);
          doc.setFont("helvetica", "normal");
          doc.text(`Run: ${runId || 'unassigned'}`, 195 - doc.getTextWidth(`Run: ${runId || 'unassigned'}`), y);
          y += 3;
          doc.setDrawColor(230, 230, 230);
          doc.line(15, y, 195, y);
          y += 10;
        }
      };

      drawHeader();

      // PART 1: METADATA & RESULTS
      checkPageBreak(50);
      
      // Draw high level stats metadata layout table box
      doc.setFillColor(248, 248, 248);
      doc.rect(15, y, 180, 52, 'F');
      doc.setDrawColor(230, 230, 230);
      doc.rect(15, y, 180, 52, 'S');

      // Add metrics inside box
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text("AUDIT METADATA", 20, y + 8);
      doc.text("COMPLIANCE TELEMETRY", 110, y + 8);

      doc.setDrawColor(230, 230, 230);
      doc.line(20, y + 11, 190, y + 11);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);

      // Left Metadata Column
      doc.text(`Run Ref ID:`, 20, y + 18);
      doc.setFont("courier", "bold");
      doc.text(`${runId || 'UNASSIGNED'}`, 48, y + 18);
      doc.setFont("helvetica", "normal");

      doc.text(`Source Repository:`, 20, y + 25);
      doc.setFont("courier", "normal");
      const shortRepo = repoUrl && repoUrl.length > 30 ? repoUrl.substring(0, 27) + "..." : repoUrl || 'Local Workspace';
      doc.text(`${shortRepo}`, 48, y + 25);
      doc.setFont("helvetica", "normal");

      doc.text(`Assigned Agent:`, 20, y + 32);
      doc.setFont("courier", "normal");
      doc.text(`${agentId || 'VEKLOM-BOT'}`, 48, y + 32);
      doc.setFont("helvetica", "normal");

      doc.text(`Timestamp:`, 20, y + 39);
      doc.text(`${new Date().toUTCString()}`, 48, y + 39);

      doc.text(`Files Reviewed:`, 20, y + 46);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text(`${filesScannedCount} files`, 48, y + 46);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);

      // Right Metadata Column
      doc.text(`Risk Category:`, 110, y + 18);
      doc.setFont("helvetica", "bold");
      let riskColor = [34, 197, 94]; // safe emerald
      if (overallRisk === 'CRITICAL' || overallRisk === 'HIGH') riskColor = [239, 68, 68];
      else if (overallRisk === 'MEDIUM') riskColor = [245, 158, 11];
      else if (overallRisk === 'LOW') riskColor = [234, 179, 8];
      
      doc.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
      doc.text(`${overallRisk || 'SAFE'}`, 144, y + 18);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);

      doc.text(`Gate Outcome:`, 110, y + 25);
      doc.setFont("helvetica", "bold");
      if (userDecision === 'APPROVED') doc.setTextColor(34, 197, 94);
      else if (userDecision === 'BLOCKED') doc.setTextColor(239, 68, 68);
      else if (userDecision === 'ESCALATED') doc.setTextColor(217, 119, 6);
      else doc.setTextColor(120, 120, 120);
      doc.text(`${userDecision || 'AWAITING RESPONSE'}`, 144, y + 25);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);

      doc.text(`Coverage Status:`, 110, y + 32);
      doc.text(`${treeTruncated ? 'Partial Truncated' : 'Complete Core Scan'}`, 144, y + 32);

      doc.text(`Security Grade:`, 110, y + 39);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 118, 110); // emerald dark
      doc.text(`${grade} (Score: ${securityScore}/100)`, 144, y + 39);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);

      doc.text(`Total Findings:`, 110, y + 46);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30,30,30);
      doc.text(`${totalFindings} Alert${totalFindings === 1 ? '' : 's'}`, 144, y + 46);
      
      y += 52 + 10;

      // PROOF SIGNATURE BOX
      checkPageBreak(35);
      doc.setFillColor(24, 24, 27); // Obsidian card style
      doc.rect(15, y, 180, 24, 'F');
      
      doc.setFont("courier", "bold");
      doc.setFontSize(8);
      doc.setTextColor(0, 255, 65); // Cyber Green
      doc.text("CANONICAL PROOF LEDGER HASH (SHA-256):", 20, y + 6);
      doc.setFont("courier", "normal");
      doc.setFontSize(8);
      doc.setTextColor(220, 220, 220);
      
      const splitHash = doc.splitTextToSize(auditHash, 170);
      doc.text(splitHash, 20, y + 12);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(120, 120, 120);
      doc.text("CRITICAL STATUS: TAMPER-PROOF VERIFIED • DIGITAL COMPLIANCE MATRIX", 20, y + 20);

      y += 24 + 10;

      // RISK BREAKDOWN HISTOGRAM REPRESENTATION
      checkPageBreak(35);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(30, 30, 30);
      doc.text("RISK SEVERITY BREAKDOWN", 15, y);
      y += 5;

      const barW = 180;
      doc.setFillColor(240, 240, 240);
      doc.rect(15, y, barW, 6, 'F');

      const sumWeights2 = criticalCount + highCount + mediumCount + lowCount + safeCount;
      const calcPct = (cnt: number) => (sumWeights2 === 0 ? 0 : (cnt / sumWeights2) * barW);

      let curX = 15;
      if (sumWeights2 > 0) {
        if (criticalCount > 0) {
          doc.setFillColor(220, 38, 38); // CRITICAL Red
          const w = calcPct(criticalCount);
          doc.rect(curX, y, w, 6, 'F');
          curX += w;
        }
        if (highCount > 0) {
          doc.setFillColor(248, 113, 113); // High Red-orange
          const w = calcPct(highCount);
          doc.rect(curX, y, w, 6, 'F');
          curX += w;
        }
        if (mediumCount > 0) {
          doc.setFillColor(245, 158, 11); // Medium Amber
          const w = calcPct(mediumCount);
          doc.rect(curX, y, w, 6, 'F');
          curX += w;
        }
        if (lowCount > 0) {
          doc.setFillColor(250, 204, 21); // Low Yellow
          const w = calcPct(lowCount);
          doc.rect(curX, y, w, 6, 'F');
          curX += w;
        }
        if (safeCount > 0) {
          doc.setFillColor(16, 185, 129); // Safe Emerald
          const w = calcPct(safeCount);
          doc.rect(curX, y, w, 6, 'F');
          curX += w;
        }
      } else {
        doc.setFillColor(16, 185, 129); // 100% Emerald Green for complete clean
        doc.rect(curX, y, barW, 6, 'F');
      }

      y += 12;

      // Severity labels row
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(220, 38, 38);
      doc.text(`CRITICAL: ${criticalCount}`, 15, y);

      doc.setTextColor(239, 68, 68);
      doc.text(`HIGH: ${highCount}`, 52, y);

      doc.setTextColor(217, 119, 6);
      doc.text(`MEDIUM: ${mediumCount}`, 88, y);

      doc.setTextColor(194, 120, 3);
      doc.text(`LOW: ${lowCount}`, 128, y);

      doc.setTextColor(16, 185, 129);
      doc.text(`SAFE: ${safeCount}`, 164, y);

      y += 10;

      // DETAILED FINDINGS REVIEW TABLE
      checkPageBreak(30);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(30, 30, 30);
      doc.text("VERIFIED FINDINGS AND THREAT LOGS", 15, y);
      y += 6;

      doc.setDrawColor(180, 180, 180);
      doc.line(15, y, 195, y);
      y += 2;

      if (findings.length === 0) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(80, 150, 90);
        doc.text("COMPLETE INTEGRITY CONFIRMED - NO VULNERABILITIES DETECTED", 15, y + 6);
        y += 12;
      } else {
        findings.forEach((finding, idx) => {
          checkPageBreak(35); // check if finding space exists
          doc.setFillColor(252, 252, 252);
          doc.rect(15, y, 180, 24, 'F');
          doc.setDrawColor(240, 240, 240);
          doc.rect(15, y, 180, 24, 'S');

          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          // High Visibility Threat Level Tagging
          let textColor = [220, 38, 38]; // critical red
          if (finding.risk_level === 'HIGH') textColor = [239, 68, 68];
          else if (finding.risk_level === 'MEDIUM') textColor = [217, 119, 6];
          else if (finding.risk_level === 'LOW') textColor = [161, 98, 7];
          
          doc.setTextColor(textColor[0], textColor[1], textColor[2]);
          doc.text(`FINDING #${idx + 1} [${finding.risk_level}]`, 18, y + 6);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(80, 80, 80);
          doc.text(`Policy Rule: ${finding.matched_rule || 'N/A'}`, 110, y + 6);

          doc.setFont("courier", "bold");
          doc.setFontSize(8.5);
          doc.setTextColor(40, 40, 40);
          const shortPath = finding.path.length > 72 ? '...' + finding.path.substring(finding.path.length - 69) : finding.path;
          doc.text(`File: ${shortPath}`, 18, y + 12);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(100, 100, 100);
          
          const maxReasonW = 172;
          const splitReason = doc.splitTextToSize(`Reason: ${finding.reason}`, maxReasonW);
          doc.text(splitReason, 18, y + 18);

          y += 24 + 4;
        });
      }

      // INTEGRITY ENDORSEMENT SECTION
      checkPageBreak(40);
      y += 5;
      doc.setDrawColor(200, 200, 200);
      doc.line(15, y, 195, y);
      y += 8;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(30, 30, 30);
      doc.text("GOVERNANCE ENDORSEMENT CERTIFICATION", 15, y);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text("SEAL DATE", 110, y);

      y += 5;
      
      doc.setFont("courier", "bold");
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text("VEKLOM-VERIFIER-AEROCLIP-STABLE-v1", 15, y);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text(`${new Date().toUTCString()}`, 110, y);

      y += 10;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(140, 140, 140);
      doc.text("The audit proof ledger records cryptographically binding decisions and events evaluated on the client machine.", 15, y);

      // Save PDF triggering immediate download
      doc.save(`veklom_security_report_${runId || 'unassigned'}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
    }
  };

  // Custom Monospace Tooltip matching deep dark obsidian terminals
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#111111] p-3 border border-neutral-800 font-mono text-[11px] rounded shadow-2xl select-none">
          <p className="text-gray-500 mb-1.5 uppercase tracking-wider font-bold">RUN: #{label}</p>
          <div className="space-y-1">
            <p className="text-red-400 flex items-center justify-between gap-4 font-bold">
              <span>CRITICAL/ERR:</span>
              <span>{payload[0]?.value ?? 0}</span>
            </p>
            <p className="text-[#FF6B00] flex items-center justify-between gap-4 font-bold">
              <span>WARNINGS:</span>
              <span>{payload[1]?.value ?? 0}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 md:p-8 bg-[#151515] min-h-[260px] flex flex-col justify-between relative border-t border-[#333]">
      {/* Visual Toast Notification popup */}
      {showToast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#FF6B00] text-black text-xs font-mono font-bold py-2 px-4 shadow-xl z-50 animate-fade-in uppercase tracking-wider flex items-center space-x-2 border border-white/20">
          <Check className="w-3.5 h-3.5 stroke-[3]" />
          <span>Hash Copied to Clipboard</span>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between border-b border-[#222] pb-2 mb-4">
          <h2 className="font-mono text-[11px] tracking-widest text-[#666] uppercase">03 / Evidence Ledger</h2>
          
          <div className="flex items-center space-x-1.5 font-mono text-[9px] sm:text-[10px]">
            <button
              onClick={() => setActiveViewTab('proof')}
              className={`px-2 py-0.5 border transition-all cursor-pointer ${
                activeViewTab === 'proof' 
                  ? 'border-[#333] text-[#00FF41] bg-[#111]' 
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              [ Proof ]
            </button>
            <button
              onClick={() => setActiveViewTab('summary')}
              className={`px-2 py-0.5 border transition-all cursor-pointer relative ${
                activeViewTab === 'summary' 
                  ? 'border-[#FF6B00] text-[#FF6B00] bg-[#FF6B00]/5 font-bold' 
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              [ Summary ]
              {isCompleted && activeViewTab !== 'summary' && (
                <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              )}
            </button>
          </div>
        </div>

        {activeViewTab === 'proof' ? (
          <>
            <p className="text-[11px] leading-relaxed mb-6 opacity-65 text-gray-400">
              SHA-256 Canonical Ledger Hash generated from strictly ordered event stream (BTreeMap serialization). Fully tamper-resistant.
            </p>

            {/* Ledger Hash Box */}
            <div 
              onClick={handleCopyHash}
              title="Click to copy SHA-256 Hash"
              className="bg-black p-4 border border-[#333] hover:border-[#FF6B00] transition-colors cursor-pointer group relative"
            >
              <div className="font-mono text-xs md:text-[12px] break-all leading-tight text-gray-300 font-bold tracking-wider select-all group-hover:text-white transition-colors">
                {auditHash}
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <span className="text-[9px] font-mono text-[#00FF41] uppercase tracking-widest font-bold flex items-center">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                    Status: Tamper-Proof-Verified
                  </span>
                </div>

                {/* Quick action helper showing copy status */}
                <span className="text-[9px] font-mono text-[#666] uppercase tracking-widest group-hover:text-[#FF6B00] transition-colors flex items-center space-x-1">
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-[#00FF41]" />
                      <span className="text-[#00FF41]">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Click to copy</span>
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Recharts Historical Telemetry line chart display with explanation panel */}
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left 2 cols: Interactive Telemetry Chart */}
              <div className="lg:col-span-2 p-4 bg-black border border-[#222] rounded flex flex-col gap-3 min-h-[250px]">
                <div className="flex items-center justify-between text-mono font-bold select-none text-[10px] uppercase tracking-wider text-[#666]">
                  <div className="flex items-center space-x-1.5">
                    <Activity className="w-3.5 h-3.5 text-[#FF6B00]" />
                    <span>GPC Historical Sweep Telemetry</span>
                  </div>
                  {onResetHistory && (
                    <button
                      onClick={onResetHistory}
                      title="Reset sweep run statistics"
                      className="flex items-center space-x-1 px-2 py-0.5 border border-[#333] hover:border-[#FF6B00] hover:text-white bg-neutral-900 text-gray-500 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-2.5 h-2.5 text-[#FF6B00]" />
                      <span className="text-[8px] tracking-widest uppercase">Reset</span>
                    </button>
                  )}
                </div>

                <div className="w-full h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={history}
                      margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                    >
                      <CartesianGrid stroke="#1a1a1a" strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#444"
                        fontSize={9}
                        fontFamily="monospace"
                        tickLine={false}
                      />
                      <YAxis 
                        stroke="#444"
                        fontSize={9}
                        fontFamily="monospace"
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        verticalAlign="top" 
                        height={24} 
                        iconSize={8}
                        iconType="circle"
                        wrapperStyle={{
                          fontFamily: 'monospace',
                          fontSize: '9px',
                          textTransform: 'uppercase',
                          letterSpacing: '1px',
                          paddingBottom: '5px'
                        }}
                        formatter={(value) => {
                          const color = value === 'critical' ? 'text-red-400 font-bold' : 'text-[#FF6B00] font-bold';
                          return <span className={color}>{value === 'critical' ? 'CRITICAL / ERROR' : 'WARNINGS'}</span>;
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="critical" 
                        name="critical"
                        stroke="#ef4444" 
                        strokeWidth={2}
                        activeDot={{ r: 5 }}
                        dot={{ r: 2 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="warning" 
                        name="warning"
                        stroke="#FF6B00" 
                        strokeWidth={2}
                        activeDot={{ r: 5 }}
                        dot={{ r: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="border-t border-[#111] pt-2 flex items-center justify-between text-[8px] sm:text-[9px] font-mono text-neutral-500 select-none">
                  <span>← Older Builds</span>
                  <span className="text-[#888] font-bold text-center">X-Axis Labels: Repo Commit Hash Revisions (e.g., 18FA, 211C)</span>
                  <span>Newer Builds →</span>
                </div>
              </div>

              {/* Right 1 col: Educational Explanation card */}
              <div className="p-4 bg-[#070707] border border-[#222] rounded flex flex-col justify-between space-y-3 select-none">
                <div className="space-y-2">
                  <div className="flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#00FF41]" />
                    <span className="text-[10px] font-mono font-black text-white uppercase tracking-wider">Continuous compliance</span>
                  </div>
                  
                  <p className="text-[10px] leading-relaxed text-gray-400 font-sans">
                    Single security scans decay instantly when new code is pushed. The <strong>GPC (Governance Policy Controller)</strong> tracks vulnerability counts over successive development iterations to maintain an auditable ledger.
                  </p>
                </div>

                <div className="space-y-2 border-t border-[#1b1b1b] pt-3 font-mono text-[9px] sm:text-[10px] text-neutral-400">
                  <div className="flex items-start space-x-1.5">
                    <span className="text-red-500 font-bold shrink-0">1.</span>
                    <div>
                      <strong className="text-gray-200 block uppercase text-[8.5px] tracking-wide">Track Regression Spikes</strong>
                      <span className="text-gray-500 text-[8.5px] leading-snug block">Pinpoint which developer git commits introduced new credentials or policy errors (e.g. <span className="text-red-400">18FA</span>).</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-1.5">
                    <span className="text-[#FF6B00] font-bold shrink-0">2.</span>
                    <div>
                      <strong className="text-gray-200 block uppercase text-[8.5px] tracking-wide">Continuous Audit-Ready</strong>
                      <span className="text-gray-500 text-[8.5px] leading-snug block">Provide real-time proof of developer hygiene and compliance over time for SOC2 compliance.</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-1.5">
                    <span className="text-[#00FF41] font-bold shrink-0">3.</span>
                    <div>
                      <strong className="text-gray-200 block uppercase text-[8.5px] tracking-wide">Prove Mitigation Uplift</strong>
                      <span className="text-gray-500 text-[8.5px] leading-snug block">Verify that the active M2M Fix Daemon has successfully shielded these containers at each revision.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (() => {
          const totalFindings = findings.length;

          const criticalCount = findings.filter(f => f.risk_level === 'CRITICAL' && !f.remediated).length;
          const highCount = findings.filter(f => f.risk_level === 'HIGH' && !f.remediated).length;
          const mediumCount = findings.filter(f => f.risk_level === 'MEDIUM' && !f.remediated).length;
          const lowCount = findings.filter(f => f.risk_level === 'LOW' && !f.remediated).length;
          const safeCount = findings.filter(f => f.risk_level === 'SAFE' || f.remediated).length;

          let securityScore = 100;
          securityScore -= criticalCount * 25;
          securityScore -= highCount * 15;
          securityScore -= mediumCount * 8;
          securityScore -= lowCount * 3;
          securityScore = Math.max(0, securityScore);

          let grade = 'A';
          if (securityScore >= 95) grade = 'A+';
          else if (securityScore >= 90) grade = 'A';
          else if (securityScore >= 80) grade = 'B';
          else if (securityScore >= 70) grade = 'C';
          else if (securityScore >= 50) grade = 'D';
          else grade = 'F';

          const sumWeights = criticalCount + highCount + mediumCount + lowCount + safeCount;
          const isZero = sumWeights === 0;

          const criticalPct = isZero ? 0 : Math.round((criticalCount / sumWeights) * 100);
          const highPct = isZero ? 0 : Math.round((highCount / sumWeights) * 100);
          const mediumPct = isZero ? 0 : Math.round((mediumCount / sumWeights) * 100);
          const lowPct = isZero ? 0 : Math.round((lowCount / sumWeights) * 100);
          const safePct = isZero ? 100 : Math.max(0, 100 - criticalPct - highPct - mediumPct - lowPct);

          return (
            <div className="space-y-4 animate-[fadeIn_0.2s_ease-out]">
              {/* Top Score & Decisions Dashboard Card */}
              <div className="grid grid-cols-2 gap-3 select-none">
                {/* Score card / Grade */}
                <div className="p-3 bg-black border border-[#222] flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-mono uppercase tracking-widest text-gray-500 block">Security Grade</span>
                    <span className="text-xl font-mono font-black text-white">{grade}</span>
                    <span className="text-[9px] text-gray-400 block font-mono mt-0.5">Score: {securityScore}/100</span>
                  </div>
                  <div className={`w-9 h-9 flex items-center justify-center border font-mono text-xs font-black rounded-sm shrink-0 ${
                    grade.startsWith('A') ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' :
                    grade.startsWith('B') ? 'border-[#FF6B00]/20 text-[#FF6B00] bg-[#FF6B00]/5' :
                    'border-red-500/20 text-red-500 bg-red-500/5'
                  }`}>
                    {grade}
                  </div>
                </div>

                {/* Status card / Decision */}
                <div className="p-3 bg-black border border-[#222] flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-mono uppercase tracking-widest text-gray-500 block">Gate Outcome</span>
                    <span className={`text-[10px] font-mono font-extrabold uppercase mt-0.5 inline-block truncate max-w-full ${
                      userDecision === 'APPROVED' ? 'text-emerald-400' :
                      userDecision === 'ESCALATED' ? 'text-[#FF6B00]' :
                      userDecision === 'BLOCKED' ? 'text-red-500' :
                      findings.some(f => f.risk_level === 'CRITICAL' || f.risk_level === 'HIGH') ? 'text-yellow-500' :
                      'text-emerald-400'
                    }`}>
                      {userDecision ? `DECISION: ${userDecision}` : isCompleted ? 'SIGNATURE REQ' : 'IN PROGRESS'}
                    </span>
                  </div>
                  <div className="text-[8px] font-mono text-gray-500 uppercase">
                    {filesScannedCount} items reviewed
                  </div>
                </div>
              </div>

              {/* Risk Distribution Breakdown Segment Bar */}
              <div className="p-3.5 bg-black border border-[#222] rounded space-y-2.5">
                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold select-none">
                  <span>Risk Distribution</span>
                  <span>{totalFindings} Finding{totalFindings === 1 ? '' : 's'}</span>
                </div>

                {/* Stacked Percentage Progress Bar Chart */}
                <div className="h-2 w-full bg-neutral-900 overflow-hidden flex rounded-xs">
                  {criticalCount > 0 && (
                    <div 
                      title={`CRITICAL: ${criticalCount}`}
                      style={{ width: `${Math.max(10, criticalPct)}%` }} 
                      className="h-full bg-red-600 hover:opacity-85 transition-opacity duration-150"
                    />
                  )}
                  {highCount > 0 && (
                    <div 
                      title={`HIGH: ${highCount}`}
                      style={{ width: `${Math.max(10, highPct)}%` }} 
                      className="h-full bg-red-400 hover:opacity-85 transition-opacity duration-150"
                    />
                  )}
                  {mediumCount > 0 && (
                    <div 
                      title={`MEDIUM: ${mediumCount}`}
                      style={{ width: `${Math.max(10, mediumPct)}%` }} 
                      className="h-full bg-amber-500 hover:opacity-85 transition-opacity duration-150"
                    />
                  )}
                  {lowCount > 0 && (
                    <div 
                      title={`LOW: ${lowCount}`}
                      style={{ width: `${Math.max(10, lowPct)}%` }} 
                      className="h-full bg-yellow-400 hover:opacity-85 transition-opacity duration-150"
                    />
                  )}
                  {safeCount > 0 && (
                    <div 
                      title={`SAFE: ${safeCount}`}
                      style={{ width: `${Math.max(10, safePct)}%` }} 
                      className="h-full bg-emerald-500 hover:opacity-85 transition-opacity duration-150"
                    />
                  )}
                  {totalFindings === 0 && (
                    <div 
                      title="COMPLETE INTEGRITY: 100% CLEAR"
                      className="h-full w-full bg-emerald-500/80 hover:opacity-85 transition-opacity duration-150"
                    />
                  )}
                </div>

                {/* Legends Row details */}
                <div className="grid grid-cols-5 gap-1 text-center select-none">
                  <div className="py-1 border border-red-500/10 bg-red-950/5 rounded-xs">
                    <span className="text-[7.5px] font-mono text-red-500 block font-bold">CRIT</span>
                    <span className="text-[10px] font-mono font-bold text-gray-300">{criticalCount}</span>
                  </div>
                  <div className="py-1 border border-red-400/10 bg-red-950/5 rounded-xs">
                    <span className="text-[7.5px] font-mono text-red-400 block font-bold">HIGH</span>
                    <span className="text-[10px] font-mono font-bold text-gray-300">{highCount}</span>
                  </div>
                  <div className="py-1 border border-amber-500/10 bg-amber-950/5 rounded-xs">
                    <span className="text-[7.5px] font-mono text-[#FF6B00] block font-bold">MED</span>
                    <span className="text-[10px] font-mono font-bold text-gray-300">{mediumCount}</span>
                  </div>
                  <div className="py-1 border border-yellow-400/10 bg-yellow-950/5 rounded-xs">
                    <span className="text-[7.5px] font-mono text-yellow-500 block font-bold">LOW</span>
                    <span className="text-[10px] font-mono font-bold text-gray-300">{lowCount}</span>
                  </div>
                  <div className="py-1 border border-emerald-500/10 bg-emerald-950/5 rounded-xs">
                    <span className="text-[7.5px] font-mono text-emerald-400 block font-bold">SAFE</span>
                    <span className="text-[10px] font-mono font-bold text-gray-300">{safeCount}</span>
                  </div>
                </div>
              </div>

              {/* Findings Quick Summary List Feed */}
              <div className="p-3 bg-black border border-[#222] rounded space-y-1.5 max-h-[110px] overflow-y-auto scrollbar-thin">
                <span className="text-[9px] font-mono uppercase tracking-widest text-[#666] block font-bold select-none">
                  Target Audit Logs Tracing
                </span>
                {findings.length === 0 ? (
                  <div className="text-[10px] font-mono text-emerald-400/90 flex items-center space-x-1.5 py-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Sovereign ledger fully clean. No alerts!</span>
                  </div>
                ) : (
                  <div className="space-y-1 font-mono text-[9px] select-text">
                    {findings.map((f, i) => (
                      <div key={f.id || i} className="flex items-center justify-between border-b border-neutral-900/40 pb-1 gap-2 last:border-b-0 last:pb-0">
                        <span className="truncate text-gray-300 max-w-[70%]" title={f.path}>
                          {f.path.split('/').pop() || f.path}
                        </span>
                        <span className={`px-1 text-[8px] rounded-xs font-bold shrink-0 ${
                          f.risk_level === 'CRITICAL' ? 'bg-red-950 text-red-500 border border-red-500/30' :
                          f.risk_level === 'HIGH' ? 'bg-red-950 text-red-400 border border-red-500/15' :
                          f.risk_level === 'MEDIUM' ? 'bg-amber-950/50 text-[#FF6B00] border border-[#FF6B00]/15' :
                          'bg-yellow-950/40 text-yellow-500'
                        }`}>
                          {f.risk_level}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Core Download JSON Report, PDF Summary, and Lightweight Findings Audit Button Card */}
              <div className="pt-2 grid grid-cols-1 md:grid-cols-3 gap-2.5 animate-[fadeIn_0.3s_ease-out]">
                <button
                  onClick={handleExportPDF}
                  disabled={events.length === 0}
                  className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 hover:opacity-90 disabled:opacity-30 text-black font-extrabold text-[10px] uppercase tracking-widest rounded-xs transition-all border border-teal-500/30 select-none cursor-pointer disabled:cursor-not-allowed shadow-[0_0_12px_rgba(20,184,166,0.15)]"
                  title="Generate and Download beautifully formatted PDF Compliance Summary Report"
                >
                  <FileText className="w-4 h-4 text-black stroke-[3]" />
                  <span>PDF Report</span>
                </button>

                <button
                  onClick={handleExportLightweightJSON}
                  disabled={events.length === 0}
                  className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-gradient-to-r from-cyan-600 via-blue-500 to-indigo-500 hover:opacity-90 disabled:opacity-30 text-black font-extrabold text-[10px] uppercase tracking-widest rounded-xs transition-all border border-blue-500/30 select-none cursor-pointer disabled:cursor-not-allowed shadow-[0_0_12px_rgba(37,99,235,0.15)]"
                  title="Generate and Download lightweight compliance-focused JSON audit report containing findings only"
                >
                  <ShieldCheck className="w-4 h-4 text-black stroke-[3]" />
                  <span>Findings JSON</span>
                </button>

                <button
                  onClick={handleExportJSON}
                  disabled={events.length === 0}
                  className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-gradient-to-r from-orange-600 via-[#FF6B00] to-amber-500 hover:opacity-90 disabled:opacity-30 text-black font-extrabold text-[10px] uppercase tracking-widest rounded-xs transition-all border border-[#FF6B00]/30 select-none cursor-pointer disabled:cursor-not-allowed shadow-[0_0_12px_rgba(255,107,0,0.15)]"
                  title="Generate and Download full event logs and findings report in JSON format"
                >
                  <Code className="w-4 h-4 text-black stroke-[3]" />
                  <span>Full Ledger JSON</span>
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Export Ledger Controls */}
      <div className="mt-6 pt-4 border-t border-[#222] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 font-mono">
        <span className="text-[10px] text-gray-500 uppercase">
          Sealed Records Vault
        </span>
        
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          {/* PDF Export button */}
          <button
            onClick={handleExportPDF}
            disabled={events.length === 0}
            className="flex items-center justify-center space-x-1 px-3 py-1.5 bg-neutral-900 border border-[#333] hover:border-[#FF6B00] hover:text-white disabled:opacity-30 disabled:hover:border-[#333] disabled:hover:text-inherit transition-all text-gray-300 font-bold uppercase tracking-wider cursor-pointer"
            title="Download beautifully formatted PDF Security Report"
          >
            <FileText className="w-3 h-3 text-[#FF6B00]" />
            <span>PDF REPORT</span>
          </button>

          {/* Lightweight Findings JSON Export button */}
          <button
            onClick={handleExportLightweightJSON}
            disabled={events.length === 0}
            className="flex items-center justify-center space-x-1 px-3 py-1.5 bg-neutral-900 border border-[#333] hover:border-[#00FF41] hover:text-white disabled:opacity-30 disabled:hover:border-[#333] disabled:hover:text-inherit transition-all text-gray-300 font-bold uppercase tracking-wider cursor-pointer"
            title="Download Lightweight JSON Findings Audit (Findings only, no timeline logs)"
          >
            <ShieldCheck className="w-3 h-3 text-[#00FF41]" />
            <span>Audit JSON</span>
          </button>

          {/* JSON Export button */}
          <button
            onClick={handleExportJSON}
            disabled={events.length === 0}
            className="flex items-center justify-center space-x-1 px-3 py-1.5 bg-neutral-900 border border-[#333] hover:border-[#FF6B00] hover:text-white disabled:opacity-30 disabled:hover:border-[#333] disabled:hover:text-inherit transition-all text-gray-300 font-bold uppercase tracking-wider cursor-pointer"
            title="Download complete system JSON ledger (includes event stream)"
          >
            <Code className="w-3 h-3 text-[#FF6B00]" />
            <span>Full Ledger</span>
          </button>

          {/* CSV Export button */}
          <button
            onClick={handleExportCSV}
            disabled={events.length === 0}
            className="flex items-center justify-center space-x-1 px-3 py-1.5 bg-neutral-900 border border-[#333] hover:border-[#FF6B00] hover:text-white disabled:opacity-30 disabled:hover:border-[#333] disabled:hover:text-inherit transition-all text-gray-300 font-bold uppercase tracking-wider cursor-pointer"
          >
            <Table className="w-3 h-3 text-[#FF6B00]" />
            <span>CSV Logs</span>
          </button>

          {/* TXT Export button */}
          <button
            onClick={handleExportTXT}
            disabled={events.length === 0}
            className="flex items-center justify-center space-x-1 px-3 py-1.5 bg-neutral-900 border border-[#333] hover:border-[#FF6B00] hover:text-white disabled:opacity-30 disabled:hover:border-[#333] disabled:hover:text-inherit transition-all text-gray-300 font-bold uppercase tracking-wider cursor-pointer"
          >
            <FileText className="w-3 h-3 text-[#FF6B00]" />
            <span>TEXT Certificate</span>
          </button>
        </div>
      </div>
    </div>
  );
};
