/**
 * Test Island Component
 *
 * A simple React component to verify React hydration works correctly.
 * Used to validate the @astrojs/react integration before migrating actual components.
 */

import { useState } from 'react';

interface TestIslandProps {
  /** Optional initial count value */
  initialCount?: number;
}

/**
 * TestIsland - A counter component to test React hydration
 *
 * @param props - Component props
 * @param props.initialCount - Initial count value (default: 0)
 * @returns A React component with interactive counter
 */
export default function TestIsland({ initialCount = 0 }: TestIslandProps) {
  const [count, setCount] = useState(initialCount);

  return (
    <div
      style={{
        padding: '1rem',
        background: '#e3f2fd',
        borderRadius: '8px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '1rem',
      }}
    >
      <span style={{ fontWeight: 'bold', color: '#1976d2' }}>Count: {count}</span>
      <button
        onClick={() => setCount((c) => c + 1)}
        style={{
          padding: '0.5rem 1rem',
          background: '#1976d2',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold',
        }}
      >
        +1
      </button>
      <button
        onClick={() => setCount((c) => c - 1)}
        style={{
          padding: '0.5rem 1rem',
          background: '#d32f2f',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold',
        }}
      >
        -1
      </button>
      <button
        onClick={() => setCount(initialCount)}
        style={{
          padding: '0.5rem 1rem',
          background: '#757575',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Reset
      </button>
    </div>
  );
}
