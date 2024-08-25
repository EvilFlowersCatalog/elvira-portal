import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import { getFileSize } from '../../utils/func/functions';
import { IoMdClose } from 'react-icons/io';

interface IDragzoneParams {
  title: string;
  hint: string;
  maxSize?: number;
  maxSizeDescription?: string;
  errorMessage: string;
  pdf?: boolean;
  value?: File | null;
  setFile: (file: File | null) => void;
}
const Dropzone = ({
  title,
  hint,
  maxSize,
  maxSizeDescription,
  errorMessage,
  pdf = false,
  value = null,
  setFile,
}: IDragzoneParams) => {
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');

  const onDropAccepted = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    setFileName(file.name ?? 'Image File');
    setFileSize(getFileSize(file.size));
    setFile(file);
  }, []);

  const onDropRejected = useCallback(() => {
    toast.error(errorMessage);
  }, []);

  const handleRemoveFile = () => {
    setFileName('');
    setFileSize('');
    setFile(null);
  };

  useEffect(() => {
    if (value) {
      setFileName(value.name);
      setFileSize(getFileSize(value.size));
    }
  });

  const { getRootProps, getInputProps } = useDropzone({
    onDropAccepted,
    onDropRejected,
    accept: pdf ? { 'application/pdf': [] } : { 'image/*': [] },
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
        className: `w-full h-full flex flex-1 border-4 border-dashed border-spacing-8 border-STUColor rounded-md bg-STUColor hover:bg-opacity-30 bg-opacity-10 text-white duration-200 ${
          fileName ? '' : 'cursor-pointer'
        }`,
      })}
    >
      <input {...getInputProps()} />
      {fileName && fileSize ? (
        <div className='w-full h-64 flex flex-col justify-center items-center relative p-5'>
          <button
            className='absolute z-30 top-2 right-2 p-2 hover:bg-white dark:hover:bg-darkGray text-black dark:text-white rounded-md'
            onClick={handleRemoveFile}
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
        <div className='w-full h-64 flex flex-col justify-center items-center p-5'>
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

export default Dropzone;
