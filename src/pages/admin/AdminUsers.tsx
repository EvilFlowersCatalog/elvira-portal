import { useEffect, useState } from 'react';
import { IUser, IUsersList } from '../../utils/interfaces/user';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { useTranslation } from 'react-i18next';
import useGetUsers from '../../hooks/api/users/useGetUsers';
import Breadcrumb from '../../components/buttons/Breadcrumb';

const AdminUsers = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [users, setUsers] = useState<IUser[]>([]);

  const getUsers = useGetUsers();
  
  useEffect(() => {
    // get users
    (async () => {
      try {
        const { items } = await getUsers();
        setUsers([...(users ?? []), ...items]);
      } catch {
        // if there was error set to true
        setIsError(true);
      } finally {
        // after everything set false
        setIsLoading(false);
      }
    })();

  }, [])

  return (
    <>
      <Breadcrumb />
      <TableContainer className='m-4 flex justify-center bg-zinc-200 dark:bg-darkGray rounded-lg'>
        <Table sx={{ minWidth: 650 }} aria-label='simple table'>
          <TableHead>
            <TableRow>
              <TableCell className='dark:text-white'>{t('users.userName')}</TableCell>
              <TableCell className='dark:text-white'>{t('users.firstName')}</TableCell>
              <TableCell className='dark:text-white'>{t('users.lastName')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user, index) => (
              <TableRow
                key={index}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell className='dark:text-white'>{user.username}</TableCell>
                <TableCell className='dark:text-white'>{user.name}</TableCell>
                <TableCell className='dark:text-white'>{user.surname}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  )
}

export default AdminUsers;
