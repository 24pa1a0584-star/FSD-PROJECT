import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import DataTable from '../components/Common/DataTable';
import Badge from '../components/Common/Badge';
import Modal from '../components/Common/Modal';
import { Users, Filter, Eye, Phone, Mail, Award, Calendar, CheckCircle } from 'lucide-react';

const StudentsPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['students', page, search, selectedDept, selectedYear, selectedStatus],
    queryFn: async () => {
      const params = new URLSearchParams({
        page,
        limit: 15,
        search,
      });
      if (selectedDept) params.append('department', selectedDept);
      if (selectedYear) params.append('academicYear', selectedYear);
      if (selectedStatus) params.append('membershipStatus', selectedStatus);

      const res = await api.get(`/students?${params.toString()}`);
      return res.data;
    },
    keepPreviousData: true,
  });

  const viewStudentDetails = async (studentId) => {
    try {
      const res = await api.get(`/students/${studentId}`);
      setSelectedStudent(res.data);
      setIsDetailOpen(true);
    } catch (err) {
      console.error('Error fetching student details:', err);
    }
  };

  const columns = [
    {
      header: 'Student',
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={
              row.profilePhoto ||
              row.userId?.avatar ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(row.userId?.name || 'S')}`
            }
            alt="Student"
            className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
          />
          <div>
            <span className="font-bold text-slate-900 dark:text-white block">
              {row.userId?.name || 'N/A'}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              {row.userId?.email}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Roll Number',
      render: (row) => (
        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
          {row.rollNumber}
        </span>
      ),
    },
    {
      header: 'Class / Branch',
      render: (row) => (
        <div className="text-xs">
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {row.department}
          </span>
          <span className="text-slate-400 ml-1">
            (Year {row.academicYear} - {row.section})
          </span>
        </div>
      ),
    },
    {
      header: 'Type',
      render: (row) => (
        <span className="text-xs text-slate-600 dark:text-slate-400">
          {row.studentType}
        </span>
      ),
    },
    {
      header: 'Assigned Facility',
      render: (row) => (
        <Badge variant={row.assignedGym?.code}>{row.assignedGym?.name}</Badge>
      ),
    },
    {
      header: 'Status',
      render: (row) => (
        <Badge variant={row.membershipStatus}>{row.membershipStatus}</Badge>
      ),
    },
    {
      header: 'Action',
      render: (row) => (
        <button
          onClick={() => viewStudentDetails(row._id)}
          className="p-1.5 rounded-lg text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition"
          title="View Profile Details"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 rounded-3xl">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Student Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Registered students across campus fitness facilities
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <select
            value={selectedDept}
            onChange={(e) => {
              setSelectedDept(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
          >
            <option value="">All Branches</option>
            <option value="CSE">CSE</option>
            <option value="ECE">ECE</option>
            <option value="IT">IT</option>
            <option value="AI&DS">AI&DS</option>
            <option value="EEE">EEE</option>
            <option value="MECH">MECH</option>
            <option value="CIVIL">CIVIL</option>
          </select>

          <select
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
          >
            <option value="">All Years</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="PENDING">PENDING</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>
      </div>

      {/* Main Students Table */}
      <DataTable
        columns={columns}
        data={data?.students || []}
        page={page}
        totalPages={data?.totalPages || 1}
        onPageChange={setPage}
        searchPlaceholder="Search by student name or roll number..."
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        isLoading={isLoading}
      />

      {/* Student Details Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Student Profile & Gym Membership Record"
        maxWidth="max-w-2xl"
      >
        {selectedStudent && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <img
                src={
                  selectedStudent.student.profilePhoto ||
                  selectedStudent.student.userId?.avatar
                }
                alt="Profile"
                className="w-16 h-16 rounded-2xl border border-slate-300 dark:border-slate-700 object-cover"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {selectedStudent.student.userId?.name}
                  </h3>
                  <Badge variant={selectedStudent.student.membershipStatus}>
                    {selectedStudent.student.membershipStatus}
                  </Badge>
                </div>
                <p className="text-xs font-mono font-bold text-brand-600 dark:text-brand-400 mt-0.5">
                  Roll No: {selectedStudent.student.rollNumber}
                </p>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                  <span>{selectedStudent.student.department} • Year {selectedStudent.student.academicYear} (Sec {selectedStudent.student.section})</span>
                  <span>•</span>
                  <span>{selectedStudent.student.studentType}</span>
                </p>
              </div>
            </div>

            {/* Contact & Facility Info */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 font-medium block mb-1">Institutional Email</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {selectedStudent.student.userId?.email}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 font-medium block mb-1">Phone Number</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {selectedStudent.student.contactNumber}
                </span>
              </div>
            </div>

            {/* Active Membership Record */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Active Membership Card
              </h4>
              {selectedStudent.membership ? (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-900/20 to-slate-900/40 border border-brand-500/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-brand-400 font-semibold block">
                        Card Identifier: {selectedStudent.membership.qrCardId}
                      </span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {selectedStudent.membership.membershipTypeId?.name || 'Semester Pass'}
                      </span>
                    </div>
                    <Badge variant="ACTIVE">VALID</Badge>
                  </div>
                  <div className="mt-3 text-xs text-slate-400 flex items-center gap-4">
                    <span>Valid from: <strong>{new Date(selectedStudent.membership.startDate).toLocaleDateString()}</strong></span>
                    <span>Valid until: <strong>{new Date(selectedStudent.membership.endDate).toLocaleDateString()}</strong></span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                  No active membership issued yet.
                </p>
              )}
            </div>

            {/* Recent Attendance Session History */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Recent Attendance Logs
              </h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {(selectedStudent.recentAttendance || []).map((att) => (
                  <div
                    key={att._id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {new Date(att.checkInTime).toLocaleDateString()} at{' '}
                        {new Date(att.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {att.checkOutTime && (
                        <span className="text-slate-400 ml-2">
                          (Duration: {att.durationMinutes} mins)
                        </span>
                      )}
                    </div>
                    <Badge variant={att.status}>{att.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StudentsPage;
