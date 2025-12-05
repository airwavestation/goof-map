import React from 'react';
import { GoofScene } from './components/GoofScene';

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#020308',
        color: '#f5f5f5',
      }}
    >
      <header
        style={{
          padding: '1rem',
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontSize: '1.75rem',
            letterSpacing: '0.08em',
          }}
        >
          G.O.O.F. – Genre Map v1
        </h1>
        <p
          style={{
            fontSize: '0.85rem',
            opacity: 0.7,
          }}
        >
          3D skeleton – generic centroid positions.
        </p>
      </header>

      <section
        style={{
          flex: 1,
        }}
      >
        <GoofScene />
      </section>
    </main>
  );
}
