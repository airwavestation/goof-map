import React from 'react';
import { GenreMap } from '../components/GenreMap';

export default function GoofMapPage() {
  return (
    <main
      style={{
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#1E1E1E',
        color: '#f5f5f5',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, system-ui, -system-ui, sans-serif'
      }}
    >
      <header
        style={{
          padding: '0.9rem 1.25rem',
          borderBottom: '1px solid rgba(0,255,0,0.18)',
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: '0.75rem',
          flexShrink: 0
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.4rem',
              letterSpacing: '0.16em',
              textTransform: 'uppercase'
            }}
          >
            <span style={{ color: '#00FF00' }}>G.O.O.F.</span>{' '}
            <span style={{ opacity: 0.85 }}>Genre Map v1</span>
          </h1>
          <p
            style={{
              fontSize: '0.78rem',
              opacity: 0.7,
              marginTop: '0.25rem'
            }}
          >
            Generic Oscillation Organization Framework &mdash; station viewport
            prototype.
          </p>
        </div>

        <a
          href="/"
          style={{
            fontSize: '0.7rem',
            opacity: 0.7,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#00FF00',
            textDecoration: 'none',
            border: '1px solid rgba(0,255,0,0.3)',
            padding: '0.4rem 0.8rem',
            transition: 'all 0.2s ease'
          }}
        >
          Back to Station
        </a>
      </header>

      <div style={{ flex: 1, minHeight: 0 }}>
        <GenreMap />
      </div>
    </main>
  );
}
