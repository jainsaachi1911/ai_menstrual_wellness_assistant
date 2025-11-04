import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => (
  <nav className="sidebar-navbar">
    <ul>
      <li><Link to="/home">Home</Link></li>
      <li><Link to="/login">Login</Link></li>
      <li><Link to="/signup">Signup</Link></li>
      <li><Link to="/user">User</Link></li>
      <li><Link to="/analysis">Analysis</Link></li>
    </ul>
  </nav>
);

export default Navbar;
