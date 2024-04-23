import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import { useEffect, useState } from 'react';
import Button from '../../common/Button';
import { IAuthor } from '../../../utils/interfaces/author';
import { IFeed } from '../../../utils/interfaces/feed';
import useGetFeeds from '../../../hooks/api/feeds/useGetFeeds';
import { CircleLoader } from 'react-spinners';
import useAppContext from '../../../hooks/useAppContext';
import useGetAuthors from '../../../hooks/api/authors/useGetAuthors';

const Filter = () => {
  const { STUColor } = useAppContext();
  const [value, setValue] = useState<number[]>([
    1970,
    new Date().getFullYear(),
  ]);
  const [authors, setAuthors] = useState<IAuthor[] | null>(null);
  const [feeds, setFeeds] = useState<IFeed[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeSection, setAciveSection] = useState<'feed' | 'author' | null>(
    null
  );

  const getFeeds = useGetFeeds();
  const getAuthors = useGetAuthors();

  const handleChange = (_: Event, newValue: number | number[]) => {
    setValue(newValue as number[]);
  };

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const { items: feedList } = await getFeeds({
          page: 1,
          limit: 200,
          kind: 'acquisition',
        });

        setFeeds(feedList);

        const { items: authorList } = await getAuthors(1, 200);
        console.log(authorList);
        setAuthors(authorList);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return (
    <div
      className={`fixed top-28 md:top-16 bottom-0 right-0 z-20 flex w-full md:w-2/4 lg:w-2/5 xl:w-1/4 flex-col bg-lightGray dark:bg-darkGray`}
    >
      {isLoading ? (
        <div className={'flex justify-center h-full items-center'}>
          <CircleLoader color={STUColor} size={50} />
        </div>
      ) : (
        <div className={'w-full h-full flex flex-col gap-5 p-5'}>
          <div className='overflow-y-auto overflow-x-hidden flex flex-col w-full h-full'>
            <span
              className={
                'text-lg text-center text-darkGray dark:text-white font-bold'
              }
            >
              YEAR
            </span>
            <Box
              sx={{
                width: '97%',
                '& .MuiSlider-thumb': {
                  borderRadius: '3px',
                },
              }}
            >
              <Slider
                max={2024}
                min={1950}
                step={1}
                value={value}
                disableSwap
                onChange={handleChange}
              />
            </Box>
            <div className={'flex w-full justify-between'}>
              <span>From: {value[0]}</span>
              <span>To: {value[1]}</span>
            </div>
            <div
              className={`flex flex-col justify-start ${
                activeSection === 'author' ? 'flex-1' : 'max-h-32'
              } w-full overflow-auto`}
            >
              <button
                className={
                  'text-lg text-darkGray dark:text-white font-bold w-full'
                }
                onClick={() =>
                  activeSection === 'author'
                    ? setAciveSection(null)
                    : setAciveSection('author')
                }
              >
                AUTHORS
              </button>
              {authors?.map((author, index) => (
                <span key={index}>{author.name + ' ' + author.surname}</span>
              ))}
            </div>
            <div
              className={`flex flex-col justify-start ${
                activeSection === 'feed' ? 'flex-1' : 'max-h-32'
              } w-full overflow-auto`}
            >
              <button
                className={
                  'text-lg text-darkGray dark:text-white font-bold w-full'
                }
                onClick={() =>
                  activeSection === 'feed'
                    ? setAciveSection(null)
                    : setAciveSection('feed')
                }
              >
                FEEDS
              </button>
              {feeds?.map((feed, index) => (
                <span key={index}>{feed.content}</span>
              ))}
            </div>
          </div>
          <span className='flex flex-1'></span>
          <div className='w-full flex justify-center'>
            <Button>
              <span>APPLY</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Filter;
