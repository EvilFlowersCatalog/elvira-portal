import { ReactNode } from 'react';

export interface IFeatureParams {
  imgPath: string;
  title: string;
  description: ReactNode;
  left: boolean;
}

const Feature = ({ imgPath, title, description, left }: IFeatureParams) => {
  return (
    <div
      className={`flex flex-col w-full flex-1 items-center ${
        left ? 'lg:items-start' : 'lg:items-end'
      }`}
    >
      <div className='flex gap-10 flex-col xl:flex-row items-center'>
        {/* IMAGE */}
        <div className='w-full md:w-96 p-10 rounded-3xl bg-black dark:bg-white animate-fly-left'>
          <img className='w-full' src={imgPath} alt='SVG Image' />
        </div>

        {/* DESCRIPTION */}
        <div className='text-center p-4 max-w-96 animate-fly-right'>
          <h1 className='text-xl font-extrabold'>{title}</h1>
          <p>{description}</p>
        </div>
      </div>
    </div>
  );
};

export default Feature;
