import { useEffect, useState } from 'react';
import { IEntryNewForm } from '../../../utils/interfaces/entry';
import Breadcrumb from '../../../components/common/Breadcrumb';
import FirstStep from './components/steps/FirstStep';
import SecondStep from './components/steps/SecondStep';
import ThirdStep from './components/steps/ThirdStep';
import FourthStep from './components/steps/FourthStep';
import FifthStep from './components/steps/FifthStep';

const steps = [
  FirstStep, // Step 1: DOI & ISBN
  SecondStep, // Step 2: ADDITIONAL DATA
  ThirdStep, // Step 3: AUTHORS & FEEDS
  FourthStep, // Step 4: CITATION
  FifthStep, // Step 5: IMAGE & PDF
];

const AdminAddEntry = () => {
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [entryForm, setEntryForm] = useState<IEntryNewForm>({
    title: '',
    authors: [{ name: '', surname: '' }],
    feeds: [],
    summary: '',
    identifiers: {
      doi: '',
      isbn: '',
    },
    categories: [],
    citation: '',
    published_at: '',
    publisher: '',
  });

  const StepComponent = steps[stepIndex];

  useEffect(() => {
    console.log(entryForm);
  }, [entryForm]);

  return (
    <>
      <Breadcrumb />
      <div className='flex flex-col flex-1 items-center overflow-auto p-4'>
        <div className='flex-1 flex w-full justify-center items-center'>
          <div className='w-full h-fit md:w-2/3 lg:w-4/6 xl:w-3/5 xxl:w-2/5 flex flex-col justify-center items-center gap-4 bg-zinc-100 dark:bg-darkGray p-11 rounded-md'>
            <StepComponent
              entryForm={entryForm}
              setEntryForm={setEntryForm}
              stepIndex={stepIndex}
              setStepIndex={setStepIndex}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminAddEntry;
