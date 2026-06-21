"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

export default function NotFoundPage() {
  const waveRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animate the 404 number counting up on mount
    const el = document.getElementById("cm-error-num");
    if (!el) return;
    let count = 0;
    const target = 404;
    const step = Math.ceil(target / 30);
    const timer = setInterval(() => {
      count = Math.min(count + step, target);
      el.textContent = String(count);
      if (count >= target) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        .cm404-root {
          background: #07080D;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 6rem 2rem 3rem;
          position: relative;
          overflow: hidden;
          font-family: 'DM Sans', sans-serif;
        }

        .cm404-bg-grid {
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(0, 210, 150, 0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 210, 150, 0.035) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
          z-index: 0;
        }

        .cm404-orb {
          position: fixed;
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
        }

        .cm404-orb-1 {
          width: 600px;
          height: 340px;
          background: radial-gradient(ellipse, rgba(99, 60, 255, 0.16) 0%, transparent 70%);
          top: -120px;
          left: 50%;
          transform: translateX(-50%);
        }

        .cm404-orb-2 {
          width: 320px;
          height: 220px;
          background: radial-gradient(ellipse, rgba(0, 210, 150, 0.11) 0%, transparent 70%);
          bottom: 80px;
          right: 5%;
        }

        /* ── NAV ── */
        .cm404-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 2.5rem;
          background: rgba(7, 8, 13, 0.7);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .cm404-logo {
          display: flex;
          align-items: center;
          gap: 9px;
          text-decoration: none;
        }

        .cm404-logo-icon {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: linear-gradient(135deg, #00D296 0%, #4B6EFF 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          color: #fff;
          font-weight: 700;
          font-family: 'Sora', sans-serif;
        }

        .cm404-logo-text {
          font-family: 'Sora', sans-serif;
          font-size: 15px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.3px;
        }

        .cm404-logo-text em {
          font-style: normal;
          color: #00D296;
        }

        .cm404-nav-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.5);
          text-decoration: none;
          padding: 7px 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          transition: color 0.2s, border-color 0.2s;
        }

        .cm404-nav-btn:hover {
          color: #00D296;
          border-color: rgba(0, 210, 150, 0.3);
        }

        /* ── CONTENT ── */
        .cm404-content {
          position: relative;
          z-index: 1;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* Status badge */
        .cm404-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: rgba(0, 210, 150, 0.07);
          border: 1px solid rgba(0, 210, 150, 0.18);
          border-radius: 20px;
          padding: 5px 14px 5px 10px;
          margin-bottom: 1.75rem;
        }

        .cm404-badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #00D296;
          animation: cm404-pulse 2s infinite;
        }

        @keyframes cm404-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.75); }
        }

        .cm404-badge span {
          font-size: 11px;
          font-weight: 500;
          color: #00D296;
          letter-spacing: 0.09em;
          text-transform: uppercase;
        }

        /* Wave bars */
        .cm404-wave {
          display: flex;
          align-items: center;
          gap: 3px;
          margin-bottom: 1.5rem;
        }

        .cm404-wave-bar {
          width: 3px;
          border-radius: 2px;
          background: rgba(0, 210, 150, 0.45);
          animation: cm404-wave 1.4s ease-in-out infinite;
        }

        @keyframes cm404-wave {
          0%, 100% { height: 5px; opacity: 0.35; }
          50% { height: 22px; opacity: 1; }
        }

        /* Error number */
        .cm404-error-num {
          font-family: 'Sora', sans-serif;
          font-size: clamp(72px, 14vw, 120px);
          font-weight: 800;
          line-height: 1;
          letter-spacing: -5px;
          background: linear-gradient(160deg, #ffffff 20%, rgba(255, 255, 255, 0.2) 85%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.4rem;
        }

        /* Headline */
        .cm404-headline {
          font-family: 'Sora', sans-serif;
          font-size: clamp(20px, 4vw, 28px);
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 0.75rem;
          letter-spacing: -0.5px;
        }

        .cm404-headline em {
          font-style: normal;
          background: linear-gradient(90deg, #00D296, #4B6EFF);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Subtext */
        .cm404-subtext {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.38);
          line-height: 1.75;
          max-width: 400px;
          margin: 0 auto 2rem;
        }

        /* Telemetry card */
        .cm404-telemetry {
          display: inline-flex;
          align-items: center;
          gap: 22px;
          background: rgba(255, 255, 255, 0.025);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 14px;
          padding: 14px 26px;
          margin-bottom: 2.25rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        .cm404-tel-item {
          text-align: center;
        }

        .cm404-tel-label {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.3);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 4px;
          font-weight: 500;
        }

        .cm404-tel-value {
          font-family: 'Sora', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: #00D296;
        }

        .cm404-tel-value.red { color: #FF5A5A; }

        .cm404-tel-divider {
          width: 1px;
          height: 34px;
          background: rgba(255, 255, 255, 0.07);
        }

        /* Action buttons */
        .cm404-actions {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 2.5rem;
        }

        .cm404-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #00D296 0%, #00b07f 100%);
          color: #07080D;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          padding: 11px 24px;
          border-radius: 24px;
          text-decoration: none;
          transition: transform 0.2s, box-shadow 0.2s;
          letter-spacing: 0.01em;
        }

        .cm404-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(0, 210, 150, 0.28);
        }

        .cm404-btn-primary:active {
          transform: translateY(0);
        }

        .cm404-btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          color: rgba(255, 255, 255, 0.65);
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          padding: 11px 22px;
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          text-decoration: none;
          transition: color 0.2s, border-color 0.2s, background 0.2s;
        }

        .cm404-btn-secondary:hover {
          color: #fff;
          border-color: rgba(255, 255, 255, 0.25);
          background: rgba(255, 255, 255, 0.04);
        }

        /* Footer links */
        .cm404-footer-links {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .cm404-footer-link {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.22);
          text-decoration: none;
          padding: 4px 10px;
          border-radius: 6px;
          transition: color 0.2s;
        }

        .cm404-footer-link:hover {
          color: rgba(255, 255, 255, 0.55);
        }

        .cm404-footer-dot {
          width: 2px;
          height: 2px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.15);
          flex-shrink: 0;
        }

        @media (max-width: 480px) {
          .cm404-telemetry { gap: 14px; padding: 12px 16px; }
          .cm404-tel-divider { display: none; }
          .cm404-nav { padding: 1rem 1.25rem; }
        }
      `}</style>

      {/* Nav */}
      <nav className="cm404-nav">
        <Link href="/" className="cm404-logo">
          <div className="cm404-logo-icon">C</div>
          <div className="cm404-logo-text">
            Call<em>Mind</em> AI
          </div>
        </Link>
        <Link href="/" className="cm404-nav-btn">
          ← Back to Home
        </Link>
      </nav>

      {/* Background effects */}
      <div className="cm404-bg-grid" aria-hidden="true" />
      <div className="cm404-orb cm404-orb-1" aria-hidden="true" />
      <div className="cm404-orb cm404-orb-2" aria-hidden="true" />

      {/* Main content */}
      <main className="cm404-content" role="main">
        {/* Status badge */}
        <div className="cm404-badge" aria-hidden="true">
          <div className="cm404-badge-dot" />
          <span>Route Not Found</span>
        </div>

        {/* Voice wave */}
        <div className="cm404-wave" aria-hidden="true" ref={waveRef}>
          {[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.4, 0.3, 0.2, 0.1, 0].map((delay, i) => (
            <div
              key={i}
              className="cm404-wave-bar"
              style={{ animationDelay: `${delay}s` }}
            />
          ))}
        </div>

        {/* 404 number */}
        <div className="cm404-error-num" aria-label="Error 404">
          <span id="cm-error-num">404</span>
        </div>

        <h1 className="cm404-headline">
          Page <em>Disconnected</em>
        </h1>

        <p className="cm404-subtext">
          This route doesn&apos;t exist or has been moved. Our AI agents are
          still online — let&apos;s get you back to the right frequency.
        </p>

        {/* Telemetry card */}
        <div className="cm404-telemetry" role="status" aria-label="System status">
          <div className="cm404-tel-item">
            <div className="cm404-tel-label">HTTP Status</div>
            <div className="cm404-tel-value red">404</div>
          </div>
          <div className="cm404-tel-divider" aria-hidden="true" />
          <div className="cm404-tel-item">
            <div className="cm404-tel-label">Latency</div>
            <div className="cm404-tel-value">0 ms</div>
          </div>
          <div className="cm404-tel-divider" aria-hidden="true" />
          <div className="cm404-tel-item">
            <div className="cm404-tel-label">AI Agents</div>
            <div className="cm404-tel-value">Online</div>
          </div>
          <div className="cm404-tel-divider" aria-hidden="true" />
          <div className="cm404-tel-item">
            <div className="cm404-tel-label">Uptime</div>
            <div className="cm404-tel-value">99.9%</div>
          </div>
        </div>

        {/* CTAs */}
        <div className="cm404-actions">
          <Link href="/" className="cm404-btn-primary">
            ↩ Go to Home
          </Link>
          <Link href="/onboarding" className="cm404-btn-secondary">
            Start Free Trial
          </Link>
        </div>

        {/* Footer links */}
        <nav className="cm404-footer-links" aria-label="Quick links">
          <Link href="/#features" className="cm404-footer-link">Features</Link>
          <div className="cm404-footer-dot" aria-hidden="true" />
          <Link href="/#demo" className="cm404-footer-link">Live Demo</Link>
          <div className="cm404-footer-dot" aria-hidden="true" />
          <Link href="/contact-us" className="cm404-footer-link">Support</Link>
          <div className="cm404-footer-dot" aria-hidden="true" />
          <Link href="/login" className="cm404-footer-link">Sign In</Link>
        </nav>
      </main>
    </>
  );
}