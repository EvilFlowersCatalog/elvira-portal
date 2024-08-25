import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import EntrySwiper from './EntrySwiper';
import { IEntry } from '../../../../utils/interfaces/entry';
import EntryBoxLoading from '../../../../components/entry/loading/EntryBoxLoading';

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
  return (
    <Swiper
      slidesPerView={'auto'}
      loop={entries.length > 10}
      autoplay={{
        delay: 5000,
        disableOnInteraction: false,
        reverseDirection: type === 'lastAdded',
      }}
      modules={[Autoplay]}
    >
      {isLoading
        ? Array.from({ length: 30 }).map((_, index) => (
            <SwiperSlide className='max-w-52' key={index}>
              <EntryBoxLoading fixedSize />
            </SwiperSlide>
          ))
        : entries.map((entry, index) => (
            <SwiperSlide className='max-w-52' key={index}>
              <EntrySwiper
                clickedEntry={clickedEntry}
                setClickedEntry={setClickedEntry}
                type={type}
                entry={entry}
                isActive={clickedEntry === type && activeEntryId === entry.id}
              />
            </SwiperSlide>
          ))}
    </Swiper>
  );
};

export default SwiperContainer;
