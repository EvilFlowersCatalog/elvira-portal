import { useCallback, MouseEvent, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { IAcquisition } from '../../../../utils/interfaces/acquisition';
import { MdDelete, MdEdit } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import useGetAcquisitions from '../../../../hooks/api/acquisitiions/useGetAcquisitions';
import useCustomEffect from '../../../../hooks/useCustomEffect';
import PageLoading from '../../../../components/page/PageLoading';
import { toast } from 'react-toastify';
import useCreateEntryAcquistion from '../../../../hooks/api/acquisitiions/useCreateEntryAcquistion';
import useRemoveAcquisition from '../../../../hooks/api/acquisitiions/useRemoveAcquisition';

interface IFilesDropzoneParams {
  entryId: string;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}
const FilesDropzone = ({
  entryId,
  isLoading,
  setIsLoading,
}: IFilesDropzoneParams) => {
  const { t } = useTranslation();
  const [acquisitions, setAcquisitions] = useState<IAcquisition[]>([]);
  const [reload, setReload] = useState<boolean>(false);

  const getAcquisitions = useGetAcquisitions();
  const createEntryAcquisition = useCreateEntryAcquistion();
  const removeAcquisition = useRemoveAcquisition();

  useCustomEffect(() => {
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
  }, [reload]);

  const onDropAccepted = useCallback(async (acceptedFiles: File[]) => {
    const newFiles = acceptedFiles;
    const metadata = {
      relation: 'open-access',
    };

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
  }, []);

  const handleRemoveFile = async (e: MouseEvent<SVGElement>, id: string) => {
    e.stopPropagation();
    setIsLoading(true);
    try {
      await removeAcquisition(id);
      toast.success(t('notifications.acquisition.remove.success', { x: id }));
      setReload((prev) => !prev);
    } catch {
      toast.error(t('notifications.acquisition.remove.error', { x: id }));
      setIsLoading(false);
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
        <div className='flex-2 min-h-60 max-h-[500px] rounded-md p-4 bg-zinc-100 dark:bg-darkGray'>
          <PageLoading />
        </div>
      ) : (
        <div
          {...getRootProps({
            className: `flex-2 min-h-60 max-h-[500px] overflow-auto rounded-md p-4 border-4 border-dashed cursor-pointer ${
              isDragActive
                ? 'bg-STUColor bg-opacity-50 border-white'
                : 'bg-zinc-100 dark:bg-darkGray border-transparent'
            }`,
          })}
        >
          <input {...getInputProps()} />
          <span>{t('entry.wizard.files')}</span>
          <table className='w-full table-auto'>
            <thead>
              <tr>
                <th className='px-4 py-2 text-center'>No.</th>
                <th className='px-4 py-2 text-center'>ID</th>
                <th className='px-4 py-2 text-center'>Relation</th>
                <th className='px-4 py-2 text-center'>Mime</th>
                <th className='px-4 py-2 text-center'>Action</th>
              </tr>
            </thead>
            <tbody>
              {acquisitions.map((item, index) => (
                <tr key={index}>
                  <td className='px-4 py-2 text-center'>{index + 1}</td>
                  <td className='px-4 py-2 text-center'>{item.id}</td>
                  <td className='px-4 py-2 text-center'>{item.relation}</td>
                  <td className='px-4 py-2 text-center'>{item.mime}</td>
                  <td className='px-4 py-2 text-center'>
                    <div className='flex justify-center gap-2'>
                      <MdEdit
                        className='cursor-pointer hover:bg-green text-transparent rounded-full p-1 duration-200'
                        color='green'
                        size={25}
                        onClick={(e) => handleEditFile(e, item.id)}
                      />
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
        </div>
      )}
    </>
  );
};

export default FilesDropzone;
