import { Modal, Box, Button, Typography, Divider, useTheme, useMediaQuery, Chip } from "@mui/material";
import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import DateTimePickerComponent from "../DateTimePicker/DateTImePicker";
import Cookies from "js-cookie";
import axios from "axios";
import { Lock, MapPin, Clock, IndianRupee, Calendar, Car, Timer, User } from "lucide-react";
import { useWebSocket } from "../../Hooks/useWebSocket";

export const BookSlotModal = ({
  spot,
  selectedSlot,
  setSelectedSlot,
  open,
  onClose,
  onBook,
  handleBookingRandom
}) => {
  const [autoSelect, setAutoSelect] = useState(false);
  const [slotStates, setSlotStates] = useState(new Map());
  const [reservedSlots, setReservedSlots] = useState(new Map());
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  // const user = useSelector(state => state.user.user);
  
 
 const { 
  subscribeToSlotUpdates, 
  reserveSlot, 
  releaseSlot,
  webSocketService,
  user // Add user to check login status
} = useWebSocket();

// Add debug effect
useEffect(() => {
  console.log('BookSlotModal - User from useWebSocket:', user);
  console.log('BookSlotModal - User has ID:', !!user?.userId); // Fix: Use userId
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
    if (!spot?.id || !open) return;

    let subscription;
    
    const handleSlotUpdate = (message) => {
      console.log('Received slot update:', message);
      
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
            if (message.userId !== user?.id) {
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
    subscription = subscribeToSlotUpdates(spot.id, handleSlotUpdate);
    
    // Subscribe to parking space for initial status
    webSocketService.subscribeToParkingSpace(spot.id);

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [spot?.id, open, subscribeToSlotUpdates, user?.id, webSocketService]);

  const handleClose = () => {
    // Release any reserved slots by current user
    slotStates.forEach((state, slotId) => {
      if (state.reserved && state.reservedBy === user?.fullname) {
        releaseSlot(slotId, spot.id);
      }
    });
    
    onClose();
    setSelectedSlot(null);
  };

const handleSlotClick = useCallback((slotId) => {
  console.log('Slot clicked, user check:', { user, hasId: !!user?.userId }); // Fix: Use userId
  
  // Check if user is logged in - Fix: Use userId
  if (!user || !user.userId) {
    console.log('User validation failed:', { user, userId: user?.userId });
    alert('Please log in to reserve a slot');
    return;
  }

  const slotState = slotStates.get(slotId);
  
  if (!slotState?.available) {
    return; // Slot not available
  }

  // If clicking on already selected slot, release it
  if (selectedSlot === slotId) {
    const success = releaseSlot(slotId, spot.id);
    if (success) {
      setSelectedSlot(null);
    }
    return;
  }

  // Release previously selected slot
  if (selectedSlot) {
    releaseSlot(selectedSlot, spot.id);
  }

  // Reserve new slot
  const success = reserveSlot(slotId, spot.id);
  if (success) {
    setSelectedSlot(slotId);
  }
}, [selectedSlot, slotStates, reserveSlot, releaseSlot, spot?.id, user]);

  const getSlotStatus = (slot) => {
    const state = slotStates.get(slot.slotId);
    if (!state) return { status: 'available', color: 'success' };

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

  const slotButtonStyle = (slot) => {
    const slotStatus = getSlotStatus(slot);
    const isSelected = selectedSlot === slot.slotId;
    
    return {
      width: { xs: 32, sm: 40, md: 44 },
      height: { xs: 32, sm: 40, md: 44 },
      minWidth: 'unset',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '2px solid',
      borderColor: isSelected ? 'primary.main' : 
                   slotStatus.status === 'available' ? 'success.light' :
                   slotStatus.status === 'reserved-by-you' ? 'primary.light' :
                   slotStatus.status === 'reserved-by-other' ? 'warning.light' : 'error.light',
      borderRadius: 1.5,
      cursor: slotStatus.status === 'available' || slotStatus.status === 'reserved-by-you' ? 'pointer' : 'not-allowed',
      backgroundColor: isSelected ? 'primary.main' :
                      slotStatus.status === 'available' ? 'success.light' :
                      slotStatus.status === 'reserved-by-you' ? 'primary.light' :
                      slotStatus.status === 'reserved-by-other' ? 'warning.light' : 'error.light',
      color: isSelected ? 'primary.contrastText' : 'text.primary',
      fontSize: { xs: '0.6rem', sm: '0.7rem', md: '0.8rem' },
      fontWeight: 600,
      transition: 'all 0.2s ease-in-out',
      opacity: slotStatus.status === 'available' || slotStatus.status === 'reserved-by-you' ? 1 : 0.6,
      '&:hover': (slotStatus.status === 'available' || slotStatus.status === 'reserved-by-you') ? {
        transform: 'scale(1.05)',
        boxShadow: 2,
      } : {},
    };
  };

  // Rest of your existing modal styling code...
  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: {
      xs: '95vw',
      sm: '90vw',
      md: 650,
      lg: 700
    },
    maxWidth: '95vw',
    maxHeight: '95vh',
    bgcolor: 'background.paper',
    borderRadius: { xs: 2, sm: 3 },
    boxShadow: 24,
    p: 0,
    outline: 'none',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
  };

  const availableSlots = Array.from(slotStates.values()).filter(state => state.available).length;
  const totalSlots = spot?.totalSlots || 0;

  return (
    <Modal 
      open={open} 
      onClose={handleClose}
      disableScrollLock
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 1,
      }}
    >
      <Box sx={modalStyle}>
        {/* Header */}
        <Box sx={{
          p: { xs: 2, sm: 3, md: 4 },
          pb: { xs: 1, sm: 2 },
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          borderRadius: { xs: '8px 8px 0 0', sm: '12px 12px 0 0' },
        }}>
          <Typography 
            variant="h5" 
            component="h2"
            sx={{ 
              fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' },
              fontWeight: 700,
              mb: 1,
            }}
          >
            {spot?.lotName}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Chip 
              icon={<Car size={16} />}
              label={`${availableSlots}/${totalSlots} Available`}
              size="small"
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                color: 'inherit',
                '& .MuiChip-icon': { color: 'inherit' }
              }}
            />
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, flexGrow: 1, overflow: 'auto' }}>
          {/* Info Card */}
          <Box sx={{
            p: { xs: 2, sm: 2.5 },
            mb: 3,
            bgcolor: 'grey.50',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'grey.200',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <MapPin size={18} color={theme.palette.text.secondary} />
              <Typography variant="body2" color="text.secondary">
                {spot?.address}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <IndianRupee size={18} color={theme.palette.text.secondary} />
              <Typography variant="body2" color="text.secondary">
                ₹{spot?.pricingPerHour}/hour
              </Typography>
            </Box>
          </Box>

          {/* Real-time Status Indicator */}
          <Box sx={{ mb: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Timer size={16} />
              Real-time updates active - Slot availability updates automatically
            </Typography>
          </Box>

          {/* Date Time Picker */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              Select Date & Time
            </Typography>
            <DateTimePickerComponent color="white" />
          </Box>

          {/* Slot Selection Options */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              Slot Selection Options
            </Typography>
            <Box 
              sx={{ 
                display: 'flex', 
                gap: 2, 
                flexDirection: { xs: 'column', sm: 'row' } 
              }}
            >
              <Button
                variant={!autoSelect ? "contained" : "outlined"}
                color="primary"
                onClick={() => setAutoSelect(false)}
                startIcon={<Lock size={18} />}
                fullWidth
                sx={{ 
                  py: 1.5,
                  fontWeight: 600,
                  textTransform: 'none',
                }}
              >
                Choose Specific Slot
              </Button>
              <Button
                variant={autoSelect ? "contained" : "outlined"}
                color="secondary"
                onClick={() => setAutoSelect(true)}
                startIcon={<Car size={18} />}
                fullWidth
                sx={{ 
                  py: 1.5,
                  fontWeight: 600,
                  textTransform: 'none',
                }}
              >
                Auto-Assign Slot
              </Button>
            </Box>
          </Box>

          {/* Slot Selection Grid */}
          {!autoSelect && (
            <>
              <Divider sx={{ my: 3 }} />
              {totalSlots > 0 ? (
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                    Available Slots
                  </Typography>
                  
                  {/* Legend */}
                  <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Chip size="small" color="success" variant="outlined" label="Available" />
                    <Chip size="small" color="primary" variant="outlined" label="Reserved by You" />
                    <Chip size="small" color="warning" variant="outlined" label="Reserved by Others" />
                    <Chip size="small" color="error" variant="outlined" label="Booked" />
                  </Box>

                  {Array.from({ length: spot?.numberOfFloors || 1 }).map((_, floorIndex) => {
                    const floorSlots = spot?.parkingSlot?.slice(
                      floorIndex * 30, 
                      (floorIndex + 1) * 30
                    ) || [];
                    
                    return (
                      <Box key={floorIndex} sx={{
                        mb: 3,
                        p: { xs: 1.5, sm: 2 },
                        bgcolor: 'background.default',
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'grey.200',
                      }}>
                        <Box sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 2,
                          pb: 1,
                          borderBottom: '1px solid',
                          borderColor: 'grey.300',
                        }}>
                          <Typography 
                            variant="subtitle2" 
                            sx={{ 
                              fontWeight: 700,
                              color: 'primary.main',
                              fontSize: { xs: '0.875rem', sm: '1rem' }
                            }}
                          >
                            Floor {floorIndex + 1}
                          </Typography>
                          <Chip 
                            label={`${floorSlots.filter(s => slotStates.get(s.slotId)?.available).length} available`}
                            size="small"
                            variant="outlined"
                            color="primary"
                          />
                        </Box>
                        <Box sx={{
                          display: 'grid',
                          gridTemplateColumns: {
                            xs: 'repeat(auto-fit, minmax(32px, 1fr))',
                            sm: 'repeat(auto-fit, minmax(40px, 1fr))',
                            md: 'repeat(auto-fit, minmax(44px, 1fr))'
                          },
                          gap: { xs: 1, sm: 1.5 },
                          maxWidth: '100%',
                        }}>
                          {floorSlots.map((slot) => {
                            const slotStatus = getSlotStatus(slot);
                            return (
                              <Button
                                key={slot.slotId}
                                onClick={() => handleSlotClick(slot.slotId)}
                                disabled={slotStatus.status === 'booked' || slotStatus.status === 'reserved-by-other'}
                                sx={slotButtonStyle(slot)}
                                title={slotStatus.text}
                              >
                                {slot.slotId}
                              </Button>
                            );
                          })}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h6" color="error" gutterBottom>
                    No Slots Available
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Please try selecting a different time or location.
                  </Typography>
                </Box>
              )}
            </>
          )}
        </Box>

        {/* Footer */}
        <Box sx={{
          p: { xs: 2, sm: 3, md: 4 },
          pt: { xs: 2, sm: 3 },
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          position: 'sticky',
          bottom: 0,
        }}>
          <Box 
            sx={{ 
              display: 'flex', 
              gap: 2, 
              flexDirection: { xs: 'column', sm: 'row' } 
            }}
          >
            <Button
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              disabled={!autoSelect && !selectedSlot}
              onClick={() => autoSelect ? handleBookingRandom() : onBook(selectedSlot)}
              sx={{ 
                py: 1.5,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '1rem',
              }}
            >
              {autoSelect ? "Auto Book Slot" : "Book Selected Slot"}
            </Button>
            <Button 
              onClick={handleClose} 
              variant="outlined" 
              color="secondary"
              size="large"
              fullWidth
              sx={{ 
                py: 1.5,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '1rem',
              }}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};