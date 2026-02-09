import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Button, Modal,
  Form, Alert, Badge, Table
} from 'react-bootstrap';
import axios from 'axios';

const MyTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTicket, setNewTicket] = useState({ issue: '' });
  const [replyMessage, setReplyMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchTickets = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/my-tickets', getAuthHeaders());
      setTickets(response.data);
    } catch (error) {
      setError('Error fetching tickets');
    }
  };

  const openTicketDetails = async (ticket) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/my-tickets/${ticket._id}`, getAuthHeaders());
      setSelectedTicket(response.data);
      setShowModal(true);
    } catch (error) {
      setError('Error fetching ticket details');
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.post('http://localhost:5000/api/my-tickets', 
        { issue: newTicket.issue }, 
        getAuthHeaders()
      );
      
      setSuccess('Ticket created successfully!');
      setNewTicket({ issue: '' });
      setShowCreateModal(false);
      fetchTickets();
    } catch (error) {
      setError(error.response?.data?.message || 'Error creating ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!replyMessage.trim()) {
      setError('Message cannot be empty');
      return;
    }

    try {
      await axios.post(`http://localhost:5000/api/my-tickets/${selectedTicket._id}/reply`, 
        { message: replyMessage }, 
        getAuthHeaders()
      );
      
      setSuccess('Reply sent successfully!');
      setReplyMessage('');
      fetchTickets();
      
      // Refresh the selected ticket
      const response = await axios.get(`http://localhost:5000/api/my-tickets/${selectedTicket._id}`, getAuthHeaders());
      setSelectedTicket(response.data);
    } catch (error) {
      setError(error.response?.data?.message || 'Error sending reply');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'warning',
      in_progress: 'info',
      closed: 'success'
    };
    return colors[status] || 'secondary';
  };

  const formatStatus = (status) => {
    return status.replace('_', ' ').toUpperCase();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Container className="py-5" style={{ marginTop: '50px' }}>
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>My Support Tickets</h2>
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              <i className="fas fa-plus me-2"></i>
              Create New Ticket
            </Button>
          </div>

          {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
          {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

          {tickets.length === 0 ? (
            <Card className="text-center py-5">
              <Card.Body>
                <i className="fas fa-ticket-alt fa-3x text-muted mb-3"></i>
                <h4 className="text-muted">No Support Tickets</h4>
                <p className="text-muted mb-4">
                  You haven't created any support tickets yet. Create your first ticket to get help from our support team.
                </p>
                <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                  Create Your First Ticket
                </Button>
              </Card.Body>
            </Card>
          ) : (
            <Card>
              <Card.Header>
                <h5 className="mb-0">Your Tickets</h5>
              </Card.Header>
              <Card.Body>
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Ticket ID</th>
                      <th>Issue</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Last Updated</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((ticket) => (
                      <tr key={ticket._id}>
                        <td><small>#{ticket._id.slice(-8)}</small></td>
                        <td>
                          <div style={{ maxWidth: '300px' }}>
                            {ticket.issue.substring(0, 100)}
                            {ticket.issue.length > 100 && '...'}
                          </div>
                        </td>
                        <td>
                          <Badge bg={getStatusColor(ticket.status)}>
                            {formatStatus(ticket.status)}
                          </Badge>
                        </td>
                        <td><small>{formatDate(ticket.createdAt)}</small></td>
                        <td><small>{formatDate(ticket.updatedAt)}</small></td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => openTicketDetails(ticket)}
                          >
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      {/* Ticket Details Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Ticket Details - #{selectedTicket?._id.slice(-8)}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTicket && (
            <div>
              {/* Ticket Status */}
              <Card className="mb-3">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">Ticket Information</h6>
                  <Badge bg={getStatusColor(selectedTicket.status)}>
                    {formatStatus(selectedTicket.status)}
                  </Badge>
                </Card.Header>
                <Card.Body style={{ color: 'black' }}>
                  <p style={{ color: 'black' }}>  <strong>Issue:</strong> {selectedTicket.issue}</p>
                  <p style={{ color: 'black' }}><strong>Created:</strong> {formatDate(selectedTicket.createdAt)}</p>
                  <p style={{ color: 'black' }}><strong>Last Updated:</strong> {formatDate(selectedTicket.updatedAt)}</p>
                </Card.Body>
              </Card>

              {/* Conversation History */}
              <Card className="mb-3">
                <Card.Header>
                  <h6 className="mb-0">Conversation</h6>
                </Card.Header>
                <Card.Body style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {selectedTicket.conversation && selectedTicket.conversation.length > 0 ? (
                    selectedTicket.conversation.map((message, index) => (
                      <div
                        key={index}
                        className={`mb-3 p-3 rounded ${
                          message.sender === 'admin' 
                            ? 'bg-primary text-white ms-5' 
                            : 'bg-light text-dark me-5'
                        }`}
                      >
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <strong>
                            {message.sender === 'admin' ? 'Support Agent' : 'You'}
                          </strong>
                          <small>
                            {formatDate(message.timestamp)}
                          </small>
                        </div>
                        <p className="mb-0" style={{ color: 'black' }}>{message.message}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted">No conversation history yet.</p>
                  )}
                </Card.Body>
              </Card>

              {/* Reply Section */}
              {selectedTicket.status !== 'closed' && (
                <Card>
                  <Card.Header>
                    <h6 className="mb-0">Add Reply</h6>
                  </Card.Header>
                  <Card.Body>
                    <Form.Group className="mb-3">
                      <Form.Label>Your Message</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Type your message here..."
                      />
                    </Form.Group>
                    <Button
                      variant="primary"
                      onClick={handleReply}
                      disabled={!replyMessage.trim()}
                    >
                      Send Reply
                    </Button>
                  </Card.Body>
                </Card>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Create Ticket Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create New Support Ticket</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateTicket}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Describe Your Issue *</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={newTicket.issue}
                onChange={(e) => setNewTicket({ issue: e.target.value })}
                placeholder="Please describe your issue in detail. Our support team will get back to you as soon as possible."
                required
              />
              <Form.Text className="text-muted">
                Be as detailed as possible to help us understand and resolve your issue quickly.
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Ticket'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default MyTickets;