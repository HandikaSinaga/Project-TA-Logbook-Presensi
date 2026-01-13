import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axiosInstance from '../../../../utils/axiosInstance.jsx';
import Skeleton from 'react-loading-skeleton';

const Dashboard = () => {
  const [stats, setStats] = useState({});
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axiosInstance.get('/supervisor/dashboard');
      setStats(response.data.stats);
      setPendingApprovals(response.data.pending_approvals || []);
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
      <h1 className="fw-bold mb-1">Supervisor Dashboard</h1>
      <p className="text-secondary">Manage your team and approvals</p>

      <Row className="mt-4 g-3">
        <Col md={3}>
          <Card className="border-0 shadow-sm rounded-4 card-soft-blue">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-uppercase small fw-semibold mb-1 opacity-75">Total Anggota Tim</p>
                  <h2 className="fw-bold mb-0">{stats.team_members || 0}</h2>
                </div>
                <div className="bg-white bg-opacity-25 rounded-circle p-3">
                  <i className="bi bi-people fs-2"></i>
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
                  <p className="text-uppercase small fw-semibold mb-1 opacity-75">Pending Approval</p>
                  <h2 className="fw-bold mb-0">{stats.pending_approvals || 0}</h2>
                </div>
                <div className="bg-white bg-opacity-25 rounded-circle p-3">
                  <i className="bi bi-hourglass-split fs-2"></i>
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
                  <p className="text-uppercase small fw-semibold mb-1 opacity-75">Kehadiran Hari Ini</p>
                  <h2 className="fw-bold mb-0">{stats.today_attendance || 0}</h2>
                </div>
                <div className="bg-white bg-opacity-25 rounded-circle p-3">
                  <i className="bi bi-calendar-check fs-2"></i>
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
                  <p className="text-uppercase small fw-semibold mb-1 opacity-75">Avg Tingkat Hadir</p>
                  <h2 className="fw-bold mb-0">{stats.avg_attendance_rate || 0}%</h2>
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
        <Col lg={8}>
          <Card className="border-0 shadow-sm rounded-4">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold mb-0">Pending Approvals</h5>
                <Button as={Link} to="/supervisor/leave" variant="link" className="text-decoration-none">
                  View All <i className="bi bi-arrow-right"></i>
                </Button>
              </div>
              
              {pendingApprovals.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-check-circle text-success fs-1"></i>
                  <p className="text-secondary mt-3">No pending approvals</p>
                </div>
              ) : (
                <Table hover responsive>
                  <thead>
                    <tr>
                      <th>Nama</th>
                      <th>Jenis</th>
                      <th>Tanggal</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingApprovals.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.user_name}</td>
                        <td>
                          <span className="badge bg-primary">{item.type}</span>
                        </td>
                        <td>{item.date}</td>
                        <td>
                          <span className="badge bg-warning">Pending</span>
                        </td>
                        <td>
                          <Button size="sm" variant="success" className="me-2">
                            <i className="bi bi-check"></i>
                          </Button>
                          <Button size="sm" variant="danger">
                            <i className="bi bi-x"></i>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="border-0 shadow-sm rounded-4">
            <Card.Body className="p-4">
              <h5 className="fw-bold mb-4">Quick Actions</h5>
              <div className="d-grid gap-3">
                <Button as={Link} to="/supervisor/attendance" variant="outline-primary" className="rounded-3">
                  <i className="bi bi-list-check me-2"></i>
                  Lihat Presensi
                </Button>
                <Button as={Link} to="/supervisor/logbook" variant="outline-success" className="rounded-3">
                  <i className="bi bi-journal-text me-2"></i>
                  Review Logbook
                </Button>
                <Button as={Link} to="/supervisor/leave" variant="outline-warning" className="rounded-3">
                  <i className="bi bi-clipboard-check me-2"></i>
                  Approval Izin
                </Button>
                <Button as={Link} to="/supervisor/division" variant="outline-secondary" className="rounded-3">
                  <i className="bi bi-people me-2"></i>
                  Kelola Tim
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
