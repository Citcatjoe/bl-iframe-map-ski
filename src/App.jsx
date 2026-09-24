import { useMemo, useState } from 'react';
import Map from './components/Map/Map';
import Panel from './components/Panel/Panel';
import resorts from './data/resorts.json';

function App() {
  const [selectedId, setSelectedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const filteredResorts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return resorts;
    return resorts.filter(
      (resort) =>
        resort.name.toLowerCase().includes(query) ||
        resort.canton.toLowerCase().includes(query) ||
        resort.cantonCode.toLowerCase() === query
    );
  }, [searchQuery]);

  const filteredIds = useMemo(() => new Set(filteredResorts.map((resort) => resort.id)), [filteredResorts]);

  const handleSelectResort = (id) => {
    setSelectedId(id);
    if (id) setIsPanelOpen(true);
  };

  return (
    <div className="relative h-[520px] w-full overflow-hidden bg-[var(--color-fill-weak)]">
      <Map resorts={resorts} selectedId={selectedId} filteredIds={filteredIds} onSelectResort={handleSelectResort} />
      <Panel
        resorts={resorts}
        filteredResorts={filteredResorts}
        selectedId={selectedId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectResort={handleSelectResort}
        isOpen={isPanelOpen}
        onToggleOpen={setIsPanelOpen}
      />
    </div>
  );
}

export default App;
