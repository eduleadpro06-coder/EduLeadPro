import { storage } from "./storage";
import { insertLeadSourceSchema } from "../shared/schema";

interface CSVLeadData {
  "Student Name": string;
  "Enquirer Mobile": string;
  "Enquirer Name": string;
  "Program Name": string;
  "Admission Status": string;
  "Notes": string;
  "Gender": string;
  "Locality": string;
  "Source": string;
}

// Map CSV admission status to our system status
function mapAdmissionStatus(status: string): string {
  const statusMap: Record<string, string> = {
    "Admission Done": "enrolled",
    "Mid Term": "interested", 
    "Admission in other School": "dropped",
    "Call Not Recieved": "new"
  };
  return statusMap[status] || "new";
}

// Map CSV program name to class/stream
function mapProgramToClass(program: string): { class: string; stream: string } {
  const programMap: Record<string, { class: string; stream: string }> = {
    "Nursery": { class: "Nursery", stream: "General" },
    "Play Group": { class: "Play Group", stream: "General" },
    "Daycare": { class: "Daycare", stream: "General" }
  };
  
  // Handle multiple programs like "Play Group, Daycare"
  const firstProgram = program.split(",")[0].trim();
  return programMap[firstProgram] || { class: "Play Group", stream: "General" };
}

export async function importCSVLeads(csvData: CSVLeadData[]): Promise<void> {
  console.log(`Starting import of ${csvData.length} leads from CSV...`);
  
  // Create lead sources first
  const uniqueSources = Array.from(new Set(csvData.map(row => row.Source)));
  for (const sourceName of uniqueSources) {
    try {
      await storage.createLeadSource({
        name: sourceName,
        cost: "0",
        conversions: 0,
        totalLeads: 0
      });
    } catch (error) {
      // Source might already exist, continue
      console.log(`Lead source "${sourceName}" already exists or error occurred`);
    }
  }

  // Import leads
  let importedCount = 0;
  for (const row of csvData) {
    try {
      const { class: studentClass, stream } = mapProgramToClass(row["Program Name"]);
      
      const leadData = {
        name: row["Student Name"],
        email: "", // Not provided in CSV
        phone: row["Enquirer Mobile"],
        class: studentClass,
        stream: stream,
        status: mapAdmissionStatus(row["Admission Status"]),
        source: row["Source"],
        counselorId: null, // Will be assigned later
        assignedAt: null,
        lastContactedAt: new Date(), // Set to current date when importing
        notes: row["Notes"] || "",
        parentName: row["Enquirer Name"],
        parentPhone: row["Enquirer Mobile"],
        address: row["Locality"] || ""
      };

      await storage.createLead(leadData);
      importedCount++;
      console.log(`Imported lead: ${row["Student Name"]}`);
    } catch (error) {
      console.error(`Failed to import lead ${row["Student Name"]}:`, error);
    }
  }
  
  console.log(`Successfully imported ${importedCount} out of ${csvData.length} leads`);
}

// CSV data from your file
export const realLeadsData: CSVLeadData[] = [
  {
    "Student Name": "Harishwa Nilesh Dangre",
    "Enquirer Mobile": "9284098836",
    "Enquirer Name": "Nilesh Dangre",
    "Program Name": "Nursery",
    "Admission Status": "Admission Done",
    "Notes": "demo",
    "Gender": "Male",
    "Locality": "Dattarya Nagar",
    "Source": "Walk Inn"
  },
  {
    "Student Name": "Rutvika Y. Nagdeve",
    "Enquirer Mobile": "8208671496",
    "Enquirer Name": "Neha Nagdeve",
    "Program Name": "Play Group",
    "Admission Status": "Mid Term",
    "Notes": "discuss",
    "Gender": "Female",
    "Locality": "Kailash Nagar",
    "Source": "Google"
  },
  {
    "Student Name": "Rishabh Rangari",
    "Enquirer Mobile": "7133244156",
    "Enquirer Name": "Ratnadeep Rangari",
    "Program Name": "Nursery",
    "Admission Status": "Admission Done",
    "Notes": "admission done",
    "Gender": "Female",
    "Locality": "Manewada",
    "Source": "Walk Inn"
  },
  {
    "Student Name": "Ruturaj T. Chavan",
    "Enquirer Mobile": "6057816816",
    "Enquirer Name": "Tushar S. Chawan",
    "Program Name": "Play Group",
    "Admission Status": "Admission in other School",
    "Notes": "EK CA ROAD",
    "Gender": "Male",
    "Locality": "Ayodhya Nagar",
    "Source": "Walk Inn"
  },
  {
    "Student Name": "Aviraj Chetan Dhoble",
    "Enquirer Mobile": "4982389476",
    "Enquirer Name": "Chetan Dhoble",
    "Program Name": "Play Group, Daycare",
    "Admission Status": "Call Not Recieved",
    "Notes": "",
    "Gender": "Male",
    "Locality": "manewada",
    "Source": "Google"
  }
];