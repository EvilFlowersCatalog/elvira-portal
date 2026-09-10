import HelpLoremArticle from './HelpLoremArticle';

const HelpSearch = () => (
  <HelpLoremArticle
    title="Vyhľadávanie v katalógu"
    heading="Vyhľadávanie"
    sections={[
      { id: 'keyword', label: 'Keyword vyhľadávanie' },
      { id: 'semanticke', label: 'Sémantické vyhľadávanie' },
      { id: 'filtre', label: 'Filtre a pokročilé vyhľadávanie' },
      { id: 'tipy', label: 'Tipy pre lepšie výsledky' },
    ]}
  />
);

export default HelpSearch;
