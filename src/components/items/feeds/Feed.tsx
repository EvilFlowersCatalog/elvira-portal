import { MdFeed } from 'react-icons/md';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaCircleArrowRight, FaFolder, FaFolderOpen } from 'react-icons/fa6';
import { useState } from 'react';
import { IFeed } from '../../../utils/interfaces/feed';
import { NAVIGATION_PATHS } from '../../../utils/interfaces/general/general';
import useAppContext from '../../../hooks/contexts/useAppContext';
import useGetFeeds from '../../../hooks/api/feeds/useGetFeeds';
import useGetFeedDetail from '../../../hooks/api/feeds/useGetFeedDetail';

interface IFeedParams {
  feed: IFeed;
}

const Feed = ({ feed }: IFeedParams) => {
  const { stuBg, umamiTrack } = useAppContext();
  var getFeedDetails = useGetFeedDetail();

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

      var searchAll = searchParams.get('search-all') === 'true';

      var previous;
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

      var searchAll = searchParams.get('search-all') === 'true';

        if (searchAll) {
          if (feed.parents && feed.parents.length > 0) {
            var parentPath = await getParentFeed(feed.parents[0]);
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
        className={`p-5 py-10 gap-5 w-full h-full flex text-center justify-between items-center ${stuBg} text-white rounded-md duration-200`}
        onClick={() => handleFeedClick()}
        onMouseEnter={() => setIsHovering(true)}
        onMouseOut={() => setIsHovering(false)}
      >
        <div
          className={
            'w-full flex flex-col text-center sm:text-left pointer-events-none'
          }
        >
          <span className={'text-xl font-bold'}>{feed.title}</span>
          <span className={'text-xs'}>{feed.content}</span>
        </div>
        <div
          className={
            'w-20 h-full pointer-events-none flex items-center justify-end'
          }
        >
          {feed.kind === 'navigation' ? (
            isHovering ? (
              <FaFolderOpen size={30} />
            ) : (
              <FaFolder size={30} />
            )
          ) : isHovering ? (
            <FaCircleArrowRight size={30} />
          ) : (
            <MdFeed size={30} />
          )}
        </div>
      </button>
    </div>
  );
};

export default Feed;
