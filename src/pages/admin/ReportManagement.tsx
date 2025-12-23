import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { toast } from '../../components/Toasts';

type Report = {
  _id: string;
  targetType: 'group' | 'activity' | 'user';
  targetId: string;
  reportedBy: {
    _id: string;
    email: string;
    username?: string;
  };
  reason: string;
  details: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  adminNotes?: string;
  reviewedBy?: {
    _id: string;
    email: string;
    username?: string;
  };
  reviewedAt?: string;
  createdAt: string;
};

type ReportDetails = {
  report: Report;
  targetDetails: any;
};

const REASON_LABELS: Record<string, string> = {
  spam: 'Spam',
  inappropriate_content: 'Inappropriate Content',
  harassment: 'Harassment',
  false_information: 'False Information',
  scam: 'Scam',
  other: 'Other'
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  reviewing: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  resolved: 'bg-green-500/20 text-green-300 border-green-500/30',
  dismissed: 'bg-gray-500/20 text-gray-300 border-gray-500/30'
};

export default function ReportManagement() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [selectedReport, setSelectedReport] = useState<ReportDetails | null>(null);
  const [actionModal, setActionModal] = useState<{ show: boolean; action: string }>({ show: false, action: '' });
  const [actionReason, setActionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [filterStatus, filterType]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterStatus) params.status = filterStatus;
      if (filterType) params.targetType = filterType;

      const response = await api.get('/admin/reports', { params });
      setReports(response.data.reports);
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      toast(error?.response?.data?.error || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchReportDetails = async (reportId: string) => {
    try {
      const response = await api.get(`/admin/reports/${reportId}`);
      setSelectedReport(response.data);
    } catch (error: any) {
      console.error('Error fetching report details:', error);
      toast(error?.response?.data?.error || 'Failed to load report details');
    }
  };

  const updateReportStatus = async (reportId: string, status: string, notes?: string) => {
    try {
      setProcessing(true);
      await api.put(`/admin/reports/${reportId}`, {
        status,
        adminNotes: notes
      });
      toast('Report status updated');
      fetchReports();
      if (selectedReport?.report._id === reportId) {
        fetchReportDetails(reportId);
      }
    } catch (error: any) {
      console.error('Error updating report:', error);
      toast(error?.response?.data?.error || 'Failed to update report');
    } finally {
      setProcessing(false);
    }
  };

  const takeAction = async (reportId: string, action: string) => {
    try {
      setProcessing(true);
      await api.post(`/admin/reports/${reportId}/action`, {
        action,
        reason: actionReason
      });
      toast(`Action "${action}" completed successfully`);
      setActionModal({ show: false, action: '' });
      setActionReason('');
      fetchReports();
      setSelectedReport(null);
    } catch (error: any) {
      console.error('Error taking action:', error);
      toast(error?.response?.data?.error || 'Failed to complete action');
    } finally {
      setProcessing(false);
    }
  };

  const renderTargetInfo = (targetDetails: any, targetType: string) => {
    if (!targetDetails) return <span className="text-slate-400">Deleted or unavailable</span>;

    switch (targetType) {
      case 'group':
        return (
          <div>
            <p className="font-medium">{targetDetails.name}</p>
            <p className="text-sm text-slate-400">{targetDetails.members?.length || 0} members</p>
          </div>
        );
      case 'activity':
        return (
          <div>
            <p className="font-medium">{targetDetails.title}</p>
            <p className="text-sm text-slate-400">{targetDetails.category}</p>
          </div>
        );
      case 'user':
        return (
          <div>
            <p className="font-medium">{targetDetails.username || targetDetails.email}</p>
            <p className="text-sm text-slate-400">Role: {targetDetails.role}</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container-app">
        {/* Header */}
        <header className="mb-6">
          <h2 className="text-3xl font-bold mb-2">Report Management</h2>
          <p className="text-slate-400">Review and moderate reported content</p>
        </header>

        {/* Filters */}
        <div className="card p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                className="input"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="reviewing">Reviewing</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select
                className="input"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">All</option>
                <option value="group">Group</option>
                <option value="activity">Activity</option>
                <option value="user">User</option>
              </select>
            </div>

            <div className="ml-auto flex items-end">
              <button onClick={fetchReports} className="btn-primary">
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <div className="card p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
            </div>
          ) : reports.length === 0 ? (
            <div className="card p-8 text-center text-slate-400">
              No reports found
            </div>
          ) : (
            reports.map((report) => (
              <div key={report._id} className="card p-4 hover:bg-white/5 transition-colors cursor-pointer"
                onClick={() => fetchReportDetails(report._id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs border ${STATUS_COLORS[report.status]}`}>
                        {report.status}
                      </span>
                      <span className="px-3 py-1 bg-slate-700 rounded-full text-xs">
                        {report.targetType}
                      </span>
                      <span className="text-xs text-slate-400">
                        {REASON_LABELS[report.reason]}
                      </span>
                    </div>

                    <p className="text-sm text-slate-300 mb-2">{report.details}</p>

                    <div className="text-xs text-slate-400">
                      Reported by: {report.reportedBy?.username || report.reportedBy?.email || '[User Deleted]'} •
                      {new Date(report.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <button className="text-cyan-400 hover:text-cyan-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Report Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setSelectedReport(null)}
              className="float-right text-slate-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-2xl font-bold mb-4">Report Details</h3>

            {/* Status */}
            <div className="mb-4">
              <span className={`px-3 py-1 rounded-full text-xs border ${STATUS_COLORS[selectedReport.report.status]}`}>
                {selectedReport.report.status}
              </span>
            </div>

            {/* Report Info */}
            <div className="space-y-4 mb-6">
              <div>
                <h4 className="text-sm font-semibold text-slate-400 mb-1">Target</h4>
                <div className="p-3 bg-white/5 rounded-lg">
                  <span className="text-xs text-slate-400 uppercase">{selectedReport.report.targetType}</span>
                  {renderTargetInfo(selectedReport.targetDetails, selectedReport.report.targetType)}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-400 mb-1">Reason</h4>
                <p>{REASON_LABELS[selectedReport.report.reason]}</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-400 mb-1">Details</h4>
                <p className="text-slate-300">{selectedReport.report.details}</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-400 mb-1">Reported By</h4>
                <p>{selectedReport.report.reportedBy?.username || selectedReport.report.reportedBy?.email || '[User Deleted]'}</p>
                <p className="text-xs text-slate-400">{new Date(selectedReport.report.createdAt).toLocaleString()}</p>
              </div>

              {selectedReport.report.adminNotes && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-400 mb-1">Admin Notes</h4>
                  <p className="text-slate-300">{selectedReport.report.adminNotes}</p>
                </div>
              )}

              {selectedReport.report.reviewedBy && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-400 mb-1">Reviewed By</h4>
                  <p>{selectedReport.report.reviewedBy?.username || selectedReport.report.reviewedBy?.email || '[User Deleted]'}</p>
                  <p className="text-xs text-slate-400">{new Date(selectedReport.report.reviewedAt!).toLocaleString()}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="border-t border-slate-700 pt-4">
              <h4 className="text-sm font-semibold mb-3">Actions</h4>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => updateReportStatus(selectedReport.report._id, 'reviewing')}
                  disabled={processing}
                  className="btn-secondary"
                >
                  Mark as Reviewing
                </button>
                <button
                  onClick={() => {
                    setActionModal({ show: true, action: 'warn' });
                  }}
                  disabled={processing}
                  className="btn-secondary"
                >
                  Issue Warning
                </button>
                <button
                  onClick={() => {
                    setActionModal({ show: true, action: 'delete' });
                  }}
                  disabled={processing}
                  className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 px-4 py-2 rounded-lg transition-colors"
                >
                  Delete Content
                </button>
                <button
                  onClick={() => {
                    setActionModal({ show: true, action: 'block_user' });
                  }}
                  disabled={processing}
                  className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 px-4 py-2 rounded-lg transition-colors"
                >
                  Block User
                </button>
                <button
                  onClick={() => {
                    setActionModal({ show: true, action: 'dismiss' });
                  }}
                  disabled={processing}
                  className="btn-secondary col-span-2"
                >
                  Dismiss Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Confirmation Modal */}
      {actionModal.show && selectedReport && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Confirm Action: {actionModal.action}</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Reason (Optional)</label>
              <textarea
                className="input w-full min-h-[80px]"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Provide a reason for this action..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => takeAction(selectedReport.report._id, actionModal.action)}
                disabled={processing}
                className="btn-primary flex-1"
              >
                {processing ? 'Processing...' : 'Confirm'}
              </button>
              <button
                onClick={() => {
                  setActionModal({ show: false, action: '' });
                  setActionReason('');
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
