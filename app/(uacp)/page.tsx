/**
 * UACP V3 Embed Page
 * Embeds the deployed UACP V3 Control Plane (uacpv3-control-plane.onrender.com)
 * as a full-viewport iframe within the Veklom control plane shell.
 *
 * Deployment URL sourced from render.yaml service name: uacpv3-control-plane
 */

'use client';

import React from 'react';

const UACP_V3_URL = 'https://uacpv3-control-plane.onrender.com';

export default function UacpPage() {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        background: '#0a0a0f',
      }}
    >
      {/* Header bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '36px',
          background: 'rgba(10,10,20,0.95)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: '10px',
          zIndex: 10,
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: '#00ff80',
            boxShadow: '0 0 6px #00ff80',
          }}
        />
        <span
          style={{
            fontSize: '10px',
            fontFamily: 'monospace',
            letterSpacing: '0.12em',
            color: 'rgba(255,255,255,0.5)',
            textTransform: 'uppercase',
          }}
        >
          UACP V3 Control Plane
        </span>
        <a
          href={UACP_V3_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            marginLeft: 'auto',
            fontSize: '10px',
            fontFamily: 'monospace',
            color: 'rgba(255,255,255,0.3)',
            textDecoration: 'none',
          }}
        >
          {UACP_V3_URL} ↗
        </a>
      </div>

      {/* UACP V3 iframe */}
      <iframe
        src={UACP_V3_URL}
        title="UACP V3 Control Plane"
        style={{
          position: 'absolute',
          top: '36px',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 'calc(100vh - 36px)',
          border: 'none',
          background: '#0a0a0f',
        }}
        allow="clipboard-read; clipboard-write; microphone"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
      />
    </div>
  );
}
