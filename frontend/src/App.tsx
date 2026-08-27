import './App.css';
import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import useDataStore from './hooks/useDataStore';
import Map from './components/map/Map';
import DistributionChart from './components/chart/DistributionChart';
import RiskTree from './components/RiskTree';
import RiskTable from './components/RiskTable';
import DetailedStats from './components/details/DetailedStats';
import useLanguageStore, { t } from './hooks/useLanguageStore';
import Header from './components/header/Header';
import Panel from './components/Panel';
import ReportPage from './pages/ReportPage';

type LoadingScreenProps = {
  progress: number;
};

function LoadingScreen({ progress }: LoadingScreenProps) {
  const l = useLanguageStore((state) => state.l);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Klimarisk France</h2>
        <p style={styles.subtitle}>
          {l({
            fr: `Chargement des indicateurs de risque climatique... (${progress}%)`,
            en: `Loading of climate risk indicators... (${progress}%)`,
          })}
        </p>
        <div style={styles.progressContainer}>
          <div
            style={{
              ...styles.progressBar,
              width: `${progress}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const { selectedDistribution, layout } = useDataStore();
  const { l } = useLanguageStore();

  return (
    <>
      <Header />
      <div className={`dashboard ${layout === "first" ? "gridLayout1" : "gridLayout2"}`}>
        <Panel
          title={l(t.panels.tree)}
          tooltip={l(t.panels.tree.tooltip)}
          className="tree"
        >
          <RiskTree />
        </Panel>

        <Panel
          title={l(t.panels.map)}
          tooltip={l(t.panels.map.tooltip)}
          className="map"
        >
          <Map />
        </Panel>

        <Panel
          title={l(t.panels.chart)}
          tooltip={l(t.panels.chart.tooltip)}
          className="chart"
        >
          <DistributionChart distributionKey={selectedDistribution} />
        </Panel>

        <Panel
          title={l(t.panels.table)}
          tooltip={l(t.panels.table.tooltip)}
          className="table"
        >
          <RiskTable />
        </Panel>

        <Panel
          title={l(t.panels.details)}
          tooltip={l(t.panels.details.tooltip)}
          className="details"
        >
          <DetailedStats />
        </Panel>
      </div>
    </>
  );
}

function App() {
  const { fetchData } = useDataStore();
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    async function initializeApp() {
      try {
        setProgress(15);
        await new Promise((resolve) => setTimeout(resolve, 300));
        setProgress(40);

        await fetchData();
        setProgress(85);

        await new Promise((resolve) => setTimeout(resolve, 200));
        setProgress(100);

        await new Promise((resolve) => setTimeout(resolve, 150));
      } catch (error) {
        console.error("Erreur lors du chargement des données de risques :", error);
      } finally {
        setIsLoading(false);
      }
    }
    initializeApp();
  }, [fetchData]);

  useEffect(() => {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 'width=1200, initial-scale=0.3, maximum-scale=3.0');
    }
  }, []);

  if (isLoading) {
    return <LoadingScreen progress={progress} />;
  }

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/report" element={<ReportPage />} />
      <Route path="*" element={<Dashboard />} />
    </Routes>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#ffffff',
    fontFamily: 'sans-serif',
  },
  card: {
    textAlign: 'center' as const,
    color: '#ffffff',
  },
  title: {
    fontSize: '1.5rem',
    marginBottom: '0.5rem',
    fontWeight: 600,
    color: '#000000',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: '#000000',
    marginBottom: '1.5rem',
  },
  progressContainer: {
    width: '300px',
    height: '6px',
    backgroundColor: '#ffedd5',
    borderRadius: '3px',
    overflow: 'hidden',
    margin: '0 auto',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#f97316',
    borderRadius: '3px',
    transition: 'width 0.3s ease-out',
  },
};

export default App;