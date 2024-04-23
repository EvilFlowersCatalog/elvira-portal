import { IFeed } from '../../../../utils/interfaces/feed';
import PageLoading from '../../PageLoading';
import useDataPage from '../../../../hooks/useDataContext';
import AdminFeed from './AdminFeed';
import { MdAdd } from 'react-icons/md';
import { useState } from 'react';
import FeedForm from './FeedForm';
import ModalWrapper from '../../../modal/ModalWrapper';

const AdminFeedContainer = () => {
  const { data, isLoading } = useDataPage();
  const [showForm, setShowForm] = useState<boolean>(false);

  return (
    <>
      <div className='flex flex-col flex-1'>
        {data!.length === 0 && isLoading ? (
          <PageLoading />
        ) : (
          <div className={`flex flex-wrap p-2.5 w-full`}>
            {/* Add button */}
            <div className={'flex p-2.5 w-full lg:w-1/2 xl:w-1/3 xxl:w-1/4'}>
              <button
                onClick={() => setShowForm(true)}
                className={`flex flex-col justify-center dark:text-white text-black items-center p-2 w-full rounded-md border-4 border-dashed border-spacing-8 border-STUColor bg-STUColor bg-opacity-40 hover:bg-opacity-20 duration-200`}
              >
                <MdAdd size={50} />
              </button>
            </div>
            {/* FEEDS */}
            {data!.map((feed, index) => (
              <AdminFeed key={index} feed={feed as IFeed} />
            ))}
          </div>
        )}
      </div>
      {showForm && <FeedForm setOpen={setShowForm} />}
    </>
  );
};

export default AdminFeedContainer;
