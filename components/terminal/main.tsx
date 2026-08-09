"use client";
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider } from '@tanstack/react-query';
import { config, queryClient } from './config/wagmi';
import App from './App.tsx';
import './index.css';
import { controlStore } from './data/simulation';

// API Interceptor removed - wired to real backend

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
);
