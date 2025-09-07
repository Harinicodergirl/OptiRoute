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
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Info as InfoIcon,
  Assessment as AssessmentIcon,
  LocalShipping as LocalShippingIcon,
  AccessTime as AccessTimeIcon,
  TrendingUp as TrendingUpIcon,
  AutoAwesome as AutoAwesomeIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

// Import shared components
import DashboardCard from '../components/shared/DashboardCard';
import ChartComponent from '../components/shared/ChartComponent';
import DataTable from '../components/shared/DataTable';

// Import Gemini AI service
import geminiService from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
// Import Firebase services for user data
import { doc, setDoc } from 'firebase/firestore';
import { database } from '../config/firebase';

const HungerWasteOptimizer = () => {
  const theme = useTheme();
  const [isLoaded, setIsLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // API Data States
  const [dashboardStats, setDashboardStats] = useState(null);
  const [inventoryFlow, setInventoryFlow] = useState(null);
  const [networkStatus, setNetworkStatus] = useState(null);
  const [wasteReduction, setWasteReduction] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [demand, setDemand] = useState([]);
  const [logistics, setLogistics] = useState([]);
  const [storage, setStorage] = useState([]);
  const [farmers, setFarmers] = useState({});
  
  // AI Plan Generation
  const [openPlanDialog, setOpenPlanDialog] = useState(false);
  const [planForm, setPlanForm] = useState({
    raw_report: '',
    priority_focus: 'all'
  });
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [generating, setGenerating] = useState(false);

  // Role-based forms
  const { user, role } = useAuth();
  const [farmerForm, setFarmerForm] = useState({ crop: '', quantity: '', location: '', economic_status: '' });
  const [warehouseForm, setWarehouseForm] = useState({ available_kg: '', temperature: '', cost_per_day_per_kg: '' });
  const [logisticsForm, setLogisticsForm] = useState({ vehicle_type: '', location: '', capacity_kg: '', status: '' });
  const [farmerSubmitting, setFarmerSubmitting] = useState(false);
  const [warehouseSubmitting, setWarehouseSubmitting] = useState(false);
  const [logisticsSubmitting, setLogisticsSubmitting] = useState(false);

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
        inventoryFlowData,
        networkStatusData,
        wasteReductionData,
        inventoryData,
        demandData,
        logisticsData,
        storageData,
        farmersData
      ] = await Promise.all([
        geminiService.getWasteOptimizerStats(),
        geminiService.getInventoryFlow(),
        geminiService.getNetworkStatus(),
        geminiService.getWasteReduction(),
        geminiService.getInventory(),
        geminiService.getDemand(),
        geminiService.getLogistics(),
        geminiService.getStorage(),
        geminiService.getFarmers()
      ]);
      
      setDashboardStats(statsData);
      setInventoryFlow(inventoryFlowData);
      setNetworkStatus(networkStatusData);
      setWasteReduction(wasteReductionData);
      setInventory(inventoryData);
      setDemand(demandData);
      setLogistics(logisticsData);
      setStorage(storageData);
      setFarmers(farmersData);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data. Please check if the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const staticPlan = {
    allocation_plan: "200kg tomatoes to Bank A, 150kg potatoes to Bank B.",
    human_summary: "Plan generated successfully.",
    estimated_impact: {
      people_served: 300,
      food_saved_kg: 350,
      economic_value_rupees: 7000,
      emissions_saved_kg: 50
    }
  };

  const handleGeneratePlan = () => {
    setGeneratedPlan(staticPlan);
  };

  // Process real-time food bank inventory levels from API
  const foodBankInventoryData = inventoryFlow ? {
    labels: inventoryFlow.days,
    datasets: [
      {
        label: 'Food In (kg)',
        data: inventoryFlow.food_in,
        borderColor: '#1976d2',
        backgroundColor: 'rgba(25, 118, 210, 0.3)',
        fill: true,
      },
      {
        label: 'Food Out (kg)',
        data: inventoryFlow.food_out,
        borderColor: '#42a5f5',
        backgroundColor: 'rgba(66, 165, 245, 0.3)',
        fill: true,
      },
      {
        label: 'Waste (kg)',
        data: inventoryFlow.waste,
        borderColor: '#f44336',
        backgroundColor: 'rgba(244, 67, 54, 0.3)',
        fill: true,
      }
    ]
  } : {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Food In (kg)',
        data: [2500, 3200, 2800, 3500, 4000, 1800, 2200],
        borderColor: '#1976d2',
        backgroundColor: 'rgba(25, 118, 210, 0.3)',
        fill: true,
      }
    ]
  };

  // Process food bank network distribution from API
  const foodBankNetworkData = networkStatus ? {
    labels: networkStatus.locations,
    datasets: [
      {
        label: 'Current Inventory (kg)',
        data: networkStatus.current_inventory,
        backgroundColor: '#1976d2',
      },
      {
        label: 'Daily Distribution (kg)',
        data: networkStatus.daily_distribution,
        backgroundColor: '#42a5f5',
      },
      {
        label: 'Surplus Available (kg)',
        data: networkStatus.surplus_available,
        backgroundColor: '#4caf50',
      }
    ]
  } : {
    labels: ['No Data'],
    datasets: [
      {
        label: 'Current Inventory (kg)',
        data: [0],
        backgroundColor: '#666',
      }
    ]
  };

  // Process food waste reduction data from API
  const wasteReductionData = wasteReduction ? {
    labels: wasteReduction.categories,
    datasets: [
      {
        label: 'Waste Before (kg/week)',
        data: wasteReduction.waste_before,
        backgroundColor: '#f44336',
      },
      {
        label: 'Waste After (kg/week)',
        data: wasteReduction.waste_after,
        backgroundColor: '#4caf50',
      }
    ]
  } : {
    labels: ['Vegetables', 'Fruits', 'Dairy', 'Meat', 'Bakery', 'Prepared Meals'],
    datasets: [
      {
        label: 'Waste Before (kg/week)',
        data: [150, 120, 80, 60, 90, 110],
        backgroundColor: '#f44336',
      }
    ]
  };

  // Process delivery routes data from API
  const deliveryRoutesColumns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'vehicle_type', headerName: 'Vehicle Type', width: 150 },
    { field: 'location', headerName: 'Current Location', width: 180 },
    { field: 'capacity_kg', headerName: 'Capacity (kg)', width: 120, type: 'number' },
    { field: 'status', headerName: 'Status', width: 120 },
    { field: 'cost_per_km', headerName: 'Cost/km', width: 100 },
  ];

  const deliveryRoutesRows = logistics.map((logistic, index) => ({
    id: logistic.id,
    vehicle_type: logistic.vehicle_type,
    location: logistic.location,
    capacity_kg: logistic.capacity_kg,
    status: logistic.status,
    cost_per_km: `₹${logistic.cost_per_km}`
  }));

  // Farmer form handlers
  const handleFarmerFormChange = (e) => {
    setFarmerForm({ ...farmerForm, [e.target.name]: e.target.value });
  };
  const handleFarmerFormSubmit = async (e) => {
    e.preventDefault();
    setFarmerSubmitting(true);
    await addFarmerInfoToFirebase(user.uid, farmerForm);
    setFarmerSubmitting(false);
  };

  // Warehouse form handlers
  const handleWarehouseFormChange = (e) => {
    setWarehouseForm({ ...warehouseForm, [e.target.name]: e.target.value });
  };
  const handleWarehouseFormSubmit = async (e) => {
    e.preventDefault();
    setWarehouseSubmitting(true);
    await addWarehouseInfoToFirebase(user.uid, warehouseForm);
    setWarehouseSubmitting(false);
  };

  // Logistics form handlers
  const handleLogisticsFormChange = (e) => {
    setLogisticsForm({ ...logisticsForm, [e.target.name]: e.target.value });
  };
  const handleLogisticsFormSubmit = async (e) => {
    e.preventDefault();
    setLogisticsSubmitting(true);
    await addLogisticsInfoToFirebase(user.uid, logisticsForm);
    setLogisticsSubmitting(false);
  };

  // Firebase form submission functions
  const addFarmerInfoToFirebase = async (userId, farmerData) => {
    try {
      const docRef = doc(database, 'farmers', userId);
      await setDoc(docRef, {
        ...farmerData,
        userId,
        timestamp: new Date().toISOString(),
        page: 'hunger-waste-optimizer'
      }, { merge: true });
      console.log('✅ Farmer data saved to Firebase');
      setFarmerForm({ crop: '', quantity: '', location: '', economic_status: '' });
    } catch (error) {
      console.error('❌ Error saving farmer data:', error);
      setError('Failed to save farmer data');
    }
  };

  const addWarehouseInfoToFirebase = async (userId, warehouseData) => {
    try {
      const docRef = doc(database, 'warehouses', userId);
      await setDoc(docRef, {
        ...warehouseData,
        userId,
        timestamp: new Date().toISOString(),
        page: 'hunger-waste-optimizer'
      }, { merge: true });
      console.log('✅ Warehouse data saved to Firebase');
      setWarehouseForm({ available_kg: '', temperature: '', cost_per_day_per_kg: '' });
    } catch (error) {
      console.error('❌ Error saving warehouse data:', error);
      setError('Failed to save warehouse data');
    }
  };

  const addLogisticsInfoToFirebase = async (userId, logisticsData) => {
    try {
      const docRef = doc(database, 'logistics', userId);
      await setDoc(docRef, {
        ...logisticsData,
        userId,
        timestamp: new Date().toISOString(),
        page: 'hunger-waste-optimizer'
      }, { merge: true });
      console.log('✅ Logistics data saved to Firebase');
      setLogisticsForm({ vehicle_type: '', location: '', capacity_kg: '', status: '' });
    } catch (error) {
      console.error('❌ Error saving logistics data:', error);
      setError('Failed to save logistics data');
    }
  };

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
              AI Driven Hunger and Waste Optimizer
            </Typography>
            <Typography variant="h6" sx={{ 
              color: 'rgba(75, 75, 75, 0.8)',
              fontWeight: 400,
              maxWidth: '600px',
              mx: 'auto',
              mb: 3
            }}>
              Smart food distribution and waste reduction system
            </Typography>
            
            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 3 }}>
              <Button
                variant="contained"
                startIcon={<AutoAwesomeIcon />}
                onClick={() => setOpenPlanDialog(true)}
                sx={{ 
                  background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1565c0, #1976d2)'
                  }
                }}
              >
                Generate AI Plan
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
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

            {/* Dashboard Stats */}
            {dashboardStats && (
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 3, flexWrap: 'wrap' }}>
                <Chip 
                  label={`${dashboardStats.total_inventory_kg}kg Inventory`} 
                  color="primary" 
                  variant="outlined"
                  sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
                />
                <Chip 
                  label={`${dashboardStats.utilization_rate}% Utilization`} 
                  color="secondary" 
                  variant="outlined"
                  sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
                />
                <Chip 
                  label={`${dashboardStats.available_vehicles} Vehicles`} 
                  color="success" 
                  variant="outlined"
                  sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
                />
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
                  title="Demand Forecasting" 
                  subtitle="AI predicts local food needs"
                  icon={<AssessmentIcon sx={{ fontSize: 28 }} />}
                  gradient="linear-gradient(135deg, rgba(10, 25, 41, 0.9) 0%, rgba(39, 62, 107, 0.8) 100%)"
                >
                  <Typography variant="body2" sx={{ 
                    color: 'rgba(65, 108, 116, 0.9)', 
                    lineHeight: 1.6,
                    fontFamily: 'Poppins'
                  }}>
                    Using historical consumption, population, and seasonal trends
                  </Typography>
                </DashboardCard>
              </Box>
            </Slide>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <Slide direction="up" in={isLoaded} timeout={1200}>
              <Box>
                <DashboardCard 
                  title="Smart Distribution" 
                  subtitle="ML matches surplus to communities in need"
                  icon={<LocalShippingIcon sx={{ fontSize: 28 }} />}
                  gradient="linear-gradient(135deg, rgba(10, 25, 41, 0.9) 0%, rgba(39, 62, 107, 0.8) 100%)"
                >
                  <Typography variant="body2" sx={{ 
                    color: 'rgba(48, 77, 138, 0.9)', 
                    lineHeight: 1.6,
                    fontFamily: 'Poppins'
                  }}>
                    Minimizing waste and hunger through optimal matching
                  </Typography>
                </DashboardCard>
              </Box>
            </Slide>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <Slide direction="up" in={isLoaded} timeout={1400}>
              <Box>
                <DashboardCard 
                  title="Perishables Optimization" 
                  subtitle="AI plans delivery routes and cold storage"
                  icon={<AccessTimeIcon sx={{ fontSize: 28 }} />}
                  gradient="linear-gradient(135deg, rgba(10, 25, 41, 0.9) 0%, rgba(39, 62, 107, 0.8) 100%)"
                >
                  <Typography variant="body2" sx={{ 
                    color: 'rgba(40, 63, 137, 0.9)', 
                    lineHeight: 1.6,
                    fontFamily: 'Poppins'
                  }}>
                    Preventing spoilage through optimized logistics
                  </Typography>
                </DashboardCard>
              </Box>
            </Slide>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <Slide direction="up" in={isLoaded} timeout={1600}>
              <Box>
                <DashboardCard 
                  title="Impact Maximization" 
                  subtitle="System simulates allocation scenarios"
                  icon={<TrendingUpIcon sx={{ fontSize: 28 }} />}
                  gradient="linear-gradient(135deg, rgba(10, 25, 41, 0.9) 0%, rgba(39, 62, 107, 0.8) 100%)"
                >
                  <Typography variant="body2" sx={{ 
                    color: 'rgba(83, 46, 141, 0.9)', 
                    lineHeight: 1.6,
                    fontFamily: 'Poppins'
                  }}>
                    Reducing economic loss for farmers and environmental impact
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
                    Food Bank Inventory Flow
                  </Typography>
                  <Tooltip title="Real-time tracking of food inventory, distribution, and waste levels">
                    <IconButton size="small" sx={{ color: 'rgba(25, 118, 210, 0.7)' }}>
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <ChartComponent 
                  type="line" 
                  data={foodBankInventoryData} 
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
                          text: 'Food (tons)',
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
                    Food Bank Network Status
                  </Typography>
                  <Tooltip title="Current inventory, distribution, and surplus levels across food bank network">
                    <IconButton size="small" sx={{ color: 'rgba(25, 118, 210, 0.7)' }}>
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <ChartComponent 
                  type="bar" 
                  data={foodBankNetworkData} 
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
                          text: 'Food (tons)',
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
                    Food Waste Reduction Impact
                  </Typography>
                  <Tooltip title="Before and after waste reduction by food category">
                    <IconButton size="small" sx={{ color: 'rgba(25, 118, 210, 0.7)' }}>
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <ChartComponent 
                  type="bar" 
                  data={wasteReductionData} 
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
                          text: 'Days',
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
                    Food Distribution Routes
                  </Typography>
                  <Tooltip title="Real-time tracking of food delivery routes and distribution status">
                    <IconButton size="small" sx={{ color: 'rgba(25, 118, 210, 0.7)' }}>
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Box sx={{ height: 400 }}>
                  <DataTable 
                    rows={deliveryRoutesRows} 
                    columns={deliveryRoutesColumns} 
                    pageSize={5}
                  />
                </Box>
              </Paper>
            </Fade>
          </Grid>

          {/* Inventory Table */}
          <Grid item xs={12} md={6}>
            <Fade in={isLoaded} timeout={2600}>
              <Paper sx={{ p: 3, background: 'rgba(39, 62, 107, 0.8)', borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, background: 'linear-gradient(45deg, #1976d2, #42a5f5)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: 'Poppins', mb: 2 }}>
                  Inventory
                </Typography>
                <DataTable
                  rows={inventory.map((item, idx) => ({
                    id: item.id || idx,
                    location: item.location,
                    item: item.item,
                    quantity: item.quantity,
                    perishability: item.perishability,
                    price: item.price_per_kg || item.price_per_l,
                    farmer_id: item.farmer_id
                  }))}
                  columns={[
                    { field: 'location', headerName: 'Location', width: 180 },
                    { field: 'item', headerName: 'Item', width: 120 },
                    { field: 'quantity', headerName: 'Quantity', width: 120 },
                    { field: 'perishability', headerName: 'Perishability', width: 120 },
                    { field: 'price', headerName: 'Price', width: 100 },
                    { field: 'farmer_id', headerName: 'Farmer ID', width: 120 }
                  ]}
                  pageSize={5}
                />
              </Paper>
            </Fade>
          </Grid>

          {/* Demand Table */}
          <Grid item xs={12} md={6}>
            <Fade in={isLoaded} timeout={2700}>
              <Paper sx={{ p: 3, background: 'rgba(39, 62, 107, 0.8)', borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, background: 'linear-gradient(45deg, #1976d2, #42a5f5)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: 'Poppins', mb: 2 }}>
                  Demand
                </Typography>
                <DataTable
                  rows={demand.map((d, idx) => ({
                    id: d.id || idx,
                    location: d.location,
                    needs: d.needs.join(', '),
                    urgency: d.urgency,
                    capacity_kg: d.capacity_kg,
                    population_served: d.population_served,
                    last_delivery: d.last_delivery
                  }))}
                  columns={[
                    { field: 'location', headerName: 'Location', width: 180 },
                    { field: 'needs', headerName: 'Needs', width: 180 },
                    { field: 'urgency', headerName: 'Urgency', width: 100 },
                    { field: 'capacity_kg', headerName: 'Capacity (kg)', width: 120 },
                    { field: 'population_served', headerName: 'Population', width: 120 },
                    { field: 'last_delivery', headerName: 'Last Delivery', width: 140 }
                  ]}
                  pageSize={5}
                />
              </Paper>
            </Fade>
          </Grid>

          {/* Storage Table */}
          <Grid item xs={12} md={6}>
            <Fade in={isLoaded} timeout={2800}>
              <Paper sx={{ p: 3, background: 'rgba(39, 62, 107, 0.8)', borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, background: 'linear-gradient(45deg, #1976d2, #42a5f5)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: 'Poppins', mb: 2 }}>
                  Storage Facilities
                </Typography>
                <DataTable
                  rows={storage.map((s, idx) => ({
                    id: s.id || idx,
                    location: s.location,
                    capacity_kg: s.capacity_kg,
                    available_kg: s.available_kg,
                    temperature: s.temperature,
                    cost_per_day_per_kg: s.cost_per_day_per_kg
                  }))}
                  columns={[
                    { field: 'location', headerName: 'Location', width: 180 },
                    { field: 'capacity_kg', headerName: 'Capacity (kg)', width: 120 },
                    { field: 'available_kg', headerName: 'Available (kg)', width: 120 },
                    { field: 'temperature', headerName: 'Temperature', width: 120 },
                    { field: 'cost_per_day_per_kg', headerName: 'Cost/Day/Kg', width: 120 }
                  ]}
                  pageSize={5}
                />
              </Paper>
            </Fade>
          </Grid>

          {/* Farmers Table */}
          <Grid item xs={12} md={6}>
            <Fade in={isLoaded} timeout={2900}>
              <Paper sx={{ p: 3, background: 'rgba(39, 62, 107, 0.8)', borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, background: 'linear-gradient(45deg, #1976d2, #42a5f5)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: 'Poppins', mb: 2 }}>
                  Farmers
                </Typography>
                <DataTable
                  rows={Object.entries(farmers).map(([id, f], idx) => ({
                    id,
                    name: f.name,
                    location: f.location,
                    years_farming: f.years_farming,
                    economic_status: f.economic_status,
                    last_month_income: f.last_month_income
                  }))}
                  columns={[
                    { field: 'name', headerName: 'Name', width: 140 },
                    { field: 'location', headerName: 'Location', width: 120 },
                    { field: 'years_farming', headerName: 'Years Farming', width: 120 },
                    { field: 'economic_status', headerName: 'Status', width: 120 },
                    { field: 'last_month_income', headerName: 'Last Month Income', width: 140 }
                  ]}
                  pageSize={5}
                />
              </Paper>
            </Fade>
          </Grid>
        </Grid>
      </Container>

      {/* Role-based forms */}
      {role === 'farmer' && (
        <Paper sx={{ p: 3, mb: 3, background: 'rgba(39,62,107,0.8)', borderRadius: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Farmer Profile</Typography>
          <form onSubmit={handleFarmerFormSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField label="Crop Type" name="crop" value={farmerForm.crop} onChange={handleFarmerFormChange} fullWidth required />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField label="Quantity (kg)" name="quantity" value={farmerForm.quantity} onChange={handleFarmerFormChange} fullWidth required type="number" />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField label="Location" name="location" value={farmerForm.location} onChange={handleFarmerFormChange} fullWidth required />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField label="Economic Status" name="economic_status" value={farmerForm.economic_status} onChange={handleFarmerFormChange} fullWidth required />
              </Grid>
              <Grid item xs={12}>
                <Button type="submit" variant="contained" disabled={farmerSubmitting}>{farmerSubmitting ? 'Saving...' : 'Save'}</Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
      )}
      {role === 'warehouse_manager' && (
        <Paper sx={{ p: 3, mb: 3, background: 'rgba(39,62,107,0.8)', borderRadius: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Warehouse Manager Panel</Typography>
          <form onSubmit={handleWarehouseFormSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField label="Available (kg)" name="available_kg" value={warehouseForm.available_kg} onChange={handleWarehouseFormChange} fullWidth required type="number" />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField label="Temperature (°C)" name="temperature" value={warehouseForm.temperature} onChange={handleWarehouseFormChange} fullWidth required type="number" />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField label="Cost/Day/Kg" name="cost_per_day_per_kg" value={warehouseForm.cost_per_day_per_kg} onChange={handleWarehouseFormChange} fullWidth required type="number" />
              </Grid>
              <Grid item xs={12}>
                <Button type="submit" variant="contained" disabled={warehouseSubmitting}>{warehouseSubmitting ? 'Saving...' : 'Save'}</Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
      )}
      {role === 'logistics_driver' && (
        <Paper sx={{ p: 3, mb: 3, background: 'rgba(39,62,107,0.8)', borderRadius: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Logistics Driver Panel</Typography>
          <form onSubmit={handleLogisticsFormSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField label="Vehicle Type" name="vehicle_type" value={logisticsForm.vehicle_type} onChange={handleLogisticsFormChange} fullWidth required />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField label="Location" name="location" value={logisticsForm.location} onChange={handleLogisticsFormChange} fullWidth required />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField label="Capacity (kg)" name="capacity_kg" value={logisticsForm.capacity_kg} onChange={handleLogisticsFormChange} fullWidth required type="number" />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField label="Status" name="status" value={logisticsForm.status} onChange={handleLogisticsFormChange} fullWidth required />
              </Grid>
              <Grid item xs={12}>
                <Button type="submit" variant="contained" disabled={logisticsSubmitting}>{logisticsSubmitting ? 'Saving...' : 'Save'}</Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
      )}

      {/* AI Plan Generation Dialog */}
      <Dialog open={openPlanDialog} onClose={() => setOpenPlanDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Generate AI-Powered Allocation Plan</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Food Surplus and Demand Report"
                value={planForm.raw_report}
                onChange={(e) => setPlanForm(prev => ({ ...prev, raw_report: e.target.value }))}
                placeholder="Describe the current food surplus situation, demand signals, and any specific requirements..."
                helperText="Provide detailed information about available food, locations, quantities, and community needs"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Priority Focus"
                value={planForm.priority_focus}
                onChange={(e) => setPlanForm(prev => ({ ...prev, priority_focus: e.target.value }))}
                SelectProps={{
                  native: true,
                }}
              >
                <option value="all">All Priorities</option>
                <option value="hunger_relief">Hunger Relief</option>
                <option value="farmer_support">Farmer Support</option>
                <option value="environment">Environmental Impact</option>
              </TextField>
            </Grid>
          </Grid>

          {/* Generated Plan Results */}
          {generatedPlan && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, color: '#1976d2' }}>
                AI-Generated Allocation Plan:
              </Typography>
              
              <Paper sx={{ p: 2, mb: 2, backgroundColor: '#f5f5f5' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#1976d2' }}>
                  Allocation Plan:
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: '#263238' }}>
                  {generatedPlan.allocation_plan}
                </Typography>
              </Paper>

              <Paper sx={{ p: 2, mb: 2, backgroundColor: '#e3f2fd' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#1976d2' }}>
                  Human Summary:
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: '#263238' }}>
                  {generatedPlan.human_summary}
                </Typography>
              </Paper>

              {generatedPlan.estimated_impact && (
                <Paper sx={{ p: 2, backgroundColor: '#e8f5e8' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#1976d2' }}>
                    Estimated Impact:
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" sx={{ color: '#263238' }}>
                        <strong>People Served:</strong> {generatedPlan.estimated_impact.people_served}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" sx={{ color: '#263238' }}>
                        <strong>Food Saved:</strong> {generatedPlan.estimated_impact.food_saved_kg}kg
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" sx={{ color: '#263238' }}>
                        <strong>Economic Value:</strong> ₹{generatedPlan.estimated_impact.economic_value_rupees}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" sx={{ color: '#263238' }}>
                        <strong>Emissions Saved:</strong> {generatedPlan.estimated_impact.emissions_saved_kg}kg CO2
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPlanDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleGeneratePlan} 
            variant="contained"
            disabled={generating || !planForm.raw_report.trim()}
            startIcon={generating ? <CircularProgress size={20} /> : <AutoAwesomeIcon />}
          >
            {generating ? 'Generating Plan...' : 'Generate Plan'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HungerWasteOptimizer;