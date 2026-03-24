import React, { useState, useEffect, useMemo } from 'react';
import { auth, googleProvider, db } from './firebase';
import { signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const ADMIN_EMAILS = ["ginaline.lopez@neu.edu.ph", "jcesperanza@neu.edu.ph"];

function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login'); 
  const [logs, setLogs] = useState([]);
  const [countdown, setCountdown] = useState(5);
  const [form, setForm] = useState({ college: '', purpose: 'Reading', type: '' });
  
  const [dateRange, setDateRange] = useState('day'); 
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [adminFilters, setAdminFilters] = useState({ college: 'All', purpose: 'All', type: 'All' });

  const isAdmin = user && ADMIN_EMAILS.includes(user.email);

  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      if (u) { 
        setUser(u); 
        setView('terminal');
        if (ADMIN_EMAILS.includes(u.email)) fetchLogs();
      } 
      else { setView('login'); }
    });
  }, []);

  useEffect(() => {
    let timer;
    if (view === 'success' && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (view === 'success' && countdown === 0) {
      setView('terminal');
      setCountdown(5);
    }
    return () => clearTimeout(timer);
  }, [view, countdown]);

  const fetchLogs = async () => {
    const q = query(collection(db, "visits"), orderBy("timestamp", "desc"));
    const snap = await getDocs(q);
    setLogs(snap.docs.map(doc => ({ 
      ...doc.data(), 
      id: doc.id, 
      date: doc.data().timestamp?.toDate() 
    })));
  };

  const login = () => signInWithPopup(auth, googleProvider);

  const handleLogVisit = async (e) => {
    e.preventDefault();
    if (!form.type || !form.college) return alert("Please select all fields");

    await addDoc(collection(db, "visits"), {
      name: user.displayName,
      email: user.email,
      college: form.college,
      purpose: form.purpose,
      type: form.type,
      timestamp: new Date()
    });
    setView('success');
    if (isAdmin) fetchLogs();
  };

  const filteredData = useMemo(() => {
    return logs.filter(log => {
      const logDate = log.date;
      if (!logDate) return false;

      const now = new Date();
      if (dateRange === 'day') {
        if (logDate.toDateString() !== now.toDateString()) return false;
      } else if (dateRange === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        if (logDate < weekAgo) return false;
      } else if (dateRange === 'custom' && startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59);
        if (logDate < start || logDate > end) return false;
      }

      const matchesCollege = adminFilters.college === 'All' || log.college === adminFilters.college;
      const matchesPurpose = adminFilters.purpose === 'All' || log.purpose === adminFilters.purpose;
      const matchesType = adminFilters.type === 'All' || 
                         (adminFilters.type === 'Employee' ? (log.type === 'Teacher' || log.type === 'Staff') : log.type === 'Student');

      return matchesCollege && matchesPurpose && matchesType;
    });
  }, [logs, dateRange, startDate, endDate, adminFilters]);

  const colors = { 
    darkViolet: '#31043d', 
    lightViolet: '#83069c', 
    gold: '#4d0f4a', 
    glass: 'rgba(255, 255, 255, 0.1)',
    glassDark: 'rgba(0,0,0,0.3)'
  };

  const containerStyle = { 
    background: `linear-gradient(180deg, ${colors.lightViolet} 0%, ${colors.darkViolet} 100%)`, 
    minHeight: '100vh', 
    padding: '20px', 
    color: 'white', 
    fontFamily: 'sans-serif' 
  };

  const cardStyle = { 
    background: colors.glass, 
    backdropFilter: 'blur(10px)', 
    borderRadius: '15px', 
    padding: '20px', 
    marginBottom: '20px', 
    border: '1px solid rgba(207, 33, 216, 0.1)' 
  };

  const inputStyle = { 
    padding: '10px', 
    borderRadius: '8px', 
    border: 'none', 
    marginRight: '10px', 
    background: 'rgba(196, 31, 31, 0.2)', 
    color: 'white' 
  };

  if (view === 'login') return (
    <div style={{...containerStyle, display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center'}}>
       <div style={cardStyle}>
          {}
          <img src="logo.png" width="80" alt="logo"/>
          <h2>NEU Library System</h2>
          <button onClick={login} style={{width: '100%', padding: '15px', background: colors.lightViolet, color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', marginTop: '20px', cursor: 'pointer'}}>Login with Google</button>
       </div>
    </div>
  );

  return (
    <div style={containerStyle}>
      <nav style={{display: 'flex', justifyContent: 'space-between', marginBottom: '30px', alignItems: 'center'}}>
        <h3>NEU Library {view === 'dashboard' ? 'Portal' : 'Terminal'}</h3>
        <div>
          {isAdmin && (
            <button onClick={() => setView(view === 'dashboard' ? 'terminal' : 'dashboard')} style={{marginRight: '10px', background: colors.lightViolet, color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer'}}>
              {view === 'dashboard' ? 'Terminal' : 'Admin Portal'}
            </button>
          )}
          <button onClick={() => auth.signOut()} style={{background: 'rgba(145, 9, 213, 0.5)', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer'}}>Logout</button>
        </div>
      </nav>

      {view === 'dashboard' && isAdmin ? (
        <div style={{maxWidth: '1200px', margin: '0 auto'}}>
          <div style={cardStyle}>
            <h4>Statistics Filters</h4>
            <div style={{display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px'}}>
              <select style={inputStyle} value={dateRange} onChange={e => setDateRange(e.target.value)}>
                <option value="day">Today</option>
                <option value="week">Past 7 Days</option>
                <option value="custom">Custom Range</option>
              </select>
              {dateRange === 'custom' && (
                <>
                  <input type="date" style={inputStyle} onChange={e => setStartDate(e.target.value)} />
                  <input type="date" style={inputStyle} onChange={e => setEndDate(e.target.value)} />
                </>
              )}
              <select style={inputStyle} onChange={e => setAdminFilters({...adminFilters, college: e.target.value})}>
                <option value="All">All Colleges</option>
                <option>College of Engineering and Technology</option>
                <option>College of Computer Studies / Informatics</option>
                <option>College of Business Administration</option>
              </select>
              <select style={inputStyle} onChange={e => setAdminFilters({...adminFilters, type: e.target.value})}>
                <option value="All">All Roles</option>
                <option value="Student">Students</option>
                <option value="Employee">Employees (Teacher/Staff)</option>
              </select>
            </div>
          </div>

          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px'}}>
            <div style={{...cardStyle, textAlign: 'center', borderBottom: `4px solid ${colors.gold}`}}>
              <p style={{opacity: 0.7}}>Total Visitors</p>
              <h1 style={{fontSize: '48px', color: colors.gold}}>{filteredData.length}</h1>
            </div>
            <div style={{...cardStyle, textAlign: 'center'}}>
              <p style={{opacity: 0.7}}>Students</p>
              <h1 style={{fontSize: '32px'}}>{filteredData.filter(d => d.type === 'Student').length}</h1>
            </div>
            <div style={{...cardStyle, textAlign: 'center'}}>
              <p style={{opacity: 0.7}}>Employees</p>
              <h1 style={{fontSize: '32px'}}>{filteredData.filter(d => d.type !== 'Student').length}</h1>
            </div>
          </div>

          <div style={{...cardStyle, height: '350px', marginTop: '20px'}}>
            <h4>College Distribution</h4>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={filteredData}>
                <XAxis dataKey="college" hide />
                <YAxis />
                <Tooltip contentStyle={{backgroundColor: colors.darkViolet, border: 'none'}} />
                <Bar dataKey="name" name="Visitors" fill={colors.gold} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : view === 'success' ? (
        <div style={{textAlign: 'center', marginTop: '50px'}}>
           <div style={{...cardStyle, padding: '50px'}}>
              <h1 style={{color: '#ed0daa'}}>Check-in Successful!</h1>
              <p>Welcome to NEU Library, <b>{user.displayName}!</b></p>
              <p style={{opacity: 0.5, marginTop: '20px'}}>Returning to terminal in {countdown}s</p>
           </div>
        </div>
      ) : (
        <div style={{textAlign: 'center', maxWidth: '450px', margin: '0 auto'}}>
          <img src={user.photoURL} style={{borderRadius: '50%', width: '80px', border: `3px solid ${colors.gold}`}} alt="profile"/>
          <h2>Complete Check-In</h2>
          <form onSubmit={handleLogVisit} style={cardStyle}>
             <select style={{width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px'}} onChange={e => setForm({...form, type: e.target.value})} required>
                <option value="">Select Role</option>
                <option>Student</option><option>Teacher</option><option>Staff</option>
             </select>
             <select style={{width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px'}} onChange={e => setForm({...form, college: e.target.value})} required>
                <option value="">Select College</option>
                <option>College of Engineering and Technology</option>
                <option>College of Computer Studies / Informatics</option>
                <option>College of Business Administration</option>
             </select>
             <select style={{width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '8px'}} onChange={e => setForm({...form, purpose: e.target.value})}>
                <option>Reading</option><option>Research</option><option>Assignment</option>
             </select>
             <button type="submit" style={{width: '100%', padding: '15px', background: colors.lightViolet, color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer'}}>Check In</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;