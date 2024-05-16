import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import { IEntry } from '../../../utils/interfaces/entry';
import EntryForSwiper from './EntryForSwiper';
import EntryLoading from '../EntryLoading';

interface IEntrySwiperParams {
  isLoading: boolean;
  entries: IEntry[];
  setClickedEntry: (clickedEntry: 'popular' | 'lastAdded' | '') => void;
  clickedEntry: 'popular' | 'lastAdded' | '';
  activeEntryId: string | null;
  type: 'popular' | 'lastAdded';
  reverseDirection?: boolean;
}

const EntrySwiper = ({
  isLoading,
  entries,
  clickedEntry,
  setClickedEntry,
  activeEntryId,
  type,
  reverseDirection = false,
}: IEntrySwiperParams) => {
  return (
    <Swiper
      slidesPerView='auto'
      loop
      autoplay={{
        delay: 5000,
        disableOnInteraction: false,
        reverseDirection,
      }}
      modules={[Autoplay]}
    >
      {isLoading
        ? Array.from({ length: 30 }).map((_, index) => (
            <SwiperSlide className='max-w-52' key={index}>
              <EntryLoading fixedSize />
            </SwiperSlide>
          ))
        : entries.map((entry, index) => (
            <SwiperSlide className='max-w-52' key={index}>
              <EntryForSwiper
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

export default EntrySwiper;
