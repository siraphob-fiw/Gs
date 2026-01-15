'use client';

import { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalFooter,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronLeft, FaChevronRight, FaPersonRunning } from 'react-icons/fa6';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import {
  TrainingSession,
  TrainingSessionExercise,
  useTrainingSessionsCalendar,
} from '@/hooks/api/use-training-session';
import { User } from '@strengthos/shared-types';
import { UserRole } from '@strengthos/shared-types/src/shared-types';
import { useIsMobile } from '@/hooks/api/use-screen-utils';

export interface WorkoutCalendarProps {
  user?: User;
  ableToAction?: boolean;
  athleteId?: string;
}

export interface PopupOpenedState {
  key: string;
  isOpened: boolean;
}

export const WorkoutCalendar = ({ user, ableToAction = true, athleteId }: WorkoutCalendarProps) => {
  const router = useRouter();
  const [popupStates, setPopupStates] = useState<PopupOpenedState>({
    key: '',
    isOpened: false,
  });
  
  // Always call the hook with the same structure - pass athleteId if provided
  const { data: trainingSessions, isLoading: trainingSessionsLoading, error } = 
    useTrainingSessionsCalendar(athleteId ? { athleteId } : undefined);
  
  const [currentDate, setCurrentDate] = useState(dayjs());
  const nameOfDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const startOfMonth = currentDate.startOf('month');
  const endOfMonth = currentDate.endOf('month');
  const daysInMonth = endOfMonth.date();
  const startDay = startOfMonth.day();
  const endDay = endOfMonth.day();
  const [isViewWorkoutsOpen, setIsViewWorkoutsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const isMobile = useIsMobile();
  const [isSelectSessionOpen, setIsSelectSessionOpen] = useState<string[]>([]);

  const onPrevMonth = () => {
    setCurrentDate(currentDate.subtract(1, 'month'));
    setPopupStates({
      key: '',
      isOpened: false,
    });
  };

  const onNextMonth = () => {
    setCurrentDate(currentDate.add(1, 'month'));
    setPopupStates({
      key: '',
      isOpened: false,
    });
  };

  const RenderCell = (day: number) => {
    const isToday = dayjs(currentDate.date(day).format('YYYY-MM-DD')).isSame(
      dayjs().format('YYYY-MM-DD'),
      'day',
    );
    const dateStr = currentDate.date(day).format('YYYY-MM-DD');
    const sessionList =
      trainingSessions?.sessions.filter((session) =>
        session.exercises.some(
          (exercise) =>
            !!exercise.exerciseDate && dayjs(exercise.exerciseDate).isSame(dateStr, 'day'),
        ),
      ) || [];

    const numberOfSessions = sessionList.length;
    const totalItems = numberOfSessions;

    const onBtnPress = () => {
      setPopupStates({
        key: dateStr,
        isOpened: true,
      });
    };

    const onGoToWorkoutsPress = (date?: string) => {
      if (sessionList.length > 1) {
        setPopupStates({
          key: '',
          isOpened: false,
        });
        setIsSelectSessionOpen(sessionList.map((session) => session.id));
        return;
      } else {
        const workoutId = sessionList[0]?.id;
        if (workoutId) {
          ableToAction ?
            router.push(`/workout/session/${workoutId}?progress=true${date ? `&date=${date}` : ''}`)
            : router.push(`/workout/session/${workoutId}${date ? `?date=${date}` : ''}`);
        }
      }
    };

    return (
      <Popover
        isOpen={popupStates.key === dateStr && popupStates.isOpened}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setPopupStates({
              key: '',
              isOpened: false,
            });
          }
        }}
      >
        <PopoverTrigger>
          <div
            onClick={onBtnPress}
            className={`${isMobile ? 'min-h-16' : 'min-h-20'} flex flex-col gap-2 p-2 cursor-pointer transition relative bg-backgroundSecondary focus:outline-none`}
            tabIndex={0}
            style={{
              boxShadow: 'none',
              outline: 'none',
              border: 'none',
              zIndex: 0,
            }}
          >
            <div className="flex items-center justify-start">
              <span className={`text-xs font-medium ${isToday ? 'text-primary' : ''}`}>
                {isMobile ? dayjs(currentDate.date(day)).format('DD MMM YYYY') : day}
              </span>
              {totalItems > 0 && (
                <FaPersonRunning
                  size={20}
                  className={`absolute top-1 right-1 ${isToday ? 'text-primary' : 'text-text'}`}
                  style={{ zIndex: 2 }}
                />
              )}
            </div>
            <div className="flex flex-col gap-1 items-center">
              {sessionList &&
                sessionList.length > 0 &&
                sessionList.map((session: TrainingSession, index) => (
                  <div
                    key={session.id || `session-${index}`}
                    className="w-full p-1 border rounded-md bg-success text-xs font-medium text-center text-white"
                    style={{
                      boxShadow: 'none',
                      outline: 'none',
                      border: '1px solid var(--border, #eee)',
                    }}
                  >
                    {session.sessionName.length > 12
                      ? session.sessionName.substring(0, 12) + '...'
                      : session.sessionName}
                  </div>
                ))}
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="max-w-[300px] min-w-[280px] shadow-none border border-border rounded-lg"
          style={{
            boxShadow: 'none',
            border: '1px solid var(--border, #eee)',
            background: 'white',
            position: 'relative',
            overflow: 'visible',
          }}
        >
          <div className="p-2 w-full flex flex-col gap-2">
            <div className="flex justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-black">
                  {dayjs(dateStr).format('MMM D, YYYY')}
                </span>
                {isToday && <span className="text-sm text-success italic">Today</span>}
              </div>
              {totalItems == 0 && !ableToAction ? null : (
                <Button
                  color={totalItems > 0 ? 'default' : 'primary'}
                  size="sm"
                  variant="solid"
                  onPress={() => {
                    // if (totalItems > 0 && !ableToAction) {
                    //   setSelectedDate(dayjs(dateStr).format('YYYY-MM-DD'));
                    //   setIsViewWorkoutsOpen(true);
                    //   setPopupStates({
                    //     key: '',
                    //     isOpened: false,
                    //   }); } else 
                    if (totalItems > 0) {
                      onGoToWorkoutsPress(dateStr);
                    } else {
                      router.push(
                        `/workout/session/deploy?date=${dateStr}${user?.role === UserRole.COACH ? `&athlete_id=${athleteId}` : ''}`,
                      );
                    }
                  }}
                >
                  {totalItems > 0
                    ? isToday
                      ? 'Go to workouts'
                      : 'View workouts'
                    : 'New Session'}
                </Button>
              )}
            </div>
            {totalItems < 1 ? (
              user?.role === UserRole.ATHLETE ? (
                <div className="text-center py-2 text-textSecondary">
                  You have no training sessions on this day
                </div>
              ) : (
                <div className="text-center py-2 text-textSecondary">
                  No workout scheduled for this day
                </div>
              )
            ) : (
              <div className="text-small pl-px text-default-500 flex flex-col gap-2">
                {Array.isArray(sessionList) && sessionList.length > 0 ? (
                  sessionList.map((session: TrainingSession, index) => {
                    const exercises = Array.isArray(session?.exercises) ? session.exercises : [];
                    const exercisesForThisDay = exercises.filter(
                      (exercise: TrainingSessionExercise) =>
                        exercise.exerciseDate &&
                        dayjs(exercise.exerciseDate).format('YYYY-MM-DD') ===
                          dayjs(dateStr).format('YYYY-MM-DD'),
                    );

                    if (exercisesForThisDay.length === 0) {
                      return null;
                    }

                    return (
                      <div
                        key={session.id || `session-${index}`}
                        className="mb-2 flex flex-col gap-2"
                        style={{
                          border: 'none',
                          boxShadow: 'none',
                          background: 'transparent',
                        }}
                      >
                        <div className="text-xs font-medium mb-1">
                          {session.sessionName ? session.sessionName : `Session ${index + 1}`}
                        </div>
                        {exercisesForThisDay.map(
                          (exercise: TrainingSessionExercise, exerciseIndex: number) => (
                            <div
                              key={exercise.id || `exercise-${exerciseIndex}`}
                              className="flex flex-col"
                              style={{ border: 'none', background: 'inherit', boxShadow: 'none' }}
                            >
                              <div className="font-medium flex items-center">
                                <span className="mr-2 font-medium text-danger text-xs">•</span>
                                <span>
                                  {exercise.exerciseName || `Exercise ${exerciseIndex + 1}`}
                                </span>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="mb-2 flex flex-col">
                    <div className="text-xs font-semibold text-info mb-1">No sessions</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  // const renderViewWorkouts = () => {
  //   const selectedDayStr = selectedDate ? dayjs(selectedDate).format('YYYY-MM-DD') : '';
  //   const filteredSessions = selectedDayStr
  //     ? trainingSessions?.sessions.reduce((acc: TrainingSession[], session) => {
  //         if (!session?.exercises || !Array.isArray(session.exercises)) return acc;
  //         const filteredExercises = session.exercises.filter(
  //           (exercise) =>
  //             exercise?.exerciseDate &&
  //             dayjs(exercise.exerciseDate).format('YYYY-MM-DD') === selectedDayStr,
  //         );
  //         if (filteredExercises.length > 0) {
  //           acc.push({ ...session, exercises: filteredExercises });
  //         }
  //         return acc;
  //       }, [])
  //     : [];

  //   return (
  //     <Modal
  //       size="2xl"
  //       isOpen={isViewWorkoutsOpen}
  //       onClose={() => setIsViewWorkoutsOpen(false)}
  //       className="bg-backgroundSecondary border border-border shadow-enhanced-xl"
  //       hideCloseButton={false}
  //       backdrop="opaque"
  //       placement="center"
  //     >
  //       <ModalContent>
  //         {(onClose) => (
  //           <>
  //             <ModalHeader>
  //               <h3 className="text-lg font-medium">
  //                 Workouts for {selectedDate ? dayjs(selectedDate).format('MMMM D, YYYY') : ''}
  //               </h3>
  //             </ModalHeader>
  //             <ModalBody className="px-2 max-h-[70vh] overflow-y-auto">
  //               {filteredSessions && filteredSessions.length > 0 ? (
  //                 <div className="space-y-4">
  //                   {filteredSessions.map((session) => (
  //                     <div key={session?.id} className="border border-border rounded-lg p-2">
  //                       <div className="flex items-center justify-between mb-1">
  //                         <h4 className="font-medium text-base truncate max-w-[60%]">
  //                           {session?.sessionName || `Session`}
  //                         </h4>
  //                         <span className="text-sm text-textSecondary">
  //                           {session?.exercises.length} exercise
  //                           {session?.exercises.length !== 1 && 's'}
  //                         </span>
  //                       </div>
  //                       <div className="space-y-3">
  //                         {session?.exercises.map((exercise, exerciseIdx) => (
  //                           <div
  //                             key={`${session.id}-${exercise?.id || exercise?.exerciseName}-${exerciseIdx}`}
  //                             className="flex flex-col items-start space-y-2"
  //                           >
  //                             <div className="flex items-center space-x-2">
  //                               <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></span>
  //                               <span className="font-medium">{exercise?.exerciseName}</span>
  //                             </div>
  //                             <Table
  //                               aria-label="exercise-table"
  //                               removeWrapper
  //                               classNames={{
  //                                 base: 'bg-background',
  //                                 th: 'bg-transparent text-text text-sm font-medium border-b border-border',
  //                                 td: 'p-0 text-text',
  //                               }}
  //                             >
  //                               <TableHeader>
  //                                 <TableColumn align="center">Target</TableColumn>
  //                                 <TableColumn align="center">Actual</TableColumn>
  //                               </TableHeader>
  //                               <TableBody>
  //                                 <TableRow>
  //                                   <TableCell>
  //                                     <Table
  //                                       aria-label="exercise-taget"
  //                                       removeWrapper
  //                                       classNames={{
  //                                         base: 'bg-background',
  //                                         th: 'bg-transparent text-text text-xs font-medium border-b border-border',
  //                                         td: 'text-text',
  //                                       }}
  //                                     >
  //                                       <TableHeader>
  //                                         <TableColumn align="center">Set</TableColumn>
  //                                         <TableColumn align="center">Weight (kgs)</TableColumn>
  //                                         <TableColumn align="center">Reps</TableColumn>
  //                                         <TableColumn align="center">RPE</TableColumn>
  //                                       </TableHeader>
  //                                       <TableBody>
  //                                         {Array.isArray(exercise?.target) &&
  //                                         exercise.target.length > 0 ? (
  //                                           exercise.target.map(
  //                                             (target: any, targetIdx: number) => (
  //                                               <TableRow
  //                                                 key={`${session.id}-${exercise?.exerciseName ?? ''}-target-${targetIdx}`}
  //                                               >
  //                                                 <TableCell className="px-2 py-1 text-center">
  //                                                   {targetIdx + 1}
  //                                                 </TableCell>
  //                                                 <TableCell className="px-2 py-1 text-center">
  //                                                   {target && 'weight' in target
  //                                                     ? target.weight
  //                                                     : '--'}
  //                                                 </TableCell>
  //                                                 <TableCell className="px-2 py-1 text-center">
  //                                                   {target && 'reps' in target
  //                                                     ? target.reps
  //                                                     : '--'}
  //                                                 </TableCell>
  //                                                 <TableCell className="px-2 py-1 text-center">
  //                                                   {target && 'rpe' in target ? target.rpe : '--'}
  //                                                 </TableCell>
  //                                               </TableRow>
  //                                             ),
  //                                           )
  //                                         ) : (
  //                                           <TableRow>
  //                                             <TableCell
  //                                               className="px-2 py-1 text-center"
  //                                               colSpan={4}
  //                                             >
  //                                               No Exercise Data
  //                                             </TableCell>
  //                                           </TableRow>
  //                                         )}
  //                                       </TableBody>
  //                                     </Table>
  //                                   </TableCell>

  //                                   <TableCell>
  //                                     <Table
  //                                       aria-label="exercise-actual"
  //                                       removeWrapper
  //                                       classNames={{
  //                                         base: 'bg-background',
  //                                         th: 'bg-transparent text-text text-sm font-medium border-b border-border',
  //                                         td: 'text-text',
  //                                       }}
  //                                     >
  //                                       <TableHeader>
  //                                         <TableColumn className="text-center">Reps</TableColumn>
  //                                         <TableColumn className="text-center">
  //                                           Weight (kgs)
  //                                         </TableColumn>
  //                                         <TableColumn className="text-center">RPE</TableColumn>
  //                                       </TableHeader>
  //                                       <TableBody>
  //                                         {Array.isArray(exercise?.actual) &&
  //                                         exercise.actual.length > 0 ? (
  //                                           exercise.actual.map(
  //                                             (actual: any, targetIdx: number) => (
  //                                               <TableRow
  //                                                 key={`${session.id}-${exercise?.exerciseName ?? ''}-actual-${targetIdx}`}
  //                                               >
  //                                                 <TableCell className="px-2 py-1 text-center">
  //                                                   {actual && 'reps' in actual
  //                                                     ? actual.reps
  //                                                     : '--'}
  //                                                 </TableCell>
  //                                                 <TableCell className="px-2 py-1 text-center">
  //                                                   {actual && 'weight' in actual
  //                                                     ? actual.weight
  //                                                     : '--'}
  //                                                 </TableCell>
  //                                                 <TableCell className="px-2 py-1 text-center">
  //                                                   {actual && 'rpe' in actual ? actual.rpe : '--'}
  //                                                 </TableCell>
  //                                               </TableRow>
  //                                             ),
  //                                           )
  //                                         ) : (
  //                                           <TableRow>
  //                                             <TableCell
  //                                               className="px-2 py-1 text-center"
  //                                               colSpan={4}
  //                                             >
  //                                               No Exercise Data
  //                                             </TableCell>
  //                                           </TableRow>
  //                                         )}
  //                                       </TableBody>
  //                                     </Table>
  //                                   </TableCell>
  //                                 </TableRow>
  //                               </TableBody>
  //                             </Table>
  //                           </div>
  //                         ))}
  //                       </div>
  //                     </div>
  //                   ))}
  //                 </div>
  //               ) : (
  //                 <div className="text-center py-12 text-textSecondary text-base">
  //                   No workouts scheduled for this day.
  //                 </div>
  //               )}
  //             </ModalBody>
  //             <ModalFooter>
  //               <Button onPress={onClose} variant="solid">
  //                 Close
  //               </Button>
  //             </ModalFooter>
  //           </>
  //         )}
  //       </ModalContent>
  //     </Modal>
  //   );
  // };

  const renderSelectSession = () => {
    return (
      <Modal
        size="2xl"
        isOpen={isSelectSessionOpen.length > 0}
        onClose={() => setIsSelectSessionOpen([])}
        className="bg-backgroundSecondary border border-border shadow-enhanced-xl"
        hideCloseButton={false}
        backdrop="opaque"
        placement="center"
      >
        <ModalContent>
          <ModalHeader>Select Session</ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-2">
              {isSelectSessionOpen.map((sessionId) => (
                <Button
                  key={sessionId}
                  onPress={() => {ableToAction ?
                    router.push(`/workout/session/${sessionId}?progress=true`)
                    : router.push(`/workout/session/${sessionId}`);
                  }}
                  variant="solid"
                >
                  {
                    trainingSessions?.sessions.find((session) => session.id === sessionId)
                      ?.sessionName
                  }
                </Button>
              ))}
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  };

  if (trainingSessionsLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-info"></div>
        <span className="ml-2 text-text mt-2">Loading calendar...</span>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto bg-backgroundSecondary">
      <div className="flex justify-between items-center mb-4">
        <Button isIconOnly variant="solid" onPress={onPrevMonth} className="p-2 rounded-full">
          <FaChevronLeft size={20} />
        </Button>
        <h2 className="text-lg font-medium text-text">{currentDate.format('MMMM YYYY')}</h2>
        <Button isIconOnly variant="solid" onPress={onNextMonth} className="p-2 rounded-full">
          <FaChevronRight size={20} />
        </Button>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentDate.format('MMMM YYYY')}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2, ease: 'linear' }}
        >
          <div
            className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-7'} text-center text-text divide-x divide-y divide-border border border-border rounded-md`}
          >
            {!isMobile &&
              nameOfDays.map((day) => (
                <div key={day} className="font-medium py-2">
                  {day}
                </div>
              ))}
            {!isMobile &&
              [...Array(startDay)].map((_, index) => (
                <div
                  key={`empty-start-${index}`}
                  className={`${isMobile ? 'min-h-16' : 'min-h-20'}`}
                />
              ))}
            {[...Array(daysInMonth)].map((_, index) => {
              const day = index + 1;
              return <div key={day}>{RenderCell(day)}</div>;
            })}
            {!isMobile &&
              [...Array(6 - endDay)].map((_, index) => (
                <div
                  key={`empty-end-${index}`}
                  className={`${isMobile ? 'min-h-16' : 'min-h-20'}`}
                />
              ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* {!ableToAction && renderViewWorkouts()} */}

      {renderSelectSession()}
    </div>
  );
};
