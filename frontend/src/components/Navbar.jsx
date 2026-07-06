import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <nav className={styles.nav}>
      <span className={styles.brand}>Blog Admin</span>
      <div className={styles.links}>
        <Link to="/" className={pathname === '/' ? styles.active : ''}>All Posts</Link>
        {isAuthenticated && (
          <Link to="/create" className={pathname === '/create' ? styles.active : ''}>New Post</Link>
        )}
        {isAuthenticated ? (
          <>
            <span className={styles.user}>{user?.username}</span>
            <button className={styles.logoutBtn} onClick={handleLogout}>Log Out</button>
          </>
        ) : (
          <Link to="/login" className={pathname === '/login' ? styles.active : ''}>Log In</Link>
        )}
      </div>
    </nav>
  );
}
