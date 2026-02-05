import React, { useState, useEffect } from "react";
import { Navbar, ButtonGroup, Dropdown, Button, Modal } from "react-bootstrap";
import { Link } from "react-router-dom";
import { logout } from "../../../services/authService";
import { getAvatarUrl } from "../../../utils/Constant";
import { validName, getDateNow, loadUserData as loadUserFromStorage } from "../../../utils/navbarHelpers";

const AVATAR_SIZE = 24;
const MAX_NAME_WIDTH = "112px";
const SUBTITLE_SIZE = "14px";

const UserNavbar = ({ onToggleSidebar }) => {
    const [show, setShow] = useState(false);
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 992);
    const [userData, setUserData] = useState({ name: "User", email: "" });

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    useEffect(() => {
        const handleResize = () => {
            setIsDesktop(window.innerWidth >= 992);
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const data = loadUserFromStorage();
        if (data) setUserData(data);

        const handleStorageChange = () => {
            const updatedData = loadUserFromStorage();
            if (updatedData) setUserData(updatedData);
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
            window.location.href = "/login";
        } catch (error) {
            console.error("Logout error:", error);
            localStorage.clear();
            window.location.href = "/login";
        }
    };

    return (
        <>
        <Navbar bg="ts" className="border-bottom" expand="lg">
            <Navbar.Brand href="#" className="px-4 d-flex items-center">
                <Button 
                    variant="link" 
                    className="d-lg-none p-0 me-3 text-dark border-0"
                    onClick={onToggleSidebar}
                    aria-label="Toggle sidebar"
                    style={{ background: 'none' }}
                >
                    <i className="bi bi-list fs-3"></i>
                </Button>
                <div>
                    <span className="fw-bold text-navy">{getDateNow()}</span>
                    <span
                        className="fw-light text-grey d-block"
                        style={{ fontSize: SUBTITLE_SIZE }}
                    >
                        Employee Portal
                    </span>
                </div>
            </Navbar.Brand>
            
            {/* Dropdown Profile - Only render on desktop */}
            {isDesktop && (
            <Dropdown
                as={ButtonGroup}
                align="end"
                className="ms-auto me-4 rounded rounded-35"
                style={{ alignSelf: 'center' }}
            >
                <Button
                    variant="white"
                    className="d-flex align-items-center"
                >
                    <img
                        src={getAvatarUrl(userData)}
                        alt="profile"
                        className="rounded-circle me-2"
                        style={{
                            objectFit: "cover",
                                width: `${AVATAR_SIZE}px`,
                                height: `${AVATAR_SIZE}px`,
                            }}
                            onError={(e) => {
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                    userData.name || "User"
                                )}&background=random&color=fff&size=128`;
                            }}
                        />
                        <span
                            className="truncate text-start"
                            style={{ maxWidth: MAX_NAME_WIDTH }}
                        >
                            {validName(userData.name, "User")}
                        </span>
                    </Button>

                    <Dropdown.Toggle
                        split
                        variant="white"
                        className="border-start"
                        id="dropdown-split-basic"
                    />

                    <Dropdown.Menu>
                        <Dropdown.Item as={Link} to="/user/profile">
                            Profile
                        </Dropdown.Item>
                        <Dropdown.Item onClick={handleShow}>
                            Logout
                        </Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
                )}
            </Navbar>
            
            <Modal show={show} onHide={handleClose} centered>
                <Modal.Body className="p-4 d-flex flex-column items-center">
                    <h4 className="mb-4 fw-bold text-dark">
                        Time to <span className="text-red">logout</span>?
                    </h4>
                    <p className="my-3 text-muted fw-light">
                        Confirm logout? We'll be here when you return.
                    </p>
                    <div className="mt-4 w-100 d-flex justify-content-center">
                        <Button
                            variant="outline-muted"
                            className="py-2 px-5 mx-1 rounded-35"
                            onClick={handleClose}
                        >
                            No, I'll stay
                        </Button>
                        <Button
                            variant="red"
                            className="py-2 px-5 mx-1 rounded-35"
                            onClick={handleLogout}
                        >
                            Yes, I'm done
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>
        </>
    );
};

export default UserNavbar;
