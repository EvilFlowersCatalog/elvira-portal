import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IFeed } from '../../utils/interfaces/feed';
import useGetFeeds from '../../hooks/api/feeds/useGetFeeds';
import ElviraInput from '../inputs/ElviraInput';
import useAppContext from '../../hooks/contexts/useAppContext';

interface IFeedAutofillParams {
  /**
   * single=false (admin): full entry object with a `.feeds` array inside.
   * single=true  (portal): the currently selected IFeed item, or undefined.
   */
  entryForm: any;
  defaultFeedId?: string;
  setEntryForm: (entryForm: any) => void;
  /**
   * single=false (admin): pushes to the entry's feed list (multi-select).
   * single=true  (portal): setEntryForm is called with [feed] or [] directly.
   */
  single?: boolean;
  kind?: 'acquisition' | 'navigation';
  placeholder?: string;
  setIsSelectionOpen?: (isOpen: boolean) => void;
}

const FeedAutofill = ({
  entryForm,
  setEntryForm,
  defaultFeedId,
  single = false,
  kind = 'acquisition',
  placeholder,
  setIsSelectionOpen
}: IFeedAutofillParams) => {
  const { t } = useTranslation();

  const [inputValue, setInputValue] = useState<string>(
    // Portal (single=true): entryForm is the IFeed item itself
    // Admin (single=false): entryForm is the full entry object with a .feeds array
    single ? (entryForm?.title || '') : (entryForm?.feeds?.[0]?.title || '')
  );
  const [suggestions, setSuggestions] = useState<IFeed[]>([]);
  const [feeds, setFeeds] = useState<IFeed[]>([]);
  const [isHovering, setIsHovering] = useState<boolean>(false);

  const getFeeds = useGetFeeds();

  useEffect(() => {
    (async () => {
      try {
        const { items } = await getFeeds({
          paginate: false,
          kind,
        });
        setFeeds(items);
      } catch {
        setFeeds([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (defaultFeedId && feeds) {
      const defaultFeed = feeds.find((feed: IFeed) => feed.id === defaultFeedId);
      if (defaultFeed) {
        setInputValue(defaultFeed.title);
        if (single) {
          setEntryForm([defaultFeed]);
        } else {
          setEntryForm({
            ...entryForm,
            feeds: [{ title: defaultFeed.title, id: defaultFeed.id }],
          });
        }
      }
    }
  }, [defaultFeedId, feeds]);

  // Portal (single=true) mode: sync display value when the selected item changes externally
  useEffect(() => {
    if (!single) return;
    setInputValue(entryForm?.title ?? '');
  }, [single, entryForm?.title]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Filter languages based on input
    const filteredSuggestions = feeds.filter((feed) =>
      feed.title.toLowerCase().startsWith(value.toLowerCase())
    );

    setSuggestions(filteredSuggestions);
  };

  const handleSuggestionClick = (feed: IFeed) => {
    if (single) {
      // Portal mode: setEntryForm is a direct array setter — call with [feed]
      setEntryForm([feed]);
      setInputValue(feed.title);
      setIsHovering(false);
      setSuggestions([]);
      return;
    }

    setInputValue('');
    const eq = entryForm.feeds.filter((item: any) => item.id === feed.id);
    if (eq.length !== 0) {
      setIsHovering(false);
      setSuggestions([]);
      return;
    }

    const newFeeds: { title: string; id: string }[] = [
      ...entryForm.feeds.map((item: any) => ({
        title: item.title,
        id: item.id,
      })),
      { title: feed.title, id: feed.id },
    ];
    setEntryForm({
      ...entryForm,
      feeds: newFeeds,
    });
    setIsHovering(false);
    setSuggestions([]); // Hide suggestions after selection
  };

  return (
    <div className='w-full relative'>
      <ElviraInput
        className={`bg-white ${suggestions.length > 0 ? 'rounded-b-none' : ''}`}
        type='text'
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder ?? t('entry.wizard.feed')}
        invalidMessage={t('entry.wizard.requiredMessages.lang')}
        onFocus={() => {
          const filteredSuggestions = feeds.filter(
            (feed) =>
              feed.title.toLowerCase().startsWith(inputValue.toLowerCase()) &&
              feed.title !== inputValue
          );

          setSuggestions(filteredSuggestions);
          setIsSelectionOpen?.(true);
        }}
        onBlur={() => {
          const feed = feeds.filter(
            (feed) =>
              feed.title.toLocaleLowerCase() === inputValue.toLocaleLowerCase()
          );
          if (feed.length === 0) {
            setInputValue('');
            // Portal mode: clear the selection when input is emptied
            if (single) setEntryForm([]);
          } else {
            handleSuggestionClick(feed[0]);
          }
          // if we click outside out input no on suggestions
          if (!isHovering) {
            setSuggestions([]);
            setIsSelectionOpen?.(false);
          }
        }}
      />
      {suggestions.length > 0 && (
        <ul
          className={`absolute top-[60px] rounded-md rounded-t-none border-primary list-none max-h-40 overflow-y-scroll bg-white dark:bg-darkGray z-20 w-full
          shadow-[0px_4px_12px_0px_#0000001A] dark:shadow-[0px_4px_12px_0px_#9999991A]`}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {suggestions.map((feed, index) => (
            <li
              key={index}
              className='bg-white dark:bg-darkGray hover:bg-zinc-200 dark:hover:bg-darkGray text-left relative z-20'
              onClick={() => handleSuggestionClick(feed)}
              style={{ padding: '5px', cursor: 'pointer' }}
            >
              {feed.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FeedAutofill;
