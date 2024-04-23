import { MdFeed } from 'react-icons/md';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaCircleArrowRight } from 'react-icons/fa6';
import { useState } from 'react';
import { NAVIGATION_PATHS } from '../../../utils/interfaces/general/general';
import { IFeed } from '../../../utils/interfaces/feed';

interface IFeedParams {
  feed: IFeed;
}

const Feed = ({ feed }: IFeedParams) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const navigate = useNavigate();

  const setParent = () => {
    if (feed.kind === 'navigation') {
      const params = new URLSearchParams(searchParams);
      params.delete('title');
      params.set('parent-id', feed.id);
      setSearchParams(params);
    } else {
      const params = new URLSearchParams();
      params.set('feed-id', feed.id);
      navigate({
        pathname: NAVIGATION_PATHS.library,
        search: params.toString(),
      });
    }
  };

  return (
    <div className={'relative flex p-2.5 w-full lg:w-1/2 xl:w-1/3 xxl:w-1/4'}>
      <button
        className={
          'p-5 py-10 gap-5 w-full flex text-center justify-between items-center bg-STUColor text-white rounded-md duration-200'
        }
        onClick={setParent}
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
          className={'w-20 h-full relative pointer-events-none hidden sm:flex'}
        >
          <div
            className={`absolute top-0.5 bottom-0.5 right-0.5 ${
              !isHovering ? 'w-full' : 'w-0'
            } overflow-hidden rounded-md flex justify-center items-center duration-300`}
          >
            <MdFeed size={34} />
          </div>
          <div
            className={`absolute top-0.5 bottom-0.5 right-0.5 ${
              isHovering ? 'w-full' : 'w-0'
            } overflow-hidden rounded-md flex justify-center items-center duration-300`}
          >
            <FaCircleArrowRight size={30} />
          </div>
        </div>
      </button>
    </div>
  );
};

export default Feed;
