import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import useCustomEffect from '../../hooks/useCustomEffect';
import { IFeed } from '../../utils/interfaces/feed';
import useGetFeeds from '../../hooks/api/feeds/useGetFeeds';
import ElviraInput from '../inputs/ElviraInput';

interface IFeedAutofillParams {
  entryForm: any;
  setEntryForm: (entryForm: any) => void;
  single?: boolean;
  kind?: 'acquisition' | 'navigation';
  placeholder?: string;
}

const FeedAutofill = ({
  entryForm,
  setEntryForm,
  single = false,
  kind = 'acquisition',
  placeholder,
}: IFeedAutofillParams) => {
  const { t } = useTranslation();

  const [inputValue, setInputValue] = useState<string>('');
  const [suggestions, setSuggestions] = useState<IFeed[]>([]);
  const [feeds, setFeeds] = useState<IFeed[]>([]);
  const [isHovering, setIsHovering] = useState<boolean>(false);

  const getFeeds = useGetFeeds();

  useCustomEffect(() => {
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
      setEntryForm({
        ...entryForm,
        feeds: [feed],
      });
      setInputValue(feed.title);
      setIsHovering(false);
      setSuggestions([]); // Hide suggestions after selection
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
        className={`bg-white dark:bg-gray ${
          suggestions.length > 0 ? 'rounded-b-none' : ''
        }`}
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
        }}
        onBlur={() => {
          const feed = feeds.filter(
            (feed) =>
              feed.title.toLocaleLowerCase() === inputValue.toLocaleLowerCase()
          );
          if (feed.length === 0) {
            setInputValue('');
          } else {
            handleSuggestionClick(feed[0]);
          }
          // if we click outside out input no on suggestions
          if (!isHovering) setSuggestions([]);
        }}
      />
      {suggestions.length > 0 && (
        <ul
          className='absolute top-[60px] border-2 rounded-md rounded-t-none border-STUColor list-none max-h-40 overflow-y-scroll bg-white dark:bg-gray z-20 w-full'
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {suggestions.map((feed, index) => (
            <li
              key={index}
              className='bg-white dark:bg-gray hover:bg-zinc-200 dark:hover:bg-darkGray text-left'
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
