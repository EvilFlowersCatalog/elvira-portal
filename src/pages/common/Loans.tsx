import { useEffect, useState } from 'react';
import { IEntry } from '../../utils/interfaces/entry';
import ItemContainer from '../../components/items/container/ItemContainer';
import { useTranslation } from 'react-i18next';
import useGetLicenses from '../../hooks/api/licenses/useGetLicenses';
import { ILicense } from '../../utils/interfaces/license';
import { AdvancedSearchWrapper } from '../../components/items/container/AdvancedSearch';
import LoansTable from '../../components/items/loans/LoansTable';
import Breadcrumb from '../../components/buttons/Breadcrumb';
import { H1 } from '../../components/primitives/Heading';

const Loans = () => {
  const { t } = useTranslation();
  return (<>
    <Breadcrumb />
    <H1>{t('license.loansPage.title')}</H1>
    <AdvancedSearchWrapper>
      <LoansTable></LoansTable>
    </AdvancedSearchWrapper>
  </>
  );
};

export default Loans;
