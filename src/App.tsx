import { Dashboard } from './components/Dashboard';
import { AssetProvider } from './context/AssetContext';

function App() {
  return (
    <AssetProvider>
      <Dashboard />
    </AssetProvider>
  );
}

export default App;
