/**
 * Confirmation dialog matching Bootstrap Modal structure
 * Uses direct DOM manipulation for proper centering
 * @param {string} message - Confirmation message
 * @param {Object} options - Configuration options
 * @returns {Promise<boolean>} - Returns true if confirmed, false if cancelled
 */
export const confirmDialog = (message, options = {}) => {
    const {
        title = options.type === "danger"
            ? "Konfirmasi Diperlukan"
            : options.type === "info"
            ? "Mohon Konfirmasi"
            : "Apakah Anda yakin?",
        confirmText = "Ya",
        cancelText = "Batal",
        type = "warning",
    } = options;

    return new Promise((resolve) => {
        const colors = {
            warning: {
                titleColor: "#ffc107",
                confirmBg: "#ffc107",
                confirmHover: "#e0a800",
            },
            danger: {
                titleColor: "#e9342d",
                confirmBg: "#e9342d",
                confirmHover: "#d82721",
            },
            info: {
                titleColor: "#0dcaf0",
                confirmBg: "#0dcaf0",
                confirmHover: "#0aa2c0",
            },
        };

        const color = colors[type] || colors.warning;

        // Create container
        const container = document.createElement("div");
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        // Create backdrop
        const backdrop = document.createElement("div");
        backdrop.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 1040;
        `;

        const cleanup = () => {
            document.body.removeChild(container);
        };

        backdrop.onclick = () => {
            cleanup();
            resolve(false);
        };

        // Create modal content
        const modal = document.createElement("div");
        modal.style.cssText = `
            position: relative;
            width: 500px;
            max-width: 90vw;
            background-color: #fff;
            border-radius: 0.5rem;
            box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
            padding: 1.5rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            z-index: 1050;
        `;

        modal.onclick = (e) => e.stopPropagation();

        // Process title for highlighting
        const titleWords = title.split(" ");
        const titleHTML = titleWords
            .map((word) => {
                const lowerWord = word.toLowerCase();
                const shouldHighlight =
                    lowerWord.includes("hapus") ||
                    lowerWord.includes("delete") ||
                    lowerWord.includes("tolak") ||
                    lowerWord.includes("reject") ||
                    lowerWord.includes("konfirmasi") ||
                    type === "danger";

                if (shouldHighlight && type === "danger") {
                    return `<span style="color: ${color.titleColor}">${word}</span>`;
                }
                return word;
            })
            .join(" ");

        modal.innerHTML = `
            <h4 style="
                margin-bottom: 1rem;
                font-weight: 700;
                color: #212529;
                text-align: center;
                font-size: 1.5rem;
            ">${titleHTML}</h4>
            <p style="
                margin: 0.75rem 0 1.5rem;
                color: #6c757d;
                font-weight: 300;
                text-align: center;
                font-size: 1rem;
                line-height: 1.5;
            ">${message}</p>
            <div style="
                margin-top: 1.5rem;
                width: 100%;
                display: flex;
                justify-content: center;
                gap: 0.5rem;
            ">
                <button id="confirmCancelBtn" style="
                    padding: 0.5rem 2.5rem;
                    background-color: transparent;
                    border: 1px solid #a3a3a3;
                    border-radius: 12px;
                    color: #a3a3a3;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: all 0.15s ease-in-out;
                ">${cancelText}</button>
                <button id="confirmOkBtn" style="
                    padding: 0.5rem 2.5rem;
                    background-color: ${color.confirmBg};
                    border: 1px solid ${color.confirmBg};
                    border-radius: 12px;
                    color: #ffffff;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: all 0.15s ease-in-out;
                ">${confirmText}</button>
            </div>
        `;

        // Add button event listeners
        const cancelBtn = modal.querySelector("#confirmCancelBtn");
        const okBtn = modal.querySelector("#confirmOkBtn");

        cancelBtn.onmouseover = () => {
            cancelBtn.style.backgroundColor = "#a3a3a3";
            cancelBtn.style.color = "#ffffff";
        };
        cancelBtn.onmouseout = () => {
            cancelBtn.style.backgroundColor = "transparent";
            cancelBtn.style.color = "#a3a3a3";
        };
        cancelBtn.onclick = () => {
            cleanup();
            resolve(false);
        };

        okBtn.onmouseover = () => {
            okBtn.style.backgroundColor = color.confirmHover;
            okBtn.style.borderColor = color.confirmHover;
        };
        okBtn.onmouseout = () => {
            okBtn.style.backgroundColor = color.confirmBg;
            okBtn.style.borderColor = color.confirmBg;
        };
        okBtn.onclick = () => {
            cleanup();
            resolve(true);
        };

        // Append to body
        container.appendChild(backdrop);
        container.appendChild(modal);
        document.body.appendChild(container);
    });
};

/**
 * Shorthand for delete confirmation
 */
export const confirmDelete = (itemName = "item ini") => {
    return confirmDialog(`Aksi ini tidak dapat dibatalkan. Lanjutkan?`, {
        title: `Hapus ${itemName}?`,
        confirmText: "Ya, hapus",
        cancelText: "Tidak",
        type: "danger",
    });
};

/**
 * Shorthand for approval confirmation
 */
export const confirmApprove = (message = "Lanjutkan persetujuan?") => {
    return confirmDialog(message, {
        title: "Setujui Aksi",
        confirmText: "Ya, setujui",
        cancelText: "Batal",
        type: "info",
    });
};

/**
 * Shorthand for rejection confirmation
 */
export const confirmReject = (
    message = "Apakah Anda yakin ingin menolak ini?"
) => {
    return confirmDialog(message, {
        title: "Tolak Aksi",
        confirmText: "Ya, tolak",
        cancelText: "Batal",
        type: "danger",
    });
};
