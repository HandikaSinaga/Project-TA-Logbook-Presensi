import { useState, useEffect } from "react";
import {
    Card,
    Form,
    Button,
    Alert,
    Row,
    Col,
    Image,
    Badge,
} from "react-bootstrap";
import {
    FaUser,
    FaEnvelope,
    FaIdCard,
    FaPhone,
    FaMapMarkerAlt,
    FaLinkedin,
    FaInstagram,
    FaTelegram,
    FaGithub,
    FaTwitter,
    FaFacebook,
    FaLock,
    FaCamera,
} from "react-icons/fa";
import axiosInstance from "../utils/axiosInstance";
import ImageCropModal from "./common/ImageCropModal";
import { getAvatarUrl } from "../utils/Constant";

const ProfileSettings = ({ role = "user" }) => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Form states
    const [editMode, setEditMode] = useState(false);
    const [socialMedia, setSocialMedia] = useState({
        bio: "",
        linkedin: "",
        instagram: "",
        telegram: "",
        github: "",
        twitter: "",
        facebook: "",
    });

    // Password change
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [passwordData, setPasswordData] = useState({
        current_password: "",
        new_password: "",
        confirm_password: "",
    });

    // Avatar upload
    const [showCropModal, setShowCropModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const endpoint = `/${role}/profile`;
            const response = await axiosInstance.get(endpoint);

            const userData = response.data.data || response.data;
            setProfile(userData);

            // Initialize social media form
            setSocialMedia({
                bio: userData.bio || "",
                linkedin: userData.linkedin || "",
                instagram: userData.instagram || "",
                telegram: userData.telegram || "",
                github: userData.github || "",
                twitter: userData.twitter || "",
                facebook: userData.facebook || "",
            });
        } catch (err) {
            setError("Gagal memuat profil");
            console.error("Error fetching profile:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith("image/")) {
                setError("File harus berupa gambar");
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setError("Ukuran file maksimal 5MB");
                return;
            }
            setSelectedImage(file);
            setShowCropModal(true);
        }
    };

    const handleCropComplete = async (croppedFile) => {
        try {
            setUploading(true);
            setError("");
            setSuccess("");

            const formData = new FormData();
            formData.append("avatar", croppedFile);

            const endpoint = `/${role}/profile/avatar`;
            const response = await axiosInstance.post(endpoint, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            // Refresh profile to get the new avatar path from backend
            await fetchProfile();

            setSuccess("Foto profil berhasil diperbarui");

            // Update localStorage with the actual avatar path from backend response
            const avatarPath =
                response.data.data?.avatar || response.data.avatar;
            if (avatarPath) {
                const userFromStorage = JSON.parse(
                    localStorage.getItem("user") || "{}"
                );
                const updatedUser = {
                    ...userFromStorage,
                    avatar: avatarPath,
                };
                localStorage.setItem("user", JSON.stringify(updatedUser));
                window.dispatchEvent(new Event("storage"));
            }
        } catch (err) {
            setError(
                err.response?.data?.message || "Gagal mengupload foto profil"
            );
            console.error("Error uploading avatar:", err);
        } finally {
            setUploading(false);
            setShowCropModal(false);
        }
    };

    const handleUpdateSocialMedia = async (e) => {
        e.preventDefault();
        try {
            setError("");
            setSuccess("");

            const endpoint = `/${role}/profile`;
            await axiosInstance.put(endpoint, socialMedia);

            setSuccess("Media sosial berhasil diperbarui");
            setEditMode(false);
            await fetchProfile();
        } catch (err) {
            setError(
                err.response?.data?.message || "Gagal memperbarui media sosial"
            );
            console.error("Error updating social media:", err);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();

        if (passwordData.new_password !== passwordData.confirm_password) {
            setError("Password baru tidak cocok");
            return;
        }

        if (passwordData.new_password.length < 6) {
            setError("Password minimal 6 karakter");
            return;
        }

        try {
            setError("");
            setSuccess("");

            const endpoint = `/${role}/profile/password`;
            await axiosInstance.put(endpoint, {
                current_password: passwordData.current_password,
                new_password: passwordData.new_password,
            });

            setSuccess("Password berhasil diubah");
            setShowPasswordForm(false);
            setPasswordData({
                current_password: "",
                new_password: "",
                confirm_password: "",
            });
        } catch (err) {
            setError(err.response?.data?.message || "Gagal mengubah password");
            console.error("Error changing password:", err);
        }
    };

    if (loading) {
        return (
            <div
                className="d-flex justify-content-center align-items-center"
                style={{ minHeight: "400px" }}
            >
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (!profile) {
        return <Alert variant="danger">Profil tidak ditemukan</Alert>;
    }

    return (
        <div className="profile-settings-container">
            <h2 className="mb-4">
                <FaUser className="me-2" />
                Pengaturan Profil
            </h2>

            {error && (
                <Alert
                    variant="danger"
                    dismissible
                    onClose={() => setError("")}
                >
                    {error}
                </Alert>
            )}
            {success && (
                <Alert
                    variant="success"
                    dismissible
                    onClose={() => setSuccess("")}
                >
                    {success}
                </Alert>
            )}

            <Row>
                {/* Profile Card */}
                <Col lg={4} className="mb-4">
                    <Card className="shadow-sm">
                        <Card.Body className="text-center">
                            <div className="position-relative d-inline-block mb-3">
                                <Image
                                    src={getAvatarUrl(profile)}
                                    roundedCircle
                                    style={{
                                        width: "150px",
                                        height: "150px",
                                        objectFit: "cover",
                                    }}
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                            profile.name
                                        )}&background=random&size=150`;
                                    }}
                                />
                                <label
                                    htmlFor="avatar-upload"
                                    className="position-absolute bottom-0 end-0 btn btn-primary btn-sm rounded-circle"
                                    style={{
                                        width: "40px",
                                        height: "40px",
                                        cursor: "pointer",
                                    }}
                                    title="Ubah foto profil"
                                >
                                    <FaCamera />
                                </label>
                                <input
                                    id="avatar-upload"
                                    type="file"
                                    accept="image/*"
                                    style={{ display: "none" }}
                                    onChange={handleImageSelect}
                                    disabled={uploading}
                                />
                            </div>

                            <h4 className="mb-1">{profile.name}</h4>
                            <p className="text-muted mb-2">{profile.email}</p>
                            <Badge
                                bg={
                                    role === "admin"
                                        ? "danger"
                                        : role === "supervisor"
                                        ? "warning"
                                        : "primary"
                                }
                                className="mb-3"
                            >
                                {role.toUpperCase()}
                            </Badge>

                            {profile.division && (
                                <div className="mt-3">
                                    <small className="text-muted">Divisi</small>
                                    <p className="mb-0 fw-bold">
                                        {profile.division.name}
                                    </p>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                {/* Profile Information */}
                <Col lg={8}>
                    {/* Admin-Managed Data (Read-Only) */}
                    <Card className="shadow-sm mb-4">
                        <Card.Header className="bg-light">
                            <h5 className="mb-0">
                                <FaIdCard className="me-2" />
                                Informasi Pribadi
                            </h5>
                            <small className="text-muted">
                                Data ini dikelola oleh Admin dan tidak dapat
                                diubah
                            </small>
                        </Card.Header>
                        <Card.Body>
                            <Row>
                                <Col md={6} className="mb-3">
                                    <Form.Label className="text-muted small">
                                        <FaUser className="me-1" /> Nama Lengkap
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={profile.name || "-"}
                                        disabled
                                        className="bg-light"
                                    />
                                </Col>
                                <Col md={6} className="mb-3">
                                    <Form.Label className="text-muted small">
                                        <FaEnvelope className="me-1" /> Email
                                    </Form.Label>
                                    <Form.Control
                                        type="email"
                                        value={profile.email || "-"}
                                        disabled
                                        className="bg-light"
                                    />
                                </Col>
                                <Col md={6} className="mb-3">
                                    <Form.Label className="text-muted small">
                                        <FaIdCard className="me-1" /> NIP
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={profile.nip || "-"}
                                        disabled
                                        className="bg-light"
                                    />
                                </Col>
                                <Col md={6} className="mb-3">
                                    <Form.Label className="text-muted small">
                                        <FaPhone className="me-1" /> Telepon
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={profile.phone || "-"}
                                        disabled
                                        className="bg-light"
                                    />
                                </Col>
                                {profile.periode && (
                                    <Col md={6} className="mb-3">
                                        <Form.Label className="text-muted small">
                                            Periode
                                        </Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={profile.periode}
                                            disabled
                                            className="bg-light"
                                        />
                                    </Col>
                                )}
                                {profile.sumber_magang && (
                                    <Col md={6} className="mb-3">
                                        <Form.Label className="text-muted small">
                                            Sumber Magang
                                        </Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={profile.sumber_magang}
                                            disabled
                                            className="bg-light"
                                        />
                                    </Col>
                                )}
                                {profile.address && (
                                    <Col md={12} className="mb-3">
                                        <Form.Label className="text-muted small">
                                            <FaMapMarkerAlt className="me-1" />{" "}
                                            Alamat
                                        </Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={2}
                                            value={profile.address}
                                            disabled
                                            className="bg-light"
                                        />
                                    </Col>
                                )}
                            </Row>
                        </Card.Body>
                    </Card>

                    {/* Editable: Bio & Social Media */}
                    <Card className="shadow-sm mb-4">
                        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">Media Sosial & Bio</h5>
                            {!editMode && (
                                <Button
                                    size="sm"
                                    variant="light"
                                    onClick={() => setEditMode(true)}
                                >
                                    Edit
                                </Button>
                            )}
                        </Card.Header>
                        <Card.Body>
                            <Form onSubmit={handleUpdateSocialMedia}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Bio / Tentang Saya</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        placeholder="Ceritakan tentang diri Anda..."
                                        value={socialMedia.bio}
                                        onChange={(e) =>
                                            setSocialMedia({
                                                ...socialMedia,
                                                bio: e.target.value,
                                            })
                                        }
                                        disabled={!editMode}
                                    />
                                </Form.Group>

                                <Row>
                                    <Col md={6} className="mb-3">
                                        <Form.Label>
                                            <FaLinkedin className="me-2 text-primary" />
                                            LinkedIn
                                        </Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="https://linkedin.com/in/username"
                                            value={socialMedia.linkedin}
                                            onChange={(e) =>
                                                setSocialMedia({
                                                    ...socialMedia,
                                                    linkedin: e.target.value,
                                                })
                                            }
                                            disabled={!editMode}
                                        />
                                    </Col>
                                    <Col md={6} className="mb-3">
                                        <Form.Label>
                                            <FaGithub className="me-2" />
                                            GitHub
                                        </Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="https://github.com/username"
                                            value={socialMedia.github}
                                            onChange={(e) =>
                                                setSocialMedia({
                                                    ...socialMedia,
                                                    github: e.target.value,
                                                })
                                            }
                                            disabled={!editMode}
                                        />
                                    </Col>
                                    <Col md={6} className="mb-3">
                                        <Form.Label>
                                            <FaInstagram className="me-2 text-danger" />
                                            Instagram
                                        </Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="@username atau URL"
                                            value={socialMedia.instagram}
                                            onChange={(e) =>
                                                setSocialMedia({
                                                    ...socialMedia,
                                                    instagram: e.target.value,
                                                })
                                            }
                                            disabled={!editMode}
                                        />
                                    </Col>
                                    <Col md={6} className="mb-3">
                                        <Form.Label>
                                            <FaTelegram className="me-2 text-info" />
                                            Telegram
                                        </Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="@username"
                                            value={socialMedia.telegram}
                                            onChange={(e) =>
                                                setSocialMedia({
                                                    ...socialMedia,
                                                    telegram: e.target.value,
                                                })
                                            }
                                            disabled={!editMode}
                                        />
                                    </Col>
                                    <Col md={6} className="mb-3">
                                        <Form.Label>
                                            <FaTwitter className="me-2 text-info" />
                                            Twitter / X
                                        </Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="@username atau URL"
                                            value={socialMedia.twitter}
                                            onChange={(e) =>
                                                setSocialMedia({
                                                    ...socialMedia,
                                                    twitter: e.target.value,
                                                })
                                            }
                                            disabled={!editMode}
                                        />
                                    </Col>
                                    <Col md={6} className="mb-3">
                                        <Form.Label>
                                            <FaFacebook className="me-2 text-primary" />
                                            Facebook
                                        </Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="https://facebook.com/username"
                                            value={socialMedia.facebook}
                                            onChange={(e) =>
                                                setSocialMedia({
                                                    ...socialMedia,
                                                    facebook: e.target.value,
                                                })
                                            }
                                            disabled={!editMode}
                                        />
                                    </Col>
                                </Row>

                                {editMode && (
                                    <div className="d-flex gap-2">
                                        <Button type="submit" variant="primary">
                                            Simpan Perubahan
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() => {
                                                setEditMode(false);
                                                setSocialMedia({
                                                    bio: profile.bio || "",
                                                    linkedin:
                                                        profile.linkedin || "",
                                                    instagram:
                                                        profile.instagram || "",
                                                    telegram:
                                                        profile.telegram || "",
                                                    github:
                                                        profile.github || "",
                                                    twitter:
                                                        profile.twitter || "",
                                                    facebook:
                                                        profile.facebook || "",
                                                });
                                            }}
                                        >
                                            Batal
                                        </Button>
                                    </div>
                                )}
                            </Form>
                        </Card.Body>
                    </Card>

                    {/* Password Change */}
                    <Card className="shadow-sm">
                        <Card.Header className="bg-warning d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">
                                <FaLock className="me-2" />
                                Keamanan Akun
                            </h5>
                            {!showPasswordForm && (
                                <Button
                                    size="sm"
                                    variant="dark"
                                    onClick={() => setShowPasswordForm(true)}
                                >
                                    Ubah Password
                                </Button>
                            )}
                        </Card.Header>
                        {showPasswordForm && (
                            <Card.Body>
                                <Form onSubmit={handleChangePassword}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>
                                            Password Saat Ini
                                        </Form.Label>
                                        <Form.Control
                                            type="password"
                                            placeholder="Masukkan password saat ini"
                                            value={
                                                passwordData.current_password
                                            }
                                            onChange={(e) =>
                                                setPasswordData({
                                                    ...passwordData,
                                                    current_password:
                                                        e.target.value,
                                                })
                                            }
                                            required
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Password Baru</Form.Label>
                                        <Form.Control
                                            type="password"
                                            placeholder="Minimal 6 karakter"
                                            value={passwordData.new_password}
                                            onChange={(e) =>
                                                setPasswordData({
                                                    ...passwordData,
                                                    new_password:
                                                        e.target.value,
                                                })
                                            }
                                            required
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>
                                            Konfirmasi Password Baru
                                        </Form.Label>
                                        <Form.Control
                                            type="password"
                                            placeholder="Ketik ulang password baru"
                                            value={
                                                passwordData.confirm_password
                                            }
                                            onChange={(e) =>
                                                setPasswordData({
                                                    ...passwordData,
                                                    confirm_password:
                                                        e.target.value,
                                                })
                                            }
                                            required
                                        />
                                    </Form.Group>
                                    <div className="d-flex gap-2">
                                        <Button type="submit" variant="warning">
                                            Ubah Password
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() => {
                                                setShowPasswordForm(false);
                                                setPasswordData({
                                                    current_password: "",
                                                    new_password: "",
                                                    confirm_password: "",
                                                });
                                            }}
                                        >
                                            Batal
                                        </Button>
                                    </div>
                                </Form>
                            </Card.Body>
                        )}
                    </Card>
                </Col>
            </Row>

            {/* Image Crop Modal */}
            <ImageCropModal
                show={showCropModal}
                imageSrc={selectedImage}
                onHide={() => setShowCropModal(false)}
                onCropComplete={handleCropComplete}
            />
        </div>
    );
};

export default ProfileSettings;
