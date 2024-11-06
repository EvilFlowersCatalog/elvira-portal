import { MdFeed } from 'react-icons/md';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaCircleArrowRight, FaFolder, FaFolderOpen } from 'react-icons/fa6';
import { useState } from 'react';
import { IFeed } from '../../../utils/interfaces/feed';
import { NAVIGATION_PATHS } from '../../../utils/interfaces/general/general';
import useAppContext from '../../../hooks/contexts/useAppContext';

interface IFeedParams {
  feed: IFeed;
}

const Feed = ({ feed }: IFeedParams) => {
  const { stuBg, umamiTrack } = useAppContext();

  const [searchParams, setSearchParams] = useSearchParams();
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleFeedClick = () => {
    if (feed.kind === 'navigation') {
      umamiTrack('Feed Parent Button', {
        feedId: feed.id,
      });
      const params = new URLSearchParams(searchParams);
      params.delete('title');
      const previous = params.get('parent-id');

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
        onClick={handleFeedClick}
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
