import React, { useState, useEffect } from "react";
import {
    Navbar,
    Nav,
    Dropdown,
    ButtonGroup,
    Button,
    Modal,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import { logout } from "../../../services/authService";
import { getAvatarUrl } from "../../../utils/Constant";
import logoutIllustration from "../../../assets/images/logout.png";

function validName(fullName) {
    if (!fullName) return "Admin";
    const nameArray = fullName.split(" ");
    const firstTwoWords = nameArray.slice(0, 2).join(" ");
    return firstTwoWords;
}

function getDateNow() {
    const days = [
        "Minggu",
        "Senin",
        "Selasa",
        "Rabu",
        "Kamis",
        "Jumat",
        "Sabtu",
    ];
    const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "Mei",
        "Jun",
        "Jul",
        "Agu",
        "Sep",
        "Okt",
        "Nov",
        "Des",
    ];

    const now = new Date();
    const dayName = days[now.getDay()];
    const day = String(now.getDate()).padStart(2, "0");
    const monthName = months[now.getMonth()];
    const year = now.getFullYear();

    return `${dayName}, ${day} ${monthName} ${year}`;
}

const AdminNavbar = () => {
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const [userData, setUserData] = useState({
        name: "Admin",
        email: "",
        picture: null,
    });

    const loadUserData = () => {
        try {
            const stored = localStorage.getItem("user");
            if (stored) {
                setUserData(JSON.parse(stored));
            }
        } catch (error) {
            console.error("Error parsing user data:", error);
        }
    };

    useEffect(() => {
        loadUserData();

        const handleStorageChange = () => {
            loadUserData();
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
            <Navbar bg="ts" className="border-bottom">
                <Navbar.Brand href="#" className="px-4 d-flex items-center">
                    <div>
                        <span className="fw-bold text-navy">
                            {getDateNow()}
                        </span>
                        <span
                            className="fw-light text-grey d-block"
                            style={{ fontSize: "14px" }}
                        >
                            CMS Attendance & Logbook System
                        </span>
                    </div>
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="navbar-nav" />
                <Navbar.Collapse id="navbar-nav">
                    <Dropdown
                        as={ButtonGroup}
                        align="end"
                        className="ms-auto me-4 rounded rounded-35"
                    >
                        <Button
                            variant="white"
                            className="d-flex align-items-center"
                        >
                            <img
                                src={getAvatarUrl(userData)}
                                alt="profile"
                                style={{
                                    objectFit: "cover",
                                    height: "24px",
                                    width: "24px",
                                    borderRadius: "100%",
                                }}
                                className="me-2"
                                onError={(e) => {
                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                        userData.name || "Admin"
                                    )}&background=0D8ABC&color=fff&size=128`;
                                }}
                            />
                            <span
                                className="truncate text-start"
                                style={{ maxWidth: "112px" }}
                            >
                                {validName(userData.name)}
                            </span>
                        </Button>

                        <Dropdown.Toggle
                            split
                            variant="white"
                            className="border-start"
                            id="dropdown-split-basic"
                        />

                        <Dropdown.Menu>
                            <Dropdown.Item as={Link} to="/admin/profile">
                                Profile
                            </Dropdown.Item>
                            <Dropdown.Item onClick={handleShow}>
                                Logout
                            </Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </Navbar.Collapse>
            </Navbar>

            <Modal show={show} onHide={handleClose} centered>
                <Modal.Body className="p-4 d-flex flex-column items-center">
                    <h4 className="mb-4 fw-bold text-dark">
                        Time to <span className="text-red">logout</span>?
                    </h4>
                    <img src={logoutIllustration} alt="" />
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

export default AdminNavbar;
