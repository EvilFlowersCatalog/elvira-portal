import HelpLoremArticle from './HelpLoremArticle';

const HelpViewer = () => (
  <HelpLoremArticle
    title="PDF Viewer"
    heading="PDF Viewer"
    sections={[
      { id: 'otvorenie', label: 'Otvorenie dokumentu' },
      { id: 'ovladanie', label: 'Ovládanie čítačky' },
      { id: 'anotacie', label: 'Anotácie a poznámky' },
      { id: 'problemy', label: 'Riešenie problémov' },
    ]}
  />
);

export default HelpViewer;
