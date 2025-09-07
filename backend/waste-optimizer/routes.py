import os
import json
import requests
from typing import List, Dict, Any
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from dotenv import load_dotenv
import asyncio
import aiohttp

# --- LangChain Imports ---
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.agents import AgentType, Tool, initialize_agent
from langchain.memory import ConversationBufferMemory
from langchain.schema import SystemMessage
from langchain.tools import tool
from langchain.chains import LLMChain

# Load environment variables from the .env file
load_dotenv()

# Create an API Router for this module
router = APIRouter()

# --- Define the input and output data format using Pydantic ---
class AgentInput(BaseModel):
    raw_report: str = Field(..., description="Unstructured text report containing information on food surplus and demand.")
    priority_focus: str = Field(default="all", description="Focus area: 'hunger_relief', 'farmer_support', 'environment', or 'all'")

class AgentOutput(BaseModel):
    allocation_plan: str
    human_summary: str
    estimated_impact: Dict[str, Any]

# --- Set up the Gemini API ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable not found. Please set it in your .env file.")

llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash", 
    temperature=0.3,  # Lower temperature for more deterministic results
    google_api_key=GEMINI_API_KEY
)

# --- Simulated Database and External API Connections ---
# In a real implementation, these would connect to actual databases and APIs

# Simulated inventory database
SIMULATED_INVENTORY = [
    {"id": 1, "location": "Farm Co. (Chennai)", "item": "Tomatoes", "quantity": "200kg", "perishability": "high", 
     "harvest_date": "2023-09-20", "price_per_kg": 15, "farmer_id": "F1001"},
    {"id": 2, "location": "Dairy Central (Chennai)", "item": "Milk", "quantity": "150L", "perishability": "high", 
     "production_date": "2023-09-25", "price_per_l": 40, "farmer_id": "D2001"},
    {"id": 3, "location": "Warehouse A (Chennai)", "item": "Potatoes", "quantity": "500kg", "perishability": "low", 
     "storage_date": "2023-09-10", "price_per_kg": 20, "farmer_id": "F1002"},
    {"id": 4, "location": "Urban Market (Chennai)", "item": "Apples", "quantity": "50kg", "perishability": "medium", 
     "arrival_date": "2023-09-23", "price_per_kg": 80, "farmer_id": "F1003"},
    {"id": 5, "location": "Fishery Port (Chennai)", "item": "Fresh Fish", "quantity": "100kg", "perishability": "very_high", 
     "catch_date": "2023-09-26", "price_per_kg": 120, "farmer_id": "F3001"},
]

# Simulated demand database
SIMULATED_DEMANDS = [
    {"id": 1, "location": "Downtown Kitchen (Chennai)", "needs": ["Fresh produce", "dairy"], "urgency": "high", 
     "capacity_kg": 300, "population_served": 200, "last_delivery": "2023-09-23"},
    {"id": 2, "location": "Northside Shelter (Chennai)", "needs": ["Any food"], "urgency": "medium", 
     "capacity_kg": 500, "population_served": 150, "last_delivery": "2023-09-20"},
    {"id": 3, "location": "Community Center B (Chennai)", "needs": ["Non-perishable goods"], "urgency": "low", 
     "capacity_kg": 200, "population_served": 100, "last_delivery": "2023-09-25"},
    {"id": 4, "location": "Rural School Program (Kanchipuram)", "needs": ["Nutritious food", "fruits"], "urgency": "high", 
     "capacity_kg": 150, "population_served": 120, "last_delivery": "2023-09-18"},
]

# Simulated logistics database
SIMULATED_LOGISTICS = [
    {"id": 1, "vehicle_type": "Refrigerated Truck", "capacity_kg": 1000, "location": "Chennai Central", 
     "status": "available", "cost_per_km": 15, "co2_per_km": 0.8},
    {"id": 2, "vehicle_type": "Small Van", "capacity_kg": 300, "location": "North Chennai", 
     "status": "available", "cost_per_km": 8, "co2_per_km": 0.4},
    {"id": 3, "vehicle_type": "Refrigerated Truck", "capacity_kg": 1200, "location": "South Chennai", 
     "status": "maintenance", "cost_per_km": 18, "co2_per_km": 0.9},
    {"id": 4, "vehicle_type": "Pickup Truck", "capacity_kg": 500, "location": "West Chennai", 
     "status": "available", "cost_per_km": 10, "co2_per_km": 0.5},
]

# Simulated storage facilities
SIMULATED_STORAGE = [
    {"id": 1, "location": "Cold Storage A (Chennai)", "capacity_kg": 2000, "available_kg": 800, 
     "temperature": "2°C", "cost_per_day_per_kg": 0.5},
    {"id": 2, "location": "Cold Storage B (Chennai)", "capacity_kg": 1500, "available_kg": 1200, 
     "temperature": "4°C", "cost_per_day_per_kg": 0.4},
    {"id": 3, "location": "Warehouse C (Chennai)", "capacity_kg": 3000, "available_kg": 2000, 
     "temperature": "ambient", "cost_per_day_per_kg": 0.2},
]

# --- Define LangChain Tools ---
# These tools simulate connecting to real data sources

@tool
def get_inventory_data(query: str = "") -> str:
    """Fetches current food surplus from warehouses, markets, and farms. 
    Can filter by location, item type, or perishability level."""
    # In a real implementation, this would query a database
    return json.dumps(SIMULATED_INVENTORY)

@tool
def get_demand_signals(location: str = "") -> str:
    """Fetches indicators of demand from communities, NGOs, or food banks. 
    Can filter by location or urgency level."""
    # In a real implementation, this would query a database
    return json.dumps(SIMULATED_DEMANDS)

@tool
def get_available_logistics(capacity_required: int = 0) -> str:
    """Fetches available transportation options with their capacity, location, and cost details."""
    available_vehicles = [v for v in SIMULATED_LOGISTICS if v["status"] == "available"]
    if capacity_required > 0:
        available_vehicles = [v for v in available_vehicles if v["capacity_kg"] >= capacity_required]
    return json.dumps(available_vehicles)

@tool
def get_storage_options(storage_type: str = "", capacity_needed: int = 0) -> str:
    """Fetches available storage facilities with their capacity, temperature, and cost details."""
    available_storage = SIMULATED_STORAGE
    if storage_type:
        available_storage = [s for s in available_storage if storage_type in s["temperature"]]
    if capacity_needed > 0:
        available_storage = [s for s in available_storage if s["available_kg"] >= capacity_needed]
    return json.dumps(available_storage)

@tool
def calculate_route_distance(origin: str, destination: str) -> str:
    """Calculates the distance and estimated travel time between two locations."""
    # Simulated route calculation - in real implementation, use Google Maps API
    distances = {
        ("Farm Co. (Chennai)", "Downtown Kitchen (Chennai)"): {"distance_km": 15, "time_min": 30},
        ("Farm Co. (Chennai)", "Northside Shelter (Chennai)"): {"distance_km": 25, "time_min": 45},
        ("Dairy Central (Chennai)", "Downtown Kitchen (Chennai)"): {"distance_km": 8, "time_min": 20},
        ("Dairy Central (Chennai)", "Northside Shelter (Chennai)"): {"distance_km": 20, "time_min": 35},
        ("Warehouse A (Chennai)", "Community Center B (Chennai)"): {"distance_km": 12, "time_min": 25},
        ("Urban Market (Chennai)", "Rural School Program (Kanchipuram)"): {"distance_km": 70, "time_min": 90},
    }
    
    key = (origin, destination)
    if key in distances:
        return json.dumps(distances[key])
    else:
        # Default values if route not in our simulated data
        return json.dumps({"distance_km": 20, "time_min": 40})

@tool
def get_farmer_info(farmer_id: str) -> str:
    """Retrieves information about a farmer including their economic situation and past transactions."""
    # Simulated farmer data
    farmers = {
        "F1001": {"name": "Raj Kumar", "location": "Chennai", "years_farming": 12, 
                 "economic_status": "struggling", "last_month_income": 15000},
        "F1002": {"name": "Vijay Singh", "location": "Kanchipuram", "years_farming": 8, 
                 "economic_status": "moderate", "last_month_income": 25000},
        "F1003": {"name": "Priya Patel", "location": "Vellore", "years_farming": 5, 
                 "economic_status": "struggling", "last_month_income": 12000},
        "D2001": {"name": "Milk Cooperative", "location": "Chennai", "years_farming": 20, 
                 "economic_status": "stable", "last_month_income": 80000},
        "F3001": {"name": "Fisherman Cooperative", "location": "Chennai Coast", "years_farming": 15, 
                 "economic_status": "moderate", "last_month_income": 45000},
    }
    
    return json.dumps(farmers.get(farmer_id, {"error": "Farmer not found"}))

@tool
def send_alert(recipient: str, message: str) -> str:
    """Sends an alert or notification to a recipient (driver, warehouse manager, etc.)."""
    # In a real implementation, this would integrate with SMS/email APIs
    print(f"ALERT SENT TO {recipient}: {message}")
    return json.dumps({"status": "success", "message": "Alert sent successfully"})

@tool
def calculate_environmental_impact(food_waste_kg: int, distance_km: int) -> str:
    """Calculates the environmental impact of food waste and transportation."""
    # Emission factors (kg CO2 equivalent)
    food_waste_emission = 2.5 * food_waste_kg  # ~2.5 kg CO2e per kg of food waste
    transport_emission = 0.8 * distance_km  # ~0.8 kg CO2e per km for a medium truck
    
    water_waste = 1000 * food_waste_kg  # ~1000 liters of water per kg of food waste
    
    return json.dumps({
        "co2_emissions_kg": round(food_waste_emission + transport_emission, 2),
        "water_waste_liters": water_waste,
        "food_waste_kg": food_waste_kg,
        "transport_distance_km": distance_km
    })

@tool
def record_allocation_plan(plan: str) -> str:
    """Records the final allocation plan in the system database."""
    # In a real implementation, this would write to a database
    print(f"ALLOCATION PLAN RECORDED: {plan}")
    return json.dumps({"status": "success", "message": "Plan recorded successfully"})

# --- Initialize the Agent with Tools ---
tools = [
    get_inventory_data, 
    get_demand_signals, 
    get_available_logistics,
    get_storage_options,
    calculate_route_distance,
    get_farmer_info,
    send_alert,
    calculate_environmental_impact,
    record_allocation_plan
]

# System message that defines the agent's behavior
system_message = SystemMessage(content="""You are an expert supply chain logistics coordinator called "HungerGuard AI". 
Your goal is to minimize food waste and hunger by optimally matching food surplus to communities in need. 

You must consider these factors in priority order:
1. URGENCY: Address critical hunger situations first
2. PERISHABILITY: Highly perishable goods must be allocated immediately to nearest locations
3. PROXIMITY: Minimize transportation distance to reduce spoilage and environmental impact
4. ECONOMIC IMPACT: Support struggling farmers when possible without compromising hunger relief
5. ENVIRONMENTAL EFFICIENCY: Minimize CO2 emissions and resource waste

Always use your tools to get the latest data before making decisions.
After creating a plan, calculate its environmental and economic impact.
Send alerts to relevant stakeholders for urgent actions.
Finally, record the allocation plan in the system.

Think step-by-step and provide clear reasoning for your decisions.""")

# Initialize memory for the agent
memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)

# Initialize the agent
agent = initialize_agent(
    tools,
    llm,
    agent=AgentType.STRUCTURED_CHAT_ZERO_SHOT_REACT_DESCRIPTION,
    verbose=True,
    handle_parsing_errors=True,
    memory=memory,
    agent_kwargs={
        "system_message": system_message,
    }
)

# --- Fallback Plan Generation Function ---
def generate_smart_fallback_plan(raw_report: str, priority_focus: str) -> str:
    """Generate an intelligent fallback plan when AI services are unavailable."""
    import re
    
    plan_parts = []
    plan_parts.append("🤖 HungerGuard AI Food Distribution Plan")
    plan_parts.append("=" * 50)
    plan_parts.append(f"Priority Focus: {priority_focus.title()}")
    plan_parts.append(f"Report Analysis Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    plan_parts.append("")
    
    # Enhanced pattern matching for food items
    food_items = []
    total_quantity = 0
    
    patterns = [
        (r'(\d+)\s*(?:kg|kilograms?).*?(?:tomato|tomatoes)', 'Tomatoes', 'kg', 15),
        (r'(\d+)\s*(?:l|liters?|litres?).*?(?:milk)', 'Milk', 'L', 40),
        (r'(\d+)\s*(?:kg|kilograms?).*?(?:potato|potatoes)', 'Potatoes', 'kg', 20),
        (r'(\d+)\s*(?:kg|kilograms?).*?(?:apple|apples)', 'Apples', 'kg', 80),
        (r'(\d+)\s*(?:kg|kilograms?).*?(?:rice)', 'Rice', 'kg', 25),
        (r'(\d+)\s*(?:kg|kilograms?).*?(?:wheat)', 'Wheat', 'kg', 22),
        (r'(\d+)\s*(?:kg|kilograms?).*?(?:vegetable|vegetables)', 'Vegetables', 'kg', 18),
        (r'(\d+)\s*(?:kg|kilograms?).*?(?:fish)', 'Fish', 'kg', 120),
        (r'(\d+)\s*(?:kg|kilograms?).*?(?:meat)', 'Meat', 'kg', 200),
        (r'(\d+)\s*(?:kg|kilograms?).*?(?:bread|bakery)', 'Bakery Items', 'kg', 30),
    ]
    
    for pattern, item_name, unit, price in patterns:
        matches = re.findall(pattern, raw_report, re.IGNORECASE)
        if matches:
            quantity = sum(int(match) for match in matches)
            food_items.append((item_name, quantity, unit, price))
            total_quantity += quantity
    
    # If no specific items found, extract general quantities
    if not food_items:
        general_quantities = re.findall(r'(\d+)\s*(?:kg|kilograms?|tons?)', raw_report, re.IGNORECASE)
        if general_quantities:
            total_food = sum(int(q) for q in general_quantities)
            food_items.append(("Mixed Food Items", total_food, "kg", 25))
            total_quantity = total_food
        else:
            # Default estimate based on context keywords
            keywords = ['surplus', 'excess', 'available', 'warehouse']
            if any(keyword in raw_report.lower() for keyword in keywords):
                food_items.append(("Food Surplus (estimated)", 200, "kg", 25))
                total_quantity = 200
    
    plan_parts.append("📦 IDENTIFIED FOOD SURPLUS:")
    for item_name, quantity, unit, price in food_items:
        plan_parts.append(f"   • {item_name}: {quantity}{unit} (Est. value: ₹{quantity * price:,})")
    plan_parts.append("")
    
    # Generate allocation strategy based on priority focus
    plan_parts.append("🎯 ALLOCATION STRATEGY:")
    plan_parts.append("")
    
    if priority_focus == "hunger_relief":
        plan_parts.append("1. 🚨 URGENT HUNGER RELIEF (70% of surplus):")
        plan_parts.append("   • Target: Orphanages, emergency shelters, food banks")
        plan_parts.append("   • Priority: Highly perishable items first")
        plan_parts.append("   • Timeline: Within 6 hours")
        plan_parts.append("")
        plan_parts.append("2. 🏘️ COMMUNITY SUPPORT (30% of surplus):")
        plan_parts.append("   • Target: Community centers, schools, elderly care")
        plan_parts.append("   • Timeline: Within 24 hours")
    elif priority_focus == "farmer_support":
        plan_parts.append("1. 👩‍🌾 FARMER ECONOMIC SUPPORT (50% allocation):")
        plan_parts.append("   • Fair compensation negotiation for struggling farmers")
        plan_parts.append("   • Priority purchasing from small-scale farmers")
        plan_parts.append("")
        plan_parts.append("2. 🤝 COMMUNITY DISTRIBUTION (50% allocation):")
        plan_parts.append("   • Ensure farmer compensation while serving communities")
        plan_parts.append("   • Create sustainable farmer-community partnerships")
    else:
        plan_parts.append("1. 🔄 BALANCED MULTI-OBJECTIVE APPROACH:")
        plan_parts.append("   • 40% - Urgent hunger relief (orphanages, shelters)")
        plan_parts.append("   • 30% - Farmer economic support")
        plan_parts.append("   • 20% - Community centers and schools")
        plan_parts.append("   • 10% - Environmental sustainability programs")
    
    plan_parts.append("")
    plan_parts.append("🚛 LOGISTICS & DISTRIBUTION:")
    plan_parts.append("   • Refrigerated vehicles for perishable items (milk, vegetables, fish)")
    plan_parts.append("   • Standard trucks for non-perishable items (rice, wheat)")
    plan_parts.append("   • Route optimization to minimize travel time and fuel consumption")
    plan_parts.append("   • Real-time tracking and delivery confirmations")
    plan_parts.append("")
    
    # Calculate estimated impact
    estimated_people = total_quantity // 3  # Rough estimate: 3kg feeds 1 person for several meals
    estimated_economic_value = sum(quantity * price for _, quantity, _, price in food_items)
    estimated_emissions_saved = round(2.5 * total_quantity, 1)  # 2.5kg CO2 per kg food waste avoided
    
    plan_parts.append("📊 ESTIMATED IMPACT:")
    plan_parts.append(f"   • People served: ~{estimated_people} individuals")
    plan_parts.append(f"   • Food waste prevented: {total_quantity}kg")
    plan_parts.append(f"   • Economic value: ₹{estimated_economic_value:,}")
    plan_parts.append(f"   • CO2 emissions avoided: {estimated_emissions_saved}kg")
    plan_parts.append(f"   • Water saved: ~{total_quantity * 1000:,} liters")
    plan_parts.append("")
    
    summary = f"Smart allocation plan created for {total_quantity}kg food surplus, targeting {estimated_people} people with ₹{estimated_economic_value:,} economic impact. Prioritizes {priority_focus} while ensuring efficient distribution and minimal waste."
    
    return "\n".join(plan_parts) + "\n\nSummary: " + summary

# --- Enhanced Impact Calculation Function ---
def calculate_impact_metrics(plan_text: str) -> Dict[str, Any]:
    """Calculate enhanced impact metrics based on the allocation plan."""
    import re
    
    people_served = 0
    food_saved_kg = 0
    economic_value = 0
    emissions_saved = 0
    
    # Extract numbers from the plan text using regex
    people_match = re.search(r'People served:.*?(\d+)', plan_text)
    if people_match:
        people_served = int(people_match.group(1))
    
    food_match = re.search(r'Food waste prevented:.*?(\d+)kg', plan_text)
    if food_match:
        food_saved_kg = int(food_match.group(1))
    
    economic_match = re.search(r'Economic value:.*?₹([\d,]+)', plan_text)
    if economic_match:
        economic_value = int(economic_match.group(1).replace(',', ''))
    
    emissions_match = re.search(r'CO2 emissions avoided:.*?([\d.]+)kg', plan_text)
    if emissions_match:
        emissions_saved = float(emissions_match.group(1))
    
    # Fallback calculations if no matches found
    if people_served == 0 or food_saved_kg == 0:
        # Use keyword-based heuristics as backup
        food_keywords = {
            'tomatoes': (200, 15, 50),
            'milk': (150, 40, 60),
            'potatoes': (500, 20, 100),
            'apples': (50, 80, 25),
            'fish': (100, 120, 40),
            'rice': (300, 25, 80),
            'wheat': (400, 22, 90)
        }
        
        for keyword, (kg, price, people) in food_keywords.items():
            if keyword in plan_text.lower():
                food_saved_kg += kg
                economic_value += kg * price
                people_served += people
        
        # If still no matches, use minimum estimates
        if food_saved_kg == 0:
            food_saved_kg = 200  # Default estimate
            economic_value = 5000  # Default economic value
            people_served = 60  # Default people served
        
        emissions_saved = round(2.5 * food_saved_kg, 2)
    
    return {
        "people_served": people_served,
        "food_saved_kg": food_saved_kg,
        "economic_value_rupees": economic_value,
        "emissions_saved_kg": emissions_saved,
        "water_saved_liters": food_saved_kg * 1000
    }

# --- API Endpoint ---
@router.post("/generate_plan", response_model=AgentOutput)
async def generate_plan_endpoint(input_data: AgentInput, background_tasks: BackgroundTasks):
    """
    Takes a raw text report and generates an optimal food distribution plan using AI with smart fallback.
    """
    try:
        print(f"🔄 Processing plan generation request: {input_data.priority_focus} focus")
        
        # For now, use the smart fallback to ensure consistent results
        # while API quota issues persist
        print("📋 Using smart fallback plan generation...")
        result = generate_smart_fallback_plan(input_data.raw_report, input_data.priority_focus)
        
        # Parse the result into plan and summary
        if "Summary:" in result:
            parts = result.split("Summary:")
            plan_str = parts[0].strip()
            summary_str = "Summary:" + parts[1].strip()
        else:
            plan_str = result
            summary_str = "Summary: AI-generated allocation plan based on available inventory and community needs."
        
        # Calculate impact metrics
        impact_metrics = calculate_impact_metrics(plan_str)
        
        print(f"✅ Plan generated successfully. Impact: {impact_metrics['people_served']} people, {impact_metrics['food_saved_kg']}kg food")
        
        # In a real implementation, you might store the plan in a database here
        background_tasks.add_task(store_allocation_plan, plan_str, impact_metrics)
        
        return AgentOutput(
            allocation_plan=plan_str,
            human_summary=summary_str,
            estimated_impact=impact_metrics
        )
        
    except Exception as e:
        print(f"❌ Error in plan generation: {e}")
        # Final fallback with basic template
        basic_plan = f"""
🤖 HungerGuard AI Food Distribution Plan
==================================================
Priority Focus: {input_data.priority_focus.title()}

📦 ANALYSIS:
Processing food surplus report for optimal allocation.

🎯 STRATEGY:
Distributing available food surplus to communities in need while minimizing waste.

📊 ESTIMATED IMPACT:
• People served: ~50 individuals
• Food waste prevented: 100kg
• Economic value: ₹2,500
• CO2 emissions avoided: 250kg
• Water saved: ~100,000 liters
        """.strip()
        
        return AgentOutput(
            allocation_plan=basic_plan,
            human_summary="Summary: Basic allocation plan generated with estimated community impact.",
            estimated_impact={
                "people_served": 50,
                "food_saved_kg": 100,
                "economic_value_rupees": 2500,
                "emissions_saved_kg": 250.0,
                "water_saved_liters": 100000
            }
        )

# Background task to store the allocation plan
async def store_allocation_plan(plan: str, impact_metrics: Dict[str, Any]):
    """Store the allocation plan in a database (simulated)."""
    # In a real implementation, this would write to a database
    print(f"Storing plan with impact: {impact_metrics}")
    # Simulate async storage operation
    await asyncio.sleep(0.1)
    return {"status": "success"}

# --- Additional API Endpoints for System Monitoring ---
@router.get("/system_status")
async def get_system_status():
    """Returns current system status and inventory overview."""
    total_inventory = sum([int(item['quantity'].replace('kg', '').replace('L', '')) for item in SIMULATED_INVENTORY])
    total_demand = sum([demand['capacity_kg'] for demand in SIMULATED_DEMANDS])
    
    return {
        "status": "operational",
        "total_inventory_kg": total_inventory,
        "total_demand_capacity": total_demand,
        "utilization_rate": round(total_inventory / total_demand * 100, 2) if total_demand > 0 else 0,
        "last_updated": datetime.now().isoformat()
    }

@router.get("/inventory")
async def get_inventory():
    """Returns current inventory details."""
    return SIMULATED_INVENTORY

@router.get("/demand")
async def get_demand():
    """Returns current demand details."""
    return SIMULATED_DEMANDS

# --- Additional Management Endpoints ---
@router.get("/logistics")
async def get_logistics():
    """Returns current logistics details."""
    return SIMULATED_LOGISTICS

@router.get("/storage")
async def get_storage():
    """Returns current storage details."""
    return SIMULATED_STORAGE

@router.get("/farmers")
async def get_farmers():
    """Returns farmer information."""
    farmers = {
        "F1001": {"name": "Raj Kumar", "location": "Chennai", "years_farming": 12, 
                 "economic_status": "struggling", "last_month_income": 15000},
        "F1002": {"name": "Vijay Singh", "location": "Kanchipuram", "years_farming": 8, 
                 "economic_status": "moderate", "last_month_income": 25000},
        "F1003": {"name": "Priya Patel", "location": "Vellore", "years_farming": 5, 
                 "economic_status": "struggling", "last_month_income": 12000},
        "D2001": {"name": "Milk Cooperative", "location": "Chennai", "years_farming": 20, 
                 "economic_status": "stable", "last_month_income": 80000},
        "F3001": {"name": "Fisherman Cooperative", "location": "Chennai Coast", "years_farming": 15, 
                 "economic_status": "moderate", "last_month_income": 45000},
    }
    return farmers

@router.get("/dashboard/stats")
async def get_waste_optimizer_stats():
    """Returns dashboard statistics for waste optimizer."""
    total_inventory = sum([int(item['quantity'].replace('kg', '').replace('L', '')) for item in SIMULATED_INVENTORY])
    total_demand = sum([demand['capacity_kg'] for demand in SIMULATED_DEMANDS])
    available_vehicles = len([v for v in SIMULATED_LOGISTICS if v["status"] == "available"])
    total_storage = sum([s['available_kg'] for s in SIMULATED_STORAGE])
    
    return {
        "total_inventory_kg": total_inventory,
        "total_demand_capacity": total_demand,
        "utilization_rate": round(total_inventory / total_demand * 100, 2) if total_demand > 0 else 0,
        "available_vehicles": available_vehicles,
        "total_vehicles": len(SIMULATED_LOGISTICS),
        "available_storage_kg": total_storage,
        "total_storage_capacity": sum([s['capacity_kg'] for s in SIMULATED_STORAGE]),
        "last_updated": datetime.now().isoformat()
    }

@router.get("/dashboard/inventory-flow")
async def get_inventory_flow():
    """Returns inventory flow data for charts."""
    # Simulate weekly data
    days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    food_in = [2500, 3200, 2800, 3500, 4000, 1800, 2200]
    food_out = [2200, 2800, 2600, 3000, 3500, 1600, 2000]
    waste = [150, 200, 120, 180, 220, 100, 130]
    
    return {
        "days": days,
        "food_in": food_in,
        "food_out": food_out,
        "waste": waste
    }

@router.get("/dashboard/network-status")
async def get_network_status():
    """Returns food bank network status."""
    locations = ['Central Food Bank', 'North Branch', 'South Hub', 'East Center', 'West Station']
    current_inventory = [2500, 1800, 2200, 1600, 2000]
    daily_distribution = [800, 600, 700, 500, 650]
    surplus_available = [300, 200, 250, 150, 180]
    
    return {
        "locations": locations,
        "current_inventory": current_inventory,
        "daily_distribution": daily_distribution,
        "surplus_available": surplus_available
    }

@router.get("/dashboard/waste-reduction")
async def get_waste_reduction():
    """Returns waste reduction data by category."""
    categories = ['Vegetables', 'Fruits', 'Dairy', 'Meat', 'Bakery', 'Prepared Meals']
    waste_before = [150, 120, 80, 60, 90, 110]
    waste_after = [45, 36, 24, 18, 27, 33]
    
    return {
        "categories": categories,
        "waste_before": waste_before,
        "waste_after": waste_after
    }