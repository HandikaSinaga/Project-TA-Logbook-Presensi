import { useState, useCallback } from "react";
import { Modal, Button } from "react-bootstrap";
import Cropper from "react-easy-crop";
import toast from "react-hot-toast";

/**
 * ImageCropModal Component
 *
 * Best practice image crop component for profile photos:
 * - Circular crop for profile avatars
 * - Auto-centers image
 * - Maintains aspect ratio
 * - Outputs optimized blob for upload
 * - Max file size validation (2MB default)
 * - Supported formats: JPG, PNG, WebP
 */
const ImageCropModal = ({
    show,
    onHide,
    imageSrc,
    onCropComplete,
    aspectRatio = 1,
    maxFileSize = 2 * 1024 * 1024,
}) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [loading, setLoading] = useState(false);

    const onCropChange = (crop) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom) => {
        setZoom(zoom);
    };

    const onCropAreaChange = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const createImage = (url) =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener("load", () => resolve(image));
            image.addEventListener("error", (error) => reject(error));
            image.setAttribute("crossOrigin", "anonymous");
            image.src = url;
        });

    const getCroppedImg = async (imageSrc, pixelCrop) => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Set canvas size to cropped area
        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        );

        return new Promise((resolve) => {
            canvas.toBlob(
                (blob) => {
                    resolve(blob);
                },
                "image/jpeg",
                0.95
            );
        });
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            const croppedImageBlob = await getCroppedImg(
                imageSrc,
                croppedAreaPixels
            );

            // Validate file size
            if (croppedImageBlob.size > maxFileSize) {
                toast.error(
                    `Ukuran file maksimal ${maxFileSize / (1024 * 1024)}MB`
                );
                return;
            }

            // Convert blob to File object
            const file = new File([croppedImageBlob], "avatar.jpg", {
                type: "image/jpeg",
            });

            onCropComplete(file);
            onHide();
        } catch (error) {
            console.error("Error cropping image:", error);
            toast.error("Gagal memotong gambar");
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        onHide();
    };

    return (
        <Modal show={show} onHide={handleCancel} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>Crop Foto Profil</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div style={{ position: "relative", height: 400 }}>
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspectRatio}
                        cropShape="round"
                        showGrid={false}
                        onCropChange={onCropChange}
                        onZoomChange={onZoomChange}
                        onCropComplete={onCropAreaChange}
                    />
                </div>
                <div className="mt-3">
                    <label htmlFor="zoom" className="form-label">
                        <i className="bi bi-zoom-in me-2"></i>
                        Zoom
                    </label>
                    <input
                        type="range"
                        id="zoom"
                        className="form-range"
                        min={1}
                        max={3}
                        step={0.1}
                        value={zoom}
                        onChange={(e) => setZoom(e.target.value)}
                    />
                </div>
                <div className="alert alert-info mt-3 mb-0">
                    <i className="bi bi-info-circle me-2"></i>
                    <small>
                        Seret gambar untuk mengatur posisi, gunakan slider untuk
                        zoom. Ukuran maksimal {maxFileSize / (1024 * 1024)}MB.
                    </small>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button
                    variant="outline-secondary"
                    onClick={handleCancel}
                    disabled={loading}
                >
                    Batal
                </Button>
                <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" />
                            Memproses...
                        </>
                    ) : (
                        <>
                            <i className="bi bi-check-lg me-2"></i>
                            Simpan
                        </>
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ImageCropModal;
