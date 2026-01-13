import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, ProgressBar } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axiosInstance from '../../../../utils/axiosInstance';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const Dashboard = () => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axiosInstance.get('/user/dashboard');
      setStats(response.data.stats);
      setUser(response.data.user);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-4">
        <Skeleton height={50} className="mb-4" />
        <Row>
          {[1, 2, 3, 4].map(i => (
            <Col md={3} key={i}>
              <Skeleton height={150} className="mb-3 rounded-4" />
            </Col>
          ))}
        </Row>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h1 className="fw-bold mb-1">Hi, {user?.name || 'User'}!</h1>
      <p className="text-secondary">Welcome to your dashboard</p>

      <Row className="mt-4 g-3">
        <Col md={3}>
          <Card className="border-0 shadow-sm rounded-4 card-soft-blue">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-uppercase small fw-semibold mb-1 opacity-75">Total Presensi</p>
                  <h2 className="fw-bold mb-0">{stats.total_attendance || 0}</h2>
                </div>
                <div className="bg-white bg-opacity-25 rounded-circle p-3">
                  <i className="bi bi-calendar-check fs-2"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="border-0 shadow-sm rounded-4 card-soft-green">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-uppercase small fw-semibold mb-1 opacity-75">Logbook</p>
                  <h2 className="fw-bold mb-0">{stats.monthly_logbooks || 0}</h2>
                </div>
                <div className="bg-white bg-opacity-25 rounded-circle p-3">
                  <i className="bi bi-journal-text fs-2"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="border-0 shadow-sm rounded-4 card-soft-amber">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-uppercase small fw-semibold mb-1 opacity-75">Izin/Cuti</p>
                  <h2 className="fw-bold mb-0">{stats.total_leaves || 0}</h2>
                </div>
                <div className="bg-white bg-opacity-25 rounded-circle p-3">
                  <i className="bi bi-calendar-x fs-2"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="border-0 shadow-sm rounded-4 card-soft-purple">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-uppercase small fw-semibold mb-1 opacity-75">Tingkat Kehadiran</p>
                  <h2 className="fw-bold mb-0">{stats.attendance_rate || 0}%</h2>
                </div>
                <div className="bg-white bg-opacity-25 rounded-circle p-3">
                  <i className="bi bi-graph-up fs-2"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col md={8}>
          <Card className="border-0 shadow-sm rounded-4">
            <Card.Body className="p-4">
              <h5 className="fw-bold mb-4">Quick Actions</h5>
              <Row className="g-3">
                <Col md={6}>
                  <Button as={Link} to="/user/attendance" variant="outline-primary" className="w-100 py-3 rounded-3">
                    <i className="bi bi-geo-alt me-2"></i>
                    Presensi
                  </Button>
                </Col>
                <Col md={6}>
                  <Button as={Link} to="/user/logbook" variant="outline-success" className="w-100 py-3 rounded-3">
                    <i className="bi bi-journal-plus me-2"></i>
                    Logbook Baru
                  </Button>
                </Col>
                <Col md={6}>
                  <Button as={Link} to="/user/leave" variant="outline-warning" className="w-100 py-3 rounded-3">
                    <i className="bi bi-calendar-event me-2"></i>
                    Ajukan Izin
                  </Button>
                </Col>
                <Col md={6}>
                  <Button as={Link} to="/user/profile" variant="outline-secondary" className="w-100 py-3 rounded-3">
                    <i className="bi bi-person me-2"></i>
                    Profile
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="border-0 shadow-sm rounded-4">
            <Card.Body className="p-4">
              <h5 className="fw-bold mb-3">Divisi Saya</h5>
              <div className="text-center py-4">
                <div className="bg-gradient-primary text-white rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style={{width: '80px', height: '80px'}}>
                  <i className="bi bi-building fs-1"></i>
                </div>
                <h6 className="fw-bold">{stats.division_name || 'No Division'}</h6>
                <p className="text-secondary small">{stats.division_members || 0} Anggota</p>
                <Button as={Link} to="/user/division" variant="primary" size="sm" className="rounded-pill px-4">
                  Lihat Detail
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
