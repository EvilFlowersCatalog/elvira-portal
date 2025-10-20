import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ICategory } from '../../utils/interfaces/category';
import useGetCategories from '../../hooks/api/categories/useGetCategories';
import ElviraInput from '../inputs/ElviraInput';
import useAppContext from '../../hooks/contexts/useAppContext';

interface ICategoryAutofillParams {
  entryForm: any;
  defaultCategoryId?: string;
  setEntryForm: (entryForm: any) => void;
  single?: boolean;
  setIsSelectionOpen: (isOpen: boolean) => void;
}

const CategoryAutofill = ({
  entryForm,
  setEntryForm,
  defaultCategoryId,
  single = false,
  setIsSelectionOpen
}: ICategoryAutofillParams) => {
  const { stuBorder } = useAppContext();
  const { t } = useTranslation();

  const [inputValue, setInputValue] = useState<string>('');
  const [suggestions, setSuggestions] = useState<ICategory[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [isHovering, setIsHovering] = useState<boolean>(false);

  const getCategories = useGetCategories();

  useEffect(() => {
    (async () => {
      try {
        const { items } = await getCategories({
          paginate: false,
        });
        setCategories(items);
      } catch {
        setCategories([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (defaultCategoryId && categories) {
      const defaultCategory = categories.find((category: ICategory) => category.id === defaultCategoryId);
      if (defaultCategory) {
        setInputValue(defaultCategory.term);
        setEntryForm({
          ...entryForm,
          categories: [{ term: defaultCategory.term, id: defaultCategory.id }],
        });
      }
    }
  }, [defaultCategoryId, categories]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Filter languages based on input
    const filteredSuggestions = categories.filter((category) =>
      category.term.toLowerCase().startsWith(value.toLowerCase())
    );

    setSuggestions(filteredSuggestions);
  };

  const handleSuggestionClick = (category: ICategory) => {
    if (single) {
      setEntryForm({
        ...entryForm,
        categories: [category],
      });
      setInputValue(category.term);
      setIsHovering(false);
      setSuggestions([]); // Hide suggestions after selection
      return;
    }

    setInputValue('');
    const eq = entryForm.categories.filter(
      (item: any) => item.id === category.id
    );

    if (eq.length !== 0) {
      setIsHovering(false);
      setSuggestions([]);
      return;
    }

    const newCategories: ICategory[] = [...entryForm.categories, category];
    setEntryForm({
      ...entryForm,
      categories: newCategories,
    });
    setIsHovering(false);
    setSuggestions([]); // Hide suggestions after selection
  };

  return (
    <div className='w-full relative'>
      <ElviraInput
        className={`bg-white ${suggestions.length > 0 ? 'rounded-b-none' : ''
          }`}
        type='text'
        value={inputValue}
        onChange={handleInputChange}
        placeholder={t('entry.wizard.category')}
        invalidMessage={t('entry.wizard.requiredMessages.lang')}
        onFocus={() => {
          const filteredSuggestions = categories.filter(
            (category) =>
              category.term
                .toLowerCase()
                .startsWith(inputValue.toLowerCase()) &&
              category.term !== inputValue
          );

          setSuggestions(filteredSuggestions);
          setIsSelectionOpen(true);
        }}
        onBlur={() => {
          const category = categories.filter(
            (category) =>
              category.term.toLocaleLowerCase() ===
              inputValue.toLocaleLowerCase()
          );
          if (category.length === 0) {
            setInputValue('');
          } else {
            setInputValue('');
            handleSuggestionClick(category[0]);
          }
          // if we click outside out input no on suggestions
          if (!isHovering) {
            setSuggestions([]);
            setIsSelectionOpen(false);
          }
        }}
      />
      {suggestions.length > 0 && (
        <ul
          className={`absolute top-[60px] rounded-md rounded-t-none ${stuBorder} list-none max-h-40 overflow-y-scroll bg-white dark:bg-gray z-20 w-full
          shadow-[0px_4px_12px_0px_#0000001A] dark:shadow-[0px_4px_12px_0px_#9999991A]`}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {suggestions.map((category, index) => (
            <li
              key={index}
              className='bg-white dark:bg-gray hover:bg-zinc-200 dark:hover:bg-darkGray'
              onClick={() => handleSuggestionClick(category)}
              style={{ padding: '5px', cursor: 'pointer' }}
            >
              {category.term}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CategoryAutofill;
