import NavbarMenu from './menu/NavbarMenu';
import SearchMenu from './menu/SearchMenu';

/**
 * Return Navbar
 * @returns custom navbar for devices bigger than mobile
 */
const Navbar = () => {
  return (
    <header className={'fixed z-30 w-16 h-full'}>
      <div className='relative w-full h-full'>
        {/* Absolute container that is placed relative to parent */}
        <div
          className={`absolute top-0 left-0 h-full py-2 w-16 hover:w-64 bg-darkGray overflow-x-hidden`}
          style={{
            transitionProperty: 'width, background',
            transitionDuration: '0.3s',
          }}
        >
          <NavbarMenu />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
