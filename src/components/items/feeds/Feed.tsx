import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaFolder, FaFolderOpen } from 'react-icons/fa6';
import { TbBooks } from 'react-icons/tb';
import { useState } from 'react';
import { IFeed } from '../../../utils/interfaces/feed';
import { NAVIGATION_PATHS } from '../../../utils/interfaces/general/general';
import useAppContext from '../../../hooks/contexts/useAppContext';
import useGetFeedDetail from '../../../hooks/api/feeds/useGetFeedDetail';

interface IFeedParams {
  feed: IFeed;
}

const Feed = ({ feed }: IFeedParams) => {
  const { umamiTrack } = useAppContext();
  const getFeedDetails = useGetFeedDetail();

  const [searchParams, setSearchParams] = useSearchParams();
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const navigate = useNavigate();

  async function getParentFeed(feedId: string): Promise<string[]> {
    const feed = await getFeedDetails(feedId);
    if (feed.parents && feed.parents.length > 0) return [...await getParentFeed(feed.parents[0]), feedId];
    else return [feedId];
  }

  const handleFeedClick = async () => {
    if (feed.kind === 'navigation') {
      umamiTrack('Feed Parent Button', {
        feedId: feed.id,
      });
      const params = new URLSearchParams(searchParams);
      params.delete('query');

      const searchAll = searchParams.get('search-all') === 'true';

      let previous;
      if (searchAll) {
        params.delete('search-all');
        if (feed.parents && feed.parents.length > 0) {
          previous = await getParentFeed(feed.parents[0]);
          previous = previous.join('&');
        }
      } else {
        previous = params.get('parent-id');
      }
      
      let path = '';
      if (previous) path = previous + '&' + feed.id;
      else path = feed.id;
      params.set('parent-id', path);

      setSearchParams(params);
    } else {
      umamiTrack('Feed Button', {
        feedId: feed.id,
      });
      const params = new URLSearchParams();

      const searchAll = searchParams.get('search-all') === 'true';

        if (searchAll) {
          if (feed.parents && feed.parents.length > 0) {
            const parentPath = await getParentFeed(feed.parents[0]);
            params.set('parent-id', parentPath.join("&"));
          }
        } else {
          params.set('parent-id', searchParams.get('parent-id') ?? '');
        }
        params.set('feed-id-step', feed.id);

        navigate({
          pathname: NAVIGATION_PATHS.library,
          search: params.toString(),
        });

    }
  };

  return (
    <div className={'relative flex p-2 w-full md:w-1/2 xl:w-1/4'}>
      <button
        className={`relative h-[126px] w-full bg-primaryLight text-left rounded-[8px] shadow-[0px_4px_6px_0px_rgba(0,0,0,0.1)] p-4 flex flex-col gap-2 duration-200 overflow-hidden hover:brightness-95`}
        onClick={() => handleFeedClick()}
        onMouseEnter={() => setIsHovering(true)}
        onMouseOut={() => setIsHovering(false)}
      >
        <div className='absolute top-4 right-4 pointer-events-none text-secondary'>
          {feed.kind === 'navigation' ? (
            isHovering ? <FaFolderOpen size={24} /> : <FaFolder size={24} />
          ) : (
            <TbBooks size={24} />
          )}
        </div>
        <span className='text-base font-bold text-secondary leading-[1.4] pr-10 line-clamp-2'>{feed.title}</span>
        <span className='text-xs text-darkGray line-clamp-2'>{feed.content}</span>
      </button>
    </div>
  );
};

export default Feed;
