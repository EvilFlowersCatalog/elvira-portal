import { useParams } from 'react-router-dom';
import Breadcrumb from '../../../components/common/Breadcrumb';
import useCustomEffect from '../../../hooks/useCustomEffect';
import useGetEntryDetail from '../../../hooks/api/entries/useGetEntryDetail';
import { ChangeEvent, useState } from 'react';
import { IEntryNew } from '../../../utils/interfaces/entry';
import PageLoading from '../../../components/page/PageLoading';
import { useTranslation } from 'react-i18next';
import useAppContext from '../../../hooks/contexts/useAppContext';
import ElviraInput from '../../../components/common/ElviraInput';
import { Checkbox } from '@mui/material';
import { IoHelpCircleOutline } from 'react-icons/io5';
import ElviraTextarea from '../../../components/common/ElviraTextarea';
import Button from '../../../components/common/Button';

const AdminEditEntry = () => {
  const { t } = useTranslation();
  const { setEditingEntryTitle, STUColor } = useAppContext();
  const { 'entry-id': id } = useParams();
  const [entry, setEntry] = useState<IEntryNew | null>(null);
  const [additionalData] = useState<{ name: string }[]>([
    { name: 'Vydavateľstvo' },
    { name: 'Rok vydania' },
    { name: 'Jazyk' },
    { name: 'Počet exemplárov' },
  ]);
  const [configurations] = useState<{ name: string }[]>([
    { name: 'Stiahnutie' },
    { name: 'Zdieľanie' },
    { name: 'Tlač' },
    { name: 'Anotácie' },
    { name: 'OCR' },
    { name: 'DRM' },
  ]);

  const getEntryDetail = useGetEntryDetail();

  useCustomEffect(() => {
    try {
      (async () => {
        if (id) {
          const { response: entryDetail } = await getEntryDetail(id);
          setEditingEntryTitle(entryDetail.title);

          setEntry({
            title: entryDetail.title,
            authors: entryDetail.authors,
            feeds: entryDetail.feeds.map((feed) => feed.id),
            summary: entryDetail.summary,
            language_code: entryDetail.language?.code ?? '',
            identifiers: entryDetail.identifiers,
            citation: entryDetail.citation,
            published_at: entryDetail.published_at,
            publisher: entryDetail.publisher,
            image: entryDetail.thumbnail,
          });
        }
      })();
    } catch {
      setEntry(null);
    }
  }, [id]);

  return (
    <div className='flex flex-col flex-1'>
      <Breadcrumb />
      {!entry ? (
        <PageLoading />
      ) : (
        <form
          className='flex flex-col flex-1 p-4 pt-0 gap-4'
          onSubmit={() => {}}
        >
          <div className='flex flex-1 flex-col xl:flex-row gap-4'>
            {/* First column */}
            <div className='flex flex-col flex-2 gap-4'>
              {/* First row, first column */}
              <div className='bg-darkGray rounded-md p-4'>
                <span>Title of the entry</span>
                <ElviraInput
                  onChange={() => {}}
                  placeholder={'Title'}
                  value={''}
                  required
                />
              </div>

              {/* Second row, first column */}
              <div className='flex flex-col md:flex-row bg-darkGray gap-4 rounded-md p-4'>
                {/* Image */}
                <div className='flex justify-center'>
                  <div className='bg-gray border border-white w-60 md:h-full h-72 rounded-md'></div>
                </div>

                {/* Information */}
                <div className='flex flex-col flex-2'>
                  <div className='flex flex-col gap-4'>
                    <span>Additional data</span>
                    {additionalData.map((item, index) => (
                      <ElviraInput
                        key={index}
                        onChange={() => {}}
                        placeholder={item.name}
                        value={''}
                      />
                    ))}
                  </div>
                </div>
              </div>
              {/* Third row, first column */}
              <div className='flex flex-col xxl:flex-row bg-darkGray p-4 rounded-md gap-4'>
                {/* Identifiers */}
                <div className='flex flex-1 flex-col'>
                  <span>Identifiers</span>
                  <div className='flex flex-col gap-4'>
                    <ElviraInput
                      onChange={() => {}}
                      placeholder={'DOI'}
                      value={''}
                    />
                    <ElviraInput
                      onChange={() => {}}
                      placeholder={'ISBN'}
                      value={''}
                    />
                  </div>
                </div>
                <div className='flex flex-col flex-2'>
                  <span>Konfigurácia</span>
                  <div className='bg-gray flex-1 rounded-md grid grid-cols-2 xxl:grid-cols-3 gap-4'>
                    {configurations.map((item, index) => (
                      <div className='flex items-center' key={index}>
                        <Checkbox
                          size='small'
                          sx={{
                            color: STUColor,
                            '&.Mui-checked': {
                              color: STUColor,
                            },
                          }}
                        />
                        <span className='text-sm'>{item.name}</span>
                        <IoHelpCircleOutline
                          className='min-w-10 hidden md:block'
                          size={20}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Forth row, first column */}
              <div className='flex flex-col md:flex-row gap-4'>
                {/* Authors */}
                <div className='min-h-96 flex flex-col flex-1 bg-darkGray rounded-md p-4'>
                  <span>Authors +</span>
                  <div className='flex-1 bg-gray rounded-md'></div>
                </div>
                {/* Feeds */}
                <div className='min-h-96 flex flex-col flex-1 bg-darkGray rounded-md p-4'>
                  <span>Feeds +</span>
                  <div className='flex-1 bg-gray rounded-md'></div>
                </div>
                {/* Categories */}
                <div className='min-h-96 flex flex-col flex-1 bg-darkGray rounded-md p-4'>
                  <span>Categories +</span>
                  <div className='flex-1 bg-gray rounded-md'></div>
                </div>
              </div>
            </div>
            {/* Second column */}
            <div className='flex flex-col flex-1 gap-4'>
              <div className='flex-1 min-h-60 bg-darkGray rounded-md p-4'>
                <span>Files</span>
              </div>
              <div className='flex flex-col flex-1 min-h-60 bg-darkGray rounded-md p-4'>
                <span>Summary</span>
                <textarea
                  className='bg-gray outline-none resize-none flex-1 p-2 rounded-md'
                  placeholder='Summary'
                />
              </div>
              <div className='flex flex-col min-h-96 flex-3 bg-darkGray rounded-md p-4'>
                <span>Citation - BiBTeX</span>
                <textarea
                  className='bg-gray outline-none resize-none flex-1 p-2 rounded-md'
                  placeholder='Citation'
                />
              </div>
            </div>
          </div>
          <div className='flex justify-center'>
            <Button type='submit'>
              <span>Edit</span>
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AdminEditEntry;
