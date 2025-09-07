import React, { useEffect, useState } from 'react';
import { 
  Grid, 
  Typography, 
  Box,
  Paper,
  useTheme,
  Tooltip,
  IconButton,
  Fade,
  Slide,
  Zoom,
  Container,
  alpha,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Info as InfoIcon,
  Bed as BedIcon,
  Route as RouteIcon,
  People as PeopleIcon,
  Warning as WarningIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Psychology as PsychologyIcon,
  Speed as SpeedIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';

// Import shared components
import DashboardCard from '../components/shared/DashboardCard';
import ChartComponent from '../components/shared/ChartComponent';
import DataTable from '../components/shared/DataTable';

// Import Gemini AI service
import geminiService from '../services/geminiService';

const HospitalResourceOptimizer = () => {
  const theme = useTheme();
  const [isLoaded, setIsLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // API Data States
  const [dashboardStats, setDashboardStats] = useState(null);
  const [occupancyTrends, setOccupancyTrends] = useState(null);
  const [specialtyDistribution, setSpecialtyDistribution] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  
  // Patient Search Dialog
  const [openPatientDialog, setOpenPatientDialog] = useState(false);
  const [patientForm, setPatientForm] = useState({
    patient_lon: 0,
    patient_lat: 0,
    severity: 1
  });
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [intelligentResults, setIntelligentResults] = useState(null);
  const [useIntelligentMode, setUseIntelligentMode] = useState(true);
  const [showReasoning, setShowReasoning] = useState(false);

  useEffect(() => {
    loadData();
    setIsLoaded(true);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [
        statsData,
        trendsData,
        specialtyData,
        hospitalsData,
        doctorsData,
        patientsData
      ] = await Promise.all([
        geminiService.getDashboardStats(),
        geminiService.getOccupancyTrends(),
        geminiService.getSpecialtyDistribution(),
        geminiService.getHospitals(),
        geminiService.getDoctors(),
        geminiService.getPatients()
      ]);
      
      setDashboardStats(statsData);
      setOccupancyTrends(trendsData);
      setSpecialtyDistribution(specialtyData);
      setHospitals(hospitalsData.hospitals || []);
      setDoctors(doctorsData.doctors || []);
      setPatients(patientsData.patients || []);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data from AI service. Using fallback data.');
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSearch = async () => {
    try {
      setSearching(true);
      setError(null);
      
      console.log('🏥 Starting hospital search with location:', {
        lat: patientForm.patient_lat,
        lon: patientForm.patient_lon,
        severity: patientForm.severity
      });
      
      // Use Gemini AI to find nearby hospitals based on geolocation
      const locationData = {
        latitude: patientForm.patient_lat,
        longitude: patientForm.patient_lon,
        severity: patientForm.severity
      };
      
      const results = await geminiService.findNearbyHospitals(locationData);
      console.log('🏥 Hospital search results:', results);
      
      if (results && results.hospitals && results.hospitals.length > 0) {
        // Transform the results to match the existing UI structure
        const transformedResults = {
          hospitals: results.hospitals,
          user_location: results.user_location,
          emergency_level: results.emergency_level,
          response_time: results.response_time,
          model_used: 'Gemini AI Hospital Locator with Real-time Geolocation',
          overall_assessment: `🏥 AI Analysis: Found ${results.hospitals.length} hospitals near your location in ${results.user_location?.area_name || 'Chennai'}, ${results.user_location?.district || 'Chennai'}. Current emergency level: ${results.emergency_level}. Your coordinates: ${results.user_location?.latitude?.toFixed(4)}, ${results.user_location?.longitude?.toFixed(4)}`,
          user_area_info: {
            area: results.user_location?.area_name || 'Unknown Area',
            district: results.user_location?.district || 'Chennai',
            landmarks: results.user_location?.nearest_landmarks || ['Unknown'],
            postal_code: results.user_location?.postal_code || '600000'
          },
          final_ranking: results.hospitals.map((hospital, index) => ({
            rank: index + 1,
            hospital_name: hospital.name,
            distance_km: hospital.distance_km,
            estimated_wait_time_minutes: hospital.estimated_wait_time,
            risk_level: hospital.distance_km < 3 ? 'Low' : hospital.distance_km < 7 ? 'Medium' : 'High',
            bed_availability_status: hospital.status,
            icu_availability: hospital.available_icu_beds > 0 ? 'Available' : 'Limited',
            specialist_match: hospital.emergency_services ? 'Perfect' : 'Good',
            ml_suitability_score: Math.min(0.95, (100 - hospital.distance_km * 2) / 100),
            real_time_score: hospital.available_beds / hospital.total_beds,
            final_score: Math.min(0.98, ((100 - hospital.distance_km * 2) / 100 + (hospital.available_beds / hospital.total_beds)) / 2),
            reasoning: `🏥 ${hospital.name} is located ${hospital.distance_km}km away in ${hospital.location} with ${hospital.available_beds} available beds out of ${hospital.total_beds} total capacity. The hospital specializes in ${hospital.specialties?.join(', ')} and ${hospital.emergency_services ? 'offers comprehensive emergency services' : 'has limited emergency capabilities'}. Contact: ${hospital.contact_number}. Address: ${hospital.address}`
          })),
          recommendations: {
            primary_choice: `🥇 ${results.hospitals[0]?.name} - Top recommendation based on proximity (${results.hospitals[0]?.distance_km}km), availability (${results.hospitals[0]?.available_beds} beds), and emergency readiness.`,
            backup_plan: `🥈 ${results.hospitals[1]?.name} - Strong alternative at ${results.hospitals[1]?.distance_km}km with ${results.hospitals[1]?.available_beds} beds available.`,
            transport_notes: `🚗 Transport to ${results.hospitals[0]?.name}: Estimated ${results.hospitals[0]?.estimated_wait_time} wait time. Ambulance service: ${results.hospitals[0]?.ambulance_available ? '✅ Available' : '❌ Limited'}. Parking: ${results.hospitals[0]?.has_parking ? '✅ Available' : '❌ No parking'}`,
            hospital_prep: `📋 Hospital Preparation: Severity level ${patientForm.severity}/5 case. Emergency department: ${results.hospitals[0]?.emergency_services ? '✅ Full services available' : '⚠️ Limited emergency services'}. Insurance accepted: ${results.hospitals[0]?.accepts_insurance ? '✅ Yes' : '❌ No'}`
          }
        };
        
        setIntelligentResults(transformedResults);
        setSearchResults([]);
      } else {
        setError('No hospitals found near your location. Please try adjusting your search criteria.');
        setIntelligentResults(null);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('❌ Hospital search error:', error);
      setError(`Failed to find nearby hospitals: ${error.message || 'AI service temporarily unavailable'}`);
      setIntelligentResults(null);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Static hospital data for testing
  const staticHospitals = [
    {
      id: 1,
      name: "Apollo Hospital Chennai",
      available_beds: 45,
      total_beds: 650,
      occupancy_rate: "93.1%",
      status: "Full"
    },
    {
      id: 2,
      name: "Fortis Hospital Delhi",
      available_beds: 120,
      total_beds: 800,
      occupancy_rate: "85.0%",
      status: "Available"
    }
  ];

  const handleFindHospitals = () => {
    setHospitals(staticHospitals);
  };

  // Process real-time bed occupancy data from API
  const bedOccupancyData = occupancyTrends ? {
    labels: occupancyTrends.days || occupancyTrends.hours || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Occupancy %',
        data: occupancyTrends.occupancy_rates || occupancyTrends.occupancy_percentages || [72, 75, 80, 85, 78, 65, 70],
        borderColor: '#1976d2',
        backgroundColor: 'rgba(25, 118, 210, 0.3)',
        fill: true,
      }
    ]
  } : {
    labels: ['6 AM', '9 AM', '12 PM', '3 PM', '6 PM', '9 PM', '12 AM'],
    datasets: [
      {
        label: 'General Beds',
        data: [65, 72, 78, 85, 82, 75, 68],
        borderColor: '#1976d2',
        backgroundColor: 'rgba(25, 118, 210, 0.3)',
        fill: true,
      }
    ]
  };

  // Process hospitals data from API
  const nearestHospitalsData = hospitals.length > 0 ? {
    labels: hospitals.slice(0, 5).map(h => h.name),
    datasets: [
      {
        label: 'Available Beds',
        data: hospitals.slice(0, 5).map(h => h.available_beds),
        backgroundColor: [
          '#1976d2',
          '#42a5f5',
          '#4caf50',
          '#ff9800',
          '#f44336',
        ],
      }
    ]
  } : {
    labels: ['No Data'],
    datasets: [
      {
        label: 'Available Beds',
        data: [0],
        backgroundColor: ['#666'],
      }
    ]
  };

  // Process staff scheduling data from API
  const staffSchedulingData = specialtyDistribution ? {
    labels: specialtyDistribution.specialties,
    datasets: [
      {
        label: 'Doctors',
        data: specialtyDistribution.counts,
        backgroundColor: '#1976d2',
      }
    ]
  } : {
    labels: ['Emergency', 'ICU', 'Surgery', 'Cardiology', 'Pediatrics'],
    datasets: [
      {
        label: 'Doctors',
        data: [3, 2, 4, 2, 3],
        backgroundColor: '#1976d2',
      }
    ]
  };

  // Hospital details table data
  const hospitalDetailsColumns = [
    { field: 'hospital_id', headerName: 'ID', width: 100 },
    { field: 'name', headerName: 'Hospital Name', width: 200 },
    { field: 'available_beds', headerName: 'Available Beds', width: 130, type: 'number' },
    { field: 'total_beds', headerName: 'Total Beds', width: 100, type: 'number' },
    { field: 'available_icu_beds', headerName: 'ICU Beds', width: 100, type: 'number' },
    { field: 'occupancy_rate', headerName: 'Occupancy %', width: 120 },
    { field: 'status', headerName: 'Status', width: 120 },
  ];

  const hospitalDetailsRows = hospitals.map((hospital, index) => {
    const occupancyRate = hospital.total_beds ? ((hospital.total_beds - hospital.available_beds) / hospital.total_beds * 100).toFixed(1) : '0';
    return {
      id: hospital.hospital_id || hospital.id || index,
      hospital_id: hospital.hospital_id || hospital.id || `H${index + 1}`,
      name: hospital.name || 'Unknown Hospital',
      available_beds: hospital.available_beds || 0,
      total_beds: hospital.total_beds || 0,
      available_icu_beds: hospital.available_icu_beds || 0,
      occupancy_rate: `${occupancyRate}%`,
      status: occupancyRate > 90 ? 'Full' : occupancyRate > 70 ? 'Limited' : 'Available'
    };
  });

  // Emergency alerts and critical cases
  const emergencyAlertsColumns = [
    { field: 'patient_id', headerName: 'Patient ID', width: 100 },
    { field: 'severity', headerName: 'Severity', width: 100 },
    { field: 'location', headerName: 'Location', width: 150 },
    { field: 'priority', headerName: 'Priority', width: 100 },
    { field: 'created_at', headerName: 'Created', width: 150 },
    { field: 'status', headerName: 'Status', width: 120 },
  ];

  const emergencyAlertsRows = patients.map((patient, index) => {
    const priority = (patient.severity && patient.severity >= 4) ? 'Critical' : (patient.severity && patient.severity >= 3) ? 'High' : 'Medium';
    return {
      id: patient.patient_id || patient.id || index,
      patient_id: patient.patient_id || patient.id || `P${index + 1}`,
      severity: patient.severity || 'N/A',
      location: `${(patient.patient_lat || 0).toFixed(4)}, ${(patient.patient_lon || 0).toFixed(4)}`,
      priority: priority,
      created_at: patient.created_at ? new Date(patient.created_at).toLocaleString() : new Date().toLocaleString(),
      status: patient.status || 'Unknown'
    };
  });

  useEffect(() => {
    // Automatically get user's location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPatientForm(prev => ({
          ...prev,
          patient_lat: position.coords.latitude,
          patient_lon: position.coords.longitude
        }));
      },
      (error) => {
        setError('Unable to get your location. Please enter it manually.');
      }
    );
  }, []);

  // Helper to check if patientForm is valid
  const isPatientFormValid =
    patientForm.patient_lat !== 0 &&
    patientForm.patient_lon !== 0 &&
    !isNaN(patientForm.patient_lat) &&
    !isNaN(patientForm.patient_lon) &&
    patientForm.severity >= 1 && patientForm.severity <= 5;

  return (
    <Box sx={{ 
      p: 3,
      background: '#0a1929',
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated background elements */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 20%, rgba(25, 118, 210, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(66, 165, 245, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 60%, rgba(25, 118, 210, 0.05) 0%, transparent 50%)
          `,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      
      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        <Fade in={isLoaded} timeout={800}>
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h3" sx={{ 
              mb: 2,
              background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 700,
              letterSpacing: '-0.02em'
            }}>
              AI Driven Hospital Resource Optimizer
            </Typography>
            <Typography variant="h6" sx={{ 
              color: 'rgba(255, 255, 255, 0.8)',
              fontWeight: 400,
              maxWidth: '600px',
              mx: 'auto',
              mb: 3
            }}>
              Advanced machine learning algorithms for optimal hospital resource management
            </Typography>
            
            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 3 }}>
              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={() => setOpenPatientDialog(true)}
                sx={{ 
                  background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1565c0, #1976d2)'
                  }
                }}
              >
                Find Hospital for Patient
              </Button>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={loadData}
                sx={{ 
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                Refresh Data
              </Button>
            </Box>

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 3, maxWidth: '600px', mx: 'auto' }}>
                {error}
              </Alert>
            )}

            {/* Loading Indicator */}
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <CircularProgress sx={{ color: '#1976d2' }} />
              </Box>
            )}
          </Box>
        </Fade>

        <Grid container spacing={4}>
          {/* Feature cards */}
          <Grid item xs={12} md={6} lg={3}>
            <Slide direction="up" in={isLoaded} timeout={1000}>
              <Box>
                <DashboardCard 
                  title="Predictive Bed Availability" 
                  subtitle="ML forecasts for bed and ICU occupancy"
                  icon={<BedIcon sx={{ fontSize: 28 }} />}
                  gradient="linear-gradient(135deg, rgba(10, 25, 41, 0.9) 0%, rgba(39, 62, 107, 0.8) 100%)"
                >
                  <Typography variant="body2" sx={{ 
                    color: 'rgba(255,255,255,0.9)', 
                    lineHeight: 1.6,
                    fontFamily: 'Poppins'
                  }}>
                    Using historical admissions and trends to predict future needs
                  </Typography>
                </DashboardCard>
              </Box>
            </Slide>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <Slide direction="up" in={isLoaded} timeout={1200}>
              <Box>
                <DashboardCard 
                  title="Smart Patient Routing" 
                  subtitle="AI recommendations for optimal hospital placement"
                  icon={<RouteIcon sx={{ fontSize: 28 }} />}
                  gradient="linear-gradient(135deg, rgba(10, 25, 41, 0.9) 0%, rgba(39, 62, 107, 0.8) 100%)"
                >
                  <Typography variant="body2" sx={{ 
                    color: 'rgba(255,255,255,0.9)', 
                    lineHeight: 1.6,
                    fontFamily: 'Poppins'
                  }}>
                    Based on location, severity, and current wait times
                  </Typography>
                </DashboardCard>
              </Box>
            </Slide>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <Slide direction="up" in={isLoaded} timeout={1400}>
              <Box>
                <DashboardCard 
                  title="Dynamic Staff Scheduling" 
                  subtitle="AI balanced workload distribution"
                  icon={<PeopleIcon sx={{ fontSize: 28 }} />}
                  gradient="linear-gradient(135deg, rgba(10, 25, 41, 0.9) 0%, rgba(39, 62, 107, 0.8) 100%)"
                >
                  <Typography variant="body2" sx={{ 
                    color: 'rgba(255,255,255,0.9)', 
                    lineHeight: 1.6,
                    fontFamily: 'Poppins'
                  }}>
                    Prevents burnout and ensures critical areas are covered
                  </Typography>
                </DashboardCard>
              </Box>
            </Slide>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <Slide direction="up" in={isLoaded} timeout={1600}>
              <Box>
                <DashboardCard 
                  title="Risk & Equity Alerts" 
                  subtitle="ML flags for high-risk zones"
                  icon={<WarningIcon sx={{ fontSize: 28 }} />}
                  gradient="linear-gradient(135deg, rgba(10, 25, 41, 0.9) 0%, rgba(39, 62, 107, 0.8) 100%)"
                >
                  <Typography variant="body2" sx={{ 
                    color: 'rgba(255,255,255,0.9)', 
                    lineHeight: 1.6,
                    fontFamily: 'Poppins'
                  }}>
                    Ensures fair resource allocation to underserved populations
                  </Typography>
                </DashboardCard>
              </Box>
            </Slide>
          </Grid>

          {/* Charts and tables */}
          <Grid item xs={12} md={6}>
            <Fade in={isLoaded} timeout={1800}>
              <Paper sx={{ 
                p: 3, 
                height: '100%',
                background: 'rgba(39, 62, 107, 0.8)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(25, 118, 210, 0.2)',
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 40px rgba(25, 118, 210, 0.15)',
                }
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600,
                    background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontFamily: 'Poppins'
                  }}>
                    Real-time Bed Occupancy (24h)
                  </Typography>
                  <Tooltip title="Live occupancy data updated every 15 minutes">
                    <IconButton size="small" sx={{ color: 'rgba(25, 118, 210, 0.7)' }}>
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <ChartComponent 
                  type="line" 
                  data={bedOccupancyData} 
                  options={{
                    responsive: true,
                    animation: {
                      duration: 2000,
                      easing: 'easeInOutQuart'
                    },
                    plugins: {
                      legend: {
                        labels: {
                          color: 'white',
                          font: {
                            family: 'Poppins',
                            weight: 500
                          }
                        }
                      }
                    },
                    scales: {
                      x: {
                        grid: {
                          color: 'rgba(255,255,255,0.1)'
                        },
                        ticks: {
                          color: 'white',
                          font: {
                            family: 'Poppins'
                          }
                        }
                      },
                      y: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                          color: 'rgba(255,255,255,0.1)'
                        },
                        ticks: {
                          color: 'white',
                          font: {
                            family: 'Poppins'
                          }
                        },
                        title: {
                          display: true,
                          text: 'Occupancy %',
                          color: 'white',
                          font: {
                            family: 'Poppins',
                            weight: 500
                          }
                        }
                      }
                    }
                  }}
                />
              </Paper>
            </Fade>
          </Grid>

          <Grid item xs={12} md={6}>
            <Fade in={isLoaded} timeout={2000}>
              <Paper sx={{ 
                p: 3, 
                height: '100%',
                background: 'rgba(39, 62, 107, 0.8)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(25, 118, 210, 0.2)',
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 40px rgba(25, 118, 210, 0.15)',
                }
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600,
                    background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontFamily: 'Poppins'
                  }}>
                    Nearest Hospitals - Available Beds
                  </Typography>
                  <Tooltip title="Real-time bed availability at nearby hospitals">
                    <IconButton size="small" sx={{ color: 'rgba(25, 118, 210, 0.7)' }}>
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <ChartComponent 
                  type="bar" 
                  data={nearestHospitalsData} 
                  options={{
                    responsive: true,
                    animation: {
                      duration: 2000,
                      easing: 'easeInOutQuart'
                    },
                    plugins: {
                      legend: {
                        labels: {
                          color: 'white',
                          font: {
                            family: 'Poppins',
                            weight: 500
                          }
                        }
                      }
                    },
                    scales: {
                      x: {
                        grid: {
                          color: 'rgba(255,255,255,0.1)'
                        },
                        ticks: {
                          color: 'white',
                          font: {
                            family: 'Poppins'
                          }
                        }
                      },
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: 'rgba(255,255,255,0.1)'
                        },
                        ticks: {
                          color: 'white',
                          font: {
                            family: 'Poppins'
                          }
                        },
                        title: {
                          display: true,
                          text: 'Wait Time (minutes)',
                          color: 'white',
                          font: {
                            family: 'Poppins',
                            weight: 500
                          }
                        }
                      }
                    }
                  }}
                />
              </Paper>
            </Fade>
          </Grid>

          <Grid item xs={12} md={6}>
            <Fade in={isLoaded} timeout={2200}>
              <Paper sx={{ 
                p: 3, 
                height: '100%',
                background: 'rgba(39, 62, 107, 0.8)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(25, 118, 210, 0.2)',
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 40px rgba(25, 118, 210, 0.15)',
                }
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600,
                    background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontFamily: 'Poppins'
                  }}>
                    Staff by Department
                  </Typography>
                  <Tooltip title="Current staffing levels across hospital departments">
                    <IconButton size="small" sx={{ color: 'rgba(25, 118, 210, 0.7)' }}>
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <ChartComponent 
                  type="bar" 
                  data={staffSchedulingData} 
                  options={{
                    responsive: true,
                    animation: {
                      duration: 2000,
                      easing: 'easeInOutQuart'
                    },
                    plugins: {
                      legend: {
                        labels: {
                          color: 'white',
                          font: {
                            family: 'Poppins',
                            weight: 500
                          }
                        }
                      }
                    },
                    scales: {
                      x: {
                        grid: {
                          color: 'rgba(255,255,255,0.1)'
                        },
                        ticks: {
                          color: 'white',
                          font: {
                            family: 'Poppins'
                          }
                        }
                      },
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: 'rgba(255,255,255,0.1)'
                        },
                        ticks: {
                          color: 'white',
                          font: {
                            family: 'Poppins'
                          }
                        },
                        title: {
                          display: true,
                          text: 'Staff Count',
                          color: 'white',
                          font: {
                            family: 'Poppins',
                            weight: 500
                          }
                        }
                      }
                    }
                  }}
                />
              </Paper>
            </Fade>
          </Grid>

          <Grid item xs={12} md={6}>
            <Fade in={isLoaded} timeout={2400}>
              <Paper sx={{ 
                p: 3, 
                height: '100%',
                background: 'rgba(39, 62, 107, 0.8)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(25, 118, 210, 0.2)',
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 40px rgba(25, 118, 210, 0.15)',
                }
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600,
                    background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontFamily: 'Poppins'
                  }}>
                    Emergency Cases & Critical Alerts
                  </Typography>
                  <Tooltip title="Real-time emergency cases and critical patient alerts">
                    <IconButton size="small" sx={{ color: 'rgba(25, 118, 210, 0.7)' }}>
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Box sx={{ height: 400 }}>
                  <DataTable 
                    rows={emergencyAlertsRows} 
                    columns={emergencyAlertsColumns} 
                    pageSize={5}
                  />
                </Box>
              </Paper>
            </Fade>
          </Grid>

          {/* Hospital Details Table */}
          <Grid item xs={12}>
            <Fade in={isLoaded} timeout={2400}>
              <Paper sx={{ 
                p: 3, 
                height: '100%',
                background: 'rgba(39, 62, 107, 0.8)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(25, 118, 210, 0.2)',
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 40px rgba(25, 118, 210, 0.15)',
                }
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600,
                    background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontFamily: 'Poppins'
                  }}>
                    Hospital Network Details
                  </Typography>
                  <Tooltip title="Complete hospital network information with real-time status">
                    <IconButton size="small" sx={{ color: 'rgba(25, 118, 210, 0.7)' }}>
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Box sx={{ height: 400 }}>
                  <DataTable 
                    rows={hospitalDetailsRows} 
                    columns={hospitalDetailsColumns} 
                    pageSize={5}
                  />
                </Box>
              </Paper>
            </Fade>
          </Grid>
        </Grid>
      </Container>

      {/* Enhanced Patient Search Dialog */}
      <Dialog open={openPatientDialog} onClose={() => setOpenPatientDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ 
          background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <PsychologyIcon />
          AI-Powered Hospital Finder
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {/* AI Mode Toggle */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, p: 2, bgcolor: 'rgba(25, 118, 210, 0.1)', borderRadius: 2 }}>
            <PsychologyIcon sx={{ color: 'primary.main', mr: 1 }} />
            <Typography variant="body1" sx={{ flexGrow: 1 }}>
              {useIntelligentMode ? 'Intelligent Mode (AI + Live Data + Gemini Analysis)' : 'Basic Mode (ML Model Only)'}
            </Typography>
            <IconButton 
              onClick={() => setUseIntelligentMode(!useIntelligentMode)}
              sx={{ color: 'primary.main' }}
            >
              {useIntelligentMode ? <ToggleOnIcon fontSize="large" /> : <ToggleOffIcon fontSize="large" />}
            </IconButton>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Patient Latitude"
                type="number"
                value={isNaN(patientForm.patient_lat) ? '' : patientForm.patient_lat}
                onChange={(e) => setPatientForm(prev => ({ ...prev, patient_lat: parseFloat(e.target.value) }))}
                helperText="Enter patient's latitude coordinate"
                error={patientForm.patient_lat === 0 || isNaN(patientForm.patient_lat)}
                InputProps={{
                  startAdornment: <LocationIcon sx={{ color: 'primary.main', mr: 1 }} />
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Patient Longitude"
                type="number"
                value={isNaN(patientForm.patient_lon) ? '' : patientForm.patient_lon}
                onChange={(e) => setPatientForm(prev => ({ ...prev, patient_lon: parseFloat(e.target.value) }))}
                helperText="Enter patient's longitude coordinate"
                error={patientForm.patient_lon === 0 || isNaN(patientForm.patient_lon)}
                InputProps={{
                  startAdornment: <LocationIcon sx={{ color: 'primary.main', mr: 1 }} />
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Severity Level"
                type="number"
                value={isNaN(patientForm.severity) ? '' : patientForm.severity}
                onChange={(e) => setPatientForm(prev => ({ ...prev, severity: parseInt(e.target.value) }))}
                helperText="1-5 scale (1=low, 5=critical)"
                inputProps={{ min: 1, max: 5 }}
                error={patientForm.severity < 1 || patientForm.severity > 5}
                InputProps={{
                  startAdornment: <AssessmentIcon sx={{ color: 'primary.main', mr: 1 }} />
                }}
              />
            </Grid>
          </Grid>

          {/* Show error if location is not set */}
          {(!isPatientFormValid && error) && (
            <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
          )}

          {/* Intelligent Search Results */}
          {intelligentResults && (
            <Box sx={{ mt: 3 }}>
              <Paper sx={{ p: 3, bgcolor: 'rgba(25, 118, 210, 0.05)', border: '2px solid rgba(25, 118, 210, 0.2)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PsychologyIcon sx={{ color: 'primary.main', mr: 1 }} />
                  <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                    AI-Enhanced Hospital Rankings
                  </Typography>
                  <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Analyzed by {intelligentResults.model_used}
                    </Typography>
                  </Box>
                </Box>

                {/* Location Information */}
                {intelligentResults.user_area_info && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>📍 Your Location:</strong> {intelligentResults.user_area_info.area}, {intelligentResults.user_area_info.district} - {intelligentResults.user_area_info.postal_code}
                      <br />
                      <strong>🏛️ Nearby Landmarks:</strong> {intelligentResults.user_area_info.landmarks.join(', ')}
                    </Typography>
                  </Alert>
                )}

                {/* Overall Assessment */}
                <Alert severity="success" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    <strong>🤖 AI Assessment:</strong> {intelligentResults.overall_assessment}
                  </Typography>
                </Alert>

                {/* Critical Factors */}
                {intelligentResults.critical_factors && intelligentResults.critical_factors.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Critical Decision Factors:
                    </Typography>
                    {intelligentResults.critical_factors.map((factor, index) => (
                      <Typography key={index} variant="body2" sx={{ mb: 0.5, pl: 2 }}>
                        • {factor}
                      </Typography>
                    ))}
                  </Box>
                )}

                {/* Hospital Rankings */}
                {intelligentResults.final_ranking && intelligentResults.final_ranking.map((hospital, index) => {
                  const getRiskColor = (riskLevel) => {
                    switch (riskLevel?.toLowerCase()) {
                      case 'low': return '#4caf50';
                      case 'medium': return '#ff9800';
                      case 'high': return '#f44336';
                      default: return '#ff9800';
                    }
                  };

                  return (
                    <Paper key={index} sx={{ 
                      p: 3, 
                      mb: 2, 
                      border: hospital.rank === 1 ? '3px solid #4caf50' : '1px solid #e0e0e0',
                      bgcolor: hospital.rank === 1 ? 'rgba(76, 175, 80, 0.05)' : 'background.paper',
                      position: 'relative'
                    }}>
                      {/* Rank Badge */}
                      <Box sx={{
                        position: 'absolute',
                        top: -10,
                        left: 20,
                        bgcolor: hospital.rank === 1 ? '#4caf50' : '#1976d2',
                        color: 'white',
                        px: 2,
                        py: 0.5,
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold'
                      }}>
                        #{hospital.rank} {hospital.rank === 1 ? 'RECOMMENDED' : 'ALTERNATIVE'}
                      </Box>

                      <Grid container spacing={3} sx={{ mt: 1 }}>
                        {/* Hospital Info */}
                        <Grid item xs={12} md={6}>
                          <Typography variant="h6" sx={{ 
                            color: 'primary.main', 
                            fontWeight: 'bold',
                            mb: 1
                          }}>
                            {hospital.hospital_name}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <LocationIcon sx={{ color: 'primary.main', fontSize: 16, mr: 0.5 }} />
                              <Typography variant="body2">
                                {hospital.distance_km} km away
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <ScheduleIcon sx={{ color: 'primary.main', fontSize: 16, mr: 0.5 }} />
                              <Typography variant="body2">
                                ~{hospital.estimated_wait_time_minutes} min wait
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <SpeedIcon sx={{ color: getRiskColor(hospital.risk_level), fontSize: 16, mr: 0.5 }} />
                              <Typography variant="body2" sx={{ color: getRiskColor(hospital.risk_level) }}>
                                {hospital.risk_level} Risk
                              </Typography>
                            </Box>
                          </Box>

                          {/* Status Indicators */}
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                            <Alert 
                              severity={hospital.bed_availability_status === 'Available' ? 'success' : hospital.bed_availability_status === 'Limited' ? 'warning' : 'error'}
                              sx={{ py: 0, fontSize: '0.7rem' }}
                            >
                              Beds: {hospital.bed_availability_status}
                            </Alert>
                            <Alert 
                              severity={hospital.icu_availability === 'Available' ? 'success' : 'warning'}
                              sx={{ py: 0, fontSize: '0.7rem' }}
                            >
                              ICU: {hospital.icu_availability}
                            </Alert>
                            <Alert 
                              severity={hospital.specialist_match === 'Perfect' ? 'success' : hospital.specialist_match === 'Good' ? 'info' : 'warning'}
                              sx={{ py: 0, fontSize: '0.7rem' }}
                            >
                              Specialist: {hospital.specialist_match}
                            </Alert>
                          </Box>
                        </Grid>

                        {/* Scores and Reasoning */}
                        <Grid item xs={12} md={6}>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                              AI Analysis Scores:
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2">ML Suitability:</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {(hospital.ml_suitability_score * 100).toFixed(1)}%
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2">Live Data Score:</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {(hospital.real_time_score * 100).toFixed(1)}%
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Final AI Score:</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                {(hospital.final_score * 100).toFixed(1)}%
                              </Typography>
                            </Box>
                          </Box>

                          {/* Reasoning */}
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                              AI Reasoning:
                            </Typography>
                            <Typography variant="body2" sx={{ 
                              fontSize: '0.85rem', 
                              lineHeight: 1.4,
                              maxHeight: showReasoning ? 'none' : '3em',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {hospital.reasoning}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>
                  );
                })}

                {/* Recommendations */}
                {intelligentResults.recommendations && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                      AI Recommendations:
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Alert severity="success">
                          <Typography variant="body2">
                            <strong>Primary Choice:</strong><br />
                            {intelligentResults.recommendations.primary_choice}
                          </Typography>
                        </Alert>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Alert severity="info">
                          <Typography variant="body2">
                            <strong>Backup Plan:</strong><br />
                            {intelligentResults.recommendations.backup_plan}
                          </Typography>
                        </Alert>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Alert severity="warning">
                          <Typography variant="body2">
                            <strong>Transport Notes:</strong><br />
                            {intelligentResults.recommendations.transport_notes}
                          </Typography>
                        </Alert>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Alert severity="info">
                          <Typography variant="body2">
                            <strong>Hospital Preparation:</strong><br />
                            {intelligentResults.recommendations.hospital_prep}
                          </Typography>
                        </Alert>
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </Paper>
            </Box>
          )}

          {/* Basic Search Results */}
          {searchResults.length > 0 && !intelligentResults && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                Basic ML Recommendations:
              </Typography>
              {searchResults.map((hospital, index) => (
                <Paper key={index} sx={{ p: 2, mb: 2, border: '1px solid #e0e0e0' }}>
                  <Typography variant="h6" sx={{ color: 'primary.main' }}>
                    {hospital.hospital_name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                    Distance: {typeof hospital.distance_km === 'number' && !isNaN(hospital.distance_km) ? hospital.distance_km : ''} km | 
                    Available Beds: {typeof hospital.predicted_beds_available === 'number' && !isNaN(hospital.predicted_beds_available) ? hospital.predicted_beds_available : ''} | 
                    Suitability Score: {typeof hospital.suitability_score === 'number' && !isNaN(hospital.suitability_score) ? (hospital.suitability_score * 100).toFixed(1) : ''}%
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Location: {typeof hospital.hospital_latitude === 'number' && !isNaN(hospital.hospital_latitude) ? hospital.hospital_latitude.toFixed(4) : ''}, {typeof hospital.hospital_longitude === 'number' && !isNaN(hospital.hospital_longitude) ? hospital.hospital_longitude.toFixed(4) : ''}
                  </Typography>
                </Paper>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: 'rgba(25, 118, 210, 0.05)' }}>
          <Button onClick={() => {
            setOpenPatientDialog(false);
            setSearchResults([]);
            setIntelligentResults(null);
          }}>
            Close
          </Button>
          <Button 
            onClick={handlePatientSearch} 
            variant="contained"
            disabled={searching || !isPatientFormValid}
            startIcon={searching ? <CircularProgress size={20} /> : (useIntelligentMode ? <PsychologyIcon /> : <SearchIcon />)}
            sx={{
              background: useIntelligentMode ? 'linear-gradient(45deg, #4caf50, #66bb6a)' : 'linear-gradient(45deg, #1976d2, #42a5f5)',
              '&:hover': {
                background: useIntelligentMode ? 'linear-gradient(45deg, #388e3c, #4caf50)' : 'linear-gradient(45deg, #1565c0, #1976d2)'
              }
            }}
          >
            {searching ? 'Analyzing...' : (useIntelligentMode ? 'AI Analysis' : 'Find Hospital')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HospitalResourceOptimizer;