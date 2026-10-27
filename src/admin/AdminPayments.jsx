import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';

const formatDate = (value) => value ? new Date(value).toLocaleString('en-IN') : '—';

export default function AdminPayments() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState('');

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setRequests(await api.getManualPaymentRequests());
    } catch (err) {
      setError(err.message || 'Could not load manual payment requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const review = async (request, decision) => {
    const rejectionReason = decision === 'rejected'
      ? window.prompt('Reason for rejecting this payment:', '')
      : '';
    if (decision === 'rejected' && !rejectionReason?.trim()) return;

    setProcessingId(request.id);
    setError('');
    try {
      await api.reviewManualPayment(request.id, decision, rejectionReason || '');
      await loadRequests();
    } catch (err) {
      setError(err.message || 'Could not update payment request.');
    } finally {
      setProcessingId('');
    }
  };

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Manual UPI Payments</h1>
          <p className="admin-page-subtitle">Verify client payment references before activating subscriptions.</p>
        </div>
        <button type="button" className="admin-btn-secondary" onClick={loadRequests} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && <div className="alert-banner alert-error">{error}</div>}

      <div className="card" style={{ overflowX: 'auto' }}>
        {loading ? (
          <p>Loading payment requests...</p>
        ) : requests.length === 0 ? (
          <p>No manual UPI payment requests yet.</p>
        ) : (
          <table className="sub-invoices-table">
            <thead>
              <tr>
                <th>Business</th>
                <th>Plan</th>
                <th>Amount</th>
                <th>UPI reference</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  <td>
                    <strong>{request.businesses?.name || request.business_id}</strong>
                    <br />
                    <small>{request.businesses?.email || ''}</small>
                  </td>
                  <td>{request.plan_id} / {request.billing_interval}</td>
                  <td>₹{Number(request.amount).toLocaleString('en-IN')}</td>
                  <td>{request.upi_reference}</td>
                  <td>{formatDate(request.created_at)}</td>
                  <td>{request.status}</td>
                  <td>
                    {request.status === 'pending' ? (
                      <span style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="admin-btn-primary"
                          disabled={processingId === request.id}
                          onClick={() => review(request, 'approved')}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="admin-btn-secondary"
                          disabled={processingId === request.id}
                          onClick={() => review(request, 'rejected')}
                        >
                          Reject
                        </button>
                      </span>
                    ) : (
                      <span>{formatDate(request.reviewed_at)}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
