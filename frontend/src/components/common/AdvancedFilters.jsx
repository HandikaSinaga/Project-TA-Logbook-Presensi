import React, { useState, useEffect, useRef } from "react";
import axiosInstance from "../../utils/axiosInstance";

const AdvancedFilters = ({
    filters,
    setFilters,
    selectedUserIds,
    setSelectedUserIds,
    showDivision = true,
    showPeriode = true,
    showUser = true,
    showSumberMagang = true,
    role = "admin", // "admin" or "supervisor"
    externalUsers = null,
    externalDivisions = null
}) => {
    const [divisions, setDivisions] = useState([]);
    const [users, setUsers] = useState([]);

    // Multi-select user filter
    const [userSearch, setUserSearch] = useState("");
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const userRef = useRef(null);

    // Single-select division filter
    const [divisionSearch, setDivisionSearch] = useState("");
    const [divisionDropdownOpen, setDivisionDropdownOpen] = useState(false);
    const [selectedDivision, setSelectedDivision] = useState(null);
    const divisionRef = useRef(null);

    // Single-select periode filter
    const [periodeSearch, setPeriodeSearch] = useState("");
    const [periodeDropdownOpen, setPeriodeDropdownOpen] = useState(false);
    const periodeRef = useRef(null);

    useEffect(() => {
        fetchData();
        
        // Setup click outside listeners
        const handleClickOutside = (event) => {
            if (userRef.current && !userRef.current.contains(event.target)) {
                setUserDropdownOpen(false);
            }
            if (divisionRef.current && !divisionRef.current.contains(event.target)) {
                setDivisionDropdownOpen(false);
                if (!selectedDivision) setDivisionSearch("");
            }
            if (periodeRef.current && !periodeRef.current.contains(event.target)) {
                setPeriodeDropdownOpen(false);
                if (!filters.periode) setPeriodeSearch("");
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [filters.periode, selectedDivision]);

    // Sync selectedDivision with filters.division_id if passed down from outside
    useEffect(() => {
        if (filters.division_id && divisions.length > 0) {
            const div = divisions.find(d => d.id === parseInt(filters.division_id));
            if (div) setSelectedDivision(div);
        } else if (!filters.division_id) {
            setSelectedDivision(null);
        }
    }, [filters.division_id, divisions]);

    const fetchData = async () => {
        try {
            // Fetch users based on role
            if (showUser || showPeriode || showSumberMagang) {
                if (externalUsers !== null) {
                    setUsers(externalUsers);
                } else {
                    const userEndpoint = role === "admin" ? "/admin/users" : "/supervisor/division/members";
                    const userResponse = await axiosInstance.get(userEndpoint);
                    let fetchedUsers = userResponse.data?.data || userResponse.data || [];
                    if (role === "supervisor" && fetchedUsers.users) {
                        fetchedUsers = fetchedUsers.users;
                    }
                    setUsers(Array.isArray(fetchedUsers) ? fetchedUsers : []);
                }
            }

            // Fetch divisions if admin
            if (showDivision && role === "admin") {
                if (externalDivisions !== null) {
                    setDivisions(externalDivisions);
                } else {
                    const divResponse = await axiosInstance.get("/admin/divisions");
                    setDivisions(divResponse.data?.data || divResponse.data || []);
                }
            }
        } catch (error) {
            console.error("Error fetching filter data:", error);
        }
    };

    // Keep data in sync if external props change
    useEffect(() => {
        if (externalUsers !== null) setUsers(externalUsers);
    }, [externalUsers]);

    useEffect(() => {
        if (externalDivisions !== null) setDivisions(externalDivisions);
    }, [externalDivisions]);

    return (
        <div className="advanced-filters">
            {showUser && (
                <div className="row g-3 mb-3">
                    <div className="col-12">
                        <label className="form-label fw-bold">
                            <i className="bi bi-people me-2"></i>
                            Filter User Spesifik
                            {selectedUserIds.length > 0 && (
                                <span className="badge bg-primary ms-2">{selectedUserIds.length} dipilih</span>
                            )}
                        </label>
                        <div className="position-relative" ref={userRef}>
                            <div
                                className="form-control d-flex flex-wrap gap-1 align-items-center"
                                style={{ minHeight: "42px", cursor: "text", height: "auto" }}
                                onClick={() => {
                                    setUserDropdownOpen(true);
                                    document.getElementById("af-user-search")?.focus();
                                }}
                            >
                                {selectedUserIds.map((id) => {
                                    const u = users.find((x) => x.id === id);
                                    if (!u) return null;
                                    return (
                                        <span
                                            key={id}
                                            className="badge bg-primary d-inline-flex align-items-center gap-1 py-1 px-2"
                                            style={{ fontSize: "0.8rem", fontWeight: 500 }}
                                        >
                                            <i className="bi bi-person-fill" style={{ fontSize: "0.7rem" }}></i>
                                            {u.name}
                                            <button
                                                type="button"
                                                className="btn-close btn-close-white"
                                                style={{ fontSize: "0.5rem" }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedUserIds((prev) => prev.filter((x) => x !== id));
                                                }}
                                            ></button>
                                        </span>
                                    );
                                })}
                                <input
                                    id="af-user-search"
                                    type="text"
                                    className="border-0 flex-grow-1"
                                    style={{ outline: "none", minWidth: "140px", background: "transparent" }}
                                    placeholder={selectedUserIds.length === 0 ? "Ketik nama/NIP untuk mencari user..." : "Tambah user..."}
                                    value={userSearch}
                                    onChange={(e) => {
                                        setUserSearch(e.target.value);
                                        setUserDropdownOpen(true);
                                    }}
                                    onFocus={() => setUserDropdownOpen(true)}
                                />
                                {(selectedUserIds.length > 0 || userSearch) && (
                                    <button
                                        type="button"
                                        className="btn btn-link p-0 ms-auto text-muted"
                                        style={{ fontSize: "0.85rem" }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedUserIds([]);
                                            setUserSearch("");
                                            setUserDropdownOpen(false);
                                        }}
                                    >
                                        <i className="bi bi-x-circle"></i>
                                    </button>
                                )}
                            </div>

                            {userDropdownOpen && (
                                <div
                                    className="position-absolute w-100 bg-white border rounded shadow-sm"
                                    style={{ zIndex: 1050, maxHeight: "220px", overflowY: "auto", top: "100%", left: 0 }}
                                >
                                    {(() => {
                                        const term = userSearch.toLowerCase().trim();
                                        const filtered = users.filter((u) => {
                                            const matchSearch = !term ||
                                                u.name?.toLowerCase().includes(term) ||
                                                u.nip?.toLowerCase().includes(term) ||
                                                u.email?.toLowerCase().includes(term);
                                            const notSelected = !selectedUserIds.includes(u.id);
                                            const matchDivision = !filters.division_id || u.division_id === parseInt(filters.division_id);
                                            const matchPeriode = !filters.periode || u.periode === filters.periode;
                                            const matchSumber = !filters.sumber_magang || u.sumber_magang === filters.sumber_magang;
                                            const isUser = u.role === "user";
                                            return matchSearch && notSelected && matchDivision && matchPeriode && matchSumber && isUser;
                                        });

                                        if (filtered.length === 0) {
                                            return (
                                                <div className="px-3 py-2 text-muted small">
                                                    <i className="bi bi-search me-2"></i>
                                                    {userSearch ? `Tidak ada user "${userSearch}"` : "Semua user sudah dipilih / tidak ada data"}
                                                </div>
                                            );
                                        }

                                        return filtered.slice(0, 50).map((u) => (
                                            <div
                                                key={u.id}
                                                className="px-3 py-2 d-flex align-items-center gap-2"
                                                style={{ cursor: "pointer" }}
                                                onClick={() => {
                                                    setSelectedUserIds((prev) => [...prev, u.id]);
                                                    setUserSearch("");
                                                    document.getElementById("af-user-search")?.focus();
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = "#f0f4ff"}
                                                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                            >
                                                <div
                                                    className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center flex-shrink-0"
                                                    style={{ width: 32, height: 32 }}
                                                >
                                                    <i className="bi bi-person-fill text-primary" style={{ fontSize: "0.85rem" }}></i>
                                                </div>
                                                <div>
                                                    <div className="fw-semibold" style={{ fontSize: "0.875rem" }}>{u.name}</div>
                                                    <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                                                        {u.nip && <span className="me-2"><i className="bi bi-card-text me-1"></i>{u.nip}</span>}
                                                        {u.division?.name && <span><i className="bi bi-diagram-3 me-1"></i>{u.division.name}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="row g-3 mb-3">
                {showSumberMagang && (
                    <div className={showDivision && role === "admin" ? "col-md-4" : "col-md-6"}>
                        <label className="form-label fw-bold">
                            <i className="bi bi-building me-2"></i>
                            Sumber Magang
                        </label>
                        <select
                            className="form-select"
                            value={filters.sumber_magang || ""}
                            onChange={(e) => setFilters({ ...filters, sumber_magang: e.target.value })}
                        >
                            <option value="">Semua Sumber</option>
                            <option value="kampus">Kampus</option>
                            <option value="pemerintah">Pemerintah</option>
                            <option value="swasta">Swasta</option>
                            <option value="internal">Internal</option>
                            <option value="umum">Umum</option>
                        </select>
                    </div>
                )}

                {showPeriode && (
                    <div className={showDivision && role === "admin" ? "col-md-4" : "col-md-6"}>
                        <label className="form-label fw-bold">
                            <i className="bi bi-calendar3 me-2"></i>
                            Periode/Batch
                            {filters.periode && (
                                <span className="badge bg-primary ms-2">1 dipilih</span>
                            )}
                        </label>
                        <div className="position-relative" ref={periodeRef}>
                            <div
                                className="form-control d-flex align-items-center gap-1"
                                style={{ minHeight: "42px", cursor: "text", height: "auto" }}
                                onClick={() => {
                                    setPeriodeDropdownOpen(true);
                                    document.getElementById("af-periode-search")?.focus();
                                }}
                            >
                                {filters.periode ? (
                                    <span
                                        className="badge bg-primary d-inline-flex align-items-center gap-1 py-1 px-2"
                                        style={{ fontSize: "0.8rem", fontWeight: 500 }}
                                    >
                                        <i className="bi bi-calendar3" style={{ fontSize: "0.7rem" }}></i>
                                        Periode {filters.periode}
                                        <button
                                            type="button"
                                            className="btn-close btn-close-white"
                                            style={{ fontSize: "0.5rem" }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPeriodeSearch("");
                                                setFilters({ ...filters, periode: "" });
                                            }}
                                        ></button>
                                    </span>
                                ) : null}
                                <input
                                    id="af-periode-search"
                                    type="text"
                                    className="border-0 flex-grow-1"
                                    style={{ outline: "none", minWidth: "120px", background: "transparent" }}
                                    placeholder={filters.periode ? "" : "Ketik periode..."}
                                    value={periodeSearch}
                                    onChange={(e) => {
                                        setPeriodeSearch(e.target.value);
                                        setPeriodeDropdownOpen(true);
                                        if (filters.periode) {
                                            setFilters({ ...filters, periode: "" });
                                        }
                                    }}
                                    onFocus={() => setPeriodeDropdownOpen(true)}
                                />
                                {(filters.periode || periodeSearch) && (
                                    <button
                                        type="button"
                                        className="btn btn-link p-0 ms-auto text-muted"
                                        style={{ fontSize: "0.85rem" }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setPeriodeSearch("");
                                            setPeriodeDropdownOpen(false);
                                            setFilters({ ...filters, periode: "" });
                                        }}
                                    >
                                        <i className="bi bi-x-circle"></i>
                                    </button>
                                )}
                            </div>

                            {periodeDropdownOpen && (
                                <div
                                    className="position-absolute w-100 bg-white border rounded shadow-sm"
                                    style={{ zIndex: 1050, maxHeight: "220px", overflowY: "auto", top: "100%", left: 0 }}
                                >
                                    <div
                                        className="px-3 py-2 d-flex align-items-center gap-2"
                                        style={{ cursor: "pointer", borderBottom: "1px solid #f0f0f0" }}
                                        onClick={() => {
                                            setPeriodeSearch("");
                                            setPeriodeDropdownOpen(false);
                                            setFilters({ ...filters, periode: "" });
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = "#f0f4ff"}
                                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                    >
                                        <i className="bi bi-calendar-event text-muted"></i>
                                        <span className="text-muted" style={{ fontSize: "0.875rem" }}>Semua Periode</span>
                                    </div>

                                    {(() => {
                                        const term = periodeSearch.toLowerCase().trim();
                                        const allPeriods = [...new Set(users.map((u) => u.periode))].filter(Boolean).sort((a, b) => b - a);
                                        const filtered = allPeriods.filter((p) => !term || p.toString().toLowerCase().includes(term));
                                        
                                        if (filtered.length === 0) {
                                            return (
                                                <div className="px-3 py-2 text-muted small">
                                                    <i className="bi bi-search me-2"></i>
                                                    Tidak ada periode "{periodeSearch}"
                                                </div>
                                            );
                                        }
                                        return filtered.map((period) => (
                                            <div
                                                key={period}
                                                className="px-3 py-2 d-flex align-items-center gap-2"
                                                style={{
                                                    cursor: "pointer",
                                                    background: filters.periode === period ? "#e8f0fe" : "transparent"
                                                }}
                                                onClick={() => {
                                                    setPeriodeSearch("");
                                                    setPeriodeDropdownOpen(false);
                                                    setFilters({ ...filters, periode: period });
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (filters.periode !== period)
                                                        e.currentTarget.style.background = "#f0f4ff";
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (filters.periode !== period)
                                                        e.currentTarget.style.background = "transparent";
                                                }}
                                            >
                                                <div
                                                    className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center flex-shrink-0"
                                                    style={{ width: 30, height: 30 }}
                                                >
                                                    <i className="bi bi-calendar3 text-primary" style={{ fontSize: "0.8rem" }}></i>
                                                </div>
                                                <div>
                                                    <div className="fw-medium" style={{ fontSize: "0.875rem" }}>Periode {period}</div>
                                                </div>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {showDivision && role === "admin" && (
                    <div className="col-md-4">
                        <label className="form-label fw-bold">
                            <i className="bi bi-diagram-3 me-2"></i>
                            Divisi
                            {selectedDivision && (
                                <span className="badge bg-primary ms-2">1 dipilih</span>
                            )}
                        </label>
                        <div className="position-relative" ref={divisionRef}>
                            <div
                                className="form-control d-flex align-items-center gap-1"
                                style={{ minHeight: "42px", cursor: "text", height: "auto" }}
                                onClick={() => {
                                    setDivisionDropdownOpen(true);
                                    document.getElementById("af-division-search")?.focus();
                                }}
                            >
                                {selectedDivision ? (
                                    <span
                                        className="badge bg-primary d-inline-flex align-items-center gap-1 py-1 px-2"
                                        style={{ fontSize: "0.8rem", fontWeight: 500 }}
                                    >
                                        <i className="bi bi-diagram-3-fill" style={{ fontSize: "0.7rem" }}></i>
                                        {selectedDivision.name}
                                        <button
                                            type="button"
                                            className="btn-close btn-close-white"
                                            style={{ fontSize: "0.5rem" }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedDivision(null);
                                                setDivisionSearch("");
                                                setFilters({ ...filters, division_id: "" });
                                            }}
                                        ></button>
                                    </span>
                                ) : null}
                                <input
                                    id="af-division-search"
                                    type="text"
                                    className="border-0 flex-grow-1"
                                    style={{ outline: "none", minWidth: "120px", background: "transparent" }}
                                    placeholder={selectedDivision ? "" : "Ketik nama divisi..."}
                                    value={divisionSearch}
                                    onChange={(e) => {
                                        setDivisionSearch(e.target.value);
                                        setDivisionDropdownOpen(true);
                                        if (selectedDivision) {
                                            setSelectedDivision(null);
                                            setFilters({ ...filters, division_id: "" });
                                        }
                                    }}
                                    onFocus={() => setDivisionDropdownOpen(true)}
                                />
                                {(selectedDivision || divisionSearch) && (
                                    <button
                                        type="button"
                                        className="btn btn-link p-0 ms-auto text-muted"
                                        style={{ fontSize: "0.85rem" }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedDivision(null);
                                            setDivisionSearch("");
                                            setDivisionDropdownOpen(false);
                                            setFilters({ ...filters, division_id: "" });
                                        }}
                                    >
                                        <i className="bi bi-x-circle"></i>
                                    </button>
                                )}
                            </div>

                            {divisionDropdownOpen && (
                                <div
                                    className="position-absolute w-100 bg-white border rounded shadow-sm"
                                    style={{ zIndex: 1050, maxHeight: "220px", overflowY: "auto", top: "100%", left: 0 }}
                                >
                                    <div
                                        className="px-3 py-2 d-flex align-items-center gap-2"
                                        style={{ cursor: "pointer", borderBottom: "1px solid #f0f0f0" }}
                                        onClick={() => {
                                            setSelectedDivision(null);
                                            setDivisionSearch("");
                                            setDivisionDropdownOpen(false);
                                            setFilters({ ...filters, division_id: "" });
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = "#f0f4ff"}
                                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                    >
                                        <i className="bi bi-grid-3x3-gap-fill text-muted"></i>
                                        <span className="text-muted" style={{ fontSize: "0.875rem" }}>Semua Divisi</span>
                                    </div>

                                    {(() => {
                                        const term = divisionSearch.toLowerCase().trim();
                                        const filtered = divisions.filter((d) =>
                                            !term || d.name?.toLowerCase().includes(term)
                                        );
                                        if (filtered.length === 0) {
                                            return (
                                                <div className="px-3 py-2 text-muted small">
                                                    <i className="bi bi-search me-2"></i>
                                                    Tidak ada divisi "{divisionSearch}"
                                                </div>
                                            );
                                        }
                                        return filtered.map((d) => (
                                            <div
                                                key={d.id}
                                                className="px-3 py-2 d-flex align-items-center gap-2"
                                                style={{
                                                    cursor: "pointer",
                                                    background: parseInt(filters.division_id) === d.id ? "#e8f0fe" : "transparent"
                                                }}
                                                onClick={() => {
                                                    setSelectedDivision(d);
                                                    setDivisionSearch("");
                                                    setDivisionDropdownOpen(false);
                                                    setFilters({ ...filters, division_id: d.id });
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (parseInt(filters.division_id) !== d.id)
                                                        e.currentTarget.style.background = "#f0f4ff";
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (parseInt(filters.division_id) !== d.id)
                                                        e.currentTarget.style.background = "transparent";
                                                }}
                                            >
                                                <div
                                                    className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center flex-shrink-0"
                                                    style={{ width: 30, height: 30 }}
                                                >
                                                    <i className="bi bi-diagram-3 text-primary" style={{ fontSize: "0.8rem" }}></i>
                                                </div>
                                                <div>
                                                    <div className="fw-medium" style={{ fontSize: "0.875rem" }}>{d.name}</div>
                                                </div>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdvancedFilters;
