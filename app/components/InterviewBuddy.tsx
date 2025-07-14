import { useEffect, useState } from 'react';
import { getUsersByInterviewDate } from '@/app/lib/getUsersByInterviewDate';
import { User } from '@/app/types';

export default function InterviewBuddy() {
  const [users, setUsers] = useState<User[]>([]);
  useEffect(() => {
    const interviewDate = new Date(); // Moved inside useEffect
    const fetchUsers = async () => {
      const users = await getUsersByInterviewDate(interviewDate);
      setUsers(users);
    };
    fetchUsers();
  }, []);

  return (
    <div>
      <h1>Mülakat Arkadaşları</h1>
      {users.length ? (
        users.map(user => (
          <div key={user.uid}>
            <p>{user.displayName}</p>
            <p>{user.email}</p>
            {/* Diğer kullanıcı detayları eklenebilir */}
          </div>
        ))
      ) : (
        <p>Bugün için mülakatları olan kimse yok.</p>
      )}
    </div>
  );
}

