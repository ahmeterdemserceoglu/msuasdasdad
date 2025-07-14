"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";

// Firebase and external libraries
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
  getDocs,
  setDoc,
  serverTimestamp,
  orderBy,
  addDoc,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import { MessageCircle, Check, X, Send } from "lucide-react";

// Project-specific imports
import { useAuth } from "@/app/lib/auth-context";
import { db } from "@/app/lib/firebase"; // Corrected path

// UI Components
import Card, { CardContent, CardHeader, CardTitle } from "@/app/components/ui/Card";
import Button from "@/app/components/ui/Button";
import Input from "@/app/components/ui/Input";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";

// Type definitions
interface UserProfile {
  id: string;
  displayName?: string;
  university?: string;
  photoURL?: string;
  friends?: string[];
}

interface FriendRequest {
  id: string;
  from: string;
  to: string;
  status: 'pending' | 'accepted' | 'rejected';
  fromUser: UserProfile;
}

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: Timestamp; // Consider using a more specific type like firebase.firestore.Timestamp
}

export default function FriendsPage() {
  const { user, firebaseUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<string>("friends");

  useEffect(() => {
    if (authLoading) {
      return; // Wait for authentication to complete
    }
    if (!user) {
      router.push("/login");
      return;
    }

    // Arkadaşlık isteklerini dinle
    // Setting up friend requests listener
    const requestsQuery = query(
      collection(db, "friendRequests"),
      where("to", "==", user.uid),
      where("status", "==", "pending")
    );

    const unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
      console.log('Friend requests snapshot received, size:', snapshot.size);
      snapshot.docs.forEach((doc) => {
        console.log('Friend request document:', doc.id, doc.data());
      });

      const requestsPromises = snapshot.docs.map(async (docSnapshot) => {
        const data = docSnapshot.data();
        console.log('Processing request from:', data.from, 'to:', data.to, 'status:', data.status);
        const fromUserDoc = await getDoc(doc(db, "users", data.from));
        if (fromUserDoc.exists()) {
          return {
            id: docSnapshot.id,
            ...data,
            fromUser: fromUserDoc.data(),
          } as FriendRequest;
        }
        console.log('From user not found:', data.from);
        return null;
      });

      Promise.all(requestsPromises).then((requests) => {
        const filteredRequests = requests.filter((req) => req !== null) as FriendRequest[];
        console.log('Setting friend requests, count:', filteredRequests.length);
        setFriendRequests(filteredRequests);
      });
    });

    // Arkadaşları dinle
    const friendsUnsubscribe = onSnapshot(doc(db, "users", user.uid), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const userData = docSnapshot.data();
        const friendsList = userData.friends || [];

        if (friendsList.length > 0) {
          const friendsPromises = friendsList.map((friendId: string) =>
            getDoc(doc(db, "users", friendId))
          );

          Promise.all(friendsPromises).then((friendDocs) => {
            const friendsData = friendDocs
              .filter((doc) => doc.exists())
              .map((doc) => ({ id: doc.id, ...doc.data() } as UserProfile));
            setFriends(friendsData);
            setDataLoading(false);
          });
        } else {
          setFriends([]);
          setDataLoading(false);
        }
      } else {
        setDataLoading(false);
      }
    });

    return () => {
      unsubscribeRequests();
      friendsUnsubscribe();
    };
  }, [user, router, authLoading]);

  // Mark friend requests as read when viewing requests tab
  useEffect(() => {
    if (selectedTab === 'requests' && user) {
      const markRequestsAsRead = async () => {
        const batch = writeBatch(db);
        const q = query(
          collection(db, 'friendRequests'),
          where('to', '==', user.uid),
          where('status', '==', 'pending'),
          where('read', '==', false)
        );

        try {
          const snapshot = await getDocs(q);
          snapshot.docs.forEach(doc => {
            batch.update(doc.ref, { read: true });
          });
          await batch.commit();
        } catch (error) {
          console.error('Error marking requests as read:', error);
        }
      };

      markRequestsAsRead();
    }
  }, [selectedTab, user]);

  // Seçili arkadaş değiştiğinde mesajları dinle
  useEffect(() => {
    if (!selectedFriend || !user) return;

    const chatId = [user.uid, selectedFriend.id].sort().join("_");
    const messagesQuery = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const msgs: Message[] = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [selectedFriend, user]);

  const handleAcceptRequest = async (requestId: string, fromUserId: string) => {
    if (!user || !firebaseUser) return;

    try {
      const token = await firebaseUser.getIdToken();

      const response = await fetch('/api/friends/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          requestId,
          fromUserId,
          toUserId: user.uid
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Something went wrong');
      }

      // UI'ı anında güncellemek için arkadaş listesini yeniden yükle veya durumu güncelle
      // Bu örnekte, sayfanın yeniden yüklenmesi basit bir çözüm olabilir
      router.refresh();
    } catch (error) {
      console.error("Arkadaşlık isteği kabul edilemedi:", error);
      alert('Arkadaşlık isteği kabul edilirken bir hata oluştu.');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await updateDoc(doc(db, "friendRequests", requestId), {
        status: "rejected",
        rejectedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Arkadaşlık isteği reddedilemedi:", error);
    }
  };

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedFriend || !user) return;

    // Arkadaşlık kontrolü
    if (!friends.some(friend => friend.id === selectedFriend.id)) {
      console.error("Önce arkadaş olmalısınız");
      return;
    }

    const chatId = [user.uid, selectedFriend.id].sort().join("_");

    try {
      // Chat dokümanını oluştur/güncelle
      const chatRef = doc(db, "chats", chatId);
      await setDoc(chatRef, {
        participants: [user.uid, selectedFriend.id],
        lastMessage: newMessage,
        lastMessageTime: serverTimestamp(),
        lastMessageBy: user.uid,
      }, { merge: true });

      // Mesajı ekle
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: newMessage,
        senderId: user.uid,
        timestamp: serverTimestamp(),
      });

      setNewMessage("");
    } catch (error) {
      console.error("Mesaj gönderilemedi:", error);
    }
  };

  if (authLoading || dataLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg font-semibold">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Arkadaşlarım</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Tabs defaultValue="friends" value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="friends">Arkadaşlar</TabsTrigger>
              <TabsTrigger value="requests">
                İstekler {friendRequests.length > 0 && `(${friendRequests.length})`}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="friends">
              <Card>
                <CardHeader>
                  <CardTitle>Arkadaş Listesi</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    {friends.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">
                        Henüz arkadaşınız yok
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {friends.map((friend) => (
                          <div
                            key={friend.id}
                            className={`flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors ${selectedFriend?.id === friend.id ? "bg-gray-100" : ""
                              }`}
                            onClick={() => setSelectedFriend(friend)}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={friend.photoURL} />
                                <AvatarFallback>
                                  {friend.displayName?.[0]?.toUpperCase() || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{friend.displayName}</p>
                                <p className="text-sm text-gray-500">{friend.university}</p>
                              </div>
                            </div>
                            <MessageCircle className="h-5 w-5 text-gray-400" />
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="requests">
              <Card>
                <CardHeader>
                  <CardTitle>Arkadaşlık İstekleri</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    {friendRequests.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">
                        Bekleyen arkadaşlık isteği yok
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {friendRequests.map((request) => (
                          <div
                            key={request.id}
                            className="p-3 border rounded-lg"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarImage src={request.fromUser?.photoURL} />
                                  <AvatarFallback>
                                    {request.fromUser?.displayName?.[0]?.toUpperCase() || "?"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{request.fromUser?.displayName}</p>
                                  <p className="text-sm text-gray-500">
                                    {request.fromUser?.university}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAcceptRequest(request.id, request.from)}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRejectRequest(request.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="lg:col-span-2">
          {selectedFriend ? (
            <Card className="h-[500px] flex flex-col">
              <CardHeader className="border-b">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={selectedFriend.photoURL} />
                    <AvatarFallback>
                      {selectedFriend.displayName?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedFriend.displayName}</p>
                    <p className="text-sm text-gray-500">{selectedFriend.university}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full p-4">
                  <div className="space-y-4">
                    {user && messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderId === user.uid ? "justify-end" : "justify-start"
                          }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${message.senderId === user.uid
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 text-gray-900"
                            }`}
                        >
                          <p>{message.text}</p>
                          <p className="text-xs mt-1 opacity-70">
                            {message.timestamp?.toDate()?.toLocaleTimeString("tr-TR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
              <div className="border-t p-4">
                <form onSubmit={sendMessage} className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Mesajınızı yazın..."
                    className="flex-1"
                  />
                  <Button type="submit">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </Card>
          ) : (
            <Card className="h-[500px] flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-4" />
                <p>Mesajlaşmaya başlamak için bir arkadaş seçin</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
