import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import { User } from '@/app/types';

export async function getUsersByInterviewDate(interviewDate: Date): Promise<User[]> {
  const usersQuery = query(
    collection(db, 'users'),
    where('interviewDate', '==', interviewDate)
  );
  const querySnapshot = await getDocs(usersQuery);
  const users: User[] = [];
  querySnapshot.forEach(doc => {
    users.push({ id: doc.id, ...(doc.data() as User) });
  });
  return users;
}
