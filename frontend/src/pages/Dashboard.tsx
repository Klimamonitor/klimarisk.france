import './Dashboard.css'
import useDataStore from '../hooks/useDataStore'
import Map from '../components/map/Map'
import DistributionChart from '../components/chart/DistributionChart';
import RiskTree from '../components/RiskTree';
import RiskTable from '../components/RiskTable';
import DetailedStats from '../components/details/DetailedStats';
import useLanguageStore, { t } from '../hooks/useLanguageStore';
import Header from '../components/header/Header';
import Panel from '../components/Panel';

function Dashboard() {

    const {
        selectedDistribution,
        layout,
    } = useDataStore();
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
    )
}

export default Dashboard