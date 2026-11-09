import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import { getFileSize } from '../../utils/func/functions';
import { IoMdClose } from 'react-icons/io';
import useAppContext from '../../hooks/contexts/useAppContext';

interface IDragzoneParams {
  title: string;
  hint: string;
  maxSize?: number;
  maxSizeDescription?: string;
  errorMessage: string;
  value?: File | null;
  setFile: (file: File | null) => void;
  /** Accessible name of the icon-only remove button. */
  removeLabel?: string;
}
const ImageDropzone = ({
  title,
  hint,
  maxSize,
  maxSizeDescription,
  errorMessage,
  value = null,
  setFile,
  removeLabel,
}: IDragzoneParams) => {
  const { umamiTrack } = useAppContext();

  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');

  const onDropAccepted = useCallback((acceptedFiles: File[]) => {
    umamiTrack('Image Dropdown');
    const file = acceptedFiles[0];
    setFileName(file.name ?? 'Image File');
    setFileSize(getFileSize(file.size));
    setFile(file);
  }, []);

  const onDropRejected = useCallback(() => {
    toast.error(errorMessage);
  }, []);

  const handleRemoveFile = () => {
    umamiTrack('Remove Dropdown Image Button');
    setFileName('');
    setFileSize('');
    setFile(null);
  };

  useEffect(() => {
    if (value) {
      setFileName(value.name);
      setFileSize(getFileSize(value.size));
    }
  }, [value]);

  const { getRootProps, getInputProps } = useDropzone({
    onDropAccepted,
    onDropRejected,
    accept: { 'image/*': [] },
    multiple: false,
    maxFiles: 1,
    maxSize,
  });

  return (
    <div
      {...getRootProps({
        onClick: (e) => {
          if (fileName) e.stopPropagation();
        },
        // bg-primary/10 doesn't work for some reason, so using color mix as a workaround
        className: `w-full h-full flex flex-1 border-4 border-dash/ed border-spacing-8 border-primary rounded-md bg-[color:color-mix(in_srgb,var(--color-primary)_10%,transparent)] hover:bg-[color:color-mix(in_srgb,var(--color-primary)_30%,transparent)] text-white duration-200 ${
          fileName ? '' : 'cursor-pointer'
        }`,
      })}>
      <input {...getInputProps()} />
      {fileName && fileSize ? (
        // The cover itself is the preview (rendered underneath by the parent);
        // keep the file details to a small caption so they don't cover it.
        <div className='w-full h-full relative'>
          <button
            className='absolute z-30 top-1 right-1 p-1.5 bg-white/80 hover:bg-white dark:bg-darkGray/80 dark:hover:bg-darkGray text-black dark:text-white rounded-md'
            onClick={handleRemoveFile}
            type='button'
            aria-label={removeLabel}
            title={removeLabel}
          >
            <IoMdClose size={18} />
          </button>
          <div className='absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-[11px] text-white truncate' title={fileName}>
            {fileName} · {fileSize}
          </div>
        </div>
      ) : (
        <div className='w-full h-full flex flex-col justify-center items-center p-5'>
          <span className='uppercase text-2xl text-center font-extrabold text-black dark:text-white'>
            {title}
          </span>
          {hint && (
            <span className='text-sm italic text-center font-extralight text-black dark:text-white'>
              {hint}
            </span>
          )}
          {maxSizeDescription && (
            <span className='text-sm italic text-center font-extralight text-black dark:text-white mt-5'>
              {maxSizeDescription}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageDropzone;
