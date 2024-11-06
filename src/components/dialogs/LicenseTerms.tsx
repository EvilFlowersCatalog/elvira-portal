import React from 'react';
import ModalWrapper from '../modal/ModalWrapper';
import { useTranslation } from 'react-i18next';

interface ILicenseTermsParams {
  setOpenLicenseModal: (open: boolean) => void;
}

const LicenseTerms = ({ setOpenLicenseModal }: ILicenseTermsParams) => {
  const { t } = useTranslation();

  return (
    <ModalWrapper
      title={t('login.licenseTitle')}
      buttonLabel=''
      close={setOpenLicenseModal}
    >
      <div className='flex flex-col gap-2 text-black dark:text-white text-left'>
        <h1 className='font-bold text-lg'>LICENCIA NA DOKUMENTY</h1>
        <span>
          V prípade Dokumentov uvedených v Digitálnej knižnici ELVIRA STU (ďalej
          len ELVIRA) týmto udeľuje používateľovi neprenosnú (okrem prípadu, ak
          je to inak stanovené v týchto Podmienkách), nevýhradnú, obmedzenú
          licenciu, aby mohol využívať prístup a používanie Dokumentov
          špecifikovaných v príslušnej sekcii prostredníctvom danej Platformy
          (podlieha licenčným podmienkam na používanie tejto platforme) z alebo
          oprávnené mobliné zariadnie za účelom povoleného použitia v zmysle
          podmienok tejto Licencie. Vyššie uvedená licencia je účinná (i) v
          prípade Dokumentov s obmedzeným prístupom a podliehajúcim autorským
          právam, príp. podmienakm použitia na základe pravidiel LITA autorské
          združenie a (ii) v prípade Dokumentov s Permanentným prístupom na
          permanentnej báze, pochádzajúcim z vydavateľstva SPEKTRUM, príp. iných
          Dokumentov s voľným DRM.
        </span>
        <h1 className='font-bold text-lg'>PRÍSTUP</h1>
        <span>
          Držiteľ licencie môže získať prístup k Dokumentom prostredníctvom
          príslušnej platformi ELVIRA použitím (i) jedného alebo viacerých
          identifikačných hesiel vydaných zo strany STU; (ii) overením IP
          adresy; (iii) prostredníctvom on-line referenčného odkazu schváleného
          zo strany STU; alebo (iv) zakúpenie si prístupového kódu zo strany
          Administrátora STU. Spôsob prístupu k príslušnej platforme ELVIRA sa
          časom môže meniť. Administrátor STU si vyhradzuje právo podľa svojho
          vlastného uváženia upraviť alebo zmeniť identifikačné heslá
          používateľa, a to podľa potreby, alebo ak to vyžadujú dané okolnosti a
          Administrátor STU bude okamžite o tom informovať používateľa.
          Používateľ sa môže rozhodnúť používať proxy servery za účelom
          zabezpečenia vzdialeného prístupu k Dokumentom pre používateľov
          prostredníctvom Oprávnených stránok. Používateľ nemôže poskytnúť
          vzdialený prístup, Administrátor STU je jediný opravnený poskytovať
          takýto prístup používateľov a to iba prostredníctvom bezpečnej metódy
          overovania používateľov. Používate je povinný okamžite informovať
          Administrátora STU, pokiaľ sa nazdáva, že došlo k neoprávnenému
          prístupu k niektorému z Dokumentov.
        </span>
      </div>
    </ModalWrapper>
  );
};

export default LicenseTerms;
