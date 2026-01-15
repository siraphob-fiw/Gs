'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Badge,
  Tabs,
  Tab,
  Modal,
  ModalContent,
  ModalHeader,
  ModalFooter,
  Textarea,
  Avatar,
} from '@heroui/react';
import { useCoachDiscovery } from '../../hooks/api/useCoachDiscovery';
import { CoachRequest } from '../../types/coaching';

interface CoachRequestsProps {
  userId: string;
  userRole: 'ATHLETE' | 'COACH';
}

export const CoachRequests: React.FC<CoachRequestsProps> = ({ userId, userRole }) => {
  const [selectedRequest, setSelectedRequest] = useState<CoachRequest | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [activeTab, setActiveTab] = useState('pending');

  const [isOpen, setIsOpen] = useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);
  const { coachRequests, loading, getCoachRequests, respondToRequest, cancelRequest } =
    useCoachDiscovery();

  useEffect(() => {
    if (userRole === 'COACH') {
      getCoachRequests('received', activeTab === 'all' ? undefined : activeTab.toUpperCase());
    } else {
      getCoachRequests('sent', activeTab === 'all' ? undefined : activeTab.toUpperCase());
    }
  }, [activeTab, userRole]);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  const handleRespondToRequest = async (status: 'ACCEPTED' | 'REJECTED') => {
    if (!selectedRequest) return;

    try {
      await respondToRequest(selectedRequest.id, {
        status,
        responseMessage: responseMessage.trim() || undefined,
      });

      onClose();
      setResponseMessage('');
      setSelectedRequest(null);

      // Refresh the requests
      getCoachRequests('received', activeTab === 'all' ? undefined : activeTab.toUpperCase());

      alert(`Request ${status.toLowerCase()} successfully!`);
    } catch (error) {
      console.error('Failed to respond to request:', error);
      alert('Failed to respond to request. Please try again.');
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to cancel this request?')) return;

    try {
      await cancelRequest(requestId);

      // Refresh the requests
      getCoachRequests('sent', activeTab === 'all' ? undefined : activeTab.toUpperCase());

      alert('Request cancelled successfully!');
    } catch (error) {
      console.error('Failed to cancel request:', error);
      alert('Failed to cancel request. Please try again.');
    }
  };

  const openResponseModal = (request: CoachRequest) => {
    setSelectedRequest(request);
    onOpen();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'ACCEPTED':
        return 'success';
      case 'REJECTED':
        return 'danger';
      case 'CANCELLED':
        return 'default';
      case 'EXPIRED':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isExpired = (expiresAt: Date) => {
    return new Date() > new Date(expiresAt);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-medium">
            {userRole === 'COACH' ? 'Coaching Requests' : 'My Coach Requests'}
          </h3>
        </CardHeader>
        <CardBody>
          <Tabs
            classNames={{
              tabList: 'border border-border bg-backgroundSecondary',
              tabContent: 'group-data-[selected=true]:text-text text-text',
            }}
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(key as string)}
          >
            <Tab key="pending" value="pending">
              Pending
            </Tab>
            <Tab key="accepted" value="accepted">
              Accepted
            </Tab>
            <Tab key="rejected" value="rejected">
              Rejected
            </Tab>
            <Tab key="cancelled" value="cancelled">
              Cancelled
            </Tab>
            <Tab key="all" value="all">
              All
            </Tab>
          </Tabs>

          <div className="space-y-4 mt-4">
            {coachRequests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No requests found.</p>
              </div>
            ) : (
              coachRequests.map((request) => (
                <Card key={request.id} className="border">
                  <CardBody>
                    <div className="flex justify-between items-start">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar name={userRole === 'COACH' ? 'Athlete' : 'Coach'} />
                            <div>
                              <p className="font-medium">
                                {userRole === 'COACH' ? 'Athlete Request' : 'Coach Request'}
                              </p>
                              <p className="text-sm text-gray-500">
                                Requested on {formatDate(request.requestedAt)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge color={getStatusColor(request.status)} variant="shadow">
                              {request.status}
                            </Badge>
                            {request.status === 'PENDING' && isExpired(request.expiresAt) && (
                              <Badge variant="shadow">EXPIRED</Badge>
                            )}
                          </div>
                        </div>

                        {request.message && (
                          <div className="bg-background p-3 rounded-lg">
                            <p className="text-sm font-medium mb-1">Message:</p>
                            <p className="text-sm text-text">{request.message}</p>
                          </div>
                        )}

                        {request.responseMessage && (
                          <div className="bg-info/5 p-3 rounded-lg">
                            <p className="text-sm font-medium mb-1">Response:</p>
                            <p className="text-sm text-text">{request.responseMessage}</p>
                            <p className="text-xs text-textSecondary mt-1">
                              Responded on{' '}
                              {request.respondedAt ? formatDate(request.respondedAt) : 'N/A'}
                            </p>
                          </div>
                        )}

                        <div className="flex justify-between items-center text-sm text-gray-500">
                          <span>Expires: {formatDate(request.expiresAt)}</span>

                          <div className="flex gap-2">
                            {userRole === 'COACH' &&
                              request.status === 'PENDING' &&
                              !isExpired(request.expiresAt) && (
                                <Button
                                  variant="bordered"
                                  onPress={() => openResponseModal(request)}
                                >
                                  Respond
                                </Button>
                              )}

                            {userRole === 'ATHLETE' &&
                              request.status === 'PENDING' &&
                              !isExpired(request.expiresAt) && (
                                <Button
                                  variant="bordered"
                                  onPress={() => handleCancelRequest(request.id)}
                                >
                                  Cancel
                                </Button>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))
            )}
          </div>
        </CardBody>
      </Card>

      {/* Response Dialog */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalHeader>
          <h3>Respond to Coaching Request</h3>
        </ModalHeader>
        <ModalContent>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="bg-background p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">Original Message:</p>
                <p className="text-sm text-text">
                  {selectedRequest.message || 'No message provided'}
                </p>
              </div>

              <Textarea
                placeholder="Add a personal message to your response..."
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                rows={3}
              />

              <div className="text-sm text-gray-500">
                <p>• Accepting will create a new coach-athlete relationship</p>
                <p>• Rejecting will notify the athlete and close the request</p>
                <p>• You can add a personal message to explain your decision</p>
              </div>
            </div>
          )}
        </ModalContent>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="ghost" onClick={() => handleRespondToRequest('REJECTED')}>
            Reject
          </Button>
          <Button onClick={() => handleRespondToRequest('ACCEPTED')}>Accept</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};
