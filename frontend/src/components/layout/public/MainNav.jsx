import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import logo from '../../../assets/images/logo.png';
import logoWhite from '../../../assets/images/logo-w.png';
import { useLocation, useNavigate } from 'react-router-dom';

const MainNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  const handleScroll = () => {
    if (window.scrollY > 80) {
      setScrolled(true);
    } else {
      setScrolled(false);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  const getNavbarMenu = () => {
    if (location.pathname === '/') {
      return 'd-block w-100';
    } else{
      return 'd-none'
    }
  };

  return (
    <Navbar collapseOnSelect expand="md" className={`position-fixed w-100 ${scrolled ? 'bg-blue' : 'bg-blur'}`} style={{zIndex:"99",top:"0"}}>
        <Container>
          <Navbar.Brand href="/" className='text-white'>
            <img
              alt=""
              src={(location.pathname === '/' || scrolled) ? logoWhite : logo}
              height="32"
              className="d-inline-block align-top"
            />{' '}
          </Navbar.Brand>
          <div className={getNavbarMenu()}>
            <Navbar.Toggle aria-controls="responsive-navbar-nav" />
            <Navbar.Collapse id="responsive-navbar-nav">
              <Nav className="w-100 w-lg-75 justify-content-center">
                <Nav.Link href="#hero" className='text-white me-3'>Home.</Nav.Link>
                <Nav.Link href="#whatis" className='text-white me-3'>What Is.</Nav.Link>
                <Nav.Link href="#feature" className='text-white me-3'>Feature.</Nav.Link>
                <Nav.Link href="#youget" className='text-white me-3'>Benefits.</Nav.Link>
                <Nav.Link onClick={() => navigate("/login")} className='text-white me-3 d-block d-md-none'>Login</Nav.Link>
              </Nav>
              <Nav className='d-none d-lg-flex'>
                <Button onClick={() => navigate("/login")} variant='outline-white' className='btn-nav mx-1 rounded-4 py-2 fs-6' size='lg'>Login</Button>
              </Nav>
            </Navbar.Collapse>
          </div>
        </Container>
      </Navbar>
  );
};

export default MainNav;
