import React, { useState, useEffect } from 'react';
import { auth, googleProvider, db } from './firebase';
import { signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const ADMIN_EMAIL = "ginaline.lopez@neu.edu.ph";

function App() {
  const [user, setUser] = useState(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [view, setView] = useState('login'); 
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState({ college: 'All', purpose: 'All', type: 'All' });
  const [form, setForm] = useState({ college: 'CEA', purpose: 'Reading Books', isEmployee: false });

  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      if (u) { setUser(u); setView('terminal'); } 
      else { setView('login'); }
    });
  }, []);

  const login = () => signInWithPopup(auth, googleProvider);

  const handleLogVisit = async (e) => {
    e.preventDefault();
    // Logic for "Admin may block entry"
    const q = query(collection(db, "blocked"), where("email", "==", user.email));
    const blockedSnap = await getDocs(q);
    
    if (!blockedSnap.empty) {
      alert("ENTRY DENIED: Your account has been blocked by the Admin.");
      return;
    }

    await addDoc(collection(db, "visits"), {
      name: user.displayName,
      email: user.email,
      college: form.college,
      purpose: form.purpose,
      isEmployee: form.isEmployee,
      timestamp: new Date()
    });
    alert("Welcome to NEU Library!");
  };

  const fetchLogs = async () => {
    const snap = await getDocs(collection(db, "visits"));
    setLogs(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    setView('dashboard');
  };

  const filteredLogs = logs.filter(l => 
    (filter.college === 'All' || l.college === filter.college) &&
    (filter.purpose === 'All' || l.purpose === filter.purpose) &&
    (filter.type === 'All' || (filter.type === 'Employee' ? l.isEmployee : !l.isEmployee))
  );

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("NEU Library Visitor Report", 20, 10);
    doc.autoTable({
      head: [['Name', 'College', 'Purpose', 'Type']],
      body: filteredLogs.map(l => [l.name, l.college, l.purpose, l.isEmployee ? 'Employee' : 'Student'])
    });
    doc.save("NEU_Library_Report.pdf");
  };

  if (view === 'login') return (
    <div style={{ 
      backgroundImage: 'url("purple.jpg")',
      height: '100vh',
      width: '100vw',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'Arial, sans-serif',
      margin: 0,
      padding: 0,backgroundSize: 'cover',           // This stretches the image to fill the screen
      backgroundRepeat: 'no-repeat',     // This stops the image from multiplying
      backgroundPosition: 'center',      // This centers the photo
      overflow: 'hidden'    
    }}>
      {/* This is the white "Card" in the middle */}
      <div style={{ 
        backgroundColor: 'rgba(234, 70, 246, 0.95)', 
        padding: '50px', 
        borderRadius: '15px', 
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        textAlign: 'center',
        maxWidth: '400px',
        width: '90%'
      }}>
        <h1 style={{ color: '#22021d', marginBottom: '10px', fontSize: '28px' }}>NEU Library</h1>
        <p style={{ color: '#333', marginBottom: '30px', fontSize: '18px' }}>Visitor Log System</p>
        
        <button 
          onClick={login} 
          style={{ 
            padding: '15px 30px', 
            fontSize: '18px', 
            backgroundColor: '#3c004d', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px', 
            cursor: 'pointer',
            fontWeight: 'bold',
            width: '100%',
            transition: '0.3s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#220221'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#d60dcc'}
        >
          Login with Google
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', background: '#800496', color: 'white', padding: '15px', borderRadius: '8px' }}>
        <h3>NEU Library System</h3>
        <div>
          {user.email === ADMIN_EMAIL && (
            <button onClick={() => setIsAdminMode(!isAdminMode)} style={{ marginRight: '10px' }}>
              Switch to {isAdminMode ? 'User' : 'Admin'} Role
            </button>
          )}
          <button onClick={() => setView('terminal')}>Terminal</button>
          {isAdminMode && <button onClick={fetchLogs}>Dashboard</button>}
          <button onClick={() => auth.signOut()}>Logout</button>
        </div>
      </nav>

      {view === 'terminal' && (
        <div style={{ maxWidth: '500px', margin: '40px auto', border: '1px solid #270330', padding: '20px', borderRadius: '10px' }}>
          <h2>Visitor Entry Terminal</h2>
          <p>Welcome, <b>{user.displayName}</b> ({user.email})</p>
          <form onSubmit={handleLogVisit}>
            <label>College/Office:</label>
            <select style={{width:'100%', marginBottom:'10px'}} onChange={e => setForm({...form, college: e.target.value})}>
              <option>CEA</option><option>CAS</option><option>COA</option><option>CBA</option><option>CED</option><option>CICS</option>
            </select>
            <label>Purpose:</label>
            <select style={{width:'100%', marginBottom:'10px'}} onChange={e => setForm({...form, purpose: e.target.value})}>
              <option>Reading Books</option><option>Research in Thesis</option><option>Use of Computer</option><option>Doing Assignments</option>
            </select>
            <label>User Type:</label>
            <select style={{width:'100%', marginBottom:'20px'}} onChange={e => setForm({...form, isEmployee: e.target.value === 'Employee'})}>
              <option value="Student">Student</option><option value="Employee">Employee (Teacher/Staff)</option>
            </select>
            <button type="submit" style={{ width: '100%', padding: '10px', background: '#360640', color: 'white' }}>TAP ID / ENTER</button>
          </form>
        </div>
      )}

      {view === 'dashboard' && isAdminMode && (
        <div>
          <h2>Admin Dashboard</h2>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <div style={{ padding: '20px', background: '#e48ef5', borderRadius: '8px', flex: 1 }}>
              <h4>Total Visitors</h4><p style={{ fontSize: '24px' }}>{filteredLogs.length}</p>
            </div>
            <div style={{ padding: '20px', background: '#690974', borderRadius: '8px', flex: 1 }}>
              <h4>Employees</h4><p style={{ fontSize: '24px' }}>{filteredLogs.filter(l => l.isEmployee).length}</p>
            </div>
          </div>

          <div style={{ marginBottom: '20px', border: '1px solid #480551', padding: '15px' }}>
            <h4>Filters</h4>
            <select onChange={e => setFilter({...filter, college: e.target.value})}>
              <option>All Colleges</option><option>CEA</option><option>CAS</option><option>COA</option>
            </select>
            <select onChange={e => setFilter({...filter, type: e.target.value})}>
              <option value="All">All Types</option><option value="Student">Student</option><option value="Employee">Employee</option>
            </select>
            <button onClick={downloadPDF} style={{ marginLeft: '20px' }}>Download PDF Report</button>
          </div>

          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredLogs}>
                <XAxis dataKey="college" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="isEmployee" fill="#2c0433" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
