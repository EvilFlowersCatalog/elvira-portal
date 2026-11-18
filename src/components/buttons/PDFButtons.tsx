import { Link } from 'react-router-dom';
import useAppContext from '../../hooks/contexts/useAppContext';
import { IEntryAcquisition } from '../../utils/interfaces/acquisition';
import { readerPath } from '@/lib/links/paths';
import { preloadReader } from '../../routes/pages';

interface IPDFButtonsParams {
  acquisition: IEntryAcquisition;
  entryId: string;
  catalogId?: string;
  /** Name the file explicitly (another file than the publication's readable PDF). */
  explicitFile?: boolean;
  children: React.ReactNode;
}

/**
 * "Read": a real link to the reader (`/entries/:id/read`), so a new tab, middle-click and Copy link address
 * all work, and the browser shows where it goes. Hover and focus start downloading the reader's code, the
 * largest chunk of the portal, so the click doesn't wait for it.
 */
const PDFButton = ({ acquisition, entryId, catalogId, explicitFile, children }: IPDFButtonsParams) => {
  const { umamiTrack } = useAppContext();

  return (
    <Link
      className="w-full block"
      to={readerPath(entryId, { file: explicitFile ? acquisition.id : null, catalogId })}
      onMouseEnter={preloadReader}
      onFocus={preloadReader}
      onTouchStart={preloadReader}
      onClick={() => umamiTrack('PDF Read Button', { pdf: acquisition.id, entryId })}
    >
      {children}
    </Link>
  );
};

export default PDFButton;
