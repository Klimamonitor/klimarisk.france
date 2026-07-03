import './header.css';
import YearSelect from './YearSelect';
import LayoutSelect from './LayoutSelect';
import LanguageSelect from './LanguageSelect';
import Tooltip from '../Tooltip';
import useLanguageStore from '../../hooks/useLanguageStore';
import { HelpCircle } from 'lucide-react'; // Ajuste l'import selon ton composant d'icône (ex: HelpCircle, Help, etc.)

function Header() {
  const l = useLanguageStore((state) => state.l);

  return (
    <header>
      <div className="headerTitleContainer">
        <h1 className="headerMainTitle">
          <a href="https://www.vestforsk.no/nn/publication/development-comprehensive-climate-risk-ranking-french-municipalities" target="_blank" rel="noopener noreferrer">
            Klimarisk <span className="titleBadge">France</span>
          </a>
        </h1>

        <Tooltip text={l({ fr: "Cliquer ici pour consulter les détails du projet à l'origine de ce site, incluant la méthodologie détaillée.", en: "Click here to read about the project at the origin of this website, including the detailed methodology." })}>
          <a
            href="https://www.vestforsk.no/nn/publication/development-comprehensive-climate-risk-ranking-french-municipalities"
            target="_blank"
            rel="noopener noreferrer"
            className="headerInfoIcon"
          >
            <HelpCircle />
          </a>
        </Tooltip>
      </div>

      <div className="headerControls">
        <LayoutSelect />
        <YearSelect />
      </div>
      <LanguageSelect />
    </header>
  );
}

export default Header;