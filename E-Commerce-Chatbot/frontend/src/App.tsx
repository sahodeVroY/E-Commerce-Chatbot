import React, { useState, useEffect } from 'react';
import './App.css';
import LoginIllustrationSvg from './assets/login-illustration.svg';

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
}

interface UserProfile {
  email: string;
  name: string;
  address: string;
  isVerified?: boolean;
}

const mockProducts: Product[] = [
  { id: 1, name: 'Wireless Headphones', price: 99.99, image: '/images/Wireless Headphones.jpg', category: 'Electronics', description: 'High-quality wireless headphones with noise cancellation.' },
  { id: 2, name: 'Smart Watch', price: 149.99, image: '/images/Smart Watch.jpg', category: 'Electronics', description: 'Track your fitness and notifications on the go.' },
  { id: 3, name: 'Bluetooth Speaker', price: 59.99, image: '/images/Bluetooth Speaker.jpg', category: 'Electronics', description: 'Portable speaker with deep bass and long battery life.' },
  { id: 4, name: 'VR Headset', price: 299.99, image: '/images/VR Headset.jpg', category: 'Electronics', description: 'Immersive virtual reality experience for games and media.' },
  { id: 5, name: 'Running Shoes', price: 89.99, image: '/images/Running Shoes.jpg', category: 'Fashion', description: 'Lightweight running shoes for all terrains.' },
  { id: 6, name: 'Leather Wallet', price: 39.99, image: '/images/Leather Wallet.jpg', category: 'Fashion', description: 'Premium leather wallet with RFID protection.' },
  { id: 7, name: 'Sunglasses', price: 29.99, image: '/images/Sunglasses.jpg', category: 'Fashion', description: 'Stylish sunglasses with UV protection.' },
  { id: 8, name: 'Backpack', price: 49.99, image: '/images/Backpack.jpg', category: 'Fashion', description: 'Durable backpack for travel and daily use.' },
  { id: 9, name: 'Coffee Maker', price: 79.99, image: '/images/Coffee Maker.jpg', category: 'Home', description: 'Brew delicious coffee with this easy-to-use machine.' },
  { id: 10, name: 'Blender', price: 59.99, image: '/images/Blender.jpg', category: 'Home', description: 'Powerful blender for smoothies and more.' },
  { id: 11, name: 'Air Purifier', price: 129.99, image: '/images/Air Purifier.jpg', category: 'Home', description: 'Keep your air clean and fresh.' },
  { id: 12, name: 'Desk Lamp', price: 24.99, image: '/images/Desk Lamp.jpg', category: 'Home', description: 'LED desk lamp with adjustable brightness.' },
];

const categories = ['All', ...Array.from(new Set(mockProducts.map(p => p.category)))];

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [cart, setCart] = useState<{[id: number]: number}>({});
  const [cartLoading, setCartLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginTab, setLoginTab] = useState<'login' | 'register'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirm, setRegisterConfirm] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMsg, setResetMsg] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileAddress, setProfileAddress] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordChangeMessage, setPasswordChangeMessage] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [showOrders, setShowOrders] = useState(false);
  const [showResendVerificationLink, setShowResendVerificationLink] = useState(false);

  // Load cart from backend on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('http://localhost:3000/api/cart');
        if (res.ok) {
          const data = await res.json();
          setCart(data.cart || {});
        }
      } catch {}
      setCartLoading(false);
    })();
  }, []);

  // Save cart to backend on change
  useEffect(() => {
    if (!cartLoading) {
      fetch('http://localhost:3000/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart }),
      });
    }
  }, [cart, cartLoading]);

  // On mount, check for JWT in localStorage and fetch user profile/orders
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      fetchUserProfile(token);
      fetchOrders(token);
    }

    // Handle email verification from URL
    const params = new URLSearchParams(window.location.search);
    const verificationToken = params.get('token');
    if (verificationToken) {
      (async () => {
        try {
          const res = await fetch(`http://localhost:3000/api/auth/verify-email?token=${verificationToken}`);
          const data = await res.json();
          if (res.ok) {
            alert(data.message);
            // Optionally redirect or update UI to show success
            window.history.replaceState({}, document.title, window.location.pathname); // Clean URL
            // Re-fetch profile to update verification status
            const currentToken = localStorage.getItem('token');
            if (currentToken) fetchUserProfile(currentToken);
          } else {
            alert(data.error || 'Email verification failed.');
          }
        } catch (err) {
          console.error('Email verification request failed:', err);
          alert('Network error during email verification.');
        }
      })();
    }
  }, []);

  const fetchUserProfile = async (token: string) => {
    try {
      const res = await fetch('http://localhost:3000/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setUserProfile(data);
        setProfileName(data.name || '');
        setProfileAddress(data.address || '');
      } else {
        console.error('Failed to fetch user profile');
        // Optionally clear token if it's invalid
        localStorage.removeItem('token');
        setIsLoggedIn(false);
      }
    } catch (err) {
      console.error('Network error fetching user profile:', err);
      // Optionally clear token if there's a network issue
      localStorage.removeItem('token');
      setIsLoggedIn(false);
    }
  };

  const fetchOrders = async (token: string) => {
    try {
      const res = await fetch('http://localhost:3000/api/auth/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      } else {
        console.error('Failed to fetch orders');
        setOrders([]);
      }
    } catch (err) {
      console.error('Network error fetching orders:', err);
      setOrders([]);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage('');
    const token = localStorage.getItem('token');
    if (!token) {
      setProfileMessage('Error: Not logged in.');
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: profileName, address: profileAddress }),
      });
      const data = await res.json();
      if (res.ok) {
        setUserProfile(prev => prev ? { ...prev, name: profileName, address: profileAddress } : null);
        setProfileMessage('Profile updated successfully!');
      } else {
        setProfileMessage(data.error || 'Failed to update profile.');
      }
    } catch (err) {
      console.error('Network error updating profile:', err);
      setProfileMessage('Network error or server unavailable.');
    }
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMessage: Message = { sender: 'user', text: input };
    setMessages((msgs) => [...msgs, userMessage]);
    setInput('');
    // Enhanced client-side bot logic
    let reply = '';

    const lowerCaseMessage = userMessage.text.toLowerCase();

    if (/(recommend|suggest)/i.test(lowerCaseMessage)) {
      const notInCart = mockProducts.filter(p => !cart[p.id]);
      const suggestion = notInCart.length > 0 ? notInCart[Math.floor(Math.random() * notInCart.length)] : null;
      reply = suggestion
        ? `How about trying our "${suggestion.name}"? ${suggestion.description} (Category: ${suggestion.category}, $${suggestion.price.toFixed(2)})`
        : 'You already have all our products in your cart!';
    } else if (/hello|hi|hey/i.test(lowerCaseMessage)) {
      reply = 'Hello! How can I help you today?';
    } else if (/(tell me about|what is|info on|details on) (.+)/i.test(lowerCaseMessage)) {
      const match = lowerCaseMessage.match(/(tell me about|what is|info on|details on) (.+)/i);
      const productNameQuery = match ? match[2].trim() : '';

      const foundProduct = mockProducts.find(p => p.name.toLowerCase().includes(productNameQuery));

      if (foundProduct) {
        reply = `Here are the details for ${foundProduct.name}: ${foundProduct.description} It's in the ${foundProduct.category} category and costs $${foundProduct.price.toFixed(2)}.`;
      } else {
        reply = `Sorry, I couldn't find any details for "${productNameQuery}". Please try another product name.`;
      }
    } else {
      reply = `You said: "${userMessage.text}". I'm here to help with your shopping! If you want product info, try asking "Tell me about [product name]".`;
    }
    setTimeout(() => setMessages((msgs) => [...msgs, { sender: 'bot', text: reply }]), 500);
  };

  const addToCart = (id: number) => {
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => {
      const updated = { ...prev };
      if (updated[id] > 1) updated[id] -= 1;
      else delete updated[id];
      return updated;
    });
  };

  const filteredProducts = mockProducts.filter(product =>
    (selectedCategory === 'All' || product.category === selectedCategory) &&
    product.name.toLowerCase().includes(search.toLowerCase())
  );

  const cartItems = Object.entries(cart).map(([id, qty]) => {
    const product = mockProducts.find(p => p.id === Number(id));
    return product ? { ...product, qty } : null;
  }).filter(Boolean) as (Product & { qty: number })[];

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);

  const clearCart = () => setCart({});

  // Social login handlers (bypass)
  const handleSocialLogin = (provider: string) => {
    setIsLoggedIn(true);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(''); // Clear previous errors

    // Allow immediate login if both fields are empty
    if (!loginEmail && !loginPassword) {
      setIsLoggedIn(true);
      return;
    }

    if (!loginEmail) {
      setLoginError('Please enter your email.');
      return;
    }
    if (!loginPassword) {
      setLoginError('Please enter your password.');
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        setIsLoggedIn(true);
        fetchUserProfile(data.token); // Fetch profile after successful login
        setShowResendVerificationLink(false); // Hide resend link on successful login
      } else if (res.status === 403 && data.error && data.error.includes('Email not verified')) {
        setLoginError(data.error);
        setShowResendVerificationLink(true);
      } else {
        setLoginError(data.error || 'Login failed.');
        setShowResendVerificationLink(false);
      }
    } catch (err) {
      console.error('Login request failed:', err);
      setLoginError('Network error or server unavailable.');
      setShowResendVerificationLink(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUserProfile(null);
    setProfileName('');
    setProfileAddress('');
    setShowProfile(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(''); // Clear previous errors
    setRegisterSuccess('');

    if (!registerEmail) {
      setRegisterError('Please enter your email.');
      return;
    }
    if (!registerPassword) {
      setRegisterError('Please enter a password.');
      return;
    }
    if (registerPassword.length < 6) {
      setRegisterError('Password must be at least 6 characters long.');
      return;
    }
    if (!registerConfirm) {
      setRegisterError('Please confirm your password.');
      return;
    }
    if (registerPassword !== registerConfirm) {
      setRegisterError('Passwords do not match.');
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: registerEmail, password: registerPassword }),
      });
      const data = await res.json();

      if (res.ok) {
        setRegisterSuccess(data.message || 'Registration successful! Please verify your email.');
        setRegisterEmail('');
        setRegisterPassword('');
        setRegisterConfirm('');
        // No automatic login here; user must verify email first
        setTimeout(() => setLoginTab('login'), 3000);
      } else {
        setRegisterError(data.error || 'Registration failed.');
      }
    } catch (err) {
      console.error('Registration request failed:', err);
      setRegisterError('Network error or server unavailable.');
    }
  };

  const handleResendVerificationEmail = async () => {
    if (!loginEmail) {
      setLoginError('Please enter your email to resend verification link.');
      return;
    }
    try {
      const res = await fetch('http://localhost:3000/api/auth/send-verification-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setLoginError(data.message || 'Verification email resent successfully!');
      } else {
        setLoginError(data.error || 'Failed to resend verification email.');
      }
    } catch (err) {
      console.error('Resend verification email request failed:', err);
      setLoginError('Network error or server unavailable.');
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMsg(''); // Clear previous messages

    if (!resetEmail) {
      setResetMsg('Please enter your email.');
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setResetMsg(data.message);
      } else {
        setResetMsg(data.error || 'Failed to send reset link.');
      }
    } catch (err) {
      console.error('Reset request failed:', err);
      setResetMsg('Network error or server unavailable.');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeMessage('');

    if (!oldPassword || !newPassword || !confirmNewPassword) {
      setPasswordChangeMessage('All fields are required.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordChangeMessage('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordChangeMessage('New password must be at least 6 characters long.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setPasswordChangeMessage('Error: Not logged in.');
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();

      if (res.ok) {
        setPasswordChangeMessage('Password changed successfully!');
        setOldPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        setPasswordChangeMessage(data.error || 'Failed to change password.');
      }
    } catch (err) {
      console.error('Password change request failed:', err);
      setPasswordChangeMessage('Network error or server unavailable.');
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Error: Not logged in.');
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/api/auth/profile', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        alert('Account deleted successfully.');
        handleLogout(); // Log out after deletion
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete account.');
      }
    } catch (err) {
      console.error('Account deletion request failed:', err);
      alert('Network error or server unavailable.');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="LoginContainer">
        <div className="LoginLeft">
          <div className="LoginCard">
            <p className="LoginWelcome">Welcome back !!!</p>
            <h2 className="LoginTitle">Sign in</h2>
            <div className="LoginTabs">
              <button className={loginTab === 'login' ? 'active' : ''} onClick={() => setLoginTab('login')}>Login</button>
              <button className={loginTab === 'register' ? 'active' : ''} onClick={() => setLoginTab('register')}>Register</button>
            </div>
            {loginTab === 'login' ? (
              <form className="LoginForm" onSubmit={handleLogin}>
                <label>Email</label>
                <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="Enter your email" />
                <div className="PasswordRow">
                  <label>Password</label>
                  <span className="LoginLink" onClick={() => setShowReset(true)}>Forgot password?</span>
                </div>
                <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="Enter your password" />
                {loginError && <div className="LoginError">{loginError}</div>}
                {showResendVerificationLink && (
                  <div className="LoginError" style={{marginTop: '-10px', cursor: 'pointer'}} onClick={handleResendVerificationEmail}>Click here to resend verification email.</div>
                )}
                <button type="submit" className="LoginBtn">LOGIN</button>
                <div className="SocialLogin">
                  <button type="button" className="GoogleBtn" onClick={() => handleSocialLogin('google')}>Sign in with Google</button>
                  <button type="button" className="GithubBtn" onClick={() => handleSocialLogin('github')}>Sign in with GitHub</button>
                </div>
              </form>
            ) : (
              <form className="LoginForm" onSubmit={handleRegister}>
                <label>Email</label>
                <input type="email" value={registerEmail} onChange={e => setRegisterEmail(e.target.value)} placeholder="Enter your email" />
                <label>Password</label>
                <input type="password" value={registerPassword} onChange={e => setRegisterPassword(e.target.value)} placeholder="Create a password" />
                <label>Confirm Password</label>
                <input type="password" value={registerConfirm} onChange={e => setRegisterConfirm(e.target.value)} placeholder="Confirm your password" />
                {registerError && <div className="LoginError">{registerError}</div>}
                {registerSuccess && <div className="LoginSuccess">{registerSuccess}</div>}
                <button type="submit" className="LoginBtn">Register</button>
              </form>
            )}
            <p className="SignupLink">
              {loginTab === 'login' ? (
                <>I don't have an account? <span className="LoginLink" onClick={() => setLoginTab('register')}>Sign up</span></>
              ) : (
                <>Already have an account? <span className="LoginLink" onClick={() => setLoginTab('login')}>Sign in</span></>
              )}
            </p>
            {/* Password Reset Modal */}
            {showReset && (
              <div className="Ecom-modal-overlay" onClick={() => setShowReset(false)}>
                <div className="Ecom-modal" onClick={e => e.stopPropagation()} style={{maxWidth: 350}}>
                  <button className="Ecom-modal-close" onClick={() => setShowReset(false)}>&times;</button>
                  <h2>Reset Password</h2>
                  <form onSubmit={handleReset} style={{display:'flex',flexDirection:'column',gap:'0.7rem'}}>
                    <label>Email</label>
                    <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} placeholder="Enter your email" />
                    {resetMsg && <div className="LoginSuccess">{resetMsg}</div>}
                    <button type="submit">Send Reset Link</button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="LoginRight">
          <img src={LoginIllustrationSvg} alt="ShopEase Illustration" className="LoginIllustrationSvg" />
        </div>
      </div>
    );
  }

  return (
    <div className="EcomApp">
      <header className="Ecom-header">
        <h1>ShopEase</h1>
        <nav>
          <a href="#" onClick={() => {setShowProfile(false); setShowOrders(false); setShowCheckout(false);}}>Home</a>
          <a href="#" onClick={() => {setShowProfile(false); setShowOrders(false); setShowCheckout(false);}}>Shop</a>
          <a href="#" onClick={() => {setShowProfile(true); setShowOrders(false); setShowCheckout(false);}}>Profile</a>
          <a href="#" onClick={() => {setShowOrders(true); setShowProfile(false); setShowCheckout(false);}}>Orders</a>
          <a href="#" onClick={() => {setShowProfile(false); setShowOrders(false); setShowCheckout(false);}}>Cart ({cartItems.length})</a>
          <button className="LogoutBtn" onClick={handleLogout}>Logout</button>
        </nav>
      </header>
      <main className="Ecom-main">
        {showProfile ? (
          <section className="Ecom-profile-section" style={{ padding: '20px', maxWidth: '600px', margin: 'auto', backgroundColor: '#f9f9f9', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h2>User Profile</h2>
            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label htmlFor="profileEmail" style={{ marginBottom: '5px', fontWeight: 'bold' }}>Email:</label>
                <input type="email" id="profileEmail" value={userProfile?.email || ''} disabled style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label htmlFor="profileName" style={{ marginBottom: '5px', fontWeight: 'bold' }}>Name:</label>
                <input type="text" id="profileName" value={profileName} onChange={e => setProfileName(e.target.value)} style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label htmlFor="profileAddress" style={{ marginBottom: '5px', fontWeight: 'bold' }}>Address:</label>
                <input type="text" id="profileAddress" value={profileAddress} onChange={e => setProfileAddress(e.target.value)} style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
              </div>
              {profileMessage && <div style={{ color: profileMessage.includes('successfully') ? 'green' : 'red' }}>{profileMessage}</div>}
              <button type="submit" style={{ padding: '10px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Update Profile</button>
            </form>

            <h3 style={{ marginTop: '30px', marginBottom: '15px' }}>Change Password</h3>
            <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label htmlFor="oldPassword" style={{ marginBottom: '5px', fontWeight: 'bold' }}>Old Password:</label>
                <input type="password" id="oldPassword" value={oldPassword} onChange={e => setOldPassword(e.target.value)} style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label htmlFor="newPassword" style={{ marginBottom: '5px', fontWeight: 'bold' }}>New Password:</label>
                <input type="password" id="newPassword" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label htmlFor="confirmNewPassword" style={{ marginBottom: '5px', fontWeight: 'bold' }}>Confirm New Password:</label>
                <input type="password" id="confirmNewPassword" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
              </div>
              {passwordChangeMessage && <div style={{ color: passwordChangeMessage.includes('successfully') ? 'green' : 'red' }}>{passwordChangeMessage}</div>}
              <button type="submit" style={{ padding: '10px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Change Password</button>
            </form>

            <h3 style={{ marginTop: '30px', marginBottom: '15px' }}>Account Management</h3>
            <button onClick={handleDeleteAccount} style={{ padding: '10px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Delete Account</button>
          </section>
        ) : showOrders ? (
          <section className="Ecom-orders-section" style={{ padding: '20px', maxWidth: '800px', margin: 'auto', backgroundColor: '#f9f9f9', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h2>My Orders</h2>
            {orders.length === 0 ? (
              <p>You have no orders yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {orders.map(order => (
                  <div key={order.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px', backgroundColor: '#fff' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>Order ID: {order.id}</h4>
                    <p style={{ margin: '0 0 5px 0' }}>Order Date: {new Date(order.orderDate).toLocaleString()}</p>
                    <p style={{ margin: '0 0 10px 0' }}>Total Amount: <b>${order.totalAmount.toFixed(2)}</b></p>
                    <h5 style={{ margin: '0 0 5px 0' }}>Items:</h5>
                    <ul style={{ listStyleType: 'none', padding: '0', margin: '0' }}>
                      {order.items.map((item: any, idx: number) => (
                        <li key={idx} style={{ padding: '5px 0', borderBottom: '1px dashed #eee', display: 'flex', justifyContent: 'space-between' }}>
                          <span>{item.name} x {item.qty}</span>
                          <span>${(item.price * item.qty).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : (
          <section className="Ecom-products-section">
            <div className="Ecom-filters">
              <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="Ecom-search"
              />
            </div>
            <div className="Ecom-products">
              {filteredProducts.map(product => (
                <div className="Ecom-product" key={product.id} onClick={() => setModalProduct(product)} style={{cursor: 'pointer'}}>
                  <img src={product.image} alt={product.name} />
                  <h3>{product.name}</h3>
                  <p>${product.price.toFixed(2)}</p>
                  <p className="Ecom-product-desc">{product.description}</p>
                  <button onClick={e => { e.stopPropagation(); addToCart(product.id); }}>Add to Cart</button>
                </div>
              ))}
            </div>
          </section>
        )}
        <aside className="Ecom-cart">
          <h2>Cart</h2>
          {cartLoading ? <p>Loading cart...</p> : cartItems.length === 0 ? <p>Your cart is empty.</p> : (
            <>
              <ul>
                {cartItems.map(item => (
                  <li key={item.id}>
                    {item.name} x {item.qty} <button onClick={() => removeFromCart(item.id)}>-</button>
                  </li>
                ))}
              </ul>
              <div className="Ecom-cart-total">Total: ${totalPrice.toFixed(2)}</div>
              <div className="Ecom-cart-actions">
                <button className="Ecom-cart-removeall" onClick={clearCart}>Remove All</button>
                <button className="Ecom-cart-checkout" onClick={() => setShowCheckout(true)}>Checkout</button>
              </div>
            </>
          )}
        </aside>
      </main>
      {/* Product Details Modal */}
      {modalProduct && (
        <div className="Ecom-modal-overlay" onClick={() => setModalProduct(null)}>
          <div className="Ecom-modal" onClick={e => e.stopPropagation()}>
            <button className="Ecom-modal-close" onClick={() => setModalProduct(null)}>&times;</button>
            <img src={modalProduct.image} alt={modalProduct.name} className="Ecom-modal-img" />
            <h2>{modalProduct.name}</h2>
            <p className="Ecom-modal-category">Category: {modalProduct.category}</p>
            <p className="Ecom-modal-desc">{modalProduct.description}</p>
            <p className="Ecom-modal-price">${modalProduct.price.toFixed(2)}</p>
            <button onClick={() => { addToCart(modalProduct.id); setModalProduct(null); }}>Add to Cart</button>
          </div>
        </div>
      )}
      {/* Checkout Modal */}
      {showCheckout && (
        <div className="Ecom-modal-overlay" onClick={() => setShowCheckout(false)}>
          <div className="Ecom-modal" onClick={e => e.stopPropagation()}>
            <button className="Ecom-modal-close" onClick={() => setShowCheckout(false)}>&times;</button>
            <h2>Checkout</h2>
            <p>Your total is <b>${totalPrice.toFixed(2)}</b>.</p>
            <p>Thank you for shopping with us!</p>
            <button onClick={() => { setShowCheckout(false); clearCart(); }}>Confirm &amp; Pay</button>
          </div>
        </div>
      )}
      {/* Floating Chatbot Widget */}
      <div className={`Chatbot-float${showChat ? ' open' : ''}`}>
        {showChat ? (
          <div className="Chatbot-window">
            <div className="Chatbot-header">
              <span>Chatbot</span>
              <button onClick={() => setShowChat(false)}>×</button>
            </div>
            <div className="chat-window">
              {messages.map((msg, idx) => (
                <div key={idx} className={msg.sender === 'user' ? 'user-msg' : 'bot-msg'}>
                  <b>{msg.sender === 'user' ? 'You' : 'Bot'}:</b> {msg.text}
                </div>
              ))}
            </div>
            <form onSubmit={sendMessage} className="chat-form">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type your message..."
                className="chat-input"
              />
              <button type="submit">Send</button>
            </form>
          </div>
        ) : (
          <button className="Chatbot-open-btn" onClick={() => setShowChat(true)}>
            💬 Chat
          </button>
        )}
      </div>
    </div>
  );
}

export default App;
