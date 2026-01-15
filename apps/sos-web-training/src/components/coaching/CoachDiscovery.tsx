'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Select,
  SelectItem,
  Badge,
  Modal,
  ModalContent,
  ModalHeader,
  ModalFooter,
  Textarea,
  Avatar,
} from '@heroui/react';
import { useCoachDiscovery } from '../../hooks/api/useCoachDiscovery';
import { CoachDiscoveryProfile, CoachRequest } from '../../types/coaching';
import { useAuth } from '@/contexts/auth-context';
import { UserRole } from '@strengthos/shared-types';

// FOR ATHLETE ONLY
export function CoachDiscovery() {
  const { state } = useAuth();
  const user = state.user;
  const [searchFilters, setSearchFilters] = useState({
    specializations: [] as string[],
    languages: [] as string[],
    location: '',
    maxHourlyRate: 0,
    minRating: 0,
    availableSlots: false,
    search: '',
  });

  const [selectedCoach, setSelectedCoach] = useState<CoachDiscoveryProfile | null>(null);
  const [requestMessage, setRequestMessage] = useState('');

  const [isOpen, setIsOpen] = useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);
  const {
    coaches,
    loading,
    searchCoaches,
    requestCoach,
    getCoachRequests,
    respondToRequest,
    cancelRequest,
  } = useCoachDiscovery();

  useEffect(() => {
    searchCoaches(searchFilters);
  }, []);

  const handleSearch = () => {
    searchCoaches(searchFilters);
  };

  const handleRequestCoach = async () => {
    if (!selectedCoach) return;

    try {
      await requestCoach({
        coachId: selectedCoach.coachId,
        message: requestMessage,
        expiresIn: 72, // 72 hours
      });

      onClose();
      setRequestMessage('');
      setSelectedCoach(null);

      // Show success message
      alert('Coach request sent successfully!');
    } catch (error) {
      console.error('Failed to send coach request:', error);
      alert('Failed to send coach request. Please try again.');
    }
  };

  const openRequestModal = (coach: CoachDiscoveryProfile) => {
    setSelectedCoach(coach);
    onOpen();
  };

  if (user?.role !== UserRole.ATHLETE) {
    return (
      <Card>
        <CardBody>
          <p className="text-center text-gray-500">
            Coach discovery is only available for athletes.
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-medium">Find Your Perfect Coach</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search by name, bio, or experience..."
              value={searchFilters.search}
              onChange={(e) => setSearchFilters((prev) => ({ ...prev, search: e.target.value }))}
            />

            <Input
              placeholder="City, State, or Country"
              value={searchFilters.location}
              onChange={(e) => setSearchFilters((prev) => ({ ...prev, location: e.target.value }))}
            />

            <Input
              type="number"
              placeholder="USD per hour"
              value={searchFilters.maxHourlyRate.toString()}
              onChange={(e) =>
                setSearchFilters((prev) => ({
                  ...prev,
                  maxHourlyRate: parseFloat(e.target.value) || 0,
                }))
              }
            />
          </div>

          <div className="flex gap-4">
            <Button className="w-full" onPress={handleSearch} isLoading={loading}>
              Search Coaches
            </Button>

            <Button
              className="w-full"
              variant="bordered"
              onPress={() =>
                setSearchFilters((prev) => ({ ...prev, availableSlots: !prev.availableSlots }))
              }
              color={searchFilters.availableSlots ? 'success' : 'default'}
            >
              {searchFilters.availableSlots ? 'Available Only' : 'Show All'}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Coach Results */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coaches.map((coach) => (
          <Card key={coach.id} className="hover:shadow-lg transition-shadow">
            <CardBody className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar
                  src={coach.profileImageUrl}
                  name={coach.displayName}
                />
                <div>
                  <h4 className="font-medium">{coach.displayName}</h4>
                  <p className="text-sm text-gray-500">{coach.location}</p>
                  {coach.rating && (
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">★</span>
                      <span className="text-sm">{coach.rating.toFixed(1)} ({coach.reviewCount} reviews)</span>
                    </div>
                  )}
                </div>
              </div>

              {coach.bio && (
                <p className="text-sm text-Secondary line-clamp-3">{coach.bio}</p>
              )}

              <div className="space-y-2">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Specializations</p>
                  <div className="flex flex-wrap gap-1">
                    {coach.specializations.slice(0, 3).map((spec) => (
                      <Badge key={spec} variant="shadow">
                        {spec}
                      </Badge>
                    ))}
                    {coach.specializations.length > 3 && (
                      <Badge variant="shadow">
                        +{coach.specializations.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">
                    {coach.availableSlots} / {coach.maxAthletes} slots available
                  </span>
                  {coach.hourlyRate && (
                    <span className="font-medium">
                      ${coach.hourlyRate}/{coach.currency || 'USD'} per hour
                    </span>
                  )}
                </div>
              </div>

              <Button className="w-full"
                disabled={!coach.isAcceptingNewAthletes || coach.availableSlots === 0}
                onPress={() => openRequestModal(coach)}
              >
                {coach.isAcceptingNewAthletes && coach.availableSlots > 0
                  ? 'Request Coaching'
                  : 'Not Available'
                }
              </Button>
            </CardBody>
          </Card>
        ))}
      </div> */}

      {coaches.length === 0 && !loading && (
        <Card>
          <CardBody>
            <p className="text-center text-gray-500">
              No coaches found matching your criteria. Try adjusting your search filters.
            </p>
          </CardBody>
        </Card>
      )}

      {/* Request Coach Dialog */}
      {/* <Modal isOpen={isOpen} onClose={onClose}>
          <ModalHeader>
            <h3>Request Coaching from {selectedCoach?.displayName}</h3>
          </ModalHeader>
          <ModalContent>
            {selectedCoach && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={selectedCoach.profileImageUrl}
                    name={selectedCoach.displayName}
                  />
                  <div>
                    <h4 className="font-medium">{selectedCoach.displayName}</h4>
                    <p className="text-sm text-gray-500">{selectedCoach.experience}</p>
                    {selectedCoach.hourlyRate && (
                      <p className="text-sm font-medium">
                        ${selectedCoach.hourlyRate}/{selectedCoach.currency || 'USD'} per hour
                      </p>
                    )}
                  </div>
                </div>

                <Textarea
                  placeholder="Tell the coach about your goals, experience level, and why you'd like to work with them..."
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  rows={4}
                />

                <div className="text-sm text-gray-500">
                  <p>• Your request will expire in 72 hours if not responded to</p>
                  <p>• The coach will be notified via email and in-app notification</p>
                  <p>• You can cancel your request at any time before it's accepted</p>
                </div>
              </div>
            )}
          </ModalContent>
          <ModalFooter>
            <Button className="w-full" variant="ghost" onPress={onClose}>
              Cancel
            </Button>
            <Button className="w-full" onPress={handleRequestCoach}>
              Send Request
            </Button>
          </ModalFooter>
      </Modal> */}
    </div>
  );
}
