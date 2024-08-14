const Footer = () => {
  return (
    <div className='w-full flex flex-col items-center mt-40 gap-5 bg-black bg-opacity-50 p-5 text-center'>
      <button
        onClick={() => window.open('https://www.fiit.stuba.sk/', '_blank')}
        className='rounded-md overflow-hidden'
      >
        <img
          className='w-52'
          src='/assets/static/fiit-logo.png'
          alt='FIIT Logo'
        />
      </button>
      <p className='text-lg text-zinc-200 dark:text-zinc-400'>
        Copyright © 2024 FIIT STU.
      </p>
    </div>
  );
};

export default Footer;
