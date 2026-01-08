import { useEffect } from 'react';
import { usePageStore } from './store/pageStore';
import { useKeyboard } from './hooks';
import { Toolbar } from './components/Toolbar';
import { SectionRail } from './components/SectionRail';
import { Canvas } from './components/Canvas';
import { Inspector } from './components/Inspector';
import './App.css';

function App() {
  const { loadSeedPage } = usePageStore();

  // Initialize keyboard shortcuts
  useKeyboard();

  // Load seed page on mount
  useEffect(() => {
    loadSeedPage();
  }, [loadSeedPage]);

  return (
    <div className="app">
      <Toolbar />
      <div className="app-main">
        <SectionRail />
        <Canvas />
        <Inspector />
      </div>
    </div>
  );
}

export default App;
