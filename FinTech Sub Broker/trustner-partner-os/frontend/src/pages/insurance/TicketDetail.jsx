import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Send } from 'lucide-react';
import api from '../../services/api';

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTicketDetails();
  }, [id]);

  const fetchTicketDetails = async () => {
    try {
      setLoading(true);
      const [ticketRes, commentsRes] = await Promise.all([
        api.get(`/insurance/tickets/${id}`),
        api.get(`/insurance/tickets/${id}/comments`),
      ]);

      setTicket(ticketRes.data);
      setComments(commentsRes.data || []);
    } catch (err) {
      setError('Failed to load ticket details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      const res = await api.post(`/insurance/tickets/${id}/comments`, {
        message: newComment,
      });

      setComments([...comments, res.data]);
      setNewComment('');
    } catch (err) {
      alert('Failed to add comment');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const res = await api.patch(`/insurance/tickets/${id}`, { status: newStatus });
      setTicket(res.data);
    } catch (err) {
      alert('Failed to update ticket');
      console.error(err);
    }
  };

  const getStatusColor = (status) => {
    const statusMap = {
      Open: 'bg-blue-100 text-blue-800',
      'In Progress': 'bg-yellow-100 text-yellow-800',
      Resolved: 'bg-green-100 text-green-800',
      Closed: 'bg-gray-100 text-gray-800',
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const priorityMap = {
      Urgent: 'bg-red-100 text-red-800 border-red-300',
      High: 'bg-orange-100 text-orange-800 border-orange-300',
      Medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      Low: 'bg-green-100 text-green-800 border-green-300',
    };
    return priorityMap[priority] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading ticket details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate('/insurance/tickets')}
          className="flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tickets
        </button>
        <div className="text-center py-12">
          <p className="text-gray-600">Ticket not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/insurance/tickets')}
        className="flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Tickets
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-900">Error</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Ticket Info Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{ticket.code}</h1>
            <p className="text-gray-600 mt-1">{ticket.subject}</p>
          </div>
          <select
            value={ticket.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className={`px-4 py-2 rounded-lg font-medium text-sm border-2 ${getStatusColor(ticket.status)}`}
          >
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
          <div>
            <p className="text-xs text-gray-600 font-medium">Category</p>
            <p className="text-sm font-bold text-gray-900 mt-1">{ticket.category}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 font-medium">Priority</p>
            <p className={`text-sm font-bold mt-1 ${getPriorityColor(ticket.priority).split(' ').pop()}`}>
              {ticket.priority}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 font-medium">Created</p>
            <p className="text-sm font-bold text-gray-900 mt-1">{ticket.createdAt}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 font-medium">Assigned To</p>
            <p className="text-sm font-bold text-gray-900 mt-1">{ticket.assignedTo || 'Unassigned'}</p>
          </div>
        </div>

        {/* Description */}
        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Description</h3>
          <p className="text-gray-700 text-sm leading-relaxed">{ticket.description}</p>
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Conversation</h2>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <div
                key={comment.id}
                className={`p-4 rounded-lg ${
                  comment.isInternal
                    ? 'bg-amber-50 border border-amber-200'
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{comment.authorName}</p>
                    <p className="text-xs text-gray-600">{comment.authorRole}</p>
                  </div>
                  {comment.isInternal && (
                    <span className="text-xs px-2 py-1 bg-amber-200 text-amber-800 rounded font-medium">
                      Internal Note
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700 mb-2">{comment.message}</p>
                <p className="text-xs text-gray-500">{comment.createdAt}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm text-center py-8">No comments yet</p>
          )}
        </div>

        {/* Add Comment Form */}
        <form onSubmit={handleAddComment} className="border-t border-gray-200 pt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Add Comment</label>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Type your comment here..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              rows="3"
            />
          </div>
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            {submitting ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {ticket.status !== 'Resolved' && (
          <button
            onClick={() => handleStatusChange('Resolved')}
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            Mark as Resolved
          </button>
        )}
        {ticket.status !== 'Closed' && (
          <button
            onClick={() => handleStatusChange('Closed')}
            className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            Close Ticket
          </button>
        )}
        {ticket.status === 'Closed' && (
          <button
            onClick={() => handleStatusChange('Open')}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Reopen Ticket
          </button>
        )}
      </div>
    </div>
  );
};

export default TicketDetail;
