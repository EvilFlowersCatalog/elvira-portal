interface IButton {
  onClick?: (any: any) => any;
  type?: 'submit';
  children: JSX.Element;
}

/**
 * Returns button
 * @param {IButton}
 * @returns custom button used in global merite
 */
export default function Button({ onClick, type, children }: IButton) {
  return (
    <button
      type={type ?? 'button'}
      className={
        'bg-STUColor rounded-md px-8 hover:px-16 py-2 uppercase text-white font-bold duration-200'
      }
      onClick={onClick}
    >
      {children}
    </button>
  );
}
