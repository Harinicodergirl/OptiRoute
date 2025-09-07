import React, { useState } from 'react';
import { Button } from 'your-button-component'; // Adjust the import based on your project structure

const SmartShelterAllocator = () => {
  const [generatedShelterPlan, setGeneratedShelterPlan] = useState(null);

  const staticShelterPlan = {
    allocation_plan: "Shelter beds allocated: 50 to Center A, 30 to Center B.",
    human_summary: "Shelter allocation completed.",
    estimated_impact: {
      people_served: 80,
      beds_allocated: 80,
      economic_value_rupees: 12000,
      emissions_saved_kg: 20
    }
  };

  const handleGenerateShelterPlan = () => {
    setGeneratedShelterPlan(staticShelterPlan);
  };

  return (
    <div>
      <Button onClick={handleGenerateShelterPlan}>Generate Shelter Plan</Button>
      {generatedShelterPlan && (
        <div>
          <h3>Generated Shelter Plan</h3>
          <p>{generatedShelterPlan.allocation_plan}</p>
          <p>{generatedShelterPlan.human_summary}</p>
          <div>
            <h4>Estimated Impact</h4>
            <p>People Served: {generatedShelterPlan.estimated_impact.people_served}</p>
            <p>Beds Allocated: {generatedShelterPlan.estimated_impact.beds_allocated}</p>
            <p>Economic Value (Rupees): {generatedShelterPlan.estimated_impact.economic_value_rupees}</p>
            <p>Emissions Saved (kg): {generatedShelterPlan.estimated_impact.emissions_saved_kg}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartShelterAllocator;