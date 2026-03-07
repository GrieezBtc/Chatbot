import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  onAuthStateChanged, 
  signOut 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  serverTimestamp,
  doc,
  setDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { 
  MessageSquare, 
  Image as ImageIcon, 
  BookOpen, 
  User as UserIcon, 
  LogOut, 
  Send, 
  Mic, 
  Moon, 
  Sun, 
  Menu,
  Lock,
  ShieldCheck,
  Megaphone,
  Users
} from 'lucide-react';

// YOUR ACTUAL FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyAhiSfSaWNVfXZlW4Zqd08fEGWYHzqx3Eg",
  authDomain: "grieezbot.firebaseapp.com",
  databaseURL: "https://grieezbot-default-rtdb.firebaseio.com",
  projectId: "grieezbot",
  storageBucket: "grieezbot.firebasestorage.app",
  messagingSenderId: "711236312178",
  appId: "1:711236312178:web:aecbc2ea940e79a594f6eb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// CHANGE THIS TO YOUR ACTUAL REGISTERED EMAIL
const ADMIN_EMAIL = "your-email@example.com"; 
const appId = "grieezbot"; 

export default function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [messages, setMessages] = useState([]);
  const [broadcast, setBroadcast] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authError, setAuthError] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '' });
  
  const chatEndRef = useRef(null);

  // --- Auth Observer ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAdmin(currentUser?.email === ADMIN_EMAIL);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- Global Broadcast Listener ---
  useEffect(() => {
    const broadcastRef = doc(db, 'artifacts', appId, 'public', 'data', 'announcements', 'latest');
    const unsub = onSnapshot(broadcastRef, (docSnap) => {
      if (docSnap.exists()) setBroadcast(docSnap.data());
    }, (err) => console.error("Broadcast error", err));
    return () => unsub();
  }, []);

  // --- Private Chat Sync ---
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'artifacts', appId, 'users', user.uid, 'messages'),
      orderBy('timestamp', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    }, (err) => console.error("Firestore Error:", err));
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAuthError('');
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      } else {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
      }
    } catch (err) {
      setAuthError(err.message.split(':').pop());
    } finally {
      setLoading(false);
    }
  };

  const sendBroadcast = async () => {
    const msg = prompt("Enter announcement for all users:");
    if (!msg) return;
    const broadcastRef = doc(db, 'artifacts', appId, 'public', 'data', 'announcements', 'latest');
    await setDoc(broadcastRef, {
      message: msg,
      timestamp: serverTimestamp(),
      sender: "GrieezBoy Admin"
    });
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isBusy || !user) return;
    const text = inputValue;
    setInputValue('');
    setIsBusy(true);

    const userMsgRef = collection(db, 'artifacts', appId, 'users', user.uid, 'messages');
    await addDoc(userMsgRef, { text, sender: 'user', timestamp: serverTimestamp() });

    try {
      let responseText = "", type = "text";
      const q = text.toLowerCase();

      if (q.includes("story")) {
        const res = await fetch(`https://eliteprotech-apis.zone.id/story?text=${encodeURIComponent(text)}`);
        const data = await res.json();
        responseText = data.story;
        type = "story";
      } else if (q.includes("image") || q.includes("draw")) {
        const res = await fetch(`https://eliteprotech-apis.zone.id/image?q=${encodeURIComponent(text)}`);
        const data = await res.json();
        responseText = data.images?.[0] || "No image found";
        type = "image";
      } else {
        const res = await fetch(`https://eliteprotech-apis.zone.id/copilot?q=${encodeURIComponent(text)}`);
        const data = await res.json();
        responseText = data.text.replace(/Copilot/gi, "GrieezBot");
      }

      await addDoc(userMsgRef, { text: responseText, sender: 'bot', type, timestamp: serverTimestamp() });
    } catch (err) {
      console.error(err);
    } finally {
      setIsBusy(false);
    }
  };

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-[#0b141a]">
      <div className="text-blue-500 font-black tracking-widest animate-pulse">GRIEEZBOY...</div>
    </div>
  );

  if (!user) return (
    <div className={`h-screen w-full flex items-center justify-center p-4 ${isDarkMode ? 'bg-[#0b141a]' : 'bg-gray-100'}`}>
      <div className={`w-full max-w-md p-8 rounded-3xl shadow-2xl border ${isDarkMode ? 'bg-[#111b21] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg rotate-3">
            <Lock className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-black italic uppercase">GrieezBot <span className="text-blue-500">Pro</span></h1>
          <p className="text-[10px] opacity-50 mt-1 uppercase tracking-widest">{isSignUp ? 'New Account' : 'Member Login'}</p>
        </div>
        <form onSubmit={handleAuth} className="space-y-4">
          <input type="email" placeholder="Email" required className={`w-full p-4 rounded-xl border outline-none ${isDarkMode ? 'bg-[#0b141a] border-white/10' : 'bg-gray-50'}`} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          <input type="password" placeholder="Password" required className={`w-full p-4 rounded-xl border outline-none ${isDarkMode ? 'bg-[#0b141a] border-white/10' : 'bg-gray-50'}`} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          {authError && <p className="text-red-400 text-xs text-center">{authError}</p>}
          <button type="submit" className="w-full py-4 bg-blue-600 text-white font-black rounded-xl shadow-lg active:scale-95 transition-all">
            {isSignUp ? 'SIGN UP' : 'LOGIN'}
          </button>
        </form>
        <button onClick={() => setIsSignUp(!isSignUp)} className="w-full mt-6 text-sm font-medium text-blue-500 hover:underline">
          {isSignUp ? 'Back to Login' : "Create an Account"}
        </button>
      </div>
    </div>
  );

  return (
    <div className={`h-screen w-full flex flex-col ${isDarkMode ? 'bg-[#0b141a] text-white' : 'bg-[#f0f2f5] text-gray-900'}`}>
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${isDarkMode ? 'bg-[#111b21] border-r border-white/10' : 'bg-white border-r border-gray-200'}`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-black text-white italic shadow-lg shadow-blue-600/20">GB</div>
            <div>
              <h2 className="font-bold text-sm">GrieezBot Pro</h2>
              <p className="text-[9px] opacity-40 uppercase font-black tracking-tighter">Official Release 2.5</p>
            </div>
          </div>
          <div className="space-y-2 flex-1">
             <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-blue-600/10 text-blue-500 font-bold text-sm">
              <MessageSquare size={18}/> Chat Sessions
            </button>
            {isAdmin && (
              <div className="mt-6 pt-6 border-t border-white/5 space-y-2">
                <p className="text-[10px] font-black text-blue-500 px-3 mb-2 tracking-widest">ADMIN PANEL</p>
                <button onClick={sendBroadcast} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-sm font-medium">
                  <Megaphone size={18}/> Push Broadcast
                </button>
              </div>
            )}
          </div>
          <button onClick={() => signOut(auth)} className="flex items-center gap-3 p-3 rounded-xl text-red-400 hover:bg-red-400/10 font-bold text-sm mt-auto">
            <LogOut size={18}/> Logout Account
          </button>
        </div>
      </aside>

      <nav className={`h-16 px-6 flex items-center justify-between border-b shrink-0 z-10 ${isDarkMode ? 'bg-[#111b21] border-white/10' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-white/5 rounded-lg"><Menu size={22}/></button>
          <div className="font-black italic text-lg tracking-tighter uppercase">GrieezBot <span className="text-blue-500">Pro</span></div>
          {isAdmin && <span className="px-2 py-0.5 rounded bg-blue-600 text-[10px] font-black text-white flex items-center gap-1"><ShieldCheck size={10}/> ADMIN</span>}
        </div>
        <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 hover:bg-white/5 rounded-lg">{isDarkMode ? <Sun size={20}/> : <Moon size={20}/>}</button>
      </nav>

      {broadcast && (
        <div className="bg-blue-600/90 backdrop-blur-md text-white px-6 py-2 text-xs font-bold flex items-center gap-3">
          <Megaphone size={14} className="shrink-0" />
          <marquee className="flex-1">{broadcast.message} — <span className="opacity-70">Posted by {broadcast.sender}</span></marquee>
          <button onClick={() => setBroadcast(null)} className="opacity-60 hover:opacity-100">×</button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 max-w-4xl mx-auto ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md ${msg.sender === 'user' ? 'bg-blue-600' : 'bg-[#202c33]'}`}>
              {msg.sender === 'user' ? <UserIcon size={18} color="white"/> : <span className="font-black italic text-white text-[10px]">GB</span>}
            </div>
            <div className={`max-w-[80%] p-4 rounded-2xl text-sm shadow-sm ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : (isDarkMode ? 'bg-[#111b21] text-white rounded-tl-none border border-white/5' : 'bg-white text-gray-800 border border-gray-200')}`}>
              {msg.type === 'image' ? (
                <div className="space-y-3">
                  <img src={msg.text} className="rounded-xl w-full" alt="AI Generated" />
                </div>
              ) : msg.type === 'story' ? (
                <div className="italic border-l-4 border-blue-500/40 pl-4 py-1 space-y-2">
                  <span className="block font-black not-italic text-blue-500 text-[10px] tracking-widest">GRIEEZBOY ARCHIVES</span>
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                </div>
              ) : <div className="whitespace-pre-wrap">{msg.text}</div>}
            </div>
          </div>
        ))}
        {isBusy && <div className="text-[10px] text-blue-500 font-black uppercase tracking-widest ml-14 animate-pulse">GrieezBot is processing...</div>}
        <div ref={chatEndRef} />
      </div>

      <div className={`p-6 border-t ${isDarkMode ? 'bg-[#111b21] border-white/10' : 'bg-white border-gray-200'}`}>
        <div className={`max-w-4xl mx-auto flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all ${isDarkMode ? 'bg-[#0b141a] border-white/10 focus-within:border-blue-500/50' : 'bg-gray-50 border-gray-200 focus-within:border-blue-500'}`}>
          <button className="text-gray-500 hover:text-blue-500"><Mic size={20}/></button>
          <input className="flex-1 bg-transparent border-none outline-none text-sm font-medium" placeholder="Message GrieezBoy..." value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} />
          <button onClick={handleSend} disabled={isBusy} className={`p-2 rounded-xl transition-all ${inputValue.trim() ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 opacity-20'}`}><Send size={20} /></button>
        </div>
        <p className="text-[9px] text-center mt-3 opacity-20 font-black uppercase tracking-[0.2em]">GrieezBoy Professional Artificial Intelligence Suite</p>
      </div>
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
}

