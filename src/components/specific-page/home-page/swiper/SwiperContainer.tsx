import { Swiper, SwiperSlide } from 'swiper/react';
import EntrySwiper from './EntrySwiper';
import { IEntry } from '../../../../utils/interfaces/entry';
import EntryBoxLoading from '../../../items/entry/loading/EntryBoxLoading';
import { Scrollbar } from 'swiper/modules';
import useAppContext from '../../../../hooks/contexts/useAppContext';

interface ISwiperContainerParams {
  isLoading: boolean;
  entries: IEntry[];
  setClickedEntry: (clickedEntry: 'popular' | 'lastAdded' | '') => void;
  clickedEntry: 'popular' | 'lastAdded' | '';
  activeEntryId: string | null;
  type: 'popular' | 'lastAdded';
}

const SwiperContainer = ({
  isLoading,
  entries,
  clickedEntry,
  setClickedEntry,
  activeEntryId,
  type,
}: ISwiperContainerParams) => {
  const { stuColor } = useAppContext();

  return (
    <Swiper
      modules={[Scrollbar]}
      slidesPerView={'auto'}
      scrollbar={{ draggable: true }}
    >
      {isLoading
        ? Array.from({ length: 30 }).map((_, index) => (
            <SwiperSlide className='max-w-52 pb-8' key={index}>
              <EntryBoxLoading fixedSize />
            </SwiperSlide>
          ))
        : entries.map((entry, index) => (
            <SwiperSlide className='max-w-52 pb-8' key={index}>
              <EntrySwiper
                clickedEntry={clickedEntry}
                setClickedEntry={setClickedEntry}
                type={type}
                entry={entry}
                isActive={clickedEntry === type && activeEntryId === entry.id}
              />
            </SwiperSlide>
          ))}
      <style>{`
        .swiper-scrollbar {
          background: rgba(0, 0, 0, 0.1) !important;
          height: 10px !important;
          }
          
        .swiper-scrollbar-drag {
          cursor: pointer !important;
          background-color: rgba(0, 0, 0, 0.5) !important;
          transition: background-color 200ms ease !important;
        }

        .swiper-scrollbar-drag:hover {
          height: 11px !important;
          background-color: ${stuColor} !important;
        }
      `}</style>
    </Swiper>
  );
};

export default SwiperContainer;
