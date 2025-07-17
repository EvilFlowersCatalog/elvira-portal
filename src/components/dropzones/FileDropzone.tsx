import { useCallback, MouseEvent, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { MdDelete, MdEdit } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { GoPlus } from 'react-icons/go';
import useGetAcquisitions from '../../hooks/api/acquisitiions/useGetAcquisitions';
import { IAcquisition } from '../../utils/interfaces/acquisition';
import useCreateEntryAcquistion from '../../hooks/api/acquisitiions/useCreateEntryAcquistion';
import useRemoveAcquisition from '../../hooks/api/acquisitiions/useRemoveAcquisition';
import PageLoading from '../page/PageLoading';
import { uuid } from '../../utils/func/functions';
import useAppContext from '../../hooks/contexts/useAppContext';

interface IFilesDropzoneParams {
  entryId?: string;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  files?: { id: string; relation: string; file: File }[] | null;
  setFiles?:
  | ((files: { id: string; relation: string; file: File }[]) => void)
  | null;
}
const FileDropzone = ({
  entryId,
  isLoading,
  setIsLoading,
  files = null,
  setFiles = null,
}: IFilesDropzoneParams) => {
  const { t } = useTranslation();
  const { stuBg, umamiTrack } = useAppContext();

  const [acquisitions, setAcquisitions] = useState<IAcquisition[]>([]);
  const [reload, setReload] = useState<boolean>(false);

  const getAcquisitions = useGetAcquisitions();
  const createEntryAcquisition = useCreateEntryAcquistion();
  const removeAcquisition = useRemoveAcquisition();

  useEffect(() => {
    if (entryId) {
      (async () => {
        try {
          setIsLoading(true);
          const { items: ea } = await getAcquisitions({
            entry_id: entryId,
          });
          setAcquisitions(ea);
        } catch {
          setAcquisitions([]);
        } finally {
          setIsLoading(false);
        }
      })();
    }
  }, [reload]);

  const onDropAccepted = useCallback(
    async (acceptedFiles: File[]) => {
      umamiTrack('File Dropdown');
      const newFiles = acceptedFiles;
      const metadata = {
        relation: 'open-access',
      };

      if (entryId) {
        setIsLoading(true);

        await Promise.all(
          newFiles.map(async (file) => {
            try {
              // Perform all file uploads concurrently
              const entryAcquisition = new FormData();
              // Append needed variables
              entryAcquisition.append('content', file);
              entryAcquisition.append('metadata', JSON.stringify(metadata));

              // Try to create acquisition
              await createEntryAcquisition(entryAcquisition, entryId);
              toast.success(
                t('notifications.acquisition.add.success', { x: file.name })
              );
            } catch {
              // Show error notification
              toast.error(t('notifications.acquisition.add.error', file.name));
            }
          })
        );

        // Show success notification
        setReload((prev) => !prev);
      } else {
        setFiles!([
          ...files!,
          ...newFiles.map((file) => ({
            id: uuid(),
            relation: 'open-access',
            file,
          })),
        ]);
      }
    },
    [files, entryId]
  );

  const handleRemoveFile = async (e: MouseEvent<SVGElement>, id: string) => {
    umamiTrack('Remove File Dropdown Button');
    e.stopPropagation();

    if (entryId) {
      setIsLoading(true);
      try {
        await removeAcquisition(id);
        toast.success(t('notifications.acquisition.remove.success', { x: id }));
        setReload((prev) => !prev);
      } catch {
        toast.error(t('notifications.acquisition.remove.error', { x: id }));
        setIsLoading(false);
      }
    } else {
      setFiles!(files!.filter((file) => file.id !== id));
    }
  };

  const handleEditFile = (e: MouseEvent<SVGElement>, id: string) => {
    e.stopPropagation();
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDropAccepted,
    accept: { 'application/pdf': [] },
    multiple: true,
  });

  return (
    <>
      {isLoading ? (
        <div className='flex-2 min-h-60 max-h-[500px] rounded-md p-4 bg-slate-200 dark:bg-gray cursor-pointer'>
          <PageLoading />
        </div>
      ) : (
        <div
          {...getRootProps({
            className: `relative flex-2 min-h-60 max-h-[500px] overflow-auto rounded-md p-4 border-4 border-dashed duration-200 cursor-pointer ${isDragActive
                ? `${stuBg} bg-opacity-50 border-white`
                : 'bg-slate-200 dark:bg-gray border-transparent'
              }`,
          })}
        >
          <h2 className='text-lg'>{t('entry.wizard.files')}</h2>
          <input {...getInputProps()} />
          {isDragActive && (
            <div className='absolute top-0 left-0 w-full h-full flex justify-center items-center'>
              {((files && files?.length !== 0) ||
                acquisitions.length !== 0) && (
                  <GoPlus color='white' size={100} />
                )}
            </div>
          )}
          {files === null ? (
            acquisitions.length === 0 ? (
              <div className='flex flex-1 h-full justify-center items-center uppercase font-extrabold text-xl'>
                {t('entry.wizard.pdfHint')}
              </div>
            ) : (
              <table className='w-full table-auto'>
                <thead>
                  <tr>
                    <th className='px-4 py-2 text-left'>ID</th>
                    <th className='px-4 py-2 text-center'>Relation</th>
                    <th className='px-4 py-2 text-center'>Mime</th>
                    <th className='px-4 py-2 text-center'>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {acquisitions.map((item, index) => (
                    <tr key={index}>
                      <td className='px-4 py-2 text-left'>{item.id}</td>
                      <td className='px-4 py-2 text-center'>{item.relation}</td>
                      <td className='px-4 py-2 text-center'>{item.mime}</td>
                      <td className='px-4 py-2 text-center'>
                        <div className='flex justify-center gap-2'>
                          {/* <MdEdit
                            className='cursor-pointer hover:bg-green text-transparent rounded-full p-1 duration-200'
                            color='green'
                            size={25}
                            onClick={(e) => handleEditFile(e, item.id)}
                          /> */}
                          <MdDelete
                            className='cursor-pointer hover:bg-orange-500 text-transparent rounded-full p-1 duration-200'
                            color='red'
                            onClick={(e) => handleRemoveFile(e, item.id)}
                            size={25}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : files.length === 0 ? (
            <div className='flex flex-1 h-full justify-center items-center uppercase font-extrabold text-xl'>
              {t('entry.wizard.pdfHint')}
            </div>
          ) : (
            <table className='w-full table-auto'>
              <thead>
                <tr>
                  <th className='px-4 py-2 text-left'>Name</th>
                  <th className='px-4 py-2 text-center'>Relation</th>
                  <th className='px-4 py-2 text-center'>Mime</th>
                  <th className='px-4 py-2 text-center'>Action</th>
                </tr>
              </thead>
              <tbody>
                {files.map((item, index) => (
                  <tr key={index}>
                    <td className='px-4 py-2 text-left'>{item.file.name}</td>
                    <td className='px-4 py-2 text-center'>{item.relation}</td>
                    <td className='px-4 py-2 text-center'>{item.file.type}</td>
                    <td className='px-4 py-2 text-center'>
                      <div className='flex justify-center'>
                        {/* <MdEdit
                            className='cursor-pointer hover:bg-green text-transparent rounded-full p-1 duration-200'
                            color='green'
                            size={25}
                            onClick={(e) => handleEditFile(e, item.id)}
                          /> */}
                        <MdDelete
                          className='cursor-pointer hover:bg-orange-500 text-transparent rounded-full p-1 duration-200'
                          color='red'
                          onClick={(e) => handleRemoveFile(e, item.id)}
                          size={25}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </>
  );
};

export default FileDropzone;
