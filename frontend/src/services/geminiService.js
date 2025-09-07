import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const API_KEY = 'AIzaSyD8JvbI4I3aPvSKkWsN2CIKjBTI0I2J9w8'; // Replace with your actual API key
const genAI = new GoogleGenerativeAI(API_KEY);

class GeminiService {
  constructor() {
    this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  // Utility method to generate content with system prompts
  async generateContent(systemPrompt, userInput, fallbackData = null) {
    try {
      const prompt = `${systemPrompt}\n\nUser Input: ${userInput}\n\nPlease provide a detailed JSON response.`;
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      
      // Try to extract JSON from the response
      try {
        // Look for JSON in the response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        } else {
          // If no JSON found, return structured fallback
          return fallbackData || { success: true, data: text };
        }
      } catch (parseError) {
        console.warn('Failed to parse JSON response, using fallback:', parseError);
        return fallbackData || { success: true, data: text };
      }
    } catch (error) {
      console.error('Gemini API error:', error);
      // Return fallback data if API fails
      return fallbackData || { success: false, error: 'AI service temporarily unavailable' };
    }
  }

  // Hospital Management
  async getHospitals() {
    const systemPrompt = `You are a hospital management system. Generate realistic hospital data for Chennai, India. 
    Return JSON with an array of hospitals, each having: id, name, location, total_beds, available_beds, specialties, contact_number, emergency_services, rating.`;
    
    const fallbackData = {
      hospitals: [
        {
          id: 1,
          name: "Apollo Hospital Chennai",
          location: "Greams Road, Chennai",
          total_beds: 650,
          available_beds: 45,
          specialties: ["Cardiology", "Neurology", "Oncology", "Emergency"],
          contact_number: "+91-44-2829-3333",
          emergency_services: true,
          rating: 4.5
        },
        {
          id: 2,
          name: "Fortis Malar Hospital",
          location: "Adyar, Chennai",
          total_beds: 400,
          available_beds: 32,
          specialties: ["Orthopedics", "Gastroenterology", "Pediatrics"],
          contact_number: "+91-44-4289-4289",
          emergency_services: true,
          rating: 4.2
        },
        {
          id: 3,
          name: "MIOT International",
          location: "Manapakkam, Chennai",
          total_beds: 500,
          available_beds: 28,
          specialties: ["Multi-organ transplant", "Cardiothoracic Surgery", "Neurosurgery"],
          contact_number: "+91-44-4200-2500",
          emergency_services: true,
          rating: 4.4
        }
      ]
    };

    return await this.generateContent(systemPrompt, "List hospitals in Chennai", fallbackData);
  }

  async getDoctors() {
    const systemPrompt = `You are a doctor management system. Generate realistic doctor data.
    Return JSON with an array of doctors, each having: id, name, specialty, hospital_id, years_experience, availability_status, consultations_today, rating.`;
    
    const fallbackData = {
      doctors: [
        {
          id: 1,
          name: "Dr. Rajesh Kumar",
          specialty: "Cardiology",
          hospital_id: 1,
          years_experience: 15,
          availability_status: "available",
          consultations_today: 12,
          rating: 4.6
        },
        {
          id: 2,
          name: "Dr. Priya Sharma",
          specialty: "Neurology",
          hospital_id: 1,
          years_experience: 18,
          availability_status: "busy",
          consultations_today: 8,
          rating: 4.8
        },
        {
          id: 3,
          name: "Dr. Suresh Reddy",
          specialty: "Emergency Medicine",
          hospital_id: 2,
          years_experience: 10,
          availability_status: "available",
          consultations_today: 15,
          rating: 4.3
        }
      ]
    };

    return await this.generateContent(systemPrompt, "List doctors", fallbackData);
  }

  async getPatients() {
    const systemPrompt = `You are a patient management system. Generate realistic patient data.
    Return JSON with an array of patients, each having: id, name, age, condition, severity, admission_date, doctor_id, status.`;
    
    const fallbackData = {
      patients: [
        {
          id: 1,
          name: "Ramesh Kumar",
          age: 45,
          condition: "Heart Attack",
          severity: "critical",
          admission_date: "2024-01-15",
          doctor_id: 1,
          status: "admitted"
        },
        {
          id: 2,
          name: "Lakshmi Devi",
          age: 32,
          condition: "Stroke",
          severity: "serious",
          admission_date: "2024-01-16",
          doctor_id: 2,
          status: "stable"
        },
        {
          id: 3,
          name: "Arjun Patel",
          age: 28,
          condition: "Accident Injury",
          severity: "moderate",
          admission_date: "2024-01-16",
          doctor_id: 3,
          status: "recovering"
        }
      ]
    };

    return await this.generateContent(systemPrompt, "List current patients", fallbackData);
  }

  async findHospitalIntelligent(patientData) {
    const systemPrompt = `You are an intelligent hospital recommendation system. Based on patient condition, location, and requirements, recommend the best hospital.
    Analyze: patient condition, severity, location, insurance, specialization needed.
    Return JSON with: recommended_hospital (object with hospital details), reasoning (string), alternatives (array of other options), estimated_time, cost_estimate.`;
    
    const fallbackData = {
      recommended_hospital: {
        id: 1,
        name: "Apollo Hospital Chennai",
        location: "Greams Road, Chennai",
        specialties: ["Cardiology", "Emergency"],
        available_beds: 45,
        estimated_time: "15 minutes",
        rating: 4.5
      },
      reasoning: "Apollo Hospital is recommended due to its excellent cardiology department and proximity to your location. They have emergency services available and experienced specialists on duty.",
      alternatives: [
        {
          name: "Fortis Malar Hospital",
          distance: "8 km",
          specialties: ["Emergency", "General Medicine"]
        }
      ],
      cost_estimate: "₹15,000 - ₹25,000",
      emergency_contact: "+91-44-2829-3333"
    };

    return await this.generateContent(systemPrompt, JSON.stringify(patientData), fallbackData);
  }

  async findNearbyHospitals(locationData) {
    const { latitude, longitude, severity = 1 } = locationData;
    
    // First determine the actual locality/area name in Chennai based on coordinates
    const reverseGeocodingPrompt = `You are a precise reverse geocoding system. Given these coordinates: latitude ${latitude}, longitude ${longitude} in Chennai, India, determine the exact locality, neighborhood, or area name these coordinates belong to.
    
    Output ONLY a detailed JSON object with this structure:
    {
      "area_name": "The specific neighborhood or locality name", 
      "district": "The district this area belongs to",
      "city": "Chennai",
      "landmarks": ["Notable landmark 1", "Notable landmark 2"],
      "postal_code": "The postal code for this area"
    }
    
    Be very precise and accurate with neighborhood names in Chennai. Do not include any explanations, just the JSON.`;
    
    let userLocation;
    try {
      const geocodingResult = await this.model.generateContent(reverseGeocodingPrompt);
      const response = await geocodingResult.response;
      const text = response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        userLocation = JSON.parse(jsonMatch[0]);
        console.log('🌍 Reverse geocoded location:', userLocation);
      }
    } catch (error) {
      console.error('Error during reverse geocoding:', error);
      userLocation = {
        area_name: "Unknown Area",
        district: "Chennai",
        city: "Chennai",
        landmarks: ["Unknown"],
        postal_code: "600000"
      };
    }
    
    const systemPrompt = `You are a hospital locator system for Chennai, India. Based on the user's current location in ${userLocation?.area_name || 'Chennai'} (lat: ${latitude}, lon: ${longitude}), find nearby hospitals.
    
    IMPORTANT: Generate realistic hospital data specifically for Chennai with:
    - Real hospital names that exist in Chennai, especially those near ${userLocation?.area_name || 'the given coordinates'}
    - Accurate distance calculations from the given coordinates 
    - Proper Chennai area/locality names, with special focus on ${userLocation?.area_name || 'the area'} and surrounding neighborhoods
    - Realistic contact information and services
    - Consideration of the emergency severity level: ${severity}/5
    
    Return JSON with structure:
    {
      "hospitals": [
        {
          "id": number,
          "name": "Hospital Name",
          "location": "Area, Chennai",
          "address": "Full Address", 
          "distance_km": number,
          "latitude": number,
          "longitude": number,
          "total_beds": number,
          "available_beds": number,
          "available_icu_beds": number,
          "occupancy_rate": "percentage",
          "status": "Available/Limited/Full",
          "specialties": ["list of medical specialties"],
          "emergency_services": boolean,
          "contact_number": "phone number",
          "rating": number (1-5),
          "estimated_wait_time": "minutes",
          "ambulance_available": boolean,
          "has_parking": boolean,
          "accepts_insurance": boolean
        }
      ],
      "user_location": {
        "latitude": ${latitude},
        "longitude": ${longitude},
        "area_name": "${userLocation?.area_name || 'Unknown Area'}",
        "district": "${userLocation?.district || 'Chennai'}",
        "nearest_landmarks": ${JSON.stringify(userLocation?.landmarks || ['Unknown'])},
        "postal_code": "${userLocation?.postal_code || '600000'}"
      },
      "emergency_level": "${severity >= 4 ? 'Critical' : severity >= 3 ? 'High' : 'Normal'}",
      "response_time": "${new Date().toISOString()}"
    }
    
    Generate at least 8-12 hospitals sorted by distance from closest to farthest, with special consideration for the patient's severity level (${severity}/5) when ranking them.`;
    
    const fallbackData = {
      hospitals: [
        {
          id: 1,
          name: "Apollo Hospital Chennai",
          location: "Greams Road, Chennai",
          address: "21, Greams Lane, Off Greams Road, Chennai - 600006",
          distance_km: 2.5,
          latitude: 13.0569,
          longitude: 80.2452,
          total_beds: 650,
          available_beds: 45,
          available_icu_beds: 8,
          occupancy_rate: "93%",
          status: "Available",
          specialties: ["Cardiology", "Neurology", "Oncology", "Emergency Medicine", "Pediatrics"],
          emergency_services: true,
          contact_number: "+91-44-2829-3333",
          rating: 4.5,
          estimated_wait_time: "15 minutes",
          ambulance_available: true,
          has_parking: true,
          accepts_insurance: true
        },
        {
          id: 2,
          name: "Fortis Malar Hospital",
          location: "Adyar, Chennai",
          address: "52, 1st Main Road, Gandhi Nagar, Adyar, Chennai - 600020",
          distance_km: 3.8,
          latitude: 13.0067,
          longitude: 80.2206,
          total_beds: 400,
          available_beds: 32,
          available_icu_beds: 5,
          occupancy_rate: "92%",
          status: "Available",
          specialties: ["Orthopedics", "Gastroenterology", "Pediatrics", "Emergency Medicine"],
          emergency_services: true,
          contact_number: "+91-44-4289-4289",
          rating: 4.2,
          estimated_wait_time: "20 minutes",
          ambulance_available: true,
          has_parking: true,
          accepts_insurance: true
        },
        {
          id: 3,
          name: "MIOT International",
          location: "Manapakkam, Chennai",
          address: "4/112, Mount Poonamalle Road, Manapakkam, Chennai - 600089",
          distance_km: 5.2,
          latitude: 13.0244,
          longitude: 80.1700,
          total_beds: 500,
          available_beds: 28,
          available_icu_beds: 6,
          occupancy_rate: "94%",
          status: "Limited",
          specialties: ["Multi-organ transplant", "Cardiothoracic Surgery", "Neurosurgery", "Emergency"],
          emergency_services: true,
          contact_number: "+91-44-4200-2500",
          rating: 4.4,
          estimated_wait_time: "25 minutes",
          ambulance_available: true,
          has_parking: true,
          accepts_insurance: true
        },
        {
          id: 4,
          name: "Gleneagles Global Health City",
          location: "Perumbakkam, Chennai",
          address: "439, Cheran Nagar, Perumbakkam, Chennai - 600100",
          distance_km: 6.7,
          latitude: 12.9010,
          longitude: 80.2279,
          total_beds: 750,
          available_beds: 55,
          available_icu_beds: 12,
          occupancy_rate: "93%",
          status: "Available",
          specialties: ["Cardiac Sciences", "Neurosciences", "Transplant", "Emergency", "Critical Care"],
          emergency_services: true,
          contact_number: "+91-44-4444-1234",
          rating: 4.6,
          estimated_wait_time: "18 minutes",
          ambulance_available: true,
          has_parking: true,
          accepts_insurance: true
        },
        {
          id: 5,
          name: "Sri Ramachandra Medical Centre",
          location: "Porur, Chennai",
          address: "No.1, Ramachandra Nagar, Porur, Chennai - 600116",
          distance_km: 8.3,
          latitude: 13.0358,
          longitude: 80.1557,
          total_beds: 580,
          available_beds: 38,
          available_icu_beds: 7,
          occupancy_rate: "93%",
          status: "Available",
          specialties: ["General Medicine", "Surgery", "Pediatrics", "Emergency Medicine", "Orthopedics"],
          emergency_services: true,
          contact_number: "+91-44-4928-1000",
          rating: 4.1,
          estimated_wait_time: "30 minutes",
          ambulance_available: true,
          has_parking: true,
          accepts_insurance: true
        },
        {
          id: 6,
          name: "Government General Hospital",
          location: "Park Town, Chennai",
          address: "EVR Periyar Salai, Park Town, Chennai - 600003",
          distance_km: 4.1,
          latitude: 13.0878,
          longitude: 80.2785,
          total_beds: 1200,
          available_beds: 85,
          available_icu_beds: 15,
          occupancy_rate: "93%",
          status: "Available",
          specialties: ["General Medicine", "Surgery", "Emergency Medicine", "Trauma Care", "Pediatrics"],
          emergency_services: true,
          contact_number: "+91-44-2819-2000",
          rating: 3.8,
          estimated_wait_time: "45 minutes",
          ambulance_available: true,
          has_parking: false,
          accepts_insurance: true
        }
      ],
      user_location: {
        latitude: latitude,
        longitude: longitude,
        nearest_landmark: "Chennai Central Area"
      },
      emergency_level: severity >= 4 ? 'Critical' : severity >= 3 ? 'High' : 'Normal',
      response_time: new Date().toISOString()
    };

    return await this.generateContent(systemPrompt, `Find hospitals near location: ${latitude}, ${longitude} with severity level ${severity}`, fallbackData);
  }

  // Dashboard Analytics
  async getDashboardStats() {
    const systemPrompt = `Generate hospital dashboard statistics including total hospitals, doctors, patients, emergencies today, average waiting time.
    Return JSON with comprehensive stats.`;
    
    const fallbackData = {
      total_hospitals: 25,
      total_doctors: 450,
      total_patients: 1200,
      emergencies_today: 35,
      average_waiting_time: 18,
      bed_occupancy_rate: 78,
      critical_patients: 42,
      ambulances_active: 12
    };

    return await this.generateContent(systemPrompt, "Generate hospital dashboard stats", fallbackData);
  }

  async getOccupancyTrends() {
    const systemPrompt = `Generate hospital bed occupancy trends for the last 7 days.
    Return JSON with days array and occupancy_rates array (percentage values).`;
    
    const fallbackData = {
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      occupancy_rates: [72, 75, 80, 85, 78, 65, 70],
      emergency_admissions: [15, 18, 22, 25, 20, 12, 16],
      discharges: [20, 25, 18, 30, 22, 28, 24]
    };

    return await this.generateContent(systemPrompt, "Generate occupancy trends", fallbackData);
  }

  async getSpecialtyDistribution() {
    const systemPrompt = `Generate distribution of medical specialties in hospitals.
    Return JSON with labels array (specialty names) and data array (number of doctors/cases).`;
    
    const fallbackData = {
      labels: ['Cardiology', 'Neurology', 'Orthopedics', 'Emergency', 'Pediatrics', 'General Medicine'],
      data: [85, 65, 75, 95, 55, 120]
    };

    return await this.generateContent(systemPrompt, "Generate specialty distribution", fallbackData);
  }

  // Shelter Allocation Service
  async allocateShelter(applicantData) {
    const systemPrompt = `You are a smart shelter allocation system using AI. Analyze applicant data and recommend suitable shelter.
    Consider: family_size, income, location_preference, special_needs, urgency_score.
    Return JSON with: allocated_shelter (object), allocation_score, reasoning, wait_time, required_documents.`;
    
    const fallbackData = {
      allocated_shelter: {
        shelter_id: "SH001",
        name: "New Hope Community Shelter",
        location: "Anna Nagar, Chennai",
        capacity: 50,
        available_slots: 5,
        facilities: ["Kitchen", "School", "Medical Care"],
        monthly_rent: 2500
      },
      allocation_score: 0.87,
      reasoning: "High compatibility based on family size, location preference, and available facilities. The shelter has good schools nearby for children and medical facilities.",
      wait_time: "2-3 days",
      required_documents: ["Aadhar Card", "Income Certificate", "Family Photos", "Bank Statement"]
    };

    return await this.generateContent(systemPrompt, JSON.stringify(applicantData), fallbackData);
  }

  async getShelterStats() {
    const systemPrompt = `Generate shelter allocation system statistics.
    Return JSON with: total_shelters, total_capacity, occupied_slots, waiting_list, allocation_success_rate, average_wait_time.`;
    
    const fallbackData = {
      total_shelters: 15,
      total_capacity: 750,
      occupied_slots: 580,
      waiting_list: 95,
      allocation_success_rate: 78,
      average_wait_time: 4.2
    };

    return await this.generateContent(systemPrompt, "Generate shelter statistics", fallbackData);
  }

  // Waste Optimizer Service
  async generateWastePlan(planData) {
    const systemPrompt = `You are HungerGuard AI, a food waste optimizer. Create an optimal food distribution plan.
    Consider: food_surplus_report, priority_focus (hunger_relief/farmer_support/environment/all).
    Return JSON with: allocation_plan (detailed string), human_summary (string), estimated_impact (object with people_served, food_saved_kg, economic_value_rupees, emissions_saved_kg).`;
    
    const { raw_report, priority_focus } = planData;
    
    // Enhanced pattern matching for food items
    const extractFoodItems = (report) => {
      const patterns = [
        { regex: /(\d+)\s*(?:kg|kilograms?).*?(?:tomato|tomatoes)/i, name: 'Tomatoes', unit: 'kg', price: 15 },
        { regex: /(\d+)\s*(?:l|liters?).*?(?:milk)/i, name: 'Milk', unit: 'L', price: 40 },
        { regex: /(\d+)\s*(?:kg|kilograms?).*?(?:potato|potatoes)/i, name: 'Potatoes', unit: 'kg', price: 20 },
        { regex: /(\d+)\s*(?:kg|kilograms?).*?(?:rice)/i, name: 'Rice', unit: 'kg', price: 25 },
      ];
      
      let totalQuantity = 0;
      let totalValue = 0;
      const items = [];
      
      patterns.forEach(pattern => {
        const match = report.match(pattern.regex);
        if (match) {
          const quantity = parseInt(match[1]);
          totalQuantity += quantity;
          totalValue += quantity * pattern.price;
          items.push(`${pattern.name}: ${quantity}${pattern.unit}`);
        }
      });
      
      return { items, totalQuantity, totalValue };
    };

    const { items, totalQuantity, totalValue } = extractFoodItems(raw_report);
    const estimatedPeople = Math.floor(totalQuantity / 3) || 50;
    
    const fallbackData = {
      allocation_plan: `🤖 HungerGuard AI Food Distribution Plan
==================================================
Priority Focus: ${priority_focus || 'Balanced Approach'}
Report Analysis Date: ${new Date().toLocaleString()}

📦 IDENTIFIED FOOD SURPLUS:
${items.length > 0 ? items.map(item => `   • ${item}`).join('\n') : '   • Mixed Food Items: 200kg'}

🎯 ALLOCATION STRATEGY:
${priority_focus === 'hunger_relief' ? 
  `1. 🚨 URGENT HUNGER RELIEF (70% of surplus):
   • Target: Orphanages, emergency shelters, food banks
   • Priority: Highly perishable items first
   • Timeline: Within 6 hours

2. 🏘️ COMMUNITY SUPPORT (30% of surplus):
   • Target: Community centers, schools, elderly care
   • Timeline: Within 24 hours` :
  `1. 🔄 BALANCED MULTI-OBJECTIVE APPROACH:
   • 40% - Urgent hunger relief (orphanages, shelters)
   • 30% - Farmer economic support
   • 20% - Community centers and schools
   • 10% - Environmental sustainability programs`}

🚛 LOGISTICS & DISTRIBUTION:
   • Refrigerated vehicles for perishable items
   • Standard trucks for non-perishable items
   • Route optimization to minimize travel time
   • Real-time tracking and delivery confirmations

📊 ESTIMATED IMPACT:
   • People served: ~${estimatedPeople} individuals
   • Food waste prevented: ${totalQuantity || 200}kg
   • Economic value: ₹${totalValue || 5000}
   • CO2 emissions avoided: ${(totalQuantity || 200) * 2.5}kg
   • Water saved: ~${(totalQuantity || 200) * 1000} liters`,
      
      human_summary: `Smart allocation plan created for ${totalQuantity || 200}kg food surplus, targeting ${estimatedPeople} people with ₹${totalValue || 5000} economic impact. Prioritizes ${priority_focus || 'balanced approach'} while ensuring efficient distribution and minimal waste.`,
      
      estimated_impact: {
        people_served: estimatedPeople,
        food_saved_kg: totalQuantity || 200,
        economic_value_rupees: totalValue || 5000,
        emissions_saved_kg: (totalQuantity || 200) * 2.5,
        water_saved_liters: (totalQuantity || 200) * 1000
      }
    };

    return await this.generateContent(systemPrompt, JSON.stringify(planData), fallbackData);
  }

  async getWasteOptimizerStats() {
    const fallbackData = {
      total_inventory_kg: 1500,
      total_demand_capacity: 1200,
      utilization_rate: 87.5,
      available_vehicles: 8,
      total_vehicles: 12,
      available_storage_kg: 4000,
      total_storage_capacity: 6500,
      last_updated: new Date().toISOString()
    };

    return fallbackData;
  }

  // Generate various dashboard data
  async getInventoryFlow() {
    return {
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      food_in: [2500, 3200, 2800, 3500, 4000, 1800, 2200],
      food_out: [2200, 2800, 2600, 3000, 3500, 1600, 2000],
      waste: [150, 200, 120, 180, 220, 100, 130]
    };
  }

  async getNetworkStatus() {
    return {
      locations: ['Central Food Bank', 'North Branch', 'South Hub', 'East Center', 'West Station'],
      current_inventory: [2500, 1800, 2200, 1600, 2000],
      daily_distribution: [800, 600, 700, 500, 650],
      surplus_available: [300, 200, 250, 150, 180]
    };
  }

  async getWasteReduction() {
    return {
      categories: ['Vegetables', 'Fruits', 'Dairy', 'Meat', 'Bakery', 'Prepared Meals'],
      waste_before: [150, 120, 80, 60, 90, 110],
      waste_after: [45, 36, 24, 18, 27, 33]
    };
  }

  // Simulate various data endpoints
  async getInventory() {
    return [
      { id: 1, location: "Farm Co. (Chennai)", item: "Tomatoes", quantity: "200kg", perishability: "high", price_per_kg: 15, farmer_id: "F1001" },
      { id: 2, location: "Dairy Central (Chennai)", item: "Milk", quantity: "150L", perishability: "high", price_per_l: 40, farmer_id: "D2001" },
      { id: 3, location: "Warehouse A (Chennai)", item: "Potatoes", quantity: "500kg", perishability: "low", price_per_kg: 20, farmer_id: "F1002" }
    ];
  }

  async getDemand() {
    return [
      { id: 1, location: "Downtown Kitchen (Chennai)", needs: ["Fresh produce", "dairy"], urgency: "high", capacity_kg: 300, population_served: 200 },
      { id: 2, location: "Northside Shelter (Chennai)", needs: ["Any food"], urgency: "medium", capacity_kg: 500, population_served: 150 }
    ];
  }

  async getLogistics() {
    return [
      { id: 1, vehicle_type: "Refrigerated Truck", capacity_kg: 1000, location: "Chennai Central", status: "available", cost_per_km: 15 },
      { id: 2, vehicle_type: "Small Van", capacity_kg: 300, location: "North Chennai", status: "available", cost_per_km: 8 }
    ];
  }

  async getStorage() {
    return [
      { id: 1, location: "Cold Storage A (Chennai)", capacity_kg: 2000, available_kg: 800, temperature: "2°C", cost_per_day_per_kg: 0.5 },
      { id: 2, location: "Cold Storage B (Chennai)", capacity_kg: 1500, available_kg: 1200, temperature: "4°C", cost_per_day_per_kg: 0.4 }
    ];
  }

  async getFarmers() {
    return {
      F1001: { name: "Raj Kumar", location: "Chennai", years_farming: 12, economic_status: "struggling", last_month_income: 15000 },
      F1002: { name: "Vijay Singh", location: "Kanchipuram", years_farming: 8, economic_status: "moderate", last_month_income: 25000 }
    };
  }
}

export default new GeminiService();
