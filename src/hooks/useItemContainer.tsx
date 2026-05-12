import { useState } from 'react';

export interface IItemContainerList<T = any> {
  items: T[];
  setItems: (items: T[]) => void;
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
  isError: boolean;
  setIsError: (v: boolean) => void;
  page: number;
  setPage: (v: number) => void;
  maxPage: number;
  setMaxPage: (v: number) => void;
  loadingNext: boolean;
  setLoadingNext: (v: boolean) => void;
  reset: () => void;
}

const useItemContainer = <T = any>(initialLoading = true): IItemContainerList<T> => {
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(initialLoading);
  const [isError, setIsError] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [maxPage, setMaxPage] = useState<number>(0);
  const [loadingNext, setLoadingNext] = useState<boolean>(false);

  const reset = () => {
    setPage(0);
    setItems([]);
    setIsLoading(true);
  };

  return {
    items, setItems,
    isLoading, setIsLoading,
    isError, setIsError,
    page, setPage,
    maxPage, setMaxPage,
    loadingNext, setLoadingNext,
    reset,
  };
};

export default useItemContainer;
