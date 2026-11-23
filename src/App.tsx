/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameCanvas } from './components/GameCanvas';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <main className="relative h-[100dvh] w-screen overflow-hidden bg-black select-none">
        <GameCanvas />
      </main>
    </ErrorBoundary>
  );
}
