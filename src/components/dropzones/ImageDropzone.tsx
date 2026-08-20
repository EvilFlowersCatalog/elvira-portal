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
}
const ImageDropzone = ({
  title,
  hint,
  maxSize,
  maxSizeDescription,
  errorMessage,
  value = null,
  setFile,
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
        <div className='w-full h-64 flex flex-col justify-center items-center relative p-5'>
          <button
            className='absolute z-30 top-2 right-2 p-2 hover:bg-white dark:hover:bg-darkGray text-black dark:text-white rounded-md'
            onClick={handleRemoveFile}
            type='button'
          >
            <IoMdClose size={20} />
          </button>
          <span className='uppercase text-lg text-center font-extrabold text-black dark:text-white'>
            {fileName}
          </span>
          <span className='text-sm italic text-center font-extralight text-black dark:text-white'>
            {fileSize}
          </span>
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
