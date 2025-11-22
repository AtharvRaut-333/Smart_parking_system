import { Modal, Box, Button, Typography, Chip, IconButton, Skeleton, Fade, Slide } from "@mui/material";
import { useState, useMemo, useCallback, useEffect } from "react";
import { Close as CloseIcon, LocalParking, Schedule, LocationOn, AttachMoney, Timer } from "@mui/icons-material";
import DateTimePickerComponent from "../DateTimePicker/DateTImePicker";
import { useWebSocket } from "../../Hooks/useWebSocket";

export const ParkingModal = ({
  spot,
  selectedSlot,
  setSelectedSlot,
  open,
  onClose,
  onBook,
  loading = false
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [slotStates, setSlotStates] = useState(new Map());
  const [reservedSlots, setReservedSlots] = useState(new Map());

  // WebSocket integration
  const { 
    subscribeToSlotUpdates, 
    reserveSlot, 
    releaseSlot,
    webSocketService,
    user
  } = useWebSocket();

  // Add debug effect
  useEffect(() => {
    console.log('ParkingModal - User from useWebSocket:', user);
    console.log('ParkingModal - User has ID:', !!user?.userId);
    console.log('ParkingModal - User object structure:', {
      userId: user?.userId,
      id: user?.id,
      fullname: user?.fullname,
      name: user?.name
    });
  }, [user]);

  // Initialize slot states
  useEffect(() => {
    if (spot?.parkingSlot) {
      const initialStates = new Map();
      spot.parkingSlot.forEach(slot => {
        initialStates.set(slot.slotId, {
          available: slot.available,
          reserved: false,
          reservedBy: null,
          reservedAt: null
        });
      });
      setSlotStates(initialStates);
    }
  }, [spot]);

  // Subscribe to real-time slot updates
  useEffect(() => {
    if (!spot?.spaceId || !open) return;

    let subscription;
    
    const handleSlotUpdate = (message) => {
      console.log('🔥 ParkingModal - WEBSOCKET MESSAGE RECEIVED:', message);
      
      setSlotStates(prevStates => {
        const newStates = new Map(prevStates);
        const currentState = newStates.get(message.slotId) || {};
        
        switch (message.action) {
          case 'RESERVED':
            newStates.set(message.slotId, {
              ...currentState,
              available: false,
              reserved: true,
              reservedBy: message.userName,
              reservedAt: new Date(message.timestamp)
            });
            
            // Set timeout to show reservation expiry
            if (message.userId !== user?.userId) {
              setTimeout(() => {
                setReservedSlots(prev => {
                  const updated = new Map(prev);
                  updated.delete(message.slotId);
                  return updated;
                });
              }, 5 * 60 * 1000); // 5 minutes
            }
            break;
            
          case 'RELEASED':
          case 'TIMEOUT':
            newStates.set(message.slotId, {
              ...currentState,
              available: true,
              reserved: false,
              reservedBy: null,
              reservedAt: null
            });
            break;
            
          case 'BOOKED':
            newStates.set(message.slotId, {
              ...currentState,
              available: false,
              reserved: false,
              reservedBy: null,
              reservedAt: null
            });
            break;
        }
        
        return newStates;
      });
    };

    // Subscribe to parking space specific updates
    console.log('🔥 SUBSCRIBING TO SLOT UPDATES for parking space:', spot.spaceId);
    subscription = subscribeToSlotUpdates(spot.spaceId, handleSlotUpdate);
    
    // Subscribe to parking space for initial status
    console.log('🔥 SUBSCRIBING TO PARKING SPACE:', spot.spaceId);
    webSocketService.subscribeToParkingSpace(spot.spaceId);
    
    // Add a test message listener to see if ANY messages are received
    console.log('🔥 WebSocket subscription created:', subscription);
    
    // Add timeout to check if we receive any messages
    setTimeout(() => {
      console.log('🔥 TIMEOUT CHECK: If you see this but no WEBSOCKET MESSAGE RECEIVED, backend is not responding');
    }, 3000);

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [spot?.spaceId, open, subscribeToSlotUpdates, user?.userId, webSocketService]);

  // Memoize slot calculations for better performance with real-time updates
  const slotStats = useMemo(() => {
    if (!spot?.parkingSlot) return { available: 0, total: 0, occupied: 0, reserved: 0 };
    
    let available = 0;
    let reserved = 0;
    let occupied = 0;
    
    spot.parkingSlot.forEach(slot => {
      const state = slotStates.get(slot.slotId);
      if (state) {
        if (state.reserved) {
          reserved++;
        } else if (state.available) {
          available++;
        } else {
          occupied++;
        }
      } else {
        // Fallback to original slot data
        if (slot.available) {
          available++;
        } else {
          occupied++;
        }
      }
    });
    
    const total = spot.parkingSlot.length;
    
    return { available, total, occupied, reserved };
  }, [spot?.parkingSlot, slotStates]);

  const handleSlotClick = useCallback((slotId) => {
    console.log('ParkingModal - Slot clicked, user check:', { user, hasId: !!user?.id });
    
    // Check if user is logged in
    if (!user || !user.userId) {
      console.log('ParkingModal - User validation failed:', { user, id: user?.id });
      alert('Please log in to reserve a slot');
      return;
    }

    const slotState = slotStates.get(slotId);
    
    if (!slotState?.available) {
      return; // Slot not available
    }

    // If clicking on already selected slot, release it
    if (selectedSlot === slotId) {
      const success = releaseSlot(slotId, spot.spaceId);
      if (success) {
        setSelectedSlot(null);
      }
      return;
    }

    // Release previously selected slot
    if (selectedSlot) {
      releaseSlot(selectedSlot, spot.spaceId);
    }

    // Reserve new slot
    const success = reserveSlot(slotId, spot.spaceId);
    if (success) {
      setSelectedSlot(slotId);
    }
  }, [selectedSlot, slotStates, reserveSlot, releaseSlot, spot?.spaceId, user, setSelectedSlot]);

  const handleClose = useCallback(() => {
    // Release any reserved slots by current user
    slotStates.forEach((state, slotId) => {
      if (state.reserved && state.reservedBy === user?.fullname) {
        releaseSlot(slotId, spot.spaceId);
      }
    });

    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setSelectedSlot(null);
      setIsClosing(false);
    }, 200);
  }, [onClose, setSelectedSlot, slotStates, releaseSlot, spot?.spaceId, user?.fullname]);

  const handleBook = useCallback(() => {
    if (selectedSlot) {
      onBook(selectedSlot);
    }
  }, [selectedSlot, onBook]);

  const getSlotStatus = (slot) => {
    const state = slotStates.get(slot.slotId);
    if (!state) return { status: 'available', color: 'success', text: 'Available' };

    if (state.reserved) {
      if (state.reservedBy === user?.fullname) {
        return { status: 'reserved-by-you', color: 'primary', text: 'Reserved by You' };
      } else {
        return { status: 'reserved-by-other', color: 'warning', text: `Reserved by ${state.reservedBy}` };
      }
    }

    if (!state.available) {
      return { status: 'booked', color: 'error', text: 'Booked' };
    }

    return { status: 'available', color: 'success', text: 'Available' };
  };

  const getSlotButtonStyle = (slot) => {
    const slotStatus = getSlotStatus(slot);
    const isSelected = selectedSlot === slot.slotId;
    
    return {
      aspectRatio: '1',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 2,
      fontSize: { xs: '0.75rem', sm: '0.875rem' },
      fontWeight: 600,
      cursor: slotStatus.status === 'available' || slotStatus.status === 'reserved-by-you' ? 'pointer' : 'not-allowed',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative',
      bgcolor: isSelected ? '#3b82f6' :
               slotStatus.status === 'available' ? 'white' :
               slotStatus.status === 'reserved-by-you' ? '#3b82f6' :
               slotStatus.status === 'reserved-by-other' ? '#f59e0b' : '#6b7280',
      color: isSelected || slotStatus.status !== 'available' ? 'white' : '#374151',
      border: isSelected ? '2px solid #1d4ed8' :
              slotStatus.status === 'available' ? '2px solid #10b981' :
              slotStatus.status === 'reserved-by-you' ? '2px solid #1d4ed8' :
              slotStatus.status === 'reserved-by-other' ? '2px solid #d97706' : '2px solid #6b7280',
      transform: isSelected ? 'scale(1.05)' : 'scale(1)',
      boxShadow: isSelected ? '0 4px 12px rgba(59, 130, 246, 0.4)' :
                 slotStatus.status === 'available' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
      opacity: slotStatus.status === 'available' || slotStatus.status === 'reserved-by-you' ? 1 : 0.6,
      '&:hover': (slotStatus.status === 'available' || slotStatus.status === 'reserved-by-you') ? {
        transform: 'scale(1.02)',
        boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
      } : {},
      '&:active': (slotStatus.status === 'available' || slotStatus.status === 'reserved-by-you') ? {
        transform: 'scale(0.98)'
      } : {}
    };
  };

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <Box sx={{ p: 3 }}>
      <Skeleton variant="text" width="60%" height={32} />
      <Skeleton variant="text" width="80%" height={24} sx={{ mt: 1 }} />
      <Skeleton variant="text" width="40%" height={24} sx={{ mt: 1 }} />
      <Skeleton variant="rectangular" width="100%" height={60} sx={{ mt: 3 }} />
      <Skeleton variant="rectangular" width="100%" height={200} sx={{ mt: 3 }} />
    </Box>
  );

  if (loading) {
    return (
      <Modal open={open} onClose={handleClose}>
        <Box
          sx={{
            width: { xs: '95%', sm: '90%', md: 700, lg: 800 },
            maxWidth: '95vw',
            maxHeight: { xs: '95vh', sm: '90vh', md: '85vh' },
            bgcolor: "white",
            margin: "auto",
            mt: { xs: 1, sm: 3, md: 6 },
            borderRadius: { xs: 2, md: 3 },
            boxShadow: 24,
          }}
        >
          <LoadingSkeleton />
        </Box>
      </Modal>
    );
  }

  return (
    <Modal 
      open={open} 
      onClose={handleClose}
      closeAfterTransition
      sx={{
        '& .MuiBackdrop-root': {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
        }
      }}
    >
      <Fade in={open && !isClosing} timeout={300}>
        <Box
          sx={{
            width: { xs: '95%', sm: '90%', md: 700, lg: 800 },
            maxWidth: '95vw',
            maxHeight: { xs: '95vh', sm: '90vh', md: '85vh' },
            bgcolor: "white",
            margin: "auto",
            mt: { xs: 1, sm: 3, md: 6 },
            display: "flex",
            flexDirection: "column",
            borderRadius: { xs: 2, md: 3 },
            boxShadow: 24,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              p: { xs: 2, sm: 3 },
              borderBottom: '1px solid #e5e7eb',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              position: 'relative',
            }}
          >
            <IconButton
              onClick={handleClose}
              sx={{
                position: 'absolute',
                right: { xs: 8, sm: 16 },
                top: { xs: 8, sm: 16 },
                color: 'white',
                bgcolor: 'rgba(255,255,255,0.1)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
              }}
            >
              <CloseIcon />
            </IconButton>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography 
                variant="h5" 
                component="h2"
                sx={{ 
                  fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
                  fontWeight: 600,
                  pr: 5
                }}
              >
                {spot?.lotName}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', opacity: 0.9 }}>
                <LocationOn sx={{ fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  {spot?.address}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', opacity: 0.9 }}>
                <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  ₹{spot?.pricingPerHour}/hour
                </Typography>
              </Box>
            </Box>

            {/* Real-time Status Indicator */}
            <Box sx={{ mb: 2 }}>
              <Chip 
                icon={<Timer sx={{ fontSize: 16 }} />}
                label="Real-time updates active"
                size="small"
                sx={{ 
                  bgcolor: 'rgba(34, 197, 94, 0.9)',
                  color: 'white',
                  fontWeight: 500
                }}
              />
            </Box>

            {/* Stats Chips */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip 
                label={`${slotStats.available} Available`}
                size="small"
                sx={{ 
                  bgcolor: slotStats.available > 0 ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)',
                  color: 'white',
                  fontWeight: 500
                }}
              />
              <Chip 
                label={`${slotStats.reserved} Reserved`}
                size="small"
                sx={{ bgcolor: 'rgba(245, 158, 11, 0.9)', color: 'white' }}
              />
              <Chip 
                label={`${slotStats.occupied} Occupied`}
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
              />
            </Box>
          </Box>

          {/* Content */}
          <Box 
            sx={{ 
              flex: 1,
              overflow: 'auto',
              p: { xs: 2, sm: 3 },
              '&::-webkit-scrollbar': { width: 8 },
              '&::-webkit-scrollbar-track': { bgcolor: '#f1f5f9' },
              '&::-webkit-scrollbar-thumb': { bgcolor: '#cbd5e1', borderRadius: 4 },
            }}
          >
            {/* DateTime Picker */}
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Schedule sx={{ mr: 1, color: '#64748b' }} />
                <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.125rem' }, color: '#1e293b' }}>
                  Select Date & Time
                </Typography>
              </Box>
              <DateTimePickerComponent color="white" />
            </Box>

            {/* Parking Slots */}
            {spot?.totalSlots > 0 ? (
              <Box>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontSize: { xs: '1rem', sm: '1.125rem' }, 
                    mb: 3,
                    color: '#1e293b',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <LocalParking sx={{ mr: 1, color: '#64748b' }} />
                  Choose Your Parking Slot
                  {selectedSlot && (
                    <Chip 
                      label={`Slot ${selectedSlot} Selected`}
                      color="primary"
                      size="small"
                      sx={{ ml: 2 }}
                    />
                  )}
                </Typography>

                {/* Legend with real-time status */}
                <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 16, height: 16, bgcolor: 'white', border: '2px solid #10b981', borderRadius: 1 }} />
                    <Typography variant="caption">Available</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 16, height: 16, bgcolor: '#3b82f6', borderRadius: 1 }} />
                    <Typography variant="caption">Reserved by You</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 16, height: 16, bgcolor: '#f59e0b', borderRadius: 1 }} />
                    <Typography variant="caption">Reserved by Others</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 16, height: 16, bgcolor: '#6b7280', borderRadius: 1 }} />
                    <Typography variant="caption">Occupied</Typography>
                  </Box>
                </Box>

                {Array.from({ length: spot?.numberOfFloors }).map((_, floorIndex) => {
                  const floorSlots = spot?.parkingSlot?.slice(
                    floorIndex * 30, 
                    (floorIndex + 1) * 30
                  ) || [];
                  
                  return (
                    <Slide key={floorIndex} direction="up" in={true} timeout={300 + floorIndex * 100}>
                      <Box
                        sx={{
                          mb: 3,
                          border: '1px solid #e2e8f0',
                          borderRadius: 2,
                          overflow: 'hidden',
                          bgcolor: '#fafafa'
                        }}
                      >
                        <Box
                          sx={{
                            p: 2,
                            bgcolor: '#f1f5f9',
                            borderBottom: '1px solid #e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                        >
                          <Typography 
                            variant="subtitle1" 
                            sx={{ 
                              fontWeight: 600,
                              color: '#334155',
                              fontSize: { xs: '0.875rem', sm: '1rem' }
                            }}
                          >
                            Floor {floorIndex + 1}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {floorSlots.filter(slot => {
                              const state = slotStates.get(slot.slotId);
                              return state ? state.available : slot.available;
                            }).length} available
                          </Typography>
                        </Box>
                        
                        <Box sx={{ p: 3 }}>
                          <Box
                            sx={{
                              display: 'grid',
                              gridTemplateColumns: {
                                xs: 'repeat(auto-fill, minmax(48px, 1fr))',
                                sm: 'repeat(auto-fill, minmax(52px, 1fr))',
                                md: 'repeat(auto-fill, minmax(56px, 1fr))'
                              },
                              gap: { xs: 1.5, sm: 2 },
                              maxWidth: '100%'
                            }}
                          >
                            {floorSlots.map((slot, i) => {
                              const slotStatus = getSlotStatus(slot);
                              return (
                                <Box
                                  key={slot.slotId}
                                  onClick={() => handleSlotClick(slot.slotId)}
                                  sx={getSlotButtonStyle(slot)}
                                  title={slotStatus.text}
                                >
                                  {i + 1}
                                  {selectedSlot === slot.slotId && (
                                    <Box
                                      sx={{
                                        position: 'absolute',
                                        top: -2,
                                        right: -2,
                                        width: 8,
                                        height: 8,
                                        bgcolor: '#10b981',
                                        borderRadius: '50%',
                                        border: '2px solid white'
                                      }}
                                    />
                                  )}
                                </Box>
                              );
                            })}
                          </Box>
                        </Box>
                      </Box>
                    </Slide>
                  );
                })}
              </Box>
            ) : (
              <Box
                sx={{
                  textAlign: 'center',
                  py: 8,
                  color: '#64748b'
                }}
              >
                <LocalParking sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" gutterBottom>
                  No Slots Available
                </Typography>
                <Typography variant="body2">
                  All parking slots are currently occupied. Please try again later.
                </Typography>
              </Box>
            )}
          </Box>

          {/* Footer */}
          <Box
            sx={{
              p: { xs: 2, sm: 3 },
              borderTop: '1px solid #e5e7eb',
              bgcolor: '#fafafa',
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: { xs: 2, sm: 2 },
              alignItems: { xs: 'stretch', sm: 'center' },
              justifyContent: 'space-between'
            }}
          >
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              {selectedSlot && (
                <Typography variant="body2" color="text.secondary">
                  Slot {selectedSlot} selected • ₹{spot?.pricingPerHour}/hour
                </Typography>
              )}
            </Box>

            <Box 
              sx={{ 
                display: 'flex', 
                gap: 2,
                flexDirection: { xs: 'column', sm: 'row' },
                minWidth: { sm: 200 }
              }}
            >
              <Button
                variant="contained"
                onClick={handleBook}
                disabled={!selectedSlot}
                sx={{
                  flex: 1,
                  py: { xs: 1.5, sm: 1.25 },
                  fontSize: { xs: '1rem', sm: '0.875rem' },
                  fontWeight: 600,
                  borderRadius: 2,
                  textTransform: 'none',
                  bgcolor: '#3b82f6',
                  '&:hover': { bgcolor: '#2563eb' },
                  '&:disabled': { bgcolor: '#e2e8f0', color: '#94a3b8' }
                }}
              >
                {selectedSlot ? `Book Slot ${selectedSlot}` : 'Select a Slot'}
              </Button>

              <Button 
                onClick={handleClose} 
                variant="outlined"
                sx={{
                  py: { xs: 1.5, sm: 1.25 },
                  px: 3,
                  fontSize: { xs: '1rem', sm: '0.875rem' },
                  borderRadius: 2,
                  textTransform: 'none',
                  borderColor: '#d1d5db',
                  color: '#6b7280',
                  '&:hover': { 
                    borderColor: '#9ca3af',
                    bgcolor: '#f9fafb'
                  }
                }}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};