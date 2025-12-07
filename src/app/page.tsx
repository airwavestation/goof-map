'use client';

import React from 'react';
import Link from 'next/link';

const modules = [
  {
    id: 'goof-map',
    name: 'G.O.O.F. Genre Map',
    description: 'Generic Oscillation Organization Framework — 3D genre visualization and exploration',
    status: 'online',
    href: '/goof-map'
  },
  {
     id: 'cryptic-calculator',
     name: 'Cryptic Calculator',
     description: 'A mysterious tool for decoding hidden musical messages',
     status: 'online',
     href: '/cryptic-calculator'
  }
];

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#1e1e1e',
        color: '#00ff00',
        fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, -system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: '2rem',
          borderBottom: '1px solid #00ff00',
          textAlign: 'center'
        }}
      >
        <h1
          style={{
            fontSize: '2.5rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            margin: 0,
            fontWeight: 400
          }}
        >
          [AIRWAVE~STATION]
        </h1>
        <p
          style={{
            fontSize: '0.9rem',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            marginTop: '0.5rem',
            opacity: 0.7
          }}
        >
          Control Station
        </p>
      </header>

      {/* Main Content */}
      <section
        style={{
          flex: 1,
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {/* Status Bar */}
        <div
          style={{
            fontSize: '0.7rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginBottom: '2rem',
            padding: '0.5rem 1rem',
            border: '1px solid rgba(0,255,0,0.3)',
            display: 'flex',
            gap: '2rem'
          }}
        >
          <span>System Status: Online</span>
          <span>Modules: {modules.length}</span>
        </div>

        {/* Modules Grid */}
        <div
          style={{
            width: '100%',
            maxWidth: '900px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.5rem'
          }}
        >
          {modules.map((module) => (
            <Link
              key={module.id}
              href={module.href}
              style={{
                textDecoration: 'none',
                color: 'inherit'
              }}
            >
              <div
                style={{
                  border: '1px solid #00ff00',
                  padding: '1.5rem',
                  backgroundColor: 'rgba(0,255,0,0.02)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0,255,0,0.08)';
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(0,255,0,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0,255,0,0.02)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.75rem'
                  }}
                >
                  <h2
                    style={{
                      fontSize: '1rem',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      margin: 0,
                      fontWeight: 400
                    }}
                  >
                    {module.name}
                  </h2>
                  <span
                    style={{
                      fontSize: '0.6rem',
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      padding: '0.2rem 0.5rem',
                      border: '1px solid rgba(0,255,0,0.5)',
                      color: module.status === 'online' ? '#00ff00' : 'rgba(0,255,0,0.5)'
                    }}
                  >
                    {module.status}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: '0.75rem',
                    opacity: 0.7,
                    margin: 0,
                    lineHeight: 1.5
                  }}
                >
                  {module.description}
                </p>
                <div
                  style={{
                    marginTop: '1rem',
                    fontSize: '0.65rem',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    opacity: 0.5
                  }}
                >
                  [ Enter Module ]
                </div>
              </div>
            </Link>
          ))}

          {/* Placeholder for future modules */}
          <div
            style={{
              border: '1px dashed rgba(0,255,0,0.3)',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '150px',
              opacity: 0.5
            }}
          >
            <span
              style={{
                fontSize: '0.7rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase'
              }}
            >
              + More Modules
            </span>
            <span
              style={{
                fontSize: '0.6rem',
                marginTop: '0.5rem',
                opacity: 0.6
              }}
            >
              Coming Soon
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: '1rem 2rem',
          borderTop: '1px solid rgba(0,255,0,0.3)',
          fontSize: '0.65rem',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          opacity: 0.5,
          textAlign: 'center'
        }}
      >
        Airwave~Station Control Interface v1.0
      </footer>
    </main>
  );
}
